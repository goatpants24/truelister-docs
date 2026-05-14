import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, usePreventRemove } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { Picker } from '@react-native-picker/picker';
import { CatalogItem, DropdownOptions, ImageResult, PhotoField } from '../types';
import { RootStackNavProp, ItemFormRouteProp } from '../navigation/types';
import { fetchDropdowns, generateItemNumber, appendItem } from '../services/sheets';
import { saveDraftItem, addPendingUpload } from '../services/localStorage';
import { uploadToDrive } from '../services/driveUpload';
import { formatFileSize } from '../services/imageProcessor';
import CameraScreen from './CameraScreen';
import TagScanner from '../components/TagScanner';
import UndoRedoBar from '../components/UndoRedoBar';
import { useUndoRedo } from '../hooks/useUndoRedo';

type FormMode = 'form' | 'camera' | 'tagScan';

const EMPTY_ITEM = (existingItems: CatalogItem[]): CatalogItem => ({
  itemNumber: generateItemNumber(existingItems),
  title: '',
  designerBrand: '',
  category: '',
  size: '',
  condition: '',
  fabricMaterial: '',
  measurements: '',
  color: '',
  saleStatus: 'Draft',
  price: '',
  photoUrl: '',
  marketplace: '',
  dateListed: new Date().toISOString().split('T')[0],
  notes: '',

  // 8 photo URL fields
  photoUrlCard: '',
  photoUrlFront: '',
  photoUrlBack: '',
  photoUrlDetail: '',
  photoUrlTabletopWide: '',
  photoUrlTabletopDetail: '',
  photoUrlTabletopMeasure1: '',
  photoUrlTabletopMeasure2: '',
});

export default function ItemFormScreen() {
  const navigation = useNavigation<RootStackNavProp<'ItemForm'>>();
  const route = useRoute<ItemFormRouteProp>();
  const { item: existingItem, existingItems } = route.params;

  const [mode, setMode] = useState<FormMode>('form');
  const [dropdowns, setDropdowns] = useState<DropdownOptions>({
    categories: [],
    conditions: [],
    saleStatuses: [],
    marketplaces: [],
    colors: [],
    sizes: [],
  });
  const [photo, setPhoto] = useState<{ compressed: ImageResult; originalUri: string } | null>(null);
  const [photoField, setPhotoField] = useState<PhotoField | null>(null); // which field we're capturing
  const [saving, setSaving] = useState(false);
  const [ocrRawText, setOcrRawText] = useState('');

  // ── Memoize initial item to prevent expensive generateItemNumber on re-renders ──
  const initialItem = React.useMemo(
    () => existingItem ?? EMPTY_ITEM(existingItems ?? []),
    [existingItem, existingItems]
  );

  // ── Undo/Redo on the entire form state ──────────────────────────────────────
  const {
    value: item,
    set: setItem,
    undo,
    redo,
    reset,
    canUndo,
    canRedo,
    historyLength,
  } = useUndoRedo<CatalogItem>(initialItem);

  const isDirty = canUndo; // form has been modified if there's undo history

  // ── Prevent accidental back navigation when form is dirty ──────────────────
  usePreventRemove(isDirty && !saving, ({ data }) => {
    Alert.alert(
      'Unsaved Changes',
      'You have unsaved changes. If you go back, this item will remain as a draft.',
      [
        { text: 'Keep Editing', style: 'cancel' },
        {
          text: 'Go Back',
          style: 'destructive',
          onPress: () => navigation.dispatch(data.action),
        },
      ]
    );
  });

  const isTitleValid = item.title.trim().length > 0;
  const errors = {
    title: !isTitleValid ? 'Title is required' : '',
  };

  useEffect(() => {
    fetchDropdowns().then(setDropdowns);
  }, []);

  const updateField = useCallback(
    (field: keyof CatalogItem, value: string, immediate = false) => {
      // Use functional update to keep this callback stable
      setItem((prev) => ({ ...prev, [field]: value }), immediate);
    },
    [setItem]
  );

  const toggleMarketplace = (m: string) => {
    const current = item.marketplace ? item.marketplace.split(',').map(s => s.trim()) : [];
    let updated;
    if (current.includes(m)) {
      updated = current.filter(x => x !== m);
    } else {
      updated = [...current, m];
    }
    updateField('marketplace', updated.join(', '), true);
  };

  const handlePhotoCapture = (compressed: ImageResult, originalUri: string) => {
    setPhoto({ compressed, originalUri });
    setMode('form');

    if (!photoField) return;

    // Upload and set the correct photo field
    const fieldName = photoField as keyof CatalogItem;
    const fileName = `${item.itemNumber}-${photoField}.jpg`;

    uploadToDrive(originalUri, fileName, item.itemNumber).then((uploadResult) => {
      if (uploadResult.success && uploadResult.driveUrl) {
        const updates: Partial<CatalogItem> = { [fieldName]: uploadResult.driveUrl };
        // Use the card photo as the main thumbnail if not already set
        if (fieldName === 'photoUrlCard' || !item.photoUrl) {
          updates.photoUrl = uploadResult.driveUrl;
        }
        setItem({ ...item, ...updates }, true);
      } else {
        addPendingUpload({
          itemNumber: item.itemNumber,
          localUri: originalUri,
          fieldName: photoField,
          fileName,
          timestamp: Date.now(),
        });
      }
    });
  };

  const handleTagScanned = (
    fields: Partial<CatalogItem>,
    rawText: string
  ) => {
    const updated = { ...item };
    for (const [key, value] of Object.entries(fields)) {
      const k = key as keyof CatalogItem;
      if (value && !item[k]) {
        (updated as Record<string, string>)[k] = value as string;
      }
    }
    setItem(updated, true); // immediate — OCR fill is one undo step
    setOcrRawText(rawText);
    setMode('form');
  };

  const handleSave = async () => {
    if (!isTitleValid) {
      Alert.alert('Required', 'Please enter a title for this item.');
      return;
    }

    setSaving(true);

    try {
      const finalItem = { ...item };

      const sheetSuccess = await appendItem(finalItem);
      if (!sheetSuccess) {
        await saveDraftItem(finalItem);
      }

      // Reset history so back navigation is clean
      reset(finalItem);
      navigation.goBack();
    } catch (err: any) {
      await saveDraftItem(item);
      const isOffline =
        err.message?.includes('offline') ||
        err.message?.includes('network');
      Alert.alert(
        'Error Saving',
        isOffline
          ? 'Item saved as draft. It will sync when connection is available.'
          : 'Item saved locally; check settings or API credentials.'
      );
      reset(item);
      navigation.goBack();
    }

    setSaving(false);
  };

  // ── Research & AI helpers ──────────────────────────────────────────────────
  const handleMarketResearch = () => {
    const query = [item.designerBrand, item.title, item.category].filter(Boolean).join(' ');
    if (!query) {
      Alert.alert('Research', 'Please enter a title or brand first.');
      return;
    }
    const url = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}&LH_Sold=1&LH_Complete=1`;
    Linking.openURL(url);
  };

  const handleLabelResearch = () => {
    const query = [item.designerBrand, item.title, 'tag labeling labels'].filter(Boolean).join(' ');
    if (!query) {
      Alert.alert('Research', 'Please enter a title or brand first.');
      return;
    }
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=isch`;
    Linking.openURL(url);
  };

  const handleAISuggest = () => {
    // In a real app, this would call an LLM API to suggest title/price
    Alert.alert(
      'AI Assistant',
      'AI suggestion feature would analyze your photos and OCR text to recommend optimal title and price. (Coming Soon)',
      [{ text: 'Sounds Good' }]
    );
  };

  const handleMarkAsSold = () => {
    const markets = item.marketplace ? item.marketplace.split(',').map(s => s.trim()) : [];

    Alert.alert(
      'Mark as Sold?',
      'This will update the item status to Sold.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Sold',
          onPress: async () => {
            updateField('saleStatus', 'Sold', true);
            if (markets.length > 0) {
              Alert.alert(
                'Cross-Listing Reminder',
                `Item sold! Don't forget to remove or update listings on:\n\n${markets.join('\n')}`,
                [{ text: 'Done' }]
              );
            }
          }
        }
      ]
    );
  };

  // ── Photo capture helpers ──────────────────────────────────────────────────
  const handleCapture = (field: PhotoField) => () => {
    setPhotoField(field);
    setMode('camera');
  };

  // ── Sub-screens rendered inline ────────────────────────────────────────────
  if (mode === 'camera') {
    return (
      <CameraScreen
        itemNumber={item.itemNumber}
        onCapture={handlePhotoCapture}
        onCancel={() => setMode('form')}
      />
    );
  }

  if (mode === 'tagScan') {
    return (
      <TagScanner
        onFieldsDetected={handleTagScanned}
        onCancel={() => setMode('form')}
      />
    );
  }

  // ── Main form ──────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      {/* Header row with Cancel / title / Save */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Cancel editing"
          accessibilityRole="button"
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {existingItem ? 'Edit Item' : 'New Item'}
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          accessibilityLabel="Save item"
          accessibilityRole="button"
        >
          <Text style={[styles.saveText, saving && { opacity: 0.5 }]}>
            {saving ? 'Saving…' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Item number badge */}
        <View style={styles.itemNumberBadge}>
          <Text style={styles.itemNumberText}>{item.itemNumber}</Text>
        </View>

        {/* Quick actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={[styles.actionButton, styles.actionPhotoButton]} onPress={handleCapture('photoUrlCard')}>
            <Text style={styles.actionIcon}>🃏</Text>
            <Text style={styles.actionLabel}>Card</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.actionPhotoButton]} onPress={handleCapture('photoUrlFront')}>
            <Text style={styles.actionIcon}>正面</Text>
            <Text style={styles.actionLabel}>Front</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.actionPhotoButton]} onPress={handleCapture('photoUrlBack')}>
            <Text style={styles.actionIcon}>背面</Text>
            <Text style={styles.actionLabel}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.actionPhotoButton]} onPress={handleCapture('photoUrlDetail')}>
            <Text style={styles.actionIcon}>🔍</Text>
            <Text style={styles.actionLabel}>Detail</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.actionPhotoButton]} onPress={handleCapture('photoUrlTabletopWide')}>
            <Text style={styles.actionIcon}>📸</Text>
            <Text style={styles.actionLabel}>Tabletop</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.actionPhotoButton]} onPress={handleCapture('photoUrlTabletopMeasure1')}>
            <Text style={styles.actionIcon}>📏</Text>
            <Text style={styles.actionLabel}>Measure 1</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => setMode('tagScan')}>
            <Text style={styles.actionIcon}>🏷</Text>
            <Text style={styles.actionLabel}>Scan Tag</Text>
          </TouchableOpacity>
        </View>

        {/* Card photo preview */}
        {item.photoUrlCard ? (
          <View style={styles.photoPreview}>
            <Image
              source={{ uri: item.photoUrlCard }}
              style={styles.photoImage}
              resizeMode="cover"
            />
            <Text style={styles.photoLabel}>Main catalog photo</Text>
          </View>
        ) : null}

        {/* OCR banner */}
        {ocrRawText ? (
          <View style={styles.ocrBanner}>
            <Text style={styles.ocrBannerLabel}>
              🏷 Tag scanned — highlighted fields were auto-filled
            </Text>
          </View>
        ) : null}

        {/* ── Item Details ── */}
        <Text style={styles.sectionLabel}>Item Details</Text>

        <View style={styles.field}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>
              Title <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              onPress={handleAISuggest}
              style={styles.aiBadge}
              accessibilityLabel="Get AI suggestions for title and price"
              accessibilityRole="button"
            >
              <Text style={styles.aiBadgeText}>🪄 AI Suggest</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.input}
            value={item.title}
            onChangeText={(v) => updateField('title', v)}
            placeholder="e.g., Vintage Levi 501 Jeans"
            placeholderTextColor="#4a5568"
            returnKeyType="next"
            maxLength={80}
          />
          <View style={styles.fieldFooter}>
            {errors.title ? (
              <Text style={styles.errorText}>{errors.title}</Text>
            ) : <View />}
            <Text
              style={[
                styles.charCount,
                item.title.length >= 80 ? styles.charCountError : item.title.length >= 70 ? styles.charCountWarning : null
              ]}
            >
              {item.title.length}/80
            </Text>
          </View>
        </View>

        <View style={styles.field}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Designer / Brand</Text>
            <TouchableOpacity
              onPress={handleLabelResearch}
              style={styles.researchLink}
              accessibilityLabel="Search Google Images for brand labels"
              accessibilityRole="button"
            >
              <Text style={styles.researchLinkText}>🔍 Label Research</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={[
              styles.input,
              item.designerBrand && ocrRawText
                ? styles.inputOcr
                : null,
            ]}
            value={item.designerBrand}
            onChangeText={(v) => updateField('designerBrand', v)}
            placeholder="e.g., Levi's"
            placeholderTextColor="#4a5568"
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={item.category}
                onValueChange={(v) =>
                  updateField('category', v as string, true)
                }
                style={styles.picker}
                dropdownIconColor="#94a3b8"
              >
                <Picker.Item
                  label="Select…"
                  value=""
                  color="#4a5568"
                />
                {dropdowns.categories.map((c) => (
                  <Picker.Item
                    key={c}
                    label={c}
                    value={c}
                    color="#e2e8f0"
                  />
                ))}
              </Picker>
            </View>
          </View>

          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Size</Text>
            <TextInput
              style={[
                styles.input,
                item.size && ocrRawText ? styles.inputOcr : null,
              ]}
              value={item.size}
              onChangeText={(v) => updateField('size', v)}
              placeholder="e.g., M, 32×30"
              placeholderTextColor="#4a5568"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Condition</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={item.condition}
                onValueChange={(v) =>
                  updateField('condition', v as string, true)
                }
                style={styles.picker}
                dropdownIconColor="#94a3b8"
              >
                <Picker.Item
                  label="Select…"
                  value=""
                  color="#4a5568"
                />
                {dropdowns.conditions.map((c) => (
                  <Picker.Item
                    key={c}
                    label={c}
                    value={c}
                    color="#e2e8f0"
                  />
                ))}
              </Picker>
            </View>
          </View>

          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Color</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={item.color}
                onValueChange={(v) =>
                  updateField('color', v as string, true)
                }
                style={styles.picker}
                dropdownIconColor="#94a3b8"
              >
                <Picker.Item
                  label="Select…"
                  value=""
                  color="#4a5568"
                />
                {dropdowns.colors.map((c) => (
                  <Picker.Item
                    key={c}
                    label={c}
                    value={c}
                    color="#e2e8f0"
                  />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Fabric / Material</Text>
          <TextInput
            style={[
              styles.input,
              item.fabricMaterial && ocrRawText
                ? styles.inputOcr
                : null,
            ]}
            value={item.fabricMaterial}
            onChangeText={(v) => updateField('fabricMaterial', v)}
            placeholder="e.g., 100% Cotton"
            placeholderTextColor="#4a5568"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Measurements</Text>
          <TextInput
            style={styles.input}
            value={item.measurements}
            onChangeText={(v) => updateField('measurements', v)}
            placeholder="e.g., Chest: 38  Length: 26"
            placeholderTextColor="#4a5568"
          />
        </View>

        {/* ── Listing Details ── */}
        <Text style={styles.sectionLabel}>Listing Details</Text>

        <View style={styles.row}>
          <View style={[styles.field, { flex: 1 }]}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Price</Text>
              <TouchableOpacity
                onPress={handleMarketResearch}
                style={styles.researchLink}
                accessibilityLabel="Search eBay for sold prices"
                accessibilityRole="button"
              >
                <Text style={styles.researchLinkText}>📈 Market Sold</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              value={item.price}
              onChangeText={(v) => updateField('price', v)}
              placeholder="0.00"
              placeholderTextColor="#4a5568"
              keyboardType="decimal-pad"
              returnKeyType="done"
            />
          </View>

          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Sale Status</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={item.saleStatus}
                onValueChange={(v) =>
                  updateField('saleStatus', v as string, true)
                }
                style={styles.picker}
                dropdownIconColor="#94a3b8"
              >
                {dropdowns.saleStatuses.map((s) => (
                  <Picker.Item
                    key={s}
                    label={s}
                    value={s}
                    color="#e2e8f0"
                  />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Marketplaces (Select all that apply)</Text>
          <View style={styles.marketplacesRow}>
            {dropdowns.marketplaces.map((m) => {
              const isSelected = item.marketplace?.split(',').map(s => s.trim()).includes(m);
              return (
                <TouchableOpacity
                  key={m}
                  style={[styles.marketChip, isSelected && styles.marketChipSelected]}
                  onPress={() => toggleMarketplace(m)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`Toggle marketplace ${m}`}
                >
                  <Text style={[styles.marketChipText, isSelected && styles.marketChipTextSelected]}>
                    {m}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={item.notes}
            onChangeText={(v) => updateField('notes', v)}
            placeholder="Care instructions, flaws, measurements…"
            placeholderTextColor="#4a5568"
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.formActions}>
          <TouchableOpacity
            style={[styles.saveButton, { flex: 1 }, saving && { opacity: 0.5 }]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? 'Saving…' : 'Save Item'}
            </Text>
          </TouchableOpacity>

          {existingItem && item.saleStatus !== 'Sold' && (
            <TouchableOpacity
              style={[styles.soldButton]}
              onPress={handleMarkAsSold}
            >
              <Text style={styles.soldButtonText}>Mark Sold</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Publish button — only shown when item has been saved (has itemNumber) */}
        <TouchableOpacity
          style={styles.publishButton}
          onPress={() => navigation.navigate('Publish', { item })}
        >
          <Text style={styles.publishButtonText}>🏪  Publish to Marketplaces</Text>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Undo / Redo bar — always visible at bottom */}
      <UndoRedoBar
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        historyLength={historyLength}
      />
    </KeyboardAvoidingView>
  );
}

// ────────────────────────────────────────────────────────────────
// CatalogItem photos: wire these into UI as needed in the future
//   photoUrlCard
//   photoUrlFront
//   photoUrlBack
//   photoUrlDetail
//   photoUrlTabletopWide
//   photoUrlTabletopDetail
//   photoUrlTabletopMeasure1
//   photoUrlTabletopMeasure2
// ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1117' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 16 : 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1d27',
  },
  cancelText: { color: '#94a3b8', fontSize: 16, fontWeight: '600' },
  headerTitle: { color: '#e8eaf6', fontSize: 17, fontWeight: '700' },
  saveText: { color: '#4f6ef7', fontSize: 16, fontWeight: '700' },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },
  itemNumberBadge: {
    alignSelf: 'center',
    backgroundColor: '#1a1d27',
    borderWidth: 1,
    borderColor: '#4f6ef7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginVertical: 14,
  },
  itemNumberText: { color: '#818cf8', fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  quickActions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 16 },
  actionButton: {
    flex: 1,
    backgroundColor: '#1a1d27',
    borderWidth: 1,
    borderColor: '#2a2d3a',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 6,
  },
  actionPhotoButton: {
    flex: 1,
  },
  actionIcon: { fontSize: 26 },
  actionLabel: { color: '#cbd5e1', fontSize: 13, fontWeight: '600' },
  photoPreview: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1a1d27',
    borderWidth: 1,
    borderColor: '#2a2d3a',
  },
  photoImage: { width: '100%', height: 200 },
  photoLabel: { color: '#94a3b8', fontSize: 13, textAlign: 'center', paddingVertical: 6 },
  ocrBanner: {
    backgroundColor: 'rgba(79, 110, 247, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(79, 110, 247, 0.3)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  ocrBannerLabel: { color: '#818cf8', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  sectionLabel: {
    color: '#6b7280',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 8,
  },
  field: { marginBottom: 14 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  label: { color: '#cbd5e1', fontSize: 13, fontWeight: '600' },
  aiBadge: {
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.3)',
  },
  aiBadgeText: { color: '#a78bfa', fontSize: 11, fontWeight: '700' },
  researchLink: {
    paddingVertical: 2,
  },
  researchLinkText: { color: '#60a5fa', fontSize: 11, fontWeight: '600' },
  required: { color: '#f87171' },
  input: {
    backgroundColor: '#1a1d27',
    borderWidth: 1,
    borderColor: '#2a2d3a',
    borderRadius: 10,
    color: '#e8eaf6',
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputOcr: {
    borderColor: 'rgba(74, 222, 128, 0.4)',
    backgroundColor: 'rgba(74, 222, 128, 0.05)',
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  pickerWrapper: {
    backgroundColor: '#1a1d27',
    borderWidth: 1,
    borderColor: '#2a2d3a',
    borderRadius: 10,
    overflow: 'hidden',
  },
  picker: { color: '#e8eaf6', height: 48 },
  row: { flexDirection: 'row', gap: 12 },
  marketplacesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  marketChip: {
    backgroundColor: '#1a1d27',
    borderWidth: 1,
    borderColor: '#2a2d3a',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  marketChipSelected: {
    backgroundColor: 'rgba(79, 110, 247, 0.2)',
    borderColor: '#4f6ef7',
  },
  marketChipText: { color: '#94a3b8', fontSize: 13, fontWeight: '500' },
  marketChipTextSelected: { color: '#4f6ef7', fontWeight: '700' },
  formActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  saveButton: {
    backgroundColor: '#4f6ef7',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#4f6ef7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  publishButton: {
    backgroundColor: '#1a1d27',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
    marginHorizontal: 20,
    borderWidth: 1.5,
    borderColor: '#4f6ef7',
  },
  publishButtonText: { color: '#4f6ef7', fontSize: 16, fontWeight: '700' },
  errorText: {
    color: '#f87171',
    fontSize: 12,
  },
  fieldFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  charCount: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  charCountWarning: {
    color: '#fbbf24',
  },
  charCountError: {
    color: '#f87171',
  },
  soldButton: {
    backgroundColor: '#1a1d27',
    borderWidth: 1,
    borderColor: '#f87171',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 20,
  },
  soldButtonText: {
    color: '#f87171',
    fontSize: 16,
    fontWeight: '700',
  },
});

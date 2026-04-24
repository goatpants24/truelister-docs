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
import { Picker } from '@react-native-picker/picker';
import { CatalogItem, DropdownOptions, ImageResult } from '../types';
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
});

export default function ItemFormScreen() {
  const navigation = useNavigation<RootStackNavProp<'ItemForm'>>();
  const route = useRoute<ItemFormRouteProp>();
  const { item: existingItem, existingItems } = route.params;

  const [mode, setMode] = useState<FormMode>('form');
  const [dropdowns, setDropdowns] = useState<DropdownOptions>({
    categories: [], conditions: [], saleStatuses: [],
    marketplaces: [], colors: [], sizes: [],
  });
  const [photo, setPhoto] = useState<{ compressed: ImageResult; originalUri: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [ocrRawText, setOcrRawText] = useState('');

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
  } = useUndoRedo<CatalogItem>(
    existingItem ?? EMPTY_ITEM(existingItems ?? [])
  );

  const isDirty = canUndo; // form has been modified if there's undo history

  // ── Prevent accidental back navigation when form is dirty ──────────────────
  usePreventRemove(isDirty && !saving, ({ data }) => {
    Alert.alert(
      'Discard Changes?',
      'You have unsaved changes. Discard them and go back?',
      [
        { text: 'Keep Editing', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => navigation.dispatch(data.action),
        },
      ]
    );
  });

  useEffect(() => {
    fetchDropdowns().then(setDropdowns);
  }, []);

  const updateField = useCallback(
    (field: keyof CatalogItem, value: string, immediate = false) => {
      setItem({ ...item, [field]: value }, immediate);
    },
    [item, setItem]
  );

  const handlePhotoCapture = (compressed: ImageResult, originalUri: string) => {
    setPhoto({ compressed, originalUri });
    setMode('form');
  };

  const handleTagScanned = (fields: Partial<CatalogItem>, rawText: string) => {
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
    if (!item.title) {
      Alert.alert('Required', 'Please enter a title for this item.');
      return;
    }

    setSaving(true);

    try {
      const finalItem = { ...item };

      if (photo) {
        const uploadResult = await uploadToDrive(
          photo.originalUri,
          `${item.itemNumber}.jpg`,
          item.itemNumber
        );
        if (uploadResult.success && uploadResult.driveUrl) {
          finalItem.photoUrl = uploadResult.driveUrl;
        } else {
          await addPendingUpload({
            itemNumber: item.itemNumber,
            localUri: photo.originalUri,
            fileName: `${item.itemNumber}.jpg`,
            timestamp: Date.now(),
          });
        }
      }

      const sheetSuccess = await appendItem(finalItem);
      if (!sheetSuccess) {
        await saveDraftItem(finalItem);
      }

      // Reset history so back navigation is clean
      reset(finalItem);
      navigation.goBack();
    } catch {
      await saveDraftItem(item);
      Alert.alert(
        'Saved Locally',
        'Item saved as draft. It will sync when connection is available.'
      );
      reset(item);
      navigation.goBack();
    }

    setSaving(false);
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
    >
      {/* Header row with Cancel / title / Save */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {existingItem ? 'Edit Item' : 'New Item'}
        </Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          <Text style={[styles.saveText, saving && { opacity: 0.5 }]}>
            {saving ? 'Saving…' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Item number badge */}
        <View style={styles.itemNumberBadge}>
          <Text style={styles.itemNumberText}>{item.itemNumber}</Text>
        </View>

        {/* Quick actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => setMode('camera')}>
            <Text style={styles.actionIcon}>📷</Text>
            <Text style={styles.actionLabel}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => setMode('tagScan')}>
            <Text style={styles.actionIcon}>🏷</Text>
            <Text style={styles.actionLabel}>Scan Tag</Text>
          </TouchableOpacity>
        </View>

        {/* Photo preview */}
        {photo && (
          <View style={styles.photoPreview}>
            <Image source={{ uri: photo.compressed.uri }} style={styles.photoImage} resizeMode="cover" />
            <Text style={styles.photoSize}>
              {formatFileSize(photo.compressed.fileSize ?? 0)} · {photo.compressed.width}×{photo.compressed.height}
            </Text>
          </View>
        )}

        {/* OCR banner */}
        {ocrRawText ? (
          <View style={styles.ocrBanner}>
            <Text style={styles.ocrBannerLabel}>🏷 Tag scanned — highlighted fields were auto-filled</Text>
          </View>
        ) : null}

        {/* ── Item Details ── */}
        <Text style={styles.sectionLabel}>Item Details</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Title <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={item.title}
            onChangeText={v => updateField('title', v)}
            placeholder="e.g., Vintage Levi 501 Jeans"
            placeholderTextColor="#4a5568"
            returnKeyType="next"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Designer / Brand</Text>
          <TextInput
            style={[styles.input, item.designerBrand && ocrRawText ? styles.inputOcr : null]}
            value={item.designerBrand}
            onChangeText={v => updateField('designerBrand', v)}
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
                onValueChange={v => updateField('category', v as string, true)}
                style={styles.picker}
                dropdownIconColor="#94a3b8"
              >
                <Picker.Item label="Select…" value="" color="#4a5568" />
                {dropdowns.categories.map(c => (
                  <Picker.Item key={c} label={c} value={c} color="#e2e8f0" />
                ))}
              </Picker>
            </View>
          </View>

          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Size</Text>
            <TextInput
              style={[styles.input, item.size && ocrRawText ? styles.inputOcr : null]}
              value={item.size}
              onChangeText={v => updateField('size', v)}
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
                onValueChange={v => updateField('condition', v as string, true)}
                style={styles.picker}
                dropdownIconColor="#94a3b8"
              >
                <Picker.Item label="Select…" value="" color="#4a5568" />
                {dropdowns.conditions.map(c => (
                  <Picker.Item key={c} label={c} value={c} color="#e2e8f0" />
                ))}
              </Picker>
            </View>
          </View>

          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Color</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={item.color}
                onValueChange={v => updateField('color', v as string, true)}
                style={styles.picker}
                dropdownIconColor="#94a3b8"
              >
                <Picker.Item label="Select…" value="" color="#4a5568" />
                {dropdowns.colors.map(c => (
                  <Picker.Item key={c} label={c} value={c} color="#e2e8f0" />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Fabric / Material</Text>
          <TextInput
            style={[styles.input, item.fabricMaterial && ocrRawText ? styles.inputOcr : null]}
            value={item.fabricMaterial}
            onChangeText={v => updateField('fabricMaterial', v)}
            placeholder="e.g., 100% Cotton"
            placeholderTextColor="#4a5568"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Measurements</Text>
          <TextInput
            style={styles.input}
            value={item.measurements}
            onChangeText={v => updateField('measurements', v)}
            placeholder="e.g., Chest: 38  Length: 26"
            placeholderTextColor="#4a5568"
          />
        </View>

        {/* ── Listing Details ── */}
        <Text style={styles.sectionLabel}>Listing Details</Text>

        <View style={styles.row}>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Price</Text>
            <TextInput
              style={styles.input}
              value={item.price}
              onChangeText={v => updateField('price', v)}
              placeholder="0.00"
              placeholderTextColor="#4a5568"
              keyboardType="decimal-pad"
            />
          </View>

          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Sale Status</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={item.saleStatus}
                onValueChange={v => updateField('saleStatus', v as string, true)}
                style={styles.picker}
                dropdownIconColor="#94a3b8"
              >
                {dropdowns.saleStatuses.map(s => (
                  <Picker.Item key={s} label={s} value={s} color="#e2e8f0" />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Marketplace</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={item.marketplace}
              onValueChange={v => updateField('marketplace', v as string, true)}
              style={styles.picker}
              dropdownIconColor="#94a3b8"
            >
              <Picker.Item label="Select…" value="" color="#4a5568" />
              {dropdowns.marketplaces.map(m => (
                <Picker.Item key={m} label={m} value={m} color="#e2e8f0" />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={item.notes}
            onChangeText={v => updateField('notes', v)}
            placeholder="Care instructions, flaws, measurements…"
            placeholderTextColor="#4a5568"
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Save button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && { opacity: 0.5 }]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving…' : 'Save Item'}
          </Text>
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
  quickActions: { flexDirection: 'row', gap: 12, marginBottom: 16 },
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
  actionIcon: { fontSize: 26 },
  actionLabel: { color: '#cbd5e1', fontSize: 13, fontWeight: '600' },
  photoPreview: { marginBottom: 16, borderRadius: 12, overflow: 'hidden', backgroundColor: '#1a1d27' },
  photoImage: { width: '100%', height: 200 },
  photoSize: { color: '#4ade80', fontSize: 12, textAlign: 'center', paddingVertical: 6 },
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
  label: { color: '#cbd5e1', fontSize: 13, fontWeight: '600', marginBottom: 6 },
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
});

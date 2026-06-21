import React, { useState, useEffect, useCallback, memo, useMemo } from 'react';
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
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, usePreventRemove } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { Picker } from '@react-native-picker/picker';
import { CatalogItem, DropdownOptions, ImageResult, PhotoField } from '../types';
import { RootStackNavProp, ItemFormRouteProp } from '../navigation/types';
import { fetchDropdowns, appendItem } from '../services/sheets';
import { saveDraftItem, addPendingUpload } from '../services/localStorage';
import { uploadToDrive } from '../services/driveUpload';
import CameraScreen from './CameraScreen';
import TagScanner from '../components/TagScanner';
import UndoRedoBar from '../components/UndoRedoBar';
import { useUndoRedo } from '../hooks/useUndoRedo';

type FormMode = 'form' | 'camera' | 'tagScan';
const PHOTO_ACTIONS: { field: PhotoField; label: string; icon: string }[] = [
  { field: "photoUrlCard", label: "Card", icon: "📇" },
  { field: "photoUrlFront", label: "Front", icon: "👕" },
  { field: "photoUrlBack", label: "Back", icon: "🔙" },
  { field: "photoUrlDetail", label: "Detail", icon: "🔍" },
  { field: "photoUrlTabletopWide", label: "Wide", icon: "↔️" },
  { field: "photoUrlTabletopDetail", label: "Zoom", icon: "🔎" },
  { field: "photoUrlTabletopMeasure1", label: "Measure 1", icon: "📏" },
  { field: "photoUrlTabletopMeasure2", label: "Measure 2", icon: "📐" },
];


/**
 * ⚡ BOLT PERFORMANCE OPTIMIZATION: Hoisted Configuration
 * Hoisting static metadata arrays prevents redundant allocations on every render.
 * Also fixes a critical runtime crash by providing the missing PHOTO_ACTIONS array.
 */
const PHOTO_ACTIONS: { field: PhotoField; label: string; icon: string }[] = [
  { field: 'photoUrlCard', label: 'Card', icon: '📇' },
  { field: 'photoUrlFront', label: 'Front', icon: '👕' },
  { field: 'photoUrlBack', label: 'Back', icon: '🔙' },
  { field: 'photoUrlDetail', label: 'Detail', icon: '🔍' },
  { field: 'photoUrlTabletopWide', label: 'Tabletop Wide', icon: '↔️' },
  { field: 'photoUrlTabletopDetail', label: 'Tabletop Detail', icon: '🔎' },
  { field: 'photoUrlTabletopMeasure1', label: 'Measure 1', icon: '📏' },
  { field: 'photoUrlTabletopMeasure2', label: 'Measure 2', icon: '📐' },
];

const EMPTY_ITEM = (newItemNumber?: string): CatalogItem => ({
  itemNumber: newItemNumber || 'TL-000',
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

const PHOTO_ACTIONS: { field: PhotoField; label: string; icon: string }[] = [
  { field: 'photoUrlCard', label: 'Card', icon: '🃏' },
  { field: 'photoUrlFront', label: 'Front', icon: '👕' },
  { field: 'photoUrlBack', label: 'Back', icon: '🧥' },
  { field: 'photoUrlDetail', label: 'Detail', icon: '🔍' },
  { field: 'photoUrlTabletopWide', label: 'Tabletop', icon: '📸' },
  { field: 'photoUrlTabletopDetail', label: 'Detail 2', icon: '🔬' },
  { field: 'photoUrlTabletopMeasure1', label: 'Measure 1', icon: '📏' },
  { field: 'photoUrlTabletopMeasure2', label: 'Measure 2', icon: '📐' },
];

const MarketplaceSelector = memo(({ selected, available, onToggle }: {
  selected: string;
  available: string[];
  onToggle: (marketplace: string) => void;
}) => {
  const selectedSet = useMemo(() => {
    return new Set(selected ? selected.split(',').map(s => s.trim()) : []);
  }, [selected]);

  return (
    <View style={styles.marketplacesRow}>
      {available.map((m) => {
        const isSelected = selectedSet.has(m);
        return (
          <TouchableOpacity
            key={m}
            style={[styles.marketChip, isSelected && styles.marketChipSelected]}
            onPress={() => onToggle(m)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`Toggle marketplace ${m}`}
          >
            <Text style={[styles.marketChipText, isSelected && styles.marketChipTextSelected]}>
              {isSelected ? '✓ ' : ''}{m}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
});

const PHOTO_ACTIONS: { field: PhotoField; label: string; icon: string }[] = [
  { field: 'photoUrlCard', label: 'Card', icon: '📇' },
  { field: 'photoUrlFront', label: 'Front', icon: '👕' },
  { field: 'photoUrlBack', label: 'Back', icon: '🔙' },
  { field: 'photoUrlDetail', label: 'Detail', icon: '🔍' },
  { field: 'photoUrlTabletopWide', label: 'Tabletop Wide', icon: '↔️' },
  { field: 'photoUrlTabletopDetail', label: 'Tabletop Detail', icon: '🔎' },
  { field: 'photoUrlTabletopMeasure1', label: 'Measure 1', icon: '📏' },
  { field: 'photoUrlTabletopMeasure2', label: 'Measure 2', icon: '📐' },
];

interface QuickActionsBarProps {
  captureStatus: Record<PhotoField, boolean>;
  ocrRawText: string;
  onCapture: (field: PhotoField) => void;
  onScanTag: () => void;
}

/**
 * Palette: Data-driven quick actions bar with consistent feedback and enhanced accessibility.
 * Bolt: Optimized with a referentially stable captureStatus object to maintain React.memo efficiency.
 * This prevents re-renders during form typing while preserving clean maintainability.
 */
const QuickActionsBar = memo(({
  captureStatus,
  ocrRawText,
  onCapture,
  onScanTag
}: {
  captureStatus: Record<PhotoField, boolean>;
  ocrRawText: string;
  onCapture: (field: PhotoField) => void;
  onScanTag: () => void;
}) => {
  return (
    <View style={styles.quickActions}>
      {PHOTO_ACTIONS.map(({ field, label, icon }) => {
        const isCaptured = captureStatus[field];
        return (
          <TouchableOpacity
            key={field}
            style={[
              styles.actionButton,
              isCaptured && styles.actionButtonCaptured
            ]}
            onPress={() => onCapture(field)}
            accessibilityRole="button"
            accessibilityLabel={`Capture ${label.toLowerCase()} photo${isCaptured ? ' (Captured)' : ''}`}
          >
            <Text style={styles.actionIcon}>{icon}</Text>
            <Text style={[styles.actionLabel, isCaptured && styles.actionLabelCaptured]}>
              {isCaptured ? '✓ ' : ''}{label}
            </Text>
          </TouchableOpacity>
        );
      })}
      <TouchableOpacity
        style={[styles.actionButton, ocrRawText && styles.actionButtonCaptured]}
        onPress={onScanTag}
        accessibilityRole="button"
        accessibilityLabel={`Scan clothing tag${ocrRawText ? ' (Scanned)' : ''}`}
      >
        <Text style={styles.actionIcon}>🏷</Text>
        <Text style={[styles.actionLabel, ocrRawText && styles.actionLabelCaptured]}>
          {ocrRawText ? '✓ ' : ''}Scan Tag
        </Text>
      </TouchableOpacity>
    </View>
  );
});

export default function ItemFormScreen() {
  const navigation = useNavigation<RootStackNavProp<'ItemForm'>>();
  const route = useRoute<ItemFormRouteProp>();
  const { item: existingItem, newItemNumber } = route.params;

  const [mode, setMode] = useState<FormMode>('form');
  const [dropdowns, setDropdowns] = useState<DropdownOptions>({
    categories: [], conditions: [], saleStatuses: [], marketplaces: [], colors: [], sizes: [],
  });
  const [saving, setSaving] = useState(false);
  const [ocrRawText, setOcrRawText] = useState('');
  const [photoField, setPhotoField] = useState<PhotoField | null>(null);

  const initialItem = useMemo(
    () => existingItem ?? EMPTY_ITEM(newItemNumber),
    [existingItem, newItemNumber]
  );

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

  const isDirty = canUndo;
  const isTitleValid = item.title.trim().length > 0;

  const categoryItems = useMemo(() => dropdowns.categories.map(c => <Picker.Item key={c} label={c} value={c} color="#e2e8f0" />), [dropdowns.categories]);
  const conditionItems = useMemo(() => dropdowns.conditions.map(c => <Picker.Item key={c} label={c} value={c} color="#e2e8f0" />), [dropdowns.conditions]);
  const colorItems = useMemo(() => dropdowns.colors.map(c => <Picker.Item key={c} label={c} value={c} color="#e2e8f0" />), [dropdowns.colors]);
  const saleStatusItems = useMemo(() => dropdowns.saleStatuses.map(s => <Picker.Item key={s} label={s} value={s} color="#e2e8f0" />), [dropdowns.saleStatuses]);

  usePreventRemove(isDirty && !saving, ({ data }) => {
    Alert.alert('Unsaved Changes', 'Discard changes and go back?', [
      { text: 'Keep Editing', style: 'cancel' },
      { text: 'Go Back', style: 'destructive', onPress: () => navigation.dispatch(data.action) },
    ]);
  });

  useEffect(() => { fetchDropdowns().then(setDropdowns); }, []);

  const updateField = useCallback((field: keyof CatalogItem, value: string, immediate = false) => {
    setItem((prev) => ({ ...prev, [field]: value }), immediate);
  }, [setItem]);

  const toggleMarketplace = useCallback((m: string) => {
    setItem((prev) => {
      const current = prev.marketplace ? prev.marketplace.split(',').map(s => s.trim()) : [];
      const updated = current.includes(m) ? current.filter(x => x !== m) : [...current, m];
      return { ...prev, marketplace: updated.join(', ') };
    }, true);
  }, [setItem]);

  const handlePhotoCapture = (compressed: ImageResult, originalUri: string) => {
    setMode('form');
    if (!photoField) return;

    const fileName = `${item.itemNumber}-${photoField}.jpg`;
    uploadToDrive(originalUri, fileName, item.itemNumber).then((res) => {
      if (res.success && res.driveUrl) {
        const updates: Partial<CatalogItem> = { [photoField]: res.driveUrl };
        if (photoField === 'photoUrlCard' || !item.photoUrl) updates.photoUrl = res.driveUrl;
        setItem({ ...item, ...updates }, true);
      } else {
        addPendingUpload({ itemNumber: item.itemNumber, localUri: originalUri, fieldName: photoField, fileName, timestamp: Date.now() });
      }
    });
  };

  const handleTagScanned = (fields: Partial<CatalogItem>, rawText: string) => {
    const updated = { ...item };
    for (const [key, value] of Object.entries(fields)) {
      if (value && !(updated as any)[key]) (updated as any)[key] = value;
    }
    setItem(updated, true);
    setOcrRawText(rawText);
    setMode('form');
  };

  const handleSave = async () => {
    if (!isTitleValid) { Alert.alert('Required', 'Please enter a title.'); return; }
    setSaving(true);
    try {
      const success = await appendItem(item);
      if (!success) await saveDraftItem(item);
      reset(item);
      navigation.goBack();
    } catch (err) {
      await saveDraftItem(item);
      navigation.goBack();
    }
    setSaving(false);
  };

  const handleMarketResearch = () => {
    const query = [item.designerBrand, item.title, item.category].filter(Boolean).join(' ');
    if (!query) { Alert.alert('Research', 'Please enter a title or brand first.'); return; }
    Linking.openURL(`https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}&LH_Sold=1&LH_Complete=1`);
  };

  const handleLabelResearch = () => {
    const query = [item.designerBrand, item.title, 'tag label'].filter(Boolean).join(' ');
    if (!query) { Alert.alert('Research', 'Please enter a title or brand first.'); return; }
    Linking.openURL(`https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=isch`);
  };

  const handleAISuggest = () => {
    Alert.alert('AI Assistant', 'AI suggestion feature coming soon.');
  };

  const handleMarkAsSold = () => {
    Alert.alert('Mark as Sold?', 'This will update status to Sold.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm Sold', onPress: () => updateField('saleStatus', 'Sold', true) }
    ]);
  };

  if (mode === 'camera') return <CameraScreen itemNumber={item.itemNumber} onCapture={handlePhotoCapture} onCancel={() => setMode('form')} />;
  if (mode === 'tagScan') return <TagScanner onFieldsDetected={handleTagScanned} onCancel={() => setMode('form')} />;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={64}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>{existingItem ? 'Edit Item' : 'New Item'}</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          <Text style={[styles.saveText, saving && { opacity: 0.5 }]}>{saving ? 'Saving…' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.itemNumberBadge}><Text style={styles.itemNumberText}>{item.itemNumber}</Text></View>

        <QuickActionsBar
          captureStatus={useMemo(() => ({
            photoUrlCard: !!item.photoUrlCard, photoUrlFront: !!item.photoUrlFront,
            photoUrlBack: !!item.photoUrlBack, photoUrlDetail: !!item.photoUrlDetail,
            photoUrlTabletopWide: !!item.photoUrlTabletopWide, photoUrlTabletopDetail: !!item.photoUrlTabletopDetail,
            photoUrlTabletopMeasure1: !!item.photoUrlTabletopMeasure1, photoUrlTabletopMeasure2: !!item.photoUrlTabletopMeasure2,
          }), [
            item.photoUrlCard, item.photoUrlFront, item.photoUrlBack, item.photoUrlDetail,
            item.photoUrlTabletopWide, item.photoUrlTabletopDetail, item.photoUrlTabletopMeasure1, item.photoUrlTabletopMeasure2
          ])}
          ocrRawText={ocrRawText}
          onCapture={(f) => { setPhotoField(f); setMode('camera'); }}
          onScanTag={() => setMode('tagScan')}
        />

        {item.photoUrlCard && <View style={styles.photoPreview}><Image source={{ uri: item.photoUrlCard }} style={styles.photoImage} resizeMode="cover" /></View>}

        <View style={styles.sectionHeader}><Text style={styles.sectionLabel}>Item Details</Text></View>

        <View style={styles.field}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Title *</Text>
            <TouchableOpacity onPress={handleAISuggest} style={styles.aiBadge}><Text style={styles.aiBadgeText}>🪄 AI Suggest</Text></TouchableOpacity>
          </View>
          <TextInput style={styles.input} value={item.title} onChangeText={(v) => updateField('title', v)} placeholder="Vintage Levi 501" placeholderTextColor="#4a5568" maxLength={80} />
          <View style={styles.fieldFooter}><Text style={[styles.charCount, item.title.length >= 70 && { color: '#fbbf24' }, item.title.length >= 80 && { color: '#f87171' }]}>{item.title.length}/80</Text></View>
        </View>

        <View style={styles.field}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Brand</Text>
            <TouchableOpacity onPress={handleLabelResearch}><Text style={styles.researchLink}>🔍 Label Research</Text></TouchableOpacity>
          </View>
          <TextInput style={[styles.input, item.designerBrand && ocrRawText && styles.inputOcr]} value={item.designerBrand} onChangeText={(v) => updateField('designerBrand', v)} placeholder="Levi's" placeholderTextColor="#4a5568" />
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1 }}><Text style={styles.label}>Category</Text><View style={styles.pickerWrapper}><Picker selectedValue={item.category} onValueChange={(v) => updateField('category', v as string, true)} style={styles.picker}>{categoryItems}</Picker></View></View>
          <View style={{ flex: 1 }}><Text style={styles.label}>Size</Text><TextInput style={styles.input} value={item.size} onChangeText={(v) => updateField('size', v)} placeholder="M" placeholderTextColor="#4a5568" /></View>
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1 }}><Text style={styles.label}>Condition</Text><View style={styles.pickerWrapper}><Picker selectedValue={item.condition} onValueChange={(v) => updateField('condition', v as string, true)} style={styles.picker}>{conditionItems}</Picker></View></View>
          <View style={{ flex: 1 }}><Text style={styles.label}>Color</Text><View style={styles.pickerWrapper}><Picker selectedValue={item.color} onValueChange={(v) => updateField('color', v as string, true)} style={styles.picker}>{colorItems}</Picker></View></View>
        </View>

        <View style={styles.field}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Price</Text>
            <TouchableOpacity onPress={handleMarketResearch}><Text style={styles.researchLink}>📈 Market Sold</Text></TouchableOpacity>
          </View>
          <TextInput style={styles.input} value={item.price} onChangeText={(v) => updateField('price', v)} placeholder="0.00" keyboardType="decimal-pad" placeholderTextColor="#4a5568" />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Marketplaces</Text>
          <MarketplaceSelector selected={item.marketplace} available={dropdowns.marketplaces} onToggle={toggleMarketplace} />
        </View>

        <View style={styles.field}><Text style={styles.label}>Notes</Text><TextInput style={[styles.input, styles.textArea]} value={item.notes} onChangeText={(v) => updateField('notes', v)} multiline numberOfLines={3} placeholderTextColor="#4a5568" /></View>

        <View style={styles.formActions}>
          <TouchableOpacity style={[styles.saveButton, saving && { opacity: 0.5 }]} onPress={handleSave} disabled={saving}>
            {saving && <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />}
            <Text style={styles.saveButtonText}>{saving ? 'Saving…' : 'Save Item'}</Text>
          </TouchableOpacity>
          {existingItem && item.saleStatus !== 'Sold' && (
            <TouchableOpacity style={styles.soldButton} onPress={handleMarkAsSold}><Text style={styles.soldButtonText}>Mark Sold</Text></TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.publishButton} onPress={() => navigation.navigate('Publish', { item })}><Text style={styles.publishButtonText}>🏪 Publish to Marketplaces</Text></TouchableOpacity>
      </ScrollView>

      <UndoRedoBar canUndo={canUndo} canRedo={canRedo} onUndo={undo} onRedo={redo} historyLength={historyLength} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1117' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1a1d27' },
  cancelText: { color: '#94a3b8', fontSize: 16, fontWeight: '600' },
  headerTitle: { color: '#e8eaf6', fontSize: 17, fontWeight: '700' },
  saveText: { color: '#4f6ef7', fontSize: 16, fontWeight: '700' },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },
  itemNumberBadge: { alignSelf: 'center', backgroundColor: '#1a1d27', borderWidth: 1, borderColor: '#4f6ef7', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6, marginVertical: 14 },
  itemNumberText: { color: '#818cf8', fontSize: 13, fontWeight: '700' },
  quickActions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 16 },
  actionButton: { flex: 1, minWidth: '22%', backgroundColor: '#1a1d27', borderWidth: 1, borderColor: '#2a2d3a', borderRadius: 12, paddingVertical: 12, alignItems: 'center', gap: 4 },
  actionIcon: { fontSize: 20 },
  actionLabel: { color: '#cbd5e1', fontSize: 11, fontWeight: '600' },
  actionLabelCaptured: { color: '#4ade80' },
  actionButtonCaptured: { borderColor: '#4ade80', backgroundColor: 'rgba(74, 222, 128, 0.05)' },
  photoPreview: { marginBottom: 16, borderRadius: 12, overflow: 'hidden', backgroundColor: '#1a1d27', borderWidth: 1, borderColor: '#2a2d3a' },
  photoImage: { width: '100%', height: 200 },
  sectionHeader: { marginTop: 8, marginBottom: 12 },
  sectionLabel: { color: '#6b7280', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  field: { marginBottom: 14 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  label: { color: '#cbd5e1', fontSize: 13, fontWeight: '600' },
  aiBadge: { backgroundColor: 'rgba(124, 58, 237, 0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(124, 58, 237, 0.3)' },
  aiBadgeText: { color: '#a78bfa', fontSize: 11, fontWeight: '700' },
  researchLink: { color: '#60a5fa', fontSize: 11, fontWeight: '600' },
  input: { backgroundColor: '#1a1d27', borderWidth: 1, borderColor: '#2a2d3a', borderRadius: 10, color: '#e8eaf6', fontSize: 15, paddingHorizontal: 14, paddingVertical: 12 },
  inputOcr: { borderColor: 'rgba(74, 222, 128, 0.4)', backgroundColor: 'rgba(74, 222, 128, 0.05)' },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  pickerWrapper: { backgroundColor: '#1a1d27', borderWidth: 1, borderColor: '#2a2d3a', borderRadius: 10, overflow: 'hidden' },
  picker: { color: '#e8eaf6', height: 48 },
  fieldFooter: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4 },
  charCount: { fontSize: 11, color: '#94a3b8' },
  row: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  marketplacesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  marketChip: { backgroundColor: '#1a1d27', borderWidth: 1, borderColor: '#2a2d3a', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  marketChipSelected: { backgroundColor: 'rgba(79, 110, 247, 0.2)', borderColor: '#4f6ef7' },
  marketChipText: { color: '#94a3b8', fontSize: 13 },
  marketChipTextSelected: { color: '#4f6ef7', fontWeight: '700' },
  formActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  saveButton: { flex: 1, backgroundColor: '#4f6ef7', borderRadius: 14, paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  saveButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  soldButton: { backgroundColor: '#1a1d27', borderWidth: 1, borderColor: '#f87171', borderRadius: 14, paddingVertical: 16, paddingHorizontal: 20 },
  soldButtonText: { color: '#f87171', fontSize: 16, fontWeight: '700' },
  publishButton: { backgroundColor: '#1a1d27', borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 10, borderWidth: 1.5, borderColor: '#4f6ef7' },
  publishButtonText: { color: '#4f6ef7', fontSize: 16, fontWeight: '700' },
});

import React, { useState, useEffect } from 'react';
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
import { Picker } from '@react-native-picker/picker';
import { CatalogItem, DropdownOptions, ImageResult } from '../types';
import { fetchDropdowns, generateItemNumber, appendItem } from '../services/sheets';
import { saveDraftItem, addPendingUpload } from '../services/localStorage';
import { uploadToDrive } from '../services/driveUpload';
import { formatFileSize } from '../services/imageProcessor';
import CameraScreen from './CameraScreen';
import TagScanner from '../components/TagScanner';

interface Props {
  existingItems: CatalogItem[];
  onSave: (item: CatalogItem) => void;
  onCancel: () => void;
}

type FormMode = 'form' | 'camera' | 'tagScan';

export default function ItemFormScreen({ existingItems, onSave, onCancel }: Props) {
  const [mode, setMode] = useState<FormMode>('form');
  const [dropdowns, setDropdowns] = useState<DropdownOptions>({
    categories: [], conditions: [], saleStatuses: [],
    marketplaces: [], colors: [], sizes: [],
  });

  const [item, setItem] = useState<CatalogItem>({
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

  const [photo, setPhoto] = useState<{ compressed: ImageResult; originalUri: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [ocrRawText, setOcrRawText] = useState('');

  useEffect(() => {
    fetchDropdowns().then(setDropdowns);
  }, []);

  const updateField = (field: keyof CatalogItem, value: string) => {
    setItem(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoCapture = (compressed: ImageResult, originalUri: string) => {
    setPhoto({ compressed, originalUri });
    setMode('form');
  };

  const handleTagScanned = (fields: Partial<CatalogItem>, rawText: string) => {
    // Merge OCR fields into form (only fill empty fields)
    setItem(prev => {
      const updated = { ...prev };
      for (const [key, value] of Object.entries(fields)) {
        const k = key as keyof CatalogItem;
        if (value && !prev[k]) {
          (updated as any)[k] = value;
        }
      }
      return updated;
    });
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
      // Upload original photo to Drive if available
      if (photo) {
        const uploadResult = await uploadToDrive(
          photo.originalUri,
          `${item.itemNumber}.jpg`,
          item.itemNumber
        );

        if (uploadResult.success && uploadResult.driveUrl) {
          item.photoUrl = uploadResult.driveUrl;
        } else {
          // Queue for later upload
          await addPendingUpload({
            itemNumber: item.itemNumber,
            localUri: photo.originalUri,
            fileName: `${item.itemNumber}.jpg`,
            timestamp: Date.now(),
          });
        }
      }

      // Try to append to Google Sheet
      const sheetSuccess = await appendItem(item);

      if (!sheetSuccess) {
        // Save locally as draft
        await saveDraftItem(item);
      }

      onSave(item);
    } catch (error) {
      await saveDraftItem(item);
      Alert.alert('Saved Locally', 'Item saved as draft. It will sync when connection is available.');
      onSave(item);
    }

    setSaving(false);
  };

  // Camera mode
  if (mode === 'camera') {
    return (
      <CameraScreen
        itemNumber={item.itemNumber}
        onCapture={handlePhotoCapture}
        onCancel={() => setMode('form')}
      />
    );
  }

  // Tag scan mode
  if (mode === 'tagScan') {
    return (
      <TagScanner
        onFieldsDetected={handleTagScanned}
        onCancel={() => setMode('form')}
      />
    );
  }

  // Form mode
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Item</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            <Text style={[styles.saveText, saving && { opacity: 0.5 }]}>
              {saving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Item Number */}
        <View style={styles.itemNumberBadge}>
          <Text style={styles.itemNumberText}>{item.itemNumber}</Text>
        </View>

        {/* Quick Actions: Photo + Tag Scan */}
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

        {/* Photo Preview */}
        {photo && (
          <View style={styles.photoPreview}>
            <Image source={{ uri: photo.compressed.uri }} style={styles.photoImage} resizeMode="cover" />
            <Text style={styles.photoSize}>
              {formatFileSize(photo.compressed.fileSize || 0)} | {photo.compressed.width}x{photo.compressed.height}
            </Text>
          </View>
        )}

        {/* OCR Raw Text (if scanned) */}
        {ocrRawText ? (
          <View style={styles.ocrBanner}>
            <Text style={styles.ocrBannerLabel}>Tag text detected — fields pre-filled below</Text>
          </View>
        ) : null}

        {/* Form Fields */}
        <Text style={styles.sectionLabel}>Item Details</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Title <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={item.title}
            onChangeText={v => updateField('title', v)}
            placeholder="e.g., Vintage Levi 501 Jeans"
            placeholderTextColor="#4a5568"
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
                onValueChange={v => updateField('category', v)}
                style={styles.picker}
                dropdownIconColor="#94a3b8"
              >
                <Picker.Item label="Select..." value="" color="#4a5568" />
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
              placeholder="e.g., M, 32x30"
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
                onValueChange={v => updateField('condition', v)}
                style={styles.picker}
                dropdownIconColor="#94a3b8"
              >
                <Picker.Item label="Select..." value="" color="#4a5568" />
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
                onValueChange={v => updateField('color', v)}
                style={styles.picker}
                dropdownIconColor="#94a3b8"
              >
                <Picker.Item label="Select..." value="" color="#4a5568" />
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
            placeholder="e.g., Chest:38 Length:26"
            placeholderTextColor="#4a5568"
          />
        </View>

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
                onValueChange={v => updateField('saleStatus', v)}
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
              onValueChange={v => updateField('marketplace', v)}
              style={styles.picker}
              dropdownIconColor="#94a3b8"
            >
              <Picker.Item label="Select..." value="" color="#4a5568" />
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
            placeholder="Additional notes, care instructions, flaws..."
            placeholderTextColor="#4a5568"
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && { opacity: 0.5 }]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : 'Save Item'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1117',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 12,
  },
  cancelText: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#e2e8f0',
    fontSize: 18,
    fontWeight: '700',
  },
  saveText: {
    color: '#7c3aed',
    fontSize: 16,
    fontWeight: '700',
  },
  itemNumberBadge: {
    alignSelf: 'center',
    backgroundColor: '#1a1d27',
    borderWidth: 1,
    borderColor: '#7c3aed',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 16,
  },
  itemNumberText: {
    color: '#a78bfa',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#1a1d27',
    borderWidth: 1,
    borderColor: '#2d3148',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 6,
  },
  actionIcon: {
    fontSize: 28,
  },
  actionLabel: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '600',
  },
  photoPreview: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1a1d27',
  },
  photoImage: {
    width: '100%',
    height: 200,
  },
  photoSize: {
    color: '#4ade80',
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 6,
  },
  ocrBanner: {
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.3)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  ocrBannerLabel: {
    color: '#a78bfa',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  sectionLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 8,
  },
  field: {
    marginBottom: 14,
  },
  label: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  required: {
    color: '#f87171',
  },
  input: {
    backgroundColor: '#1a1d27',
    borderWidth: 1,
    borderColor: '#2d3148',
    borderRadius: 8,
    color: '#e2e8f0',
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputOcr: {
    borderColor: 'rgba(74, 222, 128, 0.4)',
    backgroundColor: 'rgba(74, 222, 128, 0.05)',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pickerWrapper: {
    backgroundColor: '#1a1d27',
    borderWidth: 1,
    borderColor: '#2d3148',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    color: '#e2e8f0',
    height: 48,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  saveButton: {
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import WhiteBalancePicker from './WhiteBalancePicker';
import { scanTag } from '../services/ocrService';
import { compressImage } from '../services/imageProcessor';
import { CatalogItem } from '../types';

interface Props {
  onFieldsDetected: (fields: Partial<CatalogItem>, rawText: string) => void;
  onCancel: () => void;
}

export default function TagScanner({ onFieldsDetected, onCancel }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [whiteBalance, setWhiteBalance] = useState<any>('auto');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<{
    rawText: string;
    parsedFields: Partial<CatalogItem>;
    confidence: string;
    imageUri: string;
  } | null>(null);
  const cameraRef = React.useRef<CameraView>(null);

  const processTagImage = async (uri: string) => {
    setScanning(true);
    try {
      // Compress for OCR (smaller = faster API call)
      const compressed = await compressImage(uri);
      const ocrResult = await scanTag(compressed.uri);

      setResult({
        ...ocrResult,
        imageUri: compressed.uri,
      });
    } catch (error) {
      setResult({
        rawText: 'OCR failed. You can enter details manually.',
        parsedFields: {},
        confidence: 'low',
        imageUri: uri,
      });
    }
    setScanning(false);
  };

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (photo) {
        await processTagImage(photo.uri);
      }
    } catch (error) {
      console.error('Capture error:', error);
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      await processTagImage(result.assets[0].uri);
    }
  };

  const handleAccept = () => {
    if (result) {
      onFieldsDetected(result.parsedFields, result.rawText);
    }
  };

  const handleRescan = () => {
    setResult(null);
  };

  // Show results
  if (result) {
    const confidenceColor =
      result.confidence === 'high' ? '#4ade80' :
      result.confidence === 'medium' ? '#fbbf24' : '#f87171';

    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.resultContainer}>
          <Text style={styles.title}>Tag Scan Results</Text>

          <View style={[styles.confidenceBadge, { borderColor: confidenceColor }]}>
            <View style={[styles.confidenceDot, { backgroundColor: confidenceColor }]} />
            <Text style={[styles.confidenceText, { color: confidenceColor }]}>
              {result.confidence.toUpperCase()} confidence
            </Text>
          </View>

          <Image source={{ uri: result.imageUri }} style={styles.tagPreview} resizeMode="contain" />

          {/* Detected Fields */}
          <Text style={styles.sectionLabel}>Detected Fields</Text>
          {Object.entries(result.parsedFields).length > 0 ? (
            Object.entries(result.parsedFields).map(([key, value]) => (
              <View key={key} style={styles.fieldRow}>
                <Text style={styles.fieldKey}>{formatFieldName(key)}</Text>
                <Text style={styles.fieldValue}>{String(value)}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noFields}>No fields auto-detected. You can enter them manually.</Text>
          )}

          {/* Raw OCR Text */}
          <Text style={styles.sectionLabel}>Raw Text</Text>
          <View style={styles.rawTextBox}>
            <Text style={styles.rawText}>{result.rawText || 'No text detected'}</Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.buttonSecondary} onPress={handleRescan}>
              <Text style={styles.buttonSecondaryText}>Rescan</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={handleAccept}>
              <Text style={styles.buttonText}>Use These Fields</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Camera / scanning mode
  if (!permission?.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Camera access needed to scan tags.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buttonSecondary} onPress={onCancel}>
          <Text style={styles.buttonSecondaryText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Tag</Text>
        <View style={{ width: 60 }} />
      </View>

      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        {...({ whiteBalance } as any)}
      >
        {/* Tag alignment guide */}
        <View style={styles.guideOverlay}>
          <View style={styles.guideBox}>
            <Text style={styles.guideText}>Align tag within frame</Text>
          </View>
        </View>

        {scanning && (
          <View style={styles.scanningOverlay}>
            <ActivityIndicator color="#7c3aed" size="large" />
            <Text style={styles.scanningText}>Reading tag...</Text>
          </View>
        )}
      </CameraView>

      <View style={styles.controls}>
        <WhiteBalancePicker selected={whiteBalance} onSelect={setWhiteBalance} />
        <View style={styles.captureRow}>
          <TouchableOpacity style={styles.libraryButton} onPress={handlePickImage}>
            <Text style={styles.libraryIcon}>🖼</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.captureButton}
            onPress={handleCapture}
            disabled={scanning}
          >
            <View style={styles.captureInner}>
              <Text style={styles.captureLabel}>SCAN</Text>
            </View>
          </TouchableOpacity>

          <View style={{ width: 50 }} />
        </View>
      </View>
    </View>
  );
}

function formatFieldName(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, s => s.toUpperCase())
    .trim();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1117',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
  },
  cancelText: {
    color: '#7c3aed',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#e2e8f0',
    fontSize: 16,
    fontWeight: '700',
  },
  camera: {
    flex: 1,
  },
  guideOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideBox: {
    width: '80%',
    height: 200,
    borderWidth: 2,
    borderColor: 'rgba(124, 58, 237, 0.6)',
    borderRadius: 12,
    borderStyle: 'dashed',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 12,
  },
  guideText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
  },
  scanningOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanningText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 14,
  },
  controls: {
    backgroundColor: '#0f1117',
    paddingBottom: 30,
    paddingHorizontal: 16,
  },
  captureRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
    marginTop: 16,
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  libraryButton: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  libraryIcon: {
    fontSize: 24,
  },
  resultContainer: {
    padding: 20,
    paddingTop: 50,
  },
  title: {
    color: '#e2e8f0',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 16,
    gap: 6,
  },
  confidenceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tagPreview: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 20,
    backgroundColor: '#1a1d27',
  },
  sectionLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 8,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1a1d27',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 6,
  },
  fieldKey: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
  },
  fieldValue: {
    color: '#4ade80',
    fontSize: 14,
    fontWeight: '600',
    maxWidth: '60%',
    textAlign: 'right',
  },
  noFields: {
    color: '#64748b',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
  rawTextBox: {
    backgroundColor: '#1a1d27',
    borderRadius: 8,
    padding: 14,
    marginBottom: 20,
  },
  rawText: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'monospace',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 8,
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#7c3aed',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  buttonSecondary: {
    backgroundColor: '#1a1d27',
    borderWidth: 1,
    borderColor: '#2d3148',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  buttonSecondaryText: {
    color: '#94a3b8',
    fontSize: 15,
    fontWeight: '600',
  },
  permissionText: {
    color: '#e2e8f0',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
    paddingHorizontal: 32,
    marginBottom: 20,
  },
});

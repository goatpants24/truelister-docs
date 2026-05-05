import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import WhiteBalancePicker from '../components/WhiteBalancePicker';
import { processImage, formatFileSize } from '../services/imageProcessor';
import { WhiteBalanceMode, WhiteBalanceSettings, ImageResult } from '../types';

interface Props {
  onCapture: (compressed: ImageResult, originalUri: string) => void;
  onCancel: () => void;
  itemNumber: string;
}

export default function CameraScreen({ onCapture, onCancel, itemNumber }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [whiteBalance, setWhiteBalance] = useState<WhiteBalanceMode>('auto');
  const [processing, setProcessing] = useState(false);
  const [preview, setPreview] = useState<{ compressed: ImageResult; originalUri: string } | null>(null);
  const cameraRef = useRef<CameraView>(null);

  if (!permission) {
    return <View style={styles.container}><ActivityIndicator color="#7c3aed" size="large" /></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Camera access is needed to photograph items.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buttonSecondary} onPress={onCancel}>
          <Text style={styles.buttonSecondaryText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    setProcessing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1, // Capture at full quality; we compress separately
        exif: true,
      });
      if (!photo) {
        Alert.alert('Error', 'Failed to capture photo');
        setProcessing(false);
        return;
      }

      const wbSettings: WhiteBalanceSettings = { mode: whiteBalance };
      const result = await processImage(photo.uri, wbSettings);
      setPreview(result);
    } catch (error) {
      Alert.alert('Error', 'Failed to process photo');
    }
    setProcessing(false);
  };

  const handlePickFromLibrary = async () => {
    setProcessing(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const wbSettings: WhiteBalanceSettings = { mode: whiteBalance };
        const processed = await processImage(result.assets[0].uri, wbSettings);
        setPreview(processed);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
    setProcessing(false);
  };

  const handleConfirm = () => {
    if (preview) {
      onCapture(preview.compressed, preview.originalUri);
    }
  };

  const handleRetake = () => {
    setPreview(null);
  };

  // Preview mode — show compressed result with size info
  if (preview) {
    return (
      <View style={styles.container}>
        <View style={styles.previewHeader}>
          <Text style={styles.previewTitle}>Photo Preview — {itemNumber}</Text>
          <Text style={styles.previewSize}>
            Compressed: {formatFileSize(preview.compressed.fileSize || 0)}
            {' | '}
            {preview.compressed.width} x {preview.compressed.height}
          </Text>
        </View>
        <Image source={{ uri: preview.compressed.uri }} style={styles.previewImage} resizeMode="contain" />
        <View style={styles.previewActions}>
          <TouchableOpacity style={styles.buttonSecondary} onPress={handleRetake}>
            <Text style={styles.buttonSecondaryText}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={handleConfirm}>
            <Text style={styles.buttonText}>Use Photo</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Camera mode
  return (
    <View style={styles.container}>
      <View style={styles.cameraHeader}>
        <TouchableOpacity onPress={onCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{itemNumber}</Text>
        <View style={{ width: 60 }} />
      </View>

      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        {...({ whiteBalance } as any)}
      >
        {processing && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator color="#fff" size="large" />
            <Text style={styles.processingText}>Processing...</Text>
          </View>
        )}
      </CameraView>

      <View style={styles.controls}>
        <WhiteBalancePicker selected={whiteBalance} onSelect={setWhiteBalance} />

        <View style={styles.captureRow}>
          <TouchableOpacity style={styles.libraryButton} onPress={handlePickFromLibrary}>
            <Text style={styles.libraryIcon}>🖼</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.captureButton}
            onPress={handleCapture}
            disabled={processing}
          >
            <View style={styles.captureInner} />
          </TouchableOpacity>

          <View style={{ width: 50 }} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1117',
  },
  camera: {
    flex: 1,
  },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: '#0f1117',
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
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#fff',
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
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 14,
  },
  permissionText: {
    color: '#e2e8f0',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 100,
    paddingHorizontal: 32,
  },
  button: {
    backgroundColor: '#7c3aed',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignSelf: 'center',
    marginTop: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonSecondary: {
    backgroundColor: '#1a1d27',
    borderWidth: 1,
    borderColor: '#2d3148',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignSelf: 'center',
    marginTop: 12,
  },
  buttonSecondaryText: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '600',
  },
  previewHeader: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
    alignItems: 'center',
  },
  previewTitle: {
    color: '#e2e8f0',
    fontSize: 18,
    fontWeight: '700',
  },
  previewSize: {
    color: '#4ade80',
    fontSize: 13,
    marginTop: 4,
  },
  previewImage: {
    flex: 1,
    marginHorizontal: 16,
    borderRadius: 12,
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 20,
  },
});

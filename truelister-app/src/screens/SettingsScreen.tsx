import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  APPS_SCRIPT_URL: 'settings_apps_script_url',
  DRIVE_FOLDER_ID: 'settings_drive_folder_id',
};

export default function SettingsScreen() {
  const [appsScriptUrl, setAppsScriptUrl] = useState('');
  const [driveFolderId, setDriveFolderId] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const [url, folder] = await Promise.all([
        AsyncStorage.getItem(KEYS.APPS_SCRIPT_URL),
        AsyncStorage.getItem(KEYS.DRIVE_FOLDER_ID),
      ]);
      if (url) setAppsScriptUrl(url);
      if (folder) setDriveFolderId(folder);
    })();
  }, []);

  const handleSave = async () => {
    await Promise.all([
      AsyncStorage.setItem(KEYS.APPS_SCRIPT_URL, appsScriptUrl.trim()),
      AsyncStorage.setItem(KEYS.DRIVE_FOLDER_ID, driveFolderId.trim()),
    ]);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will remove all local drafts and settings. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            setAppsScriptUrl('');
            setDriveFolderId('');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Settings</Text>

      {/* Google Sheet */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Google Sheet</Text>
        <Text style={styles.sectionDesc}>
          Your catalog sheet is already connected and reading live data.
        </Text>
        <TouchableOpacity
          style={styles.linkBtn}
          onPress={() =>
            Linking.openURL(
              'https://docs.google.com/spreadsheets/d/1QHrXKkuh-6bNUyeYgp8jZrdP3t8MzBSyx-8k-GjFOcI/edit'
            )
          }
        >
          <Text style={styles.linkBtnText}>Open Google Sheet ↗</Text>
        </TouchableOpacity>
      </View>

      {/* Apps Script */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Write to Sheet</Text>
        <Text style={styles.sectionDesc}>
          Deploy the Apps Script from the repo's{' '}
          <Text style={styles.code}>docs/apps-script.js</Text> and paste the
          deployment URL here to enable saving new items.
        </Text>
        <TextInput
          style={styles.input}
          value={appsScriptUrl}
          onChangeText={setAppsScriptUrl}
          placeholder="https://script.google.com/macros/s/..."
          placeholderTextColor="#4a4d60"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />
      </View>

      {/* Drive Folder */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Google Drive Photo Folder</Text>
        <Text style={styles.sectionDesc}>
          Create a folder in Google Drive for original photos and paste its ID
          here. Find the ID in the folder's URL after{' '}
          <Text style={styles.code}>/folders/</Text>.
        </Text>
        <TextInput
          style={styles.input}
          value={driveFolderId}
          onChangeText={setDriveFolderId}
          placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
          placeholderTextColor="#4a4d60"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* Tag OCR — info only, no key needed */}
      <View style={styles.infoSection}>
        <Text style={styles.infoIcon}>✓</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.infoTitle}>Tag OCR — No Setup Required</Text>
          <Text style={styles.infoDesc}>
            Tag scanning runs entirely on-device using Google ML Kit (free,
            open-source, no API key, no billing account). Just tap "Scan Tag"
            and point your camera at a clothing label.
          </Text>
        </View>
      </View>

      {/* Save */}
      <TouchableOpacity
        style={[styles.saveBtn, saved && styles.saveBtnSuccess]}
        onPress={handleSave}
      >
        <Text style={styles.saveBtnText}>{saved ? '✓ Saved' : 'Save Settings'}</Text>
      </TouchableOpacity>

      {/* Danger zone */}
      <View style={styles.dangerSection}>
        <Text style={styles.dangerTitle}>Danger Zone</Text>
        <TouchableOpacity style={styles.dangerBtn} onPress={handleClearData}>
          <Text style={styles.dangerBtnText}>Clear All Local Data</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.version}>TrueLister v1.0.0 · Expo SDK 54</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1117' },
  content: { padding: 20, paddingBottom: 48 },
  pageTitle: { fontSize: 26, fontWeight: '800', color: '#e8eaf6', marginBottom: 24 },
  section: {
    backgroundColor: '#1a1d27',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#2a2d3a',
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#e8eaf6', marginBottom: 6 },
  sectionDesc: { fontSize: 13, color: '#6b7280', lineHeight: 19, marginBottom: 12 },
  code: { fontFamily: 'Courier', color: '#a0a8c0', fontSize: 12 },
  input: {
    backgroundColor: '#0f1117',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2a2d3a',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#e8eaf6',
    fontFamily: 'Courier',
  },
  linkBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#1e2235',
    borderWidth: 1,
    borderColor: '#4f6ef7',
  },
  linkBtnText: { fontSize: 13, color: '#4f6ef7', fontWeight: '600' },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#0d1f17',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#166534',
    gap: 12,
  },
  infoIcon: { fontSize: 18, color: '#22c55e', marginTop: 1 },
  infoTitle: { fontSize: 14, fontWeight: '700', color: '#22c55e', marginBottom: 4 },
  infoDesc: { fontSize: 13, color: '#6b7280', lineHeight: 19 },
  saveBtn: {
    backgroundColor: '#4f6ef7',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 24,
  },
  saveBtnSuccess: { backgroundColor: '#22c55e' },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  dangerSection: {
    backgroundColor: '#1a1117',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#3a1a1a',
    marginBottom: 24,
  },
  dangerTitle: { fontSize: 14, fontWeight: '700', color: '#ef4444', marginBottom: 10 },
  dangerBtn: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ef4444',
    paddingVertical: 10,
    alignItems: 'center',
  },
  dangerBtnText: { color: '#ef4444', fontWeight: '600', fontSize: 14 },
  version: { textAlign: 'center', fontSize: 12, color: '#3a3d50' },
});

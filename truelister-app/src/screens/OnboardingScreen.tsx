import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { clearSpreadsheetIdCache } from '../services/sheets';

export default function OnboardingScreen() {
  const navigation = useNavigation<any>();
  const [sheetUrl, setSheetUrl] = useState('');
  const [appsScriptUrl, setAppsScriptUrl] = useState('');
  const [step, setStep] = useState(1);

  const extractId = (url: string) => {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : url;
  };

  const handleNext = async () => {
    if (step === 1) {
      if (!sheetUrl) {
        Alert.alert('Setup', 'Please paste your Google Sheet URL to continue.');
        return;
      }
      const id = extractId(sheetUrl);
      await AsyncStorage.setItem('settings_spreadsheet_id', id);
      clearSpreadsheetIdCache();
      setStep(2);
    } else {
      if (appsScriptUrl) {
        await AsyncStorage.setItem('settings_apps_script_url', appsScriptUrl.trim());
        clearSpreadsheetIdCache();
      }
      await AsyncStorage.setItem('has_onboarded', 'true');
      navigation.replace('Main');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.emoji}>{step === 1 ? '📊' : '🚀'}</Text>
      <Text style={styles.title}>
        {step === 1 ? 'Connect your Catalog' : 'Enable Saving'}
      </Text>
      <Text style={styles.subtitle}>
        {step === 1
          ? 'Paste the URL of your Google Sheet. TruCatLog will use this to read your inventory.'
          : 'Paste your Apps Script Web App URL to enable saving new items. (Optional, you can do this later)'}
      </Text>

      <TextInput
        style={styles.input}
        placeholder={step === 1 ? "https://docs.google.com/spreadsheets/d/..." : "https://script.google.com/macros/s/..."}
        placeholderTextColor="#4a5568"
        value={step === 1 ? sheetUrl : appsScriptUrl}
        onChangeText={step === 1 ? setSheetUrl : setAppsScriptUrl}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <TouchableOpacity style={styles.button} onPress={handleNext}>
        <Text style={styles.buttonText}>{step === 1 ? 'Next' : 'Finish Setup'}</Text>
      </TouchableOpacity>

      {step === 1 && (
        <TouchableOpacity style={styles.skip} onPress={() => setStep(2)}>
          <Text style={styles.skipText}>Use default demo sheet</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1117' },
  content: { padding: 40, alignItems: 'center', justifyContent: 'center', minHeight: '100%' },
  emoji: { fontSize: 64, marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '800', color: '#e8eaf6', textAlign: 'center', marginBottom: 12 },
  subtitle: { fontSize: 16, color: '#94a3b8', textAlign: 'center', marginBottom: 32, lineHeight: 24 },
  input: {
    width: '100%',
    backgroundColor: '#1a1d27',
    borderWidth: 1,
    borderColor: '#2a2d3a',
    borderRadius: 12,
    color: '#e8eaf6',
    padding: 16,
    fontSize: 14,
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#4f6ef7',
    width: '100%',
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#4f6ef7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '700' },
  skip: { marginTop: 20 },
  skipText: { color: '#6b7280', fontSize: 14, fontWeight: '500' },
});

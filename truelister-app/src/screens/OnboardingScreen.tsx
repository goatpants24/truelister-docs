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
import { setSpreadsheetId, setAppsScriptUrl } from '../services/localStorage';

const validateGoogleSheetUrl = (url: string): boolean | null => {
  if (!url.trim()) return null;
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed.includes('docs.google.com/spreadsheets');
  }
  // Check if it's a valid direct spreadsheet ID
  return /^[a-zA-Z0-9-_]{20,}$/.test(trimmed);
};

const validateAppsScriptUrl = (url: string): boolean | null => {
  if (!url.trim()) return null;
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed.includes('script.google.com/macros/s/');
  }
  return false;
};

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
      await setSpreadsheetId(id);
      setStep(2);
    } else {
      if (appsScriptUrl) {
        await setAppsScriptUrl(appsScriptUrl);
      }
      await AsyncStorage.setItem('has_onboarded', 'true');
      navigation.replace('Main');
    }
  };

  const isSheetValid = validateGoogleSheetUrl(sheetUrl);
  const isScriptValid = validateAppsScriptUrl(appsScriptUrl);

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
        style={[
          styles.input,
          step === 1
            ? (isSheetValid === true ? styles.inputValid : isSheetValid === false ? styles.inputInvalid : null)
            : (isScriptValid === true ? styles.inputValid : isScriptValid === false ? styles.inputInvalid : null)
        ]}
        placeholder={step === 1 ? "https://docs.google.com/spreadsheets/d/..." : "https://script.google.com/macros/s/..."}
        placeholderTextColor="#4a5568"
        value={step === 1 ? sheetUrl : appsScriptUrl}
        onChangeText={step === 1 ? setSheetUrl : setAppsScriptUrl}
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel={step === 1 ? "Google Sheet URL" : "Apps Script Web App URL"}
        returnKeyType={step === 1 ? "next" : "done"}
        blurOnSubmit={step === 1 ? false : true}
        onSubmitEditing={handleNext}
      />

      {step === 1 && isSheetValid !== null && (
        <View style={styles.feedbackContainer} accessibilityLiveRegion="polite">
          <Text style={isSheetValid ? styles.feedbackValidText : styles.feedbackInvalidText}>
            {isSheetValid ? '✓ Valid Google Sheet link detected' : '⚠️ Must be a valid docs.google.com spreadsheets link or sheet ID'}
          </Text>
        </View>
      )}

      {step === 2 && isScriptValid !== null && (
        <View style={styles.feedbackContainer} accessibilityLiveRegion="polite">
          <Text style={isScriptValid ? styles.feedbackValidText : styles.feedbackInvalidText}>
            {isScriptValid ? '✓ Valid Apps Script Web App URL detected' : '⚠️ Must be a valid script.google.com Web App macro link'}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.button,
          (step === 1 && isSheetValid === false) || (step === 2 && isScriptValid === false)
            ? styles.buttonDisabled
            : null
        ]}
        onPress={handleNext}
        disabled={(step === 1 && isSheetValid === false) || (step === 2 && isScriptValid === false)}
        accessibilityRole="button"
        accessibilityLabel={step === 1 ? "Next" : "Finish Setup"}
      >
        <Text style={styles.buttonText}>{step === 1 ? 'Next' : 'Finish Setup'}</Text>
      </TouchableOpacity>

      {step === 1 && (
        <TouchableOpacity
          style={styles.skip}
          onPress={() => setStep(2)}
          accessibilityRole="button"
          accessibilityLabel="Use default demo sheet"
        >
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
  inputValid: {
    borderColor: '#22c55e',
  },
  inputInvalid: {
    borderColor: '#ef4444',
  },
  feedbackContainer: {
    width: '100%',
    marginTop: -16,
    marginBottom: 24,
    paddingHorizontal: 4,
    alignSelf: 'flex-start',
  },
  feedbackValidText: {
    fontSize: 13,
    color: '#22c55e',
    fontWeight: '600',
  },
  feedbackInvalidText: {
    fontSize: 13,
    color: '#ef4444',
    fontWeight: '600',
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
  buttonDisabled: {
    backgroundColor: '#1e2235',
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '700' },
  skip: { marginTop: 20 },
  skipText: { color: '#6b7280', fontSize: 14, fontWeight: '500' },
});

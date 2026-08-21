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
import { setSpreadsheetId, setAppsScriptUrl as setStoredAppsScriptUrl } from '../services/localStorage';

export default function OnboardingScreen() {
  const navigation = useNavigation<any>();
  const [sheetUrl, setSheetUrl] = useState('');
  const [appsScriptUrl, setAppsScriptUrl] = useState('');
  const [step, setStep] = useState(1);

  const extractId = (url: string) => {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : url;
  };

  const isSheetValid = (() => {
    const trimmed = sheetUrl.trim();
    if (trimmed.length === 0) return false;
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed.includes('docs.google.com/spreadsheets');
    }
    return trimmed.length >= 25 && /^[a-zA-Z0-9-_]+$/.test(trimmed);
  })();

  const isAppsScriptValid = (() => {
    const trimmed = appsScriptUrl.trim();
    if (trimmed.length === 0) return true;
    return trimmed.startsWith('https://') && trimmed.includes('script.google.com/macros/s/');
  })();

  const isNextDisabled = step === 1 ? !isSheetValid : !isAppsScriptValid;

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
        await setStoredAppsScriptUrl(appsScriptUrl);
      }
      await AsyncStorage.setItem('has_onboarded', 'true');
      navigation.replace('Main');
    }
  };

  const getInputStyle = () => {
    if (step === 1) {
      if (!sheetUrl) return styles.input;
      return [styles.input, isSheetValid ? styles.inputValid : styles.inputInvalid];
    } else {
      if (!appsScriptUrl) return styles.input;
      return [styles.input, isAppsScriptValid ? styles.inputValid : styles.inputInvalid];
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
        style={getInputStyle()}
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

      {step === 1 && sheetUrl.trim().length > 0 && (
        <Text
          style={[styles.feedbackText, isSheetValid ? styles.feedbackValid : styles.feedbackInvalid]}
          accessibilityLiveRegion="polite"
        >
          {isSheetValid ? '✓ Valid Google Sheet URL format' : '⚠️ Invalid Google Sheet URL format'}
        </Text>
      )}

      {step === 2 && appsScriptUrl.trim().length > 0 && (
        <Text
          style={[styles.feedbackText, isAppsScriptValid ? styles.feedbackValid : styles.feedbackInvalid]}
          accessibilityLiveRegion="polite"
        >
          {isAppsScriptValid ? '✓ Valid Apps Script URL format' : '⚠️ Invalid Apps Script URL format'}
        </Text>
      )}

      <TouchableOpacity
        style={[styles.button, isNextDisabled && styles.buttonDisabled]}
        onPress={handleNext}
        disabled={isNextDisabled}
        accessibilityRole="button"
        accessibilityLabel={step === 1 ? "Next" : "Finish Setup"}
        accessibilityState={{ disabled: isNextDisabled }}
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
  feedbackText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 16,
    textAlign: 'center',
  },
  feedbackValid: {
    color: '#22c55e',
  },
  feedbackInvalid: {
    color: '#ef4444',
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
    backgroundColor: '#1e293b',
    opacity: 0.5,
  },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '700' },
  skip: { marginTop: 20 },
  skipText: { color: '#6b7280', fontSize: 14, fontWeight: '500' },
});

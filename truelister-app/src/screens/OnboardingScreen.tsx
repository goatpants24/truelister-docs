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

  const isSheetUrlValid = (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return true; // empty is unvalidated initial state
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed.includes('docs.google.com/spreadsheets');
    }
    return trimmed.length >= 25; // spreadsheet ID string length
  };

  const isAppsScriptUrlValid = (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return true; // optional field
    return trimmed.startsWith('https://') && trimmed.includes('script.google.com/macros/s/');
  };

  const step1Valid = sheetUrl.trim().length > 0 && isSheetUrlValid(sheetUrl);
  const step2Valid = isAppsScriptUrlValid(appsScriptUrl);

  const isCurrentValid = step === 1 ? isSheetUrlValid(sheetUrl) : step2Valid;
  const isCurrentEmpty = step === 1 ? sheetUrl.trim().length === 0 : appsScriptUrl.trim().length === 0;

  const handleNext = async () => {
    if (step === 1) {
      if (!sheetUrl.trim()) {
        Alert.alert('Setup', 'Please paste your Google Sheet URL to continue.');
        return;
      }
      if (!isSheetUrlValid(sheetUrl)) {
        Alert.alert('Invalid URL', 'Please enter a valid Google Sheet URL or ID.');
        return;
      }
      const id = extractId(sheetUrl);
      await setSpreadsheetId(id);
      setStep(2);
    } else {
      if (appsScriptUrl.trim()) {
        if (!isAppsScriptUrlValid(appsScriptUrl)) {
          Alert.alert('Invalid URL', 'Please enter a valid Apps Script Web App URL.');
          return;
        }
        await setStoredAppsScriptUrl(appsScriptUrl);
      }
      await AsyncStorage.setItem('has_onboarded', 'true');
      navigation.replace('Main');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.emoji} accessibilityElementsHidden={true} importantForAccessibility="no">
        {step === 1 ? '📊' : '🚀'}
      </Text>
      <Text style={styles.title}>
        {step === 1 ? 'Connect your Catalog' : 'Enable Saving'}
      </Text>
      <Text style={styles.subtitle}>
        {step === 1
          ? 'Paste the URL of your Google Sheet. TruCatLog will use this to read your inventory.'
          : 'Paste your Apps Script Web App URL to enable saving new items. (Optional, you can do this later)'}
      </Text>

      <View style={styles.inputWrapper}>
        <TextInput
          style={[
            styles.input,
            !isCurrentEmpty && isCurrentValid && styles.inputValid,
            !isCurrentEmpty && !isCurrentValid && styles.inputInvalid,
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
        {!isCurrentEmpty && !isCurrentValid && (
          <Text style={styles.errorText} accessibilityLiveRegion="polite">
            ⚠️ {step === 1 ? 'Invalid Google Sheet URL format' : 'Invalid Apps Script Web App URL'}
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={[styles.button, (step === 1 ? !step1Valid : !step2Valid) && styles.buttonDisabled]}
        onPress={handleNext}
        disabled={step === 1 ? !step1Valid : !step2Valid}
        accessibilityRole="button"
        accessibilityLabel={step === 1 ? "Next" : "Finish Setup"}
        accessibilityState={{ disabled: step === 1 ? !step1Valid : !step2Valid }}
        accessibilityHint={step === 1 ? "Saves Google Sheet URL and proceeds to step 2" : "Saves Apps Script URL and finishes onboarding"}
      >
        <Text style={styles.buttonText}>{step === 1 ? 'Next' : 'Finish Setup'}</Text>
      </TouchableOpacity>

      {step === 1 && (
        <TouchableOpacity
          style={styles.skip}
          onPress={() => setStep(2)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Use default demo sheet"
          accessibilityHint="Skips URL configuration and uses demo catalog"
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
  inputWrapper: {
    width: '100%',
    marginBottom: 24,
  },
  input: {
    width: '100%',
    backgroundColor: '#1a1d27',
    borderWidth: 1,
    borderColor: '#2a2d3a',
    borderRadius: 12,
    color: '#e8eaf6',
    padding: 16,
    fontSize: 14,
  },
  inputValid: {
    borderColor: '#22c55e',
  },
  inputInvalid: {
    borderColor: '#f87171',
  },
  errorText: {
    color: '#f87171',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
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
    opacity: 0.5,
  },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '700' },
  skip: { marginTop: 20 },
  skipText: { color: '#6b7280', fontSize: 14, fontWeight: '500' },
});

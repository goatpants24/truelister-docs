import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { MARKETPLACES, MarketplaceId, MarketplaceMeta } from '../services/marketplaces/types';
import {
  saveCredentials,
  loadCredentials,
  clearCredentials,
} from '../services/marketplaces/credentialsStore';

// ── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: MarketplaceMeta['apiStatus'] }) {
  const config = {
    official: { label: 'Official API', bg: '#0d1f17', border: '#166534', text: '#22c55e' },
    partner_only: { label: 'Partner API', bg: '#1a1500', border: '#854d0e', text: '#eab308' },
    no_api: { label: 'No Public API', bg: '#1a1117', border: '#7f1d1d', text: '#ef4444' },
  }[status];

  return (
    <View style={[styles.badge, { backgroundColor: config.bg, borderColor: config.border }]}>
      <Text style={[styles.badgeText, { color: config.text }]}>{config.label}</Text>
    </View>
  );
}

// ── Single Marketplace Card ───────────────────────────────────────────────────

function MarketplaceCard({ marketplace }: { marketplace: MarketplaceMeta }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const creds = await loadCredentials(
        marketplace.id,
        marketplace.credentialFields.map(f => f.key)
      );
      setValues(creds);
      setLoading(false);
    })();
  }, [marketplace.id]);

  const handleSave = async () => {
    await saveCredentials(marketplace.id, values);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClear = () => {
    Alert.alert(
      `Clear ${marketplace.name} Credentials`,
      'This will remove all saved API keys for this marketplace.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearCredentials(marketplace.id);
            const empty: Record<string, string> = {};
            marketplace.credentialFields.forEach(f => { empty[f.key] = ''; });
            setValues(empty);
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.card}>
        <ActivityIndicator color="#4f6ef7" />
      </View>
    );
  }

  return (
    <View style={[styles.card, { borderLeftColor: marketplace.color, borderLeftWidth: 3 }]}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: marketplace.color }]}>{marketplace.name}</Text>
        <StatusBadge status={marketplace.apiStatus} />
      </View>

      {/* Docs link */}
      <TouchableOpacity onPress={() => Linking.openURL(marketplace.docsUrl)}>
        <Text style={styles.docsLink}>View API Docs ↗</Text>
      </TouchableOpacity>

      {/* No-API notice */}
      {marketplace.apiStatus === 'no_api' && (
        <View style={styles.noApiNotice}>
          <Text style={styles.noApiText}>
            This platform does not have a public listing API. Save your login email below for use with
            cross-listing tools like{' '}
            <Text
              style={styles.link}
              onPress={() => Linking.openURL('https://vendoo.co')}
            >
              Vendoo
            </Text>{' '}
            or{' '}
            <Text
              style={styles.link}
              onPress={() => Linking.openURL('https://listperfectly.com')}
            >
              List Perfectly
            </Text>
            .
          </Text>
        </View>
      )}

      {/* Partner-only notice */}
      {marketplace.apiStatus === 'partner_only' && (
        <View style={styles.partnerNotice}>
          <Text style={styles.partnerText}>
            Requires approved partner access. Apply via the API docs link above before adding credentials.
          </Text>
        </View>
      )}

      {/* Credential fields */}
      {marketplace.credentialFields.map(field => (
        <View key={field.key} style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>{field.label}</Text>
          {field.hint && <Text style={styles.fieldHint}>{field.hint}</Text>}
          <TextInput
            style={styles.input}
            value={values[field.key] ?? ''}
            onChangeText={v => setValues(prev => ({ ...prev, [field.key]: v }))}
            placeholder={field.placeholder}
            placeholderTextColor="#4a4d60"
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry={field.secure}
            keyboardType={field.key === 'email' ? 'email-address' : 'default'}
          />
        </View>
      ))}

      {/* Actions */}
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.saveBtn, saved && styles.saveBtnSuccess]}
          onPress={handleSave}
        >
          <Text style={styles.saveBtnText}>{saved ? '✓ Saved' : 'Save'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
          <Text style={styles.clearBtnText}>Clear</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function MarketplacesScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Marketplaces</Text>
      <Text style={styles.pageDesc}>
        Store your API credentials for each platform. Credentials are saved locally on your device
        and never transmitted except directly to the respective marketplace API.
      </Text>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendRow}>
          <StatusBadge status="official" />
          <Text style={styles.legendText}>Full listing API — TrueLister can publish directly</Text>
        </View>
        <View style={styles.legendRow}>
          <StatusBadge status="partner_only" />
          <Text style={styles.legendText}>Requires approved partner access before use</Text>
        </View>
        <View style={styles.legendRow}>
          <StatusBadge status="no_api" />
          <Text style={styles.legendText}>No public API — use a cross-listing tool</Text>
        </View>
      </View>

      {MARKETPLACES.map(m => (
        <MarketplaceCard key={m.id} marketplace={m} />
      ))}
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1117' },
  content: { padding: 20, paddingBottom: 48 },
  pageTitle: { fontSize: 26, fontWeight: '800', color: '#e8eaf6', marginBottom: 8 },
  pageDesc: { fontSize: 13, color: '#6b7280', lineHeight: 19, marginBottom: 16 },
  legend: {
    backgroundColor: '#1a1d27',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2a2d3a',
    gap: 8,
  },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  legendText: { fontSize: 12, color: '#6b7280', flex: 1 },
  card: {
    backgroundColor: '#1a1d27',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a2d3a',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardTitle: { fontSize: 17, fontWeight: '800' },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  docsLink: { fontSize: 12, color: '#4f6ef7', marginBottom: 12 },
  noApiNotice: {
    backgroundColor: '#1a1117',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#3a1a1a',
  },
  noApiText: { fontSize: 12, color: '#9ca3af', lineHeight: 17 },
  partnerNotice: {
    backgroundColor: '#1a1500',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#854d0e',
  },
  partnerText: { fontSize: 12, color: '#d97706', lineHeight: 17 },
  link: { color: '#4f6ef7', textDecorationLine: 'underline' },
  fieldGroup: { marginBottom: 12 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#c8cae0', marginBottom: 3 },
  fieldHint: { fontSize: 11, color: '#4a4d60', marginBottom: 5, lineHeight: 15 },
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
  cardActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  saveBtn: {
    flex: 1,
    backgroundColor: '#4f6ef7',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  saveBtnSuccess: { backgroundColor: '#22c55e' },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  clearBtn: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3a3d50',
    alignItems: 'center',
  },
  clearBtnText: { fontSize: 14, color: '#6b7280', fontWeight: '600' },
});

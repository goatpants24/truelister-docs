import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { MARKETPLACES, MarketplaceId, ListingResult } from '../services/marketplaces/types';
import { publishToMarketplaces } from '../services/marketplaces/publisher';

type Props = NativeStackScreenProps<RootStackParamList, 'Publish'>;

export default function PublishScreen({ route, navigation }: Props) {
  const { item } = route.params;
  const [selected, setSelected] = useState<Set<MarketplaceId>>(new Set(['ebay', 'etsy']));
  const [publishing, setPublishing] = useState(false);
  const [results, setResults] = useState<ListingResult[] | null>(null);

  const toggleMarketplace = (id: MarketplaceId) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handlePublish = async () => {
    if (selected.size === 0) {
      Alert.alert('No Platforms Selected', 'Select at least one marketplace to publish to.');
      return;
    }
    setPublishing(true);
    setResults(null);
    try {
      const res = await publishToMarketplaces(item, Array.from(selected));
      setResults(res);
    } catch (err: any) {
      Alert.alert('Publish Error', err.message);
    } finally {
      setPublishing(false);
    }
  };

  const successCount = results?.filter(r => r.success).length ?? 0;
  const failCount = results?.filter(r => !r.success).length ?? 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Publish Listing</Text>
      <Text style={styles.itemTitle} numberOfLines={2}>{item.title ?? `Item #${item.itemNumber}`}</Text>

      {/* Platform selector */}
      <Text style={styles.sectionLabel}>Select Platforms</Text>
      <View style={styles.platformGrid}>
        {MARKETPLACES.map(m => {
          const isSelected = selected.has(m.id);
          return (
            <TouchableOpacity
              key={m.id}
              style={[
                styles.platformBtn,
                isSelected && { borderColor: m.color, backgroundColor: `${m.color}18` },
              ]}
              onPress={() => toggleMarketplace(m.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.platformName, isSelected && { color: m.color }]}>
                {m.name}
              </Text>
              <Text style={[
                styles.platformStatus,
                m.apiStatus === 'official' && { color: '#22c55e' },
                m.apiStatus === 'partner_only' && { color: '#eab308' },
                m.apiStatus === 'no_api' && { color: '#ef4444' },
              ]}>
                {m.apiStatus === 'official' ? '● Direct' : m.apiStatus === 'partner_only' ? '● Partner' : '○ Manual'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Publish button */}
      {!results && (
        <TouchableOpacity
          style={[styles.publishBtn, publishing && styles.publishBtnDisabled]}
          onPress={handlePublish}
          disabled={publishing}
        >
          {publishing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.publishBtnText}>
              Publish to {selected.size} Platform{selected.size !== 1 ? 's' : ''}
            </Text>
          )}
        </TouchableOpacity>
      )}

      {/* Results */}
      {results && (
        <View style={styles.resultsSection}>
          <View style={styles.resultsSummary}>
            <Text style={styles.resultsSummaryText}>
              {successCount > 0 && `✓ ${successCount} published  `}
              {failCount > 0 && `✗ ${failCount} failed`}
            </Text>
          </View>

          {results.map(r => {
            const meta = MARKETPLACES.find(m => m.id === r.marketplace)!;
            return (
              <View
                key={r.marketplace}
                style={[
                  styles.resultCard,
                  r.success ? styles.resultSuccess : styles.resultFail,
                ]}
              >
                <Text style={[styles.resultName, { color: meta.color }]}>{meta.name}</Text>
                {r.success ? (
                  <>
                    <Text style={styles.resultOk}>✓ Published as draft</Text>
                    {r.listingUrl && (
                      <TouchableOpacity onPress={() => Linking.openURL(r.listingUrl!)}>
                        <Text style={styles.resultLink}>View listing ↗</Text>
                      </TouchableOpacity>
                    )}
                  </>
                ) : (
                  <Text style={styles.resultError}>{r.error}</Text>
                )}
              </View>
            );
          })}

          <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1117' },
  content: { padding: 20, paddingBottom: 48 },
  pageTitle: { fontSize: 26, fontWeight: '800', color: '#e8eaf6', marginBottom: 4 },
  itemTitle: { fontSize: 15, color: '#6b7280', marginBottom: 24 },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: '#6b7280', marginBottom: 10, letterSpacing: 0.5, textTransform: 'uppercase' },
  platformGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  platformBtn: {
    width: '47%',
    backgroundColor: '#1a1d27',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#2a2d3a',
    padding: 14,
  },
  platformName: { fontSize: 15, fontWeight: '700', color: '#e8eaf6', marginBottom: 4 },
  platformStatus: { fontSize: 11, fontWeight: '600' },
  publishBtn: {
    backgroundColor: '#4f6ef7',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  publishBtnDisabled: { opacity: 0.6 },
  publishBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  resultsSection: { gap: 12 },
  resultsSummary: {
    backgroundColor: '#1a1d27',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginBottom: 4,
  },
  resultsSummaryText: { fontSize: 15, fontWeight: '700', color: '#e8eaf6' },
  resultCard: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
  },
  resultSuccess: { backgroundColor: '#0d1f17', borderColor: '#166534' },
  resultFail: { backgroundColor: '#1a1117', borderColor: '#7f1d1d' },
  resultName: { fontSize: 15, fontWeight: '800', marginBottom: 6 },
  resultOk: { fontSize: 13, color: '#22c55e', fontWeight: '600' },
  resultLink: { fontSize: 12, color: '#4f6ef7', marginTop: 4 },
  resultError: { fontSize: 12, color: '#fca5a5', lineHeight: 17 },
  doneBtn: {
    backgroundColor: '#1a1d27',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2d3a',
    marginTop: 8,
  },
  doneBtnText: { fontSize: 15, fontWeight: '700', color: '#e8eaf6' },
});

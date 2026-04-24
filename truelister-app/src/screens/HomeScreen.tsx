import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { RootStackNavProp } from '../navigation/types';
import { CatalogItem } from '../types';
import { fetchInventory } from '../services/sheets';
import { getDraftItems } from '../services/localStorage';

export default function HomeScreen() {
  const navigation = useNavigation<RootStackNavProp<'Main'>>();
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadItems = useCallback(async () => {
    try {
      const [sheetItems, draftItems] = await Promise.all([
        fetchInventory(),
        getDraftItems(),
      ]);
      const sheetNumbers = new Set(sheetItems.map(i => i.itemNumber));
      const uniqueDrafts = draftItems.filter(d => !sheetNumbers.has(d.itemNumber));
      setItems([...sheetItems, ...uniqueDrafts]);
    } catch (error) {
      console.error('Error loading items:', error);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  // Reload every time the tab comes into focus (e.g. after saving a new item)
  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [loadItems])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadItems();
  };

  const statusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return '#4ade80';
      case 'sold': return '#60a5fa';
      case 'draft': return '#fbbf24';
      case 'reserved': return '#c084fc';
      case 'archived': return '#64748b';
      default: return '#94a3b8';
    }
  };

  const renderItem = ({ item }: { item: CatalogItem }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('ItemForm', { item, existingItems: items })}
      activeOpacity={0.75}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.itemNumber}>{item.itemNumber}</Text>
        <View style={[styles.statusBadge, { borderColor: statusColor(item.saleStatus) }]}>
          <Text style={[styles.statusText, { color: statusColor(item.saleStatus) }]}>
            {item.saleStatus || 'Draft'}
          </Text>
        </View>
      </View>
      <Text style={styles.itemTitle} numberOfLines={1}>{item.title || 'Untitled'}</Text>
      <View style={styles.cardMeta}>
        {item.designerBrand ? <Text style={styles.metaText}>{item.designerBrand}</Text> : null}
        {item.size ? <Text style={styles.metaDivider}>·</Text> : null}
        {item.size ? <Text style={styles.metaText}>{item.size}</Text> : null}
        {item.price ? <Text style={styles.metaDivider}>·</Text> : null}
        {item.price ? <Text style={styles.priceText}>${item.price}</Text> : null}
      </View>
      {item.marketplace ? (
        <Text style={styles.marketplace}>{item.marketplace}</Text>
      ) : null}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#4f6ef7" size="large" />
        <Text style={styles.loadingText}>Loading inventory…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.appTitle}>TrueLister</Text>
          <Text style={styles.subtitle}>{items.length} items in catalog</Text>
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={item => item.itemNumber || Math.random().toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#4f6ef7"
            colors={['#4f6ef7']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyTitle}>No items yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap + to add your first catalog item
            </Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('ItemForm', { existingItems: items })}
        accessibilityLabel="Add new item"
        accessibilityRole="button"
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1117' },
  loadingContainer: { flex: 1, backgroundColor: '#0f1117', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#6b7280', marginTop: 12, fontSize: 14 },
  header: {
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1d27',
  },
  appTitle: { color: '#e8eaf6', fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { color: '#6b7280', fontSize: 13, marginTop: 2 },
  list: { padding: 16, paddingBottom: 100 },
  card: {
    backgroundColor: '#1a1d27',
    borderWidth: 1,
    borderColor: '#2a2d3a',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  itemNumber: { color: '#4f6ef7', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  statusBadge: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 2 },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  itemTitle: { color: '#e8eaf6', fontSize: 16, fontWeight: '600', marginBottom: 6 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  metaText: { color: '#94a3b8', fontSize: 13 },
  metaDivider: { color: '#3a3d50', fontSize: 13 },
  priceText: { color: '#4ade80', fontSize: 13, fontWeight: '600' },
  marketplace: { color: '#6b7280', fontSize: 12, marginTop: 4 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#4f6ef7',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4f6ef7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300', marginTop: -2 },
  emptyContainer: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { color: '#e8eaf6', fontSize: 20, fontWeight: '700', marginBottom: 8 },
  emptySubtitle: { color: '#6b7280', fontSize: 14, textAlign: 'center', paddingHorizontal: 40 },
});

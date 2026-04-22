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
import { CatalogItem } from '../types';
import { fetchInventory } from '../services/sheets';
import { getDraftItems } from '../services/localStorage';

interface Props {
  onNewItem: (items: CatalogItem[]) => void;
  onSelectItem: (item: CatalogItem) => void;
}

export default function HomeScreen({ onNewItem, onSelectItem }: Props) {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadItems = useCallback(async () => {
    try {
      const [sheetItems, draftItems] = await Promise.all([
        fetchInventory(),
        getDraftItems(),
      ]);

      // Merge: sheet items + drafts not yet in sheet
      const sheetNumbers = new Set(sheetItems.map(i => i.itemNumber));
      const uniqueDrafts = draftItems.filter(d => !sheetNumbers.has(d.itemNumber));
      setItems([...sheetItems, ...uniqueDrafts]);
    } catch (error) {
      console.error('Error loading items:', error);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

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
    <TouchableOpacity style={styles.card} onPress={() => onSelectItem(item)}>
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
        {item.size ? <Text style={styles.metaDivider}>|</Text> : null}
        {item.size ? <Text style={styles.metaText}>{item.size}</Text> : null}
        {item.price ? <Text style={styles.metaDivider}>|</Text> : null}
        {item.price ? <Text style={styles.priceText}>${item.price}</Text> : null}
      </View>
      {item.marketplace ? (
        <Text style={styles.marketplace}>{item.marketplace}</Text>
      ) : null}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#7c3aed" size="large" />
          <Text style={styles.loadingText}>Loading inventory...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.appTitle}>TrueLister</Text>
          <Text style={styles.subtitle}>{items.length} items in catalog</Text>
        </View>
      </View>

      {/* Item List */}
      <FlatList
        data={items}
        keyExtractor={item => item.itemNumber || Math.random().toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#7c3aed"
            colors={['#7c3aed']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyTitle}>No items yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap the + button to add your first catalog item
            </Text>
          </View>
        }
      />

      {/* FAB: New Item */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => onNewItem(items)}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1117',
  },
  header: {
    paddingTop: 55,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1d27',
  },
  appTitle: {
    color: '#e2e8f0',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: '#64748b',
    fontSize: 14,
    marginTop: 2,
  },
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#1a1d27',
    borderWidth: 1,
    borderColor: '#2d3148',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  itemNumber: {
    color: '#7c3aed',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemTitle: {
    color: '#e2e8f0',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    color: '#94a3b8',
    fontSize: 13,
  },
  metaDivider: {
    color: '#2d3148',
    marginHorizontal: 8,
  },
  priceText: {
    color: '#4ade80',
    fontSize: 13,
    fontWeight: '600',
  },
  marketplace: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '300',
    marginTop: -2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#e2e8f0',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

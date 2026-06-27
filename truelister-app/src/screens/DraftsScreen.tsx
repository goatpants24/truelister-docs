import React, { useCallback, useState, memo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { RootStackNavProp } from '../navigation/types';
import { getDrafts, deleteDraft } from '../services/localStorage';
import { CatalogItem } from '../types';

/**
 * ⚡ BOLT PERFORMANCE OPTIMIZATION: Memoized Draft Card
 * Prevents re-rendering of every list item when only one is updated or deleted.
 */
const DraftCard = memo(({
  item,
  onEdit,
  onDelete
}: {
  item: CatalogItem;
  onEdit: (item: CatalogItem) => void;
  onDelete: (itemNumber: string) => void;
}) => (
  <TouchableOpacity
    style={styles.card}
    onPress={() => onEdit(item)}
    activeOpacity={0.75}
    accessibilityRole="button"
    accessibilityLabel={`Edit draft ${item.itemNumber}: ${item.title || 'Untitled'}`}
  >
    <View style={styles.cardLeft}>
      <Text style={styles.itemNumber}>{item.itemNumber}</Text>
      <Text style={styles.itemTitle} numberOfLines={1}>
        {item.title || 'Untitled'}
      </Text>
      <Text style={styles.itemMeta}>
        {[item.designerBrand, item.size, item.condition]
          .filter(Boolean)
          .join(' · ')}
      </Text>
    </View>
    <TouchableOpacity
      style={styles.deleteBtn}
      onPress={() => onDelete(item.itemNumber)}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      accessibilityRole="button"
      accessibilityLabel={`Delete draft ${item.itemNumber}`}
    >
      <Text style={styles.deleteIcon}>🗑</Text>
    </TouchableOpacity>
  </TouchableOpacity>
));

export default function DraftsScreen() {
  const navigation = useNavigation<RootStackNavProp<'Main'>>();
  const [drafts, setDrafts] = useState<CatalogItem[]>([]);

  const loadDrafts = useCallback(async () => {
    const saved = await getDrafts();
    setDrafts(saved);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDrafts();
    }, [loadDrafts])
  );

  const handleEdit = useCallback((item: CatalogItem) => {
    navigation.navigate('ItemForm', { item });
  }, [navigation]);

  const handleDelete = useCallback((itemNumber: string) => {
    Alert.alert('Delete Draft', 'Remove this draft permanently?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteDraft(itemNumber);
          loadDrafts();
        },
      },
    ]);
  }, [loadDrafts]);

  /**
   * ⚡ BOLT PERFORMANCE OPTIMIZATION: Optimized layout calculation
   * Eliminates dynamic measurement of items during scroll, improving FPS.
   */
  const getItemLayout = useCallback((_data: any, index: number) => ({
    length: 92, // card height (82) + margin (10)
    offset: 92 * index,
    index,
  }), []);

  const renderItem = useCallback(({ item }: { item: CatalogItem }) => (
    <DraftCard item={item} onEdit={handleEdit} onDelete={handleDelete} />
  ), [handleEdit, handleDelete]);

  if (drafts.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>📝</Text>
        <Text style={styles.emptyTitle}>No Drafts</Text>
        <Text style={styles.emptySubtitle}>
          Items saved offline will appear here.
        </Text>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => navigation.navigate('ItemForm', {})}
          accessibilityRole="button"
          accessibilityLabel="Create New Item"
        >
          <Text style={styles.ctaButtonText}>Create New Item</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Drafts ({drafts.length})</Text>
      <FlatList
        data={drafts}
        keyExtractor={(item) => item.itemNumber}
        contentContainerStyle={styles.listContent}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        removeClippedSubviews={true}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1117', paddingHorizontal: 16, paddingTop: 16 },
  header: { fontSize: 22, fontWeight: '700', color: '#e8eaf6', marginBottom: 16 },
  listContent: { paddingBottom: 24 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1d27',
    borderRadius: 12,
    padding: 14,
    height: 82, // Fixed height for getItemLayout optimization
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2a2d3a',
  },
  cardLeft: { flex: 1 },
  itemNumber: { fontSize: 11, color: '#4f6ef7', fontWeight: '700', marginBottom: 2 },
  itemTitle: { fontSize: 15, fontWeight: '600', color: '#e8eaf6', marginBottom: 3 },
  itemMeta: { fontSize: 12, color: '#6b7280' },
  deleteBtn: { padding: 4 },
  deleteIcon: { fontSize: 18 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f1117' },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#e8eaf6', marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center', paddingHorizontal: 32, marginBottom: 24 },
  ctaButton: {
    backgroundColor: '#4f6ef7',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  ctaButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

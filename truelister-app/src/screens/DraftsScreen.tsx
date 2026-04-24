import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { RootStackNavProp } from '../navigation/types';
import { getDrafts, deleteDraft } from '../services/localStorage';
import { CatalogItem } from '../types';

export default function DraftsScreen() {
  const navigation = useNavigation<RootStackNavProp<'Main'>>();
  const [drafts, setDrafts] = useState<CatalogItem[]>([]);

  const loadDrafts = async () => {
    const saved = await getDrafts();
    setDrafts(saved);
  };

  useEffect(() => {
    loadDrafts();
  }, []);

  const handleEdit = (item: CatalogItem) => {
    navigation.navigate('ItemForm', { item, existingItems: drafts });
  };

  const handleDelete = (itemNumber: string) => {
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
  };

  if (drafts.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>📝</Text>
        <Text style={styles.emptyTitle}>No Drafts</Text>
        <Text style={styles.emptySubtitle}>
          Items saved offline will appear here.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Drafts ({drafts.length})</Text>
      <FlatList
        data={drafts}
        keyExtractor={(item) => item.itemNumber}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => handleEdit(item)}
            activeOpacity={0.75}
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
              onPress={() => handleDelete(item.itemNumber)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.deleteIcon}>🗑</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1117', paddingHorizontal: 16, paddingTop: 16 },
  header: { fontSize: 22, fontWeight: '700', color: '#e8eaf6', marginBottom: 16 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1d27',
    borderRadius: 12,
    padding: 14,
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
  emptySubtitle: { fontSize: 14, color: '#6b7280', textAlign: 'center', paddingHorizontal: 32 },
});

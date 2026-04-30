import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Alert,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { RootStackNavProp } from '../navigation/types';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';

import { CatalogItem } from '../types';
import { fetchInventory } from '../services/sheets';
import { getDraftItems } from '../services/localStorage';

type ViewMode = 'list' | 'grid' | 'table';
type ThumbnailSize = 'small' | 'medium' | 'large';

export default function HomeScreen() {
  const navigation = useNavigation<RootStackNavProp<'Main'>>();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [thumbnailSize, setThumbnailSize] = useState<ThumbnailSize>('medium');
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);

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
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [loadItems])
  );

  const renderGridItem = ({ item }: { item: CatalogItem }) => {
    const size = thumbnailSize === 'small' ? 64 : thumbnailSize === 'medium' ? 96 : 128;

    return (
      <TouchableOpacity
        style={[styles.gridItem, { width: size + 32, height: size + 64 }]}
        onPress={() => navigation.navigate('ItemForm', { item, existingItems: items })}
      >
        {item.photoUrl ? (
          <Image
            source={{ uri: item.photoUrl }}
            style={[styles.thumbnail, { width: size, height: size }]}
            resizeMode="cover"
          />
        ) : (
          <View
            style={[
              styles.thumbnail,
              { width: size, height: size, justifyContent: 'center', alignItems: 'center' },
            ]}
          >
            <Text style={{ color: '#94a3b8', fontSize: 12 }}>No Image</Text>
          </View>
        )}
        <Text style={styles.itemTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.itemBrand}>
          {item.designerBrand || '–'}
        </Text>
        {item.price ? (
          <Text style={styles.itemPrice}>${item.price}</Text>
        ) : null}
        {item.marketplace ? (
          <Text style={styles.itemMarketplace} numberOfLines={1}>
            {item.marketplace}
          </Text>
        ) : null}
      </TouchableOpacity>
    );
  };

  const renderListItem = ({ item }: { item: CatalogItem }) => {
    return (
      <TouchableOpacity
        style={styles.listItem}
        onPress={() => navigation.navigate('ItemForm', { item, existingItems: items })}
      >
        {item.photoUrl && (
          <Image
            source={{ uri: item.photoUrl }}
            style={[styles.listThumbnail, { width: 64, height: 64 }]}
            resizeMode="cover"
          />
        )}
        <View style={styles.listTextContainer}>
          <Text style={styles.listTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.listSubtitle} numberOfLines={1}>
            {item.designerBrand} • {item.size} • {item.condition}
          </Text>
          {item.price && (
            <Text style={styles.listPrice}>${item.price}</Text>
          )}
          {item.marketplace && (
            <Text style={styles.listMarketplace}>{item.marketplace}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const handleExport = () => {
    Alert.alert(
      'Export / Templates',
      'Select an option:',
      [
        {
          text: 'CSV',
          onPress: () => exportCSV(items),
        },
        {
          text: 'PDF',
          onPress: () => {
            Alert.alert(
              'PDF Export (Coming Soon)',
              'PDF catalog generation is under construction but will be added soon.'
            );
          },
        },
        {
          text: 'HTML Catalog',
          onPress: () => exportHTMLCatalog(items),
        },
        {
          text: 'Marketplace Templates',
          onPress: () => showMarketplaceTemplates(items),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header: view mode / thumbnail size / export */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.viewModeRow}>
            <TouchableOpacity
              onPress={() => setViewMode('list')}
              style={[styles.modeButton, viewMode === 'list' && { backgroundColor: '#4f6ef7' }]}
            >
              <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>List</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setViewMode('grid')}
              style={[styles.modeButton, viewMode === 'grid' && { backgroundColor: '#4f6ef7' }]}
            >
              <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>Grid</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setViewMode('table')}
              style={[styles.modeButton, viewMode === 'table' && { backgroundColor: '#4f6ef7' }]}
            >
              <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>Table</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.thumbnailSizeRow}>
            <TouchableOpacity
              onPress={() => setThumbnailSize('small')}
              style={[styles.sizeButton, thumbnailSize === 'small' && { backgroundColor: '#4f6ef7' }]}
            >
              <Text style={{ color: 'white', fontSize: 12 }}>S</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setThumbnailSize('medium')}
              style={[styles.sizeButton, thumbnailSize === 'medium' && { backgroundColor: '#4f6ef7' }]}
            >
              <Text style={{ color: 'white', fontSize: 12 }}>M</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setThumbnailSize('large')}
              style={[styles.sizeButton, thumbnailSize === 'large' && { backgroundColor: '#4f6ef7' }]}
            >
              <Text style={{ color: 'white', fontSize: 12 }}>L</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
          <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>
            ⚙️ Export / Templates
          </Text>
        </TouchableOpacity>
      </View>

      {/* Items list */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4f6ef7" />
          <Text style={{ color: '#94a3b8', marginTop: 12 }}>Loading catalog…</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          key={viewMode}
          renderItem={viewMode === 'grid' ? renderGridItem : renderListItem}
          numColumns={viewMode === 'grid' ? 2 : 1}
          keyExtractor={(item) => item.itemNumber}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

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

// --- exports / templates ---

function exportCSV(items: CatalogItem[]) {
  const headers = [
    'Item #',
    'Title',
    'Designer/Brand',
    'Category',
    'Size',
    'Condition',
    'Fabric/Material',
    'Color',
    'Price',
    'Marketplace',
    'Date Listed',
    'Notes',
    'Photo URL',
  ];

  const rows = items.map((item) => [
    item.itemNumber,
    item.title,
    item.designerBrand,
    item.category,
    item.size,
    item.condition,
    item.fabricMaterial,
    item.color,
    item.price,
    item.marketplace,
    item.dateListed,
    item.notes,
    item.photoUrl,
  ]);

  const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

  saveToFile(csv, 'truelister-catalog.csv', 'text/csv');
}

function exportHTMLCatalog(items: CatalogItem[]) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TrueLister Catalog</title>
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, "Open Sans";
      background: #f9fafb;
      padding: 24px;
      margin: 0;
      max-width: 1200px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      padding: 24px 0;
      border-bottom: 1px solid #e5e7eb;
      margin-bottom: 24px;
    }
    h1 {
      margin: 0;
      color: #111827;
    }
    .catalog {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 20px;
    }
    .item {
      background: white;
      padding: 16px;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);
      transition: transform 0.1s, box-shadow 0.1s;
    }
    .item:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06);
    }
    .item img {
      width: 100%;
      height: 180px;
      object-fit: cover;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }
    .no-image {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 180px;
      background: #f3f4f6;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 14px;
    }
    .item h3 {
      margin: 12px 0 4px 0;
      font-size: 16px;
      font-weight: 600;
      color: #111827;
    }
    .item p {
      margin: 4px 0;
      font-size: 13px;
      color: #4b5563;
    }
    .badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
    }
    .price {
      color: #059669;
      font-weight: 700;
    }
    .marketplace {
      background: #dbeafe;
      color: #1e40af;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>TrueLister Catalog</h1>
  </div>
  <div class="catalog">
    ${items
      .map(
        (item) => `
      <div class="item">
        ${item.photoUrl
          ? `<img src="${item.photoUrl}" alt="${item.title}" />`
          : `<div class="no-image">No Image</div>`
        }
        <h3>${item.title}</h3>
        <p><strong>Brand:</strong> ${item.designerBrand || '–'}</p>
        <p><strong>Size:</strong> ${item.size || '–'}</p>
        <p><strong>Price:</strong> <span class="price">$${item.price || '–'}</span></p>
        <p><strong>Condition:</strong> ${item.condition || '–'}</p>
        <p><strong>Fabric:</strong> ${item.fabricMaterial || '–'}</p>
        <p><strong>Color:</strong> ${item.color || '–'}</p>
        <p><strong>Category:</strong> ${item.category || '–'}</p>
        ${item.marketplace ? `<p><strong>Marketplace:</strong> <span class="badge marketplace">${item.marketplace}</span></p>` : ''}
        <p><strong>Date Listed:</strong> ${item.dateListed || '–'}</p>
        <p style="font-size: 12px; color: #6b7280;">${item.notes || 'No additional notes.'}</p>
      </div>`
      )
      .join('')}
  </div>
</body>
</html>`;

  saveToFile(html, 'truelister-catalog.html', 'text/html');
}

type MarketplaceTemplate = {
  platform: 'ebay' | 'mercari' | 'etsy' | 'facebook';
  title: string;
  description: string;
  price: string;
  condition: string;
  measurements: string;
  color: string;
  photos: string[];
};

function showMarketplaceTemplates(items: CatalogItem[]) {
  Alert.alert(
    'Marketplace Templates',
    'Select a platform to generate ready‑to‑use listing templates.',
    [
      {
        text: 'eBay',
        onPress: () => openMarketplaceTemplateModal(items, 'ebay'),
      },
      {
        text: 'Mercari',
        onPress: () => openMarketplaceTemplateModal(items, 'mercari'),
      },
      {
        text: 'Etsy / Facebook',
        onPress: () => openMarketplaceTemplateModal(items, 'etsy'),
      },
      { text: 'Cancel', style: 'cancel' },
    ]
  );
}

function openMarketplaceTemplateModal(
  items: CatalogItem[],
  platform: 'ebay' | 'mercari' | 'etsy' | 'facebook'
) {
  const templates = items.map((item) => generateTemplate(item, platform));

  Alert.alert(
    `${platform.charAt(0).toUpperCase() + platform.slice(1)} Templates`,
    `Generated ${templates.length} templates. In the full app, this would render a screen where you can view and copy each field.`,
    [{ text: 'OK' }]
  );
}

function generateTemplate(
  item: CatalogItem,
  platform: 'ebay' | 'mercari' | 'etsy' | 'facebook'
): MarketplaceTemplate {
  const baseTitle = [item.title, item.designerBrand, item.category].filter(Boolean).join(' - ');
  const baseDesc = [item.notes, item.fabricMaterial, `Size: ${item.size}`, `Color: ${item.color}`]
    .filter(Boolean)
    .join('\n\n');

  return {
    platform,
    title: baseTitle,
    description: baseDesc,
    price: item.price || '',
    condition: item.condition || 'Used',
    measurements: item.measurements || '',
    color: item.color || '',
    photos: item.photoUrl ? [item.photoUrl] : [],
  };
}

async function saveToFile(content: string, fileName: string, mimeType: string) {
  const fileUri = FileSystem.documentDirectory + fileName;

  await FileSystem.writeAsStringAsync(fileUri, content, { encoding: FileSystem.EncodingType.UTF8 });

  await Sharing.shareAsync(fileUri, {
    mimeType,
    dialogTitle: `Export TrueLister Catalog (${fileName.split('.').slice(-1)[0].toUpperCase()})`,
  });
}

// --- styles ---

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1117' },
  header: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2a2d3a' },
  headerRow: { gap: 12 },
  viewModeRow: { flexDirection: 'row', gap: 8 },
  modeButton: {
    backgroundColor: '#1a1d27',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2a2d3a',
  },
  thumbnailSizeRow: { flexDirection: 'row', gap: 8 },
  sizeButton: {
    backgroundColor: '#1a1d27',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2a2d3a',
  },
  exportButton: {
    backgroundColor: '#4f6ef7',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    shadowColor: '#4f6ef7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  listContainer: { padding: 16 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  gridItem: {
    backgroundColor: '#1a1d27',
    marginHorizontal: 8,
    marginVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(79, 110, 247, 0.15)',
  },
  thumbnail: {
    borderRadius: 8,
  },
  itemTitle: {
    color: '#e8eaf6',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  itemBrand: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  itemPrice: {
    color: '#4ade80',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  itemMarketplace: {
    color: '#60a5fa',
    fontSize: 10,
    marginTop: 2,
  },
  listItem: {
    flexDirection: 'row',
    backgroundColor: '#1a1d27',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(79, 110, 247, 0.1)',
  },
  listThumbnail: {
    borderRadius: 8,
  },
  listTextContainer: { flex: 1, justifyContent: 'center' },
  listTitle: {
    color: '#e8eaf6',
    fontSize: 15,
    fontWeight: '600',
  },
  listSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
  },
  listPrice: {
    color: '#4ade80',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  listMarketplace: {
    color: '#60a5fa',
    fontSize: 12,
    marginTop: 2,
  },
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
});

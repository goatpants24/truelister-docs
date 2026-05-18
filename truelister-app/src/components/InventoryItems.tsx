import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { CatalogItem } from '../types';

interface GridItemProps {
  item: CatalogItem;
  size: number;
  onPress: (item: CatalogItem) => void;
}

/**
 * Memoized GridItem to prevent re-renders when other items in the FlatList change.
 */
export const GridItem = React.memo(({ item, size, onPress }: GridItemProps) => {
  return (
    <TouchableOpacity
      style={[styles.gridItem, { width: size + 32, height: size + 64 }]}
      onPress={() => onPress(item)}
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
});

interface ListItemProps {
  item: CatalogItem;
  onPress: (item: CatalogItem) => void;
}

/**
 * Memoized ListItem to prevent re-renders when other items in the FlatList change.
 */
export const ListItem = React.memo(({ item, onPress }: ListItemProps) => {
  return (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => onPress(item)}
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
});

const styles = StyleSheet.create({
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
});

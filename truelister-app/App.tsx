import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet } from 'react-native';
import HomeScreen from './src/screens/HomeScreen';
import ItemFormScreen from './src/screens/ItemFormScreen';
import { CatalogItem } from './src/types';

type Screen = 'home' | 'newItem' | 'editItem';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [currentItems, setCurrentItems] = useState<CatalogItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);

  const handleNewItem = (items: CatalogItem[]) => {
    setCurrentItems(items);
    setSelectedItem(null);
    setScreen('newItem');
  };

  const handleSelectItem = (item: CatalogItem) => {
    setSelectedItem(item);
    setScreen('editItem');
  };

  const handleSave = (_item: CatalogItem) => {
    setScreen('home');
  };

  const handleCancel = () => {
    setScreen('home');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      {screen === 'home' && (
        <HomeScreen
          onNewItem={handleNewItem}
          onSelectItem={handleSelectItem}
        />
      )}
      {(screen === 'newItem' || screen === 'editItem') && (
        <ItemFormScreen
          existingItems={currentItems}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1117',
  },
});

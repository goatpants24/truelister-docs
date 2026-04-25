import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp, RouteProp } from '@react-navigation/native';
import { CatalogItem } from '../types';

// ── Root Stack ────────────────────────────────────────────────────────────────
export type RootStackParamList = {
  Main: undefined;
  // ItemForm: modal sheet on iOS, card slide on Android
  // Camera and TagScanner are rendered inline inside ItemFormScreen
  // (they are sub-views, not separate routes) to avoid passing callbacks
  // through navigation params (which React Navigation does not support).
  ItemForm: { item?: CatalogItem; existingItems: CatalogItem[] };
};

// ── Bottom Tab Navigator ──────────────────────────────────────────────────────
export type TabParamList = {
  Inventory: undefined;
  Drafts: undefined;
  Settings: undefined;
};

// ── Composite nav props ───────────────────────────────────────────────────────
export type RootStackNavProp<T extends keyof RootStackParamList> =
  NativeStackNavigationProp<RootStackParamList, T>;

export type TabNavProp<T extends keyof TabParamList> = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, T>,
  NativeStackNavigationProp<RootStackParamList>
>;

export type ItemFormRouteProp = RouteProp<RootStackParamList, 'ItemForm'>;

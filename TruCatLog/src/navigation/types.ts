import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp, RouteProp } from '@react-navigation/native';
import { CatalogItem } from '../types';

// ── Root Stack ────────────────────────────────────────────────────────────────
export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
  ItemForm: { item?: CatalogItem; existingItems: CatalogItem[] };
  Publish: { item: CatalogItem };
};

// ── Bottom Tab Navigator ──────────────────────────────────────────────────────
export type TabParamList = {
  Inventory: undefined;
  Drafts: undefined;
  Marketplaces: undefined;
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
export type PublishRouteProp = RouteProp<RootStackParamList, 'Publish'>;

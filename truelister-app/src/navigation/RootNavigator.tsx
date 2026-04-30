import React from 'react';
import { Platform } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import { RootStackParamList, TabParamList } from './types';
import HomeScreen from '../screens/HomeScreen3';
import ItemFormScreen from '../screens/itemFormScreen3';
import DraftsScreen from '../screens/DraftsScreen';
import SettingsScreen from '../screens/SettingsScreen';

// ── Theme ─────────────────────────────────────────────────────────────────────
const AppTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: '#4f6ef7',
    background: '#0f1117',
    card: '#1a1d27',
    text: '#e8eaf6',
    border: '#2a2d3a',
    notification: '#4f6ef7',
  },
};

// ── Tab icon helper ───────────────────────────────────────────────────────────
function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Inventory: '📦',
    Drafts: '📝',
    Settings: '⚙️',
  };
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.45 }}>
      {icons[label] ?? '•'}
    </Text>
  );
}

// ── Bottom Tab Navigator ──────────────────────────────────────────────────────
const Tab = createBottomTabNavigator<TabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => (
          <TabIcon label={route.name} focused={focused} />
        ),
        tabBarStyle: {
          backgroundColor: '#1a1d27',
          borderTopColor: '#2a2d3a',
          borderTopWidth: 1,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 80 : 60,
        },
        tabBarActiveTintColor: '#4f6ef7',
        tabBarInactiveTintColor: '#5a5e78',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.3,
        },
      })}
    >
      <Tab.Screen
        name="Inventory"
        component={HomeScreen}
        options={{ title: 'Inventory' }}
      />
      <Tab.Screen
        name="Drafts"
        component={DraftsScreen}
        options={{ title: 'Drafts' }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Tab.Navigator>
  );
}

// ── Root Stack Navigator ──────────────────────────────────────────────────────
const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <NavigationContainer theme={AppTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#1a1d27' },
          headerTintColor: '#e8eaf6',
          headerTitleStyle: { fontWeight: '700', fontSize: 17 },
          headerShadowVisible: false,
          // Native back gesture on iOS, predictive back on Android 14+
          gestureEnabled: true,
          animation: Platform.OS === 'ios' ? 'default' : 'slide_from_right',
          contentStyle: { backgroundColor: '#0f1117' },
        }}
      >
        {/* Main tabs — no header (tabs have their own) */}
        <Stack.Screen
          name="Main"
          component={MainTabs}
          options={{ headerShown: false }}
        />

        {/* Item form — slides up as a modal on iOS, slides right on Android */}
        <Stack.Screen
          name="ItemForm"
          component={ItemFormScreen}
          options={({ route }) => ({
            title: route.params?.item ? 'Edit Item' : 'New Item',
            presentation: Platform.OS === 'ios' ? 'modal' : 'card',
            animation: Platform.OS === 'ios' ? 'slide_from_bottom' : 'slide_from_right',
            headerLeft: () => null, // Form has its own Cancel / Save buttons
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { WhiteBalanceMode } from '../types';

interface Props {
  selected: WhiteBalanceMode;
  onSelect: (mode: WhiteBalanceMode) => void;
}

const WB_OPTIONS: { mode: WhiteBalanceMode; label: string; icon: string }[] = [
  { mode: 'auto', label: 'Auto', icon: 'A' },
  { mode: 'daylight', label: 'Sun', icon: '☀' },
  { mode: 'cloudy', label: 'Cloud', icon: '☁' },
  { mode: 'fluorescent', label: 'Fluor', icon: '⚡' },
  { mode: 'incandescent', label: 'Bulb', icon: '💡' },
];

export default function WhiteBalancePicker({ selected, onSelect }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>White Balance</Text>
      <View style={styles.options}>
        {WB_OPTIONS.map(({ mode, label, icon }) => (
          <TouchableOpacity
            key={mode}
            style={[styles.option, selected === mode && styles.optionSelected]}
            onPress={() => onSelect(mode)}
          >
            <Text style={styles.icon}>{icon}</Text>
            <Text style={[styles.optionText, selected === mode && styles.optionTextSelected]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  label: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    textAlign: 'center',
  },
  options: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  option: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 56,
  },
  optionSelected: {
    backgroundColor: 'rgba(124, 58, 237, 0.8)',
  },
  icon: {
    fontSize: 18,
    marginBottom: 2,
  },
  optionText: {
    color: '#cbd5e1',
    fontSize: 10,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
});

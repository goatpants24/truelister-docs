import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface Props {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  historyLength?: number;
}

export default function UndoRedoBar({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  historyLength = 0,
}: Props) {
  return (
    <View style={styles.bar}>
      <TouchableOpacity
        style={[styles.btn, !canUndo && styles.btnDisabled]}
        onPress={onUndo}
        disabled={!canUndo}
        accessibilityLabel="Undo"
        accessibilityRole="button"
      >
        <Text style={[styles.icon, !canUndo && styles.iconDisabled]}>↩</Text>
        <Text style={[styles.label, !canUndo && styles.labelDisabled]}>Undo</Text>
      </TouchableOpacity>

      {historyLength > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{historyLength}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.btn, !canRedo && styles.btnDisabled]}
        onPress={onRedo}
        disabled={!canRedo}
        accessibilityLabel="Redo"
        accessibilityRole="button"
      >
        <Text style={[styles.icon, !canRedo && styles.iconDisabled]}>↪</Text>
        <Text style={[styles.label, !canRedo && styles.labelDisabled]}>Redo</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: '#1a1d27',
    borderTopWidth: 1,
    borderTopColor: '#2a2d3a',
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#252836',
  },
  btnDisabled: {
    backgroundColor: '#1e2030',
  },
  icon: {
    fontSize: 16,
    color: '#a0a8c0',
  },
  iconDisabled: {
    color: '#3a3d50',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#a0a8c0',
    letterSpacing: 0.3,
  },
  labelDisabled: {
    color: '#3a3d50',
  },
  badge: {
    backgroundColor: '#4f6ef7',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
});

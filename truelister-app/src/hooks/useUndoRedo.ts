import { useCallback, useReducer, useRef } from 'react';

interface UndoRedoState<T> {
  past: T[];
  present: T;
  future: T[];
  lastCommitted: T;
}

type UndoRedoAction<T> =
  | { type: 'UPDATE'; payload: T }
  | { type: 'COMMIT'; payload: T }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'RESET'; payload: T };

/**
 * Optimized shallow equality check.
 * Faster than JSON.stringify for large state objects.
 */
function shallowEqual(objA: any, objB: any) {
  if (Object.is(objA, objB)) return true;
  if (typeof objA !== 'object' || objA === null || typeof objB !== 'object' || objB === null) {
    return false;
  }
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);
  if (keysA.length !== keysB.length) return false;
  for (let i = 0; i < keysA.length; i++) {
    if (!Object.prototype.hasOwnProperty.call(objB, keysA[i]) || !Object.is(objA[keysA[i]], objB[keysA[i]])) {
      return false;
    }
  }
  return true;
}

function undoRedoReducer<T>(
  state: UndoRedoState<T>,
  action: UndoRedoAction<T>
): UndoRedoState<T> {
  switch (action.type) {
    case 'UPDATE': {
      if (shallowEqual(state.present, action.payload)) {
        return state;
      }
      return { ...state, present: action.payload, future: [] };
    }
    case 'COMMIT': {
      // Don't push if value is identical to the last committed one
      if (shallowEqual(state.lastCommitted, action.payload)) {
        return { ...state, present: action.payload, future: [] };
      }
      return {
        past: [...state.past, state.lastCommitted],
        present: action.payload,
        lastCommitted: action.payload,
        future: [],
      };
    }
    case 'UNDO': {
      // If there's a pending uncommitted change, undoing it returns to lastCommitted
      if (!shallowEqual(state.present, state.lastCommitted)) {
        return {
          ...state,
          present: state.lastCommitted,
          future: [state.present, ...state.future],
        };
      }
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      return {
        past: state.past.slice(0, -1),
        present: previous,
        lastCommitted: previous,
        future: [state.present, ...state.future],
      };
    }
    case 'REDO': {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      return {
        past: [...state.past, state.present],
        present: next,
        lastCommitted: next,
        future: state.future.slice(1),
      };
    }
    case 'RESET': {
      return { past: [], present: action.payload, lastCommitted: action.payload, future: [] };
    }
    default:
      return state;
  }
}

/**
 * useUndoRedo<T>
 *
 * Drop-in replacement for useState with full undo/redo history.
 * Debounces rapid keystrokes so each word (not each character) is a history entry.
 *
 * @param initialValue  Starting value
 * @param debounceMs    How long to wait before committing a change to history (default 600ms)
 */
export function useUndoRedo<T>(initialValue: T, debounceMs = 600) {
  const [state, dispatch] = useReducer(
    (s: UndoRedoState<T>, a: UndoRedoAction<T>) => undoRedoReducer(s, a),
    { past: [], present: initialValue, future: [], lastCommitted: initialValue }
  );

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingValue = useRef<T>(initialValue);
  // Keep track of present state in a ref to support functional updates safely
  const presentRef = useRef<T>(initialValue);
  presentRef.current = state.present;

  /** Commit pending value to history immediately */
  const flush = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    dispatch({ type: 'COMMIT', payload: pendingValue.current });
  }, []);

  /**
   * Set a new value. Debounced — rapid changes are batched into one history entry.
   * Supports functional updates like set(prev => ({ ...prev, count: prev.count + 1 })).
   * Pass `immediate: true` to bypass debounce (e.g., on dropdown select).
   */
  const set = useCallback(
    (value: T | ((prev: T) => T), immediate = false) => {
      const nextValue = typeof value === 'function'
        ? (value as (prev: T) => T)(presentRef.current)
        : value;

      pendingValue.current = nextValue;

      if (immediate) {
        if (debounceTimer.current) {
          clearTimeout(debounceTimer.current);
          debounceTimer.current = null;
        }
        dispatch({ type: 'COMMIT', payload: nextValue });
      } else {
        // Update present immediately for UI responsiveness
        dispatch({ type: 'UPDATE', payload: nextValue });
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(flush, debounceMs);
      }
    },
    [debounceMs, flush]
  );

  const undo = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    dispatch({ type: 'UNDO' });
    // Note: pendingValue.current will sync on next render via presentRef
  }, []);

  const redo = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    dispatch({ type: 'REDO' });
    // Note: pendingValue.current will sync on next render via presentRef
  }, []);

  const reset = useCallback((value: T) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    dispatch({ type: 'RESET', payload: value });
    pendingValue.current = value;
  }, []);

  return {
    value: state.present,
    set,
    undo,
    redo,
    reset,
    canUndo: state.past.length > 0 || !shallowEqual(state.present, state.lastCommitted),
    canRedo: state.future.length > 0,
    historyLength: state.past.length,
  };
}

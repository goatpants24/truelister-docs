import { useCallback, useReducer, useRef } from 'react';

interface UndoRedoState<T> {
  past: T[];
  present: T;
  future: T[];
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
      return { ...state, present: action.payload };
    }
    case 'COMMIT': {
      // Don't push if value is identical (optimized shallow check)
      if (shallowEqual(state.present, action.payload)) {
        return state;
      }
      return {
        past: [...state.past, state.present],
        present: action.payload,
        future: [],
      };
    }
    case 'UNDO': {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      return {
        past: state.past.slice(0, -1),
        present: previous,
        future: [state.present, ...state.future],
      };
    }
    case 'REDO': {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      return {
        past: [...state.past, state.present],
        present: next,
        future: state.future.slice(1),
      };
    }
    case 'RESET': {
      return { past: [], present: action.payload, future: [] };
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
    { past: [], present: initialValue, future: [] }
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
      dispatch({ type: 'COMMIT', payload: pendingValue.current });
    }
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

      const isFirstOfSequence = !debounceTimer.current;
      pendingValue.current = nextValue;

      if (immediate) {
        flush();
        dispatch({ type: 'COMMIT', payload: nextValue });
      } else {
        if (isFirstOfSequence) {
          // Push current stable state to history, move to next state
          dispatch({ type: 'COMMIT', payload: nextValue });
        } else {
          // Just update UI, don't grow history stack
          dispatch({ type: 'UPDATE', payload: nextValue });
        }

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
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: 'REDO' });
  }, []);

  const reset = useCallback((value: T) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    dispatch({ type: 'RESET', payload: value });
  }, []);

  return {
    value: state.present,
    set,
    undo,
    redo,
    reset,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    historyLength: state.past.length,
  };
}

import { useCallback, useReducer, useRef } from 'react';

interface UndoRedoState<T> {
  past: T[];
  present: T;
  future: T[];
}

type UndoRedoAction<T> =
  | { type: 'SET'; payload: T }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'RESET'; payload: T };

function undoRedoReducer<T>(
  state: UndoRedoState<T>,
  action: UndoRedoAction<T>
): UndoRedoState<T> {
  switch (action.type) {
    case 'SET': {
      // Don't push if value is identical
      if (JSON.stringify(state.present) === JSON.stringify(action.payload)) {
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

  /** Commit pending value to history immediately */
  const flush = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    dispatch({ type: 'SET', payload: pendingValue.current });
  }, []);

  /**
   * Set a new value. Debounced — rapid changes are batched into one history entry.
   * Pass `immediate: true` to bypass debounce (e.g., on dropdown select).
   */
  const set = useCallback(
    (value: T, immediate = false) => {
      pendingValue.current = value;
      // Update present immediately for UI responsiveness
      dispatch({ type: 'SET', payload: value });

      if (!immediate) {
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

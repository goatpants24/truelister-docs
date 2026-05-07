import { useCallback, useReducer, useRef } from 'react';

interface UndoRedoState<T> {
  past: T[];
  present: T;
  future: T[];
}

type UndoRedoAction<T> =
  | { type: 'UPDATE'; payload: T }
  | { type: 'COMMIT'; payload: { previous: T; next: T } }
  | { type: 'UNDO'; payload: { previousStable: T } }
  | { type: 'REDO' }
  | { type: 'RESET'; payload: T };

function undoRedoReducer<T>(
  state: UndoRedoState<T>,
  action: UndoRedoAction<T>
): UndoRedoState<T> {
  switch (action.type) {
    case 'UPDATE': {
      return {
        ...state,
        present: action.payload,
      };
    }
    case 'COMMIT': {
      const { previous, next } = action.payload;
      // Don't push if previous stable value is identical to the new value
      if (JSON.stringify(previous) === JSON.stringify(next)) {
        return {
          ...state,
          present: next,
          future: [],
        };
      }
      return {
        past: [...state.past, previous],
        present: next,
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
  const lastStableValue = useRef<T>(initialValue);
  const currentPresentRef = useRef<T>(initialValue);

  // Sync ref with state.present for use in callbacks and functional updates
  currentPresentRef.current = state.present;

  const flush = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }

    const nextStable = currentPresentRef.current;
    dispatch({
      type: 'COMMIT',
      payload: { previous: lastStableValue.current, next: nextStable },
    });
    lastStableValue.current = nextStable;
  }, []);

  /**
   * Set a new value. Debounced — rapid changes are batched into one history entry.
   * Pass `immediate: true` to bypass debounce (e.g., on dropdown select).
   */
  const set = useCallback(
    (valueOrUpdater: T | ((prev: T) => T), immediate = false) => {
      const nextValue =
        typeof valueOrUpdater === 'function'
          ? (valueOrUpdater as (prev: T) => T)(currentPresentRef.current)
          : valueOrUpdater;

      if (immediate) {
        // If there was a pending debounced change, we should probably commit it first
        // or just merge this immediate change into a new history entry from the last stable.
        if (debounceTimer.current) {
          clearTimeout(debounceTimer.current);
          debounceTimer.current = null;
        }

        dispatch({
          type: 'COMMIT',
          payload: { previous: lastStableValue.current, next: nextValue },
        });
        lastStableValue.current = nextValue;
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
      flush();
    }
    dispatch({ type: 'UNDO', payload: { previousStable: lastStableValue.current } });
    // After undo, the new present is the new stable
    // But wait, the reducer handles 'present' update.
    // We need to update our ref AFTER the state change.
    // Since useReducer updates are processed, we'll rely on an effect or just update it in the next cycle?
    // Actually, we can just update it here if we know the result, but it's safer to let it sync.
    // However, lastStableValue MUST be synced.
  }, [flush]);

  // To keep lastStableValue in sync with state.present after undo/redo/reset
  // we could use an effect, but refs are better updated during render or in callbacks.
  // Actually, whenever 'present' changes due to UNDO/REDO/RESET, it becomes the new stable.
  const isInternalChange = useRef(false);

  const undoWrapped = useCallback(() => {
    if (debounceTimer.current) flush();
    isInternalChange.current = true;
    dispatch({ type: 'UNDO', payload: { previousStable: lastStableValue.current } });
  }, [flush]);

  const redoWrapped = useCallback(() => {
    if (debounceTimer.current) flush();
    isInternalChange.current = true;
    dispatch({ type: 'REDO' });
  }, [flush]);

  const resetWrapped = useCallback((value: T) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    isInternalChange.current = true;
    dispatch({ type: 'RESET', payload: value });
  }, []);

  // Sync lastStableValue when present changes from UNDO/REDO/RESET
  if (isInternalChange.current) {
    lastStableValue.current = state.present;
    isInternalChange.current = false;
  }

  return {
    value: state.present,
    set,
    undo: undoWrapped,
    redo: redoWrapped,
    reset: resetWrapped,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    historyLength: state.past.length,
  };
}

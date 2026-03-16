import { useState, useCallback, useEffect, useRef } from 'react';

const MAX_HISTORY = 20;

export function useUndoRedo(initial) {
  const [state, setState] = useState(initial);
  const historyRef = useRef([]);
  const futureRef = useRef([]);

  const set = useCallback((newState) => {
    const s = typeof newState === 'function' ? newState(state) : newState;
    historyRef.current = [...historyRef.current.slice(-MAX_HISTORY), state];
    futureRef.current = [];
    setState(s);
  }, [state]);

  const undo = useCallback(() => {
    if (historyRef.current.length === 0) return;
    const prev = historyRef.current[historyRef.current.length - 1];
    historyRef.current = historyRef.current.slice(0, -1);
    futureRef.current = [state, ...futureRef.current];
    setState(prev);
  }, [state]);

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return;
    const next = futureRef.current[0];
    futureRef.current = futureRef.current.slice(1);
    historyRef.current = [...historyRef.current, state];
    setState(next);
  }, [state]);

  const canUndo = historyRef.current.length > 0;
  const canRedo = futureRef.current.length > 0;

  useEffect(() => {
    const handler = (e) => {
      const isZ = e.key === 'z' || e.key === 'Z';
      const isY = e.key === 'y' || e.key === 'Y';
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && isZ && !e.shiftKey) { e.preventDefault(); undo(); }
      if (ctrl && (isY || (isZ && e.shiftKey))) { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

  return { state, set, undo, redo, canUndo, canRedo };
}

import { useState, useCallback, useRef } from 'react';

export function useSaveStatus() {
  const [status, setStatus] = useState('idle'); // idle | saving | saved | error
  const timerRef = useRef(null);

  const setSaving = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setStatus('saving');
  }, []);

  const setSaved = useCallback(() => {
    setStatus('saved');
    timerRef.current = setTimeout(() => setStatus('idle'), 3000);
  }, []);

  const setError = useCallback(() => {
    setStatus('error');
  }, []);

  const setIdle = useCallback(() => setStatus('idle'), []);

  return { status, setSaving, setSaved, setError, setIdle };
}

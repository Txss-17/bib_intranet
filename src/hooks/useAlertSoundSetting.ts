import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'alert-sound-enabled';

function getStored(): boolean {
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
}

export function useAlertSoundSetting() {
  const [enabled, setEnabledState] = useState(getStored);

  const setEnabled = useCallback((value: boolean) => {
    setEnabledState(value);
    try { localStorage.setItem(STORAGE_KEY, String(value)); } catch {}
    window.dispatchEvent(new CustomEvent('alert-sound-changed', { detail: value }));
  }, []);

  useEffect(() => {
    const handler = (e: Event) => setEnabledState((e as CustomEvent).detail);
    window.addEventListener('alert-sound-changed', handler);
    return () => window.removeEventListener('alert-sound-changed', handler);
  }, []);

  return { soundEnabled: enabled, setSoundEnabled: setEnabled };
}

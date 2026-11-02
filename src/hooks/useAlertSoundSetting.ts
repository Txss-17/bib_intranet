import { useState, useEffect, useCallback } from 'react';

// Notification preference is temporary until saved as an authenticated
// server-side user preference; no persistent browser storage is used.
let soundEnabled = true;
export function useAlertSoundSetting() {
  const [enabled,setEnabledState] = useState(soundEnabled);
  const setEnabled = useCallback((value:boolean) => {
    soundEnabled = value;
    setEnabledState(value);
    window.dispatchEvent(new CustomEvent('alert-sound-changed',{detail:value}));
  },[]);
  useEffect(() => {
    const sync = (event:Event) => setEnabledState((event as CustomEvent<boolean>).detail);
    window.addEventListener('alert-sound-changed',sync);
    return () => window.removeEventListener('alert-sound-changed',sync);
  },[]);
  return {soundEnabled:enabled,setSoundEnabled:setEnabled};
}

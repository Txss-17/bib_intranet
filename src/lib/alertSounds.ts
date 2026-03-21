let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

export function playCriticalAlertSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Two-tone urgent alert: high beep × 2
    [0, 0.25].forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now + offset);
      osc.frequency.setValueAtTime(1100, now + offset + 0.08);

      gain.gain.setValueAtTime(0, now + offset);
      gain.gain.linearRampToValueAtTime(0.15, now + offset + 0.02);
      gain.gain.setValueAtTime(0.15, now + offset + 0.12);
      gain.gain.linearRampToValueAtTime(0, now + offset + 0.18);

      osc.start(now + offset);
      osc.stop(now + offset + 0.2);
    });
  } catch {
    // Audio not available — fail silently
  }
}

export function playHighAlertSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, now);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.1, now + 0.02);
    gain.gain.setValueAtTime(0.1, now + 0.1);
    gain.gain.linearRampToValueAtTime(0, now + 0.2);

    osc.start(now);
    osc.stop(now + 0.25);
  } catch {
    // Audio not available
  }
}

/**
 * speechSynthesis.js — AI Voice Synthesizer & Audio Feedback for VF Smart List
 * 
 * Provides:
 * - High-quality text-to-speech feedback (English & Tamil)
 * - Read-aloud for shopping list items
 * - Web Audio API procedural sound chimes (listening start, success chime, clear chime)
 */

let synth = null;
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  synth = window.speechSynthesis;
}

let cachedVoices = [];

function loadVoices() {
  if (!synth) return [];
  if (cachedVoices.length > 0) return cachedVoices;
  cachedVoices = synth.getVoices() || [];
  return cachedVoices;
}

if (synth) {
  synth.onvoiceschanged = () => {
    cachedVoices = synth.getVoices() || [];
  };
}

/**
 * Pick the most natural voice based on language
 */
export function getBestVoice(lang = 'en') {
  const voices = loadVoices();
  if (voices.length === 0) return null;

  if (lang === 'ta' || lang.startsWith('ta')) {
    // Look for Tamil voice (e.g., Valluvar, ta-IN, Google தமிழ்)
    const taVoice = voices.find(v => v.lang.toLowerCase().includes('ta'));
    if (taVoice) return taVoice;
  }

  // Preferred English voices: Indian English -> Google Natural / US / UK
  const inVoice = voices.find(v => v.lang.toLowerCase().includes('en-in') || v.name.toLowerCase().includes('india'));
  if (inVoice) return inVoice;

  const naturalVoice = voices.find(v =>
    v.lang.toLowerCase().startsWith('en') &&
    (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Karen'))
  );
  if (naturalVoice) return naturalVoice;

  return voices.find(v => v.lang.toLowerCase().startsWith('en')) || voices[0];
}

/**
 * Procedural Web Audio API sound effects
 */
export function playSound(type = 'start') {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === 'start') {
      // Gentle ascending 2-tone chime: listening started
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.15); // G5

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'success') {
      // Cheerful double bell chime: items added / saved
      const now = ctx.currentTime;
      [
        { f: 659.25, time: 0 },    // E5
        { f: 880.00, time: 0.12 }, // A5
      ].forEach(note => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.f, now + note.time);
        gain.gain.setValueAtTime(0.1, now + note.time);
        gain.gain.exponentialRampToValueAtTime(0.001, now + note.time + 0.28);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + note.time);
        osc.stop(now + note.time + 0.3);
      });
    } else if (type === 'clear') {
      // Gentle descending chime
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(329.63, now + 0.2); // E4

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    }
  } catch {
    // Audio context not allowed without interaction or not supported
  }
}

/**
 * Speaks a given sentence using SpeechSynthesis
 */
export function speakText(text, options = {}) {
  if (!synth) return;
  const {
    lang = 'en',
    rate = 1.0,
    pitch = 1.0,
    onStart,
    onEnd,
    onError
  } = options;

  try {
    synth.cancel(); // Stop any pending speech

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = getBestVoice(lang);
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      utterance.lang = lang === 'ta' ? 'ta-IN' : 'en-IN';
    }

    utterance.rate = rate;
    utterance.pitch = pitch;

    if (onStart) utterance.onstart = onStart;
    if (onEnd)   utterance.onend = onEnd;
    if (onError) utterance.onerror = onError;

    synth.speak(utterance);
  } catch (err) {
    console.warn('SpeechSynthesis error:', err);
    if (onError) onError(err);
  }
}

/**
 * Cancel / Mute active speech
 */
export function stopSpeaking() {
  if (synth) {
    synth.cancel();
  }
}

/**
 * Read the entire shopping list aloud in pleasant, natural phrasing
 */
export function readShoppingListAloud(selectedItems = [], lang = 'en', onComplete) {
  if (!selectedItems || selectedItems.length === 0) {
    const emptyMsg = lang === 'ta'
      ? 'உங்கள் ஷாப்பிங் பட்டியல் காலியாக உள்ளது. பொருட்களை தேர்வு செய்யுங்கள்.'
      : 'Your shopping list is currently empty. Please add items to begin.';
    speakText(emptyMsg, { lang, onEnd: onComplete });
    return;
  }

  const totalCount = selectedItems.length;

  if (lang === 'ta') {
    const itemPhrases = selectedItems.map(item => {
      const name = item.name_ta || item.name;
      return `${name} ${item.kgFormatted}`;
    }).join(', ');

    const speech = `உங்கள் பட்டியலில் மொத்தம் ${totalCount} பொருட்கள் உள்ளன: ${itemPhrases}.`;
    speakText(speech, { lang: 'ta', rate: 0.95, onEnd: onComplete });
  } else {
    const itemPhrases = selectedItems.map(item => {
      return `${item.kgFormatted} of ${item.name}`;
    }).join(', ');

    const speech = `You have ${totalCount} item${totalCount > 1 ? 's' : ''} in your shopping list: ${itemPhrases}.`;
    speakText(speech, { lang: 'en', rate: 1.0, onEnd: onComplete });
  }
}

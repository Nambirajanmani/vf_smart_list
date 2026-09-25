import { useState, useEffect, useRef, useCallback } from 'react';
import { parseVoiceCommand } from '../utils/voiceParser.js';
import { getTanglishName, getEnglishName } from '../utils/tanglish.js';
import api from '../api/api.js';
import {
  speakText,
  stopSpeaking,
  playSound,
  readShoppingListAloud
} from '../utils/speechSynthesis.js';
import './AiVoiceAssistant.css';

export default function AiVoiceAssistant({
  catalogItems = [],
  quantities = {},
  selectedItems = [],
  onQtyChange,
  onClearList,
  onSaveHistory,
  onShareWhatsApp,
  onSearch,
  externalTriggerOpen = false,
  onCloseExternalTrigger
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [feedback, setFeedback] = useState(null); // { type: 'success'|'info'|'warning', text, items }
  const [lang, setLang] = useState('en'); // 'en' | 'ta'
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [textInput, setTextInput] = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);

  const recognitionRef = useRef(null);
  const finalTranscriptAccumulator = useRef('');

  // Sync external open trigger (e.g. from navbar or search mic)
  useEffect(() => {
    if (externalTriggerOpen) {
      setIsOpen(true);
      if (onCloseExternalTrigger) onCloseExternalTrigger();
    }
  }, [externalTriggerOpen, onCloseExternalTrigger]);

  // Initialize Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      setIsListening(true);
      playSound('start');
    };

    rec.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const item = event.results[i];
        if (item.isFinal) {
          finalTranscriptAccumulator.current += ' ' + item[0].transcript;
          setTranscript(finalTranscriptAccumulator.current.trim());
        } else {
          interim += item[0].transcript;
        }
      }
      setInterimText(interim);
    };

    rec.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setFeedback({
          type: 'warning',
          text: lang === 'ta'
            ? 'மைக்ரோஃபோன் அனுமதி மறுக்கப்பட்டுள்ளது. உலாவி அமைப்புகளில் அனுமதியை இயக்கவும்.'
            : 'Microphone permission denied. Please allow microphone access in browser settings.'
        });
      }
      setIsListening(false);
    };

    rec.onend = () => {
      setIsListening(false);
      setInterimText('');
    };

    recognitionRef.current = rec;

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }
      stopSpeaking();
    };
  }, [lang]);

  // Update recognition language
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = lang === 'ta' ? 'ta-IN' : 'en-IN';
    }
  }, [lang]);

  // Stop listening when assistant closes
  const handleClose = () => {
    stopListening();
    stopSpeaking();
    setIsOpen(false);
    setInterimText('');
    setFeedback(null);
  };

  // Toggle microphone listening
  const toggleListening = () => {
    if (!speechSupported) {
      alert('Speech Recognition is not supported in this browser. You can type commands below!');
      return;
    }

    if (isListening) {
      stopListening();
      if (transcript.trim()) {
        executeCommand(transcript.trim());
      }
    } else {
      startListening();
    }
  };

  const startListening = () => {
    if (!recognitionRef.current) return;
    finalTranscriptAccumulator.current = '';
    setTranscript('');
    setInterimText('');
    setFeedback(null);
    stopSpeaking();

    try {
      recognitionRef.current.lang = lang === 'ta' ? 'ta-IN' : 'en-IN';
      recognitionRef.current.start();
    } catch (err) {
      console.warn('Could not start recognition:', err);
    }
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch {}
    setIsListening(false);
  };

  // Process and execute recognized natural language command
  const executeCommand = useCallback((rawPhrase) => {
    if (!rawPhrase || !rawPhrase.trim()) return;

    const result = parseVoiceCommand(rawPhrase, catalogItems);
    const spokenMessage = lang === 'ta' ? result.feedbackTamil : result.feedbackText;

    // Asynchronously log to data collection pipeline for Transformer training
    try {
      api.post('/voice/log', {
        utterance: rawPhrase,
        lang,
        action: result.action,
        matchedItems: (result.items || []).map(i => ({
          id: i.item.id,
          name: i.item.name,
          english: getEnglishName(i.item),
          qty: i.qty,
          confidence: i.confidence,
          matchType: i.matchType
        }))
      }).catch(() => {});
    } catch {}

    if (result.action === 'ADD_OR_UPDATE') {
      result.items.forEach(({ item, qty }) => {
        onQtyChange(item.id, qty);
      });
      playSound('success');
      setFeedback({
        type: 'success',
        text: spokenMessage,
        items: result.items
      });
      if (voiceEnabled) {
        setIsSpeaking(true);
        speakText(spokenMessage, { lang, onEnd: () => setIsSpeaking(false) });
      }
    } else if (result.action === 'REMOVE') {
      result.items.forEach(({ item }) => {
        onQtyChange(item.id, 0);
      });
      playSound('success');
      setFeedback({
        type: 'info',
        text: spokenMessage,
        items: result.items
      });
      if (voiceEnabled) {
        setIsSpeaking(true);
        speakText(spokenMessage, { lang, onEnd: () => setIsSpeaking(false) });
      }
    } else if (result.action === 'CLEAR') {
      onClearList();
      playSound('clear');
      setFeedback({
        type: 'info',
        text: spokenMessage
      });
      if (voiceEnabled) {
        setIsSpeaking(true);
        speakText(spokenMessage, { lang, onEnd: () => setIsSpeaking(false) });
      }
    } else if (result.action === 'READ_LIST') {
      setFeedback({
        type: 'info',
        text: spokenMessage
      });
      setIsSpeaking(true);
      readShoppingListAloud(selectedItems, lang, () => setIsSpeaking(false));
    } else if (result.action === 'WHATSAPP') {
      onShareWhatsApp();
      setFeedback({
        type: 'success',
        text: spokenMessage
      });
      if (voiceEnabled) {
        setIsSpeaking(true);
        speakText(spokenMessage, { lang, onEnd: () => setIsSpeaking(false) });
      }
    } else if (result.action === 'SAVE_LIST') {
      onSaveHistory();
      setFeedback({
        type: 'success',
        text: spokenMessage
      });
      if (voiceEnabled) {
        setIsSpeaking(true);
        speakText(spokenMessage, { lang, onEnd: () => setIsSpeaking(false) });
      }
    } else if (result.action === 'SEARCH') {
      if (onSearch && result.searchTerm) {
        onSearch(result.searchTerm);
      }
      setFeedback({
        type: 'info',
        text: spokenMessage
      });
      if (voiceEnabled) {
        setIsSpeaking(true);
        speakText(spokenMessage, { lang, onEnd: () => setIsSpeaking(false) });
      }
    } else {
      // Unknown command
      setFeedback({
        type: 'warning',
        text: spokenMessage
      });
      if (voiceEnabled) {
        setIsSpeaking(true);
        speakText(spokenMessage, { lang, onEnd: () => setIsSpeaking(false) });
      }
    }
  }, [catalogItems, lang, voiceEnabled, onQtyChange, onClearList, onSaveHistory, onShareWhatsApp, onSearch, selectedItems]);

  // Handle manual command text submit
  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    setTranscript(textInput);
    executeCommand(textInput);
    setTextInput('');
  };

  // Quick command suggestions
  const samplePrompts = lang === 'ta' ? [
    'ஒரு கிலோ தக்காளி, அரை கிலோ வெங்காயம்',
    'அரை லிட்டர் பால், 250 கிராம் வெண்ணெய்',
    'கால் கிலோ இஞ்சி, 100 கிராம் பச்சை மிளகாய்',
    'பட்டியலை வாசி',
    'பட்டியலை அழி'
  ] : [
    'Add 1kg Tomato and 500g Onion',
    'Add 2 Liters Milk and 250g Butter',
    'Add quarter kg Ginger, 100g Green Chilli',
    'Read my shopping list',
    'Clear list'
  ];

  return (
    <>
      {/* ── Floating AI Voice Button (FAB) ── */}
      <button
        type="button"
        className={`ai-voice-fab ${isListening ? 'ai-voice-fab--listening' : ''} ${isSpeaking ? 'ai-voice-fab--speaking' : ''}`}
        onClick={() => setIsOpen(true)}
        title="Open AI Voice Assistant (English & தமிழ்)"
        aria-label="AI Voice Assistant"
      >
        <span className="fab-pulse-ring" />
        <span className="fab-pulse-ring fab-pulse-ring--delay" />
        <div className="fab-icon-inner">
          <span className="fab-icon">🎙️</span>
        </div>
        <span className="fab-text">AI Voice</span>
        <span className="fab-badge">தமிழ்</span>
      </button>

      {/* ── Modal Interface ── */}
      {isOpen && (
        <div className="ai-modal-overlay fade-in" onClick={handleClose}>
          <div
            className="ai-modal-card glass-card slide-up"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="ai-modal-header">
              <div className="ai-brand-group">
                <div className="ai-brand-icon">🤖</div>
                <div>
                  <h2 className="ai-modal-title">
                    VF <span className="text-accent">AI Voice</span> Assistant
                  </h2>
                  <p className="ai-modal-sub">
                    {lang === 'ta'
                      ? 'காய்கறி, பழங்கள் மற்றும் மளிகைப் பொருட்களை குரல் மூலம் சேர்க்கலாம்'
                      : 'Speak naturally to add items, change quantities, or manage your list'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="ai-close-btn"
                onClick={handleClose}
                aria-label="Close voice assistant"
              >
                ✕
              </button>
            </div>

            {/* Language & Voice Response Controls Bar */}
            <div className="ai-top-bar">
              <div className="ai-lang-toggle">
                <button
                  type="button"
                  className={`ai-lang-pill ${lang === 'en' ? 'ai-lang-pill--active' : ''}`}
                  onClick={() => setLang('en')}
                >
                  🇬🇧 English
                </button>
                <button
                  type="button"
                  className={`ai-lang-pill ${lang === 'ta' ? 'ai-lang-pill--active' : ''}`}
                  onClick={() => setLang('ta')}
                >
                  🇮🇳 தமிழ் (Tamil)
                </button>
              </div>

              <button
                type="button"
                className={`ai-tts-toggle ${voiceEnabled ? 'ai-tts-toggle--on' : ''}`}
                onClick={() => {
                  if (voiceEnabled) stopSpeaking();
                  setVoiceEnabled(!voiceEnabled);
                }}
                title={voiceEnabled ? 'Mute AI voice responses' : 'Enable AI voice responses'}
              >
                {voiceEnabled ? '🔊 Voice Feedback: ON' : '🔇 Voice Feedback: OFF'}
              </button>
            </div>

            {/* Glowing Interactive AI Voice Orb Visualizer */}
            <div className="ai-orb-container">
              <div
                className={`ai-orb ${isListening ? 'ai-orb--listening' : ''} ${isSpeaking ? 'ai-orb--speaking' : ''}`}
                onClick={toggleListening}
                role="button"
                tabIndex={0}
                title={isListening ? 'Click to stop listening' : 'Click to start speaking'}
              >
                <div className="ai-orb-core">
                  <span className="ai-orb-icon">
                    {isSpeaking ? '🔊' : isListening ? '🎙️' : '✨'}
                  </span>
                </div>
                <div className="ai-orb-wave wave-1" />
                <div className="ai-orb-wave wave-2" />
                <div className="ai-orb-wave wave-3" />
              </div>

              {/* Status Indicator */}
              <div className="ai-status-row">
                {isListening ? (
                  <div className="ai-status-badge ai-status--listening">
                    <span className="dot pulse" />
                    <span>{lang === 'ta' ? 'கேட்கிறது... பேசுங்கள்' : 'Listening... Speak now'}</span>
                  </div>
                ) : isSpeaking ? (
                  <div className="ai-status-badge ai-status--speaking">
                    <span className="dot pulse" />
                    <span>{lang === 'ta' ? 'AI பேசுகிறது...' : 'AI Speaking...'}</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="ai-mic-cta-btn"
                    onClick={toggleListening}
                  >
                    🎙️ {lang === 'ta' ? 'மைக் தட்டி பேசவும்' : 'Tap to Speak'}
                  </button>
                )}
              </div>
            </div>

            {/* Live Audio Wave Bars (When Listening) */}
            {isListening && (
              <div className="ai-wave-bars">
                <span className="wave-bar bar-1" />
                <span className="wave-bar bar-2" />
                <span className="wave-bar bar-3" />
                <span className="wave-bar bar-4" />
                <span className="wave-bar bar-5" />
                <span className="wave-bar bar-6" />
                <span className="wave-bar bar-7" />
                <span className="wave-bar bar-8" />
              </div>
            )}

            {/* Spoken Transcript Box */}
            <div className="ai-transcript-box">
              <div className="ai-transcript-label">
                <span>💬 {lang === 'ta' ? 'நீங்கள் கூறியது' : 'Recognized Speech'}:</span>
                {isListening && <span className="ai-live-tag">LIVE</span>}
              </div>
              <div className="ai-transcript-content">
                {transcript || interimText ? (
                  <p>
                    <strong>{transcript}</strong>{' '}
                    <span className="ai-interim">{interimText}</span>
                  </p>
                ) : (
                  <p className="ai-placeholder">
                    {isListening
                      ? (lang === 'ta' ? 'உங்கள் குரலை கேட்கிறது...' : 'Listening to your voice...')
                      : (lang === 'ta' ? 'எடுத்துக்காட்டு: "1 கிலோ தக்காளி, அரை கிலோ வெங்காயம்"' : 'Example: "Add 1kg tomato, 500g onion, and 2L milk"')}
                  </p>
                )}
              </div>

              {isListening && (
                <div className="ai-transcript-actions">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={toggleListening}
                  >
                    ✓ {lang === 'ta' ? 'முடித்தேன் (முடிவு செய்)' : 'Done Speaking'}
                  </button>
                </div>
              )}
            </div>

            {/* AI Feedback & Parsed Items Notification */}
            {feedback && (
              <div className={`ai-feedback-banner ai-feedback--${feedback.type} fade-in`}>
                <div className="ai-feedback-text">
                  <span className="ai-feedback-icon">
                    {feedback.type === 'success' ? '✅' : feedback.type === 'warning' ? '⚠️' : 'ℹ️'}
                  </span>
                  <span>{feedback.text}</span>
                </div>

                {/* Parsed Item Tags Preview */}
                {feedback.items && feedback.items.length > 0 && (
                  <div className="ai-parsed-chips">
                    {feedback.items.map((pi, idx) => (
                      <div key={idx} className={`ai-parsed-chip ${pi.isRemove ? 'ai-parsed-chip--remove' : ''}`}>
                        <span>{pi.item.emoji}</span>
                        <strong>
                          {lang === 'ta' && pi.item.name_ta ? pi.item.name_ta : (getEnglishName(pi.item) || pi.item.name)}
                          {getTanglishName(pi.item) && (
                            <span style={{ opacity: 0.8, fontWeight: 400, marginLeft: 4 }}>
                              ({getTanglishName(pi.item)})
                            </span>
                          )}
                        </strong>
                        {!pi.isRemove && (
                          <span className="ai-parsed-qty">
                            {pi.isLiquid ? `${pi.qty} L` : `${pi.qty >= 1 ? `${pi.qty} kg` : `${Math.round(pi.qty * 1000)} g`}`}
                          </span>
                        )}
                        {pi.isRemove && <span className="ai-parsed-removed">Removed</span>}
                        {pi.confidence && (
                          <span
                            title={`Transformer Confidence: ${Math.round(pi.confidence * 100)}%`}
                            style={{
                              marginLeft: '6px',
                              fontSize: '0.72rem',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: '#059669',
                              fontWeight: 600
                            }}
                          >
                            ⚡ {Math.round(pi.confidence * 100)}%
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Sample Command Chips */}
            <div className="ai-prompts-section">
              <span className="ai-prompts-title">
                💡 {lang === 'ta' ? 'முயற்சி செய்ய சில குரல் கட்டளைகள்' : 'Quick Voice Suggestions'}:
              </span>
              <div className="ai-prompts-scroll">
                {samplePrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="ai-prompt-chip"
                    onClick={() => {
                      setTranscript(prompt);
                      executeCommand(prompt);
                    }}
                  >
                    🎙️ {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Text Input Fallback (for quiet environments or no mic access) */}
            <form className="ai-manual-input-form" onSubmit={handleTextSubmit}>
              <input
                type="text"
                className="ai-manual-input"
                placeholder={lang === 'ta' ? 'அல்லது இங்கே தட்டச்சு செய்து கட்டளையிடலாம்...' : 'Or type a command (e.g. Add 1kg tomato & 500g onion)...'}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
              />
              <button
                type="submit"
                className="btn btn-primary btn-sm ai-manual-btn"
                disabled={!textInput.trim()}
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

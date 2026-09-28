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
  onAddCustomItem,
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
  const [lang, setLang] = useState('en'); // 'en' | 'ta'
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [autoListen, setAutoListen] = useState(false); // Hands-free continuous conversation mode
  const [textInput, setTextInput] = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);

  // Chat message history
  const [messages, setMessages] = useState(() => [
    {
      id: 'msg_welcome',
      sender: 'ai',
      text: "Hello! I'm your VF Voice AI Assistant 🎙️. Speak product names, kg/grams, liters, or packets, and I will directly add them to your product list!",
      textTa: "வணக்கம்! நான் உங்கள் VF வாய்ஸ் AI உதவியாளர் 🎙️. பொருட்கள், கிலோ/அளவு விவரங்களை பேசினால் நேரடியாக உங்கள் பட்டியலில் சேர்க்கப்படும்!",
      timestamp: 'Online',
      prompts: [
        'Add 2kg Tomato and 1kg Onion',
        'Add 1 Liter Milk and 500g Butter',
        'Add 250g Green Chilli and 100g Ginger',
        'What is in my list?',
        'Clear list'
      ],
      promptsTa: [
        'ஒரு கிலோ தக்காளி, அரை கிலோ வெங்காயம்',
        'அரை லிட்டர் பால், 250 கிராம் வெண்ணெய்',
        '250 கிராம் பச்சை மிளகாய், 100 கிராம் இஞ்சி',
        'பட்டியலை வாசி',
        'பட்டியலை அழி'
      ]
    }
  ]);

  const recognitionRef = useRef(null);
  const finalTranscriptAccumulator = useRef('');
  const chatBottomRef = useRef(null);
  const autoListenRef = useRef(autoListen);
  autoListenRef.current = autoListen;

  // Scroll to bottom of chat whenever messages or interim speech changes
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, interimText]);

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
        const errorMsg = lang === 'ta'
          ? 'மைக்ரோஃபோன் அனுமதி மறுக்கப்பட்டுள்ளது. உலாவி அமைப்புகளில் அனுமதியை இயக்கவும்.'
          : 'Microphone permission denied. Please allow microphone access in browser settings.';
        setMessages(prev => [
          ...prev,
          {
            id: `err_${Date.now()}`,
            sender: 'ai',
            isError: true,
            text: errorMsg,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
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
  };

  // Toggle microphone listening
  const toggleListening = () => {
    if (!speechSupported) {
      alert('Speech Recognition is not supported in this browser. You can type commands below!');
      return;
    }

    if (isListening) {
      stopListening();
      const currentFullText = (finalTranscriptAccumulator.current + ' ' + interimText).trim();
      if (currentFullText) {
        executeCommand(currentFullText, true);
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
  const executeCommand = useCallback((rawPhrase, fromVoice = false) => {
    if (!rawPhrase || !rawPhrase.trim()) return;
    const cleanPhrase = rawPhrase.trim();

    // 1. Append User Message to Chat
    const userMsg = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: cleanPhrase,
      isVoice: fromVoice,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setTranscript('');
    setInterimText('');
    finalTranscriptAccumulator.current = '';

    // 2. Intelligent NLP Parse
    const result = parseVoiceCommand(cleanPhrase, catalogItems);
    const spokenMessage = lang === 'ta' ? result.feedbackTamil : result.feedbackText;

    // Asynchronously log to data collection pipeline for Transformer training
    try {
      api.post('/voice/log', {
        utterance: cleanPhrase,
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

    // 3. Register any dynamic / custom items detected so they persist in the product list
    if (onAddCustomItem && result.items && result.items.length > 0) {
      result.items.forEach(({ item }) => {
        if (item.isCustom) {
          onAddCustomItem(item);
        }
      });
    }

    // 4. Execute Actions & Directly Update the Product List
    if (result.action === 'ADD_OR_UPDATE') {
      result.items.forEach(({ item, qty }) => {
        onQtyChange(item.id, qty);
      });
      playSound('success');
    } else if (result.action === 'REMOVE') {
      result.items.forEach(({ item }) => {
        onQtyChange(item.id, 0);
      });
      playSound('success');
    } else if (result.action === 'CLEAR') {
      onClearList();
      playSound('clear');
    } else if (result.action === 'READ_LIST') {
      readShoppingListAloud(selectedItems, lang, () => {
        setIsSpeaking(false);
        if (autoListenRef.current) startListening();
      });
    } else if (result.action === 'WHATSAPP') {
      onShareWhatsApp();
    } else if (result.action === 'SAVE_LIST') {
      onSaveHistory();
    } else if (result.action === 'SEARCH') {
      if (onSearch && result.searchTerm) {
        onSearch(result.searchTerm);
      }
    }

    // 5. Append AI Assistant Response Message to Chat
    const aiMsg = {
      id: `ai_${Date.now()}`,
      sender: 'ai',
      text: spokenMessage,
      action: result.action,
      items: result.items || [],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, aiMsg]);

    // 6. Text-To-Speech Audio Feedback
    if (voiceEnabled && result.action !== 'READ_LIST') {
      setIsSpeaking(true);
      speakText(spokenMessage, {
        lang,
        onEnd: () => {
          setIsSpeaking(false);
          // Auto-resume listening if Hands-Free Mode is enabled
          if (autoListenRef.current) {
            setTimeout(() => {
              startListening();
            }, 300);
          }
        },
        onError: () => {
          setIsSpeaking(false);
          if (autoListenRef.current) {
            setTimeout(() => {
              startListening();
            }, 300);
          }
        }
      });
    } else if (autoListenRef.current && result.action !== 'READ_LIST') {
      // If voice feedback is muted but autoListen is on, restart listening after short delay
      setTimeout(() => {
        startListening();
      }, 700);
    }
  }, [catalogItems, lang, voiceEnabled, onQtyChange, onAddCustomItem, onClearList, onSaveHistory, onShareWhatsApp, onSearch, selectedItems]);

  // Handle manual command text submit
  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    executeCommand(textInput.trim(), false);
    setTextInput('');
  };

  // Helper to adjust quantity directly from chat card
  const handleCardQtyAdjust = (item, delta) => {
    const current = quantities[item.id] || 0;
    const step = item.category === 'dairy' ? 0.25 : 0.25;
    const updated = Math.max(0, Math.round((current + delta * step) * 1000) / 1000);
    onQtyChange(item.id, updated);
  };

  // Helper to remove item directly from chat card
  const handleCardRemove = (item) => {
    onQtyChange(item.id, 0);
  };

  // Quick command suggestions
  const samplePrompts = lang === 'ta' ? [
    '2 கிலோ தக்காளி, 1 கிலோ வெங்காயம்',
    'அரை லிட்டர் பால், 250 கிராம் வெண்ணெய்',
    'கால் கிலோ இஞ்சி, 100 கிராம் பச்சை மிளகாய்',
    '2 பாக்கெட் பிரட்',
    'பட்டியலை வாசி',
    'பட்டியலை அழி'
  ] : [
    'Add 2kg Tomato and 1kg Onion',
    'Add 1 Liter Milk and 500g Butter',
    'Add 250g Green Chilli and 100g Ginger',
    'Add 2 packets Bread',
    'What is in my list?',
    'Clear list'
  ];

  return (
    <>
      {/* ── Floating AI Voice Chat Button (FAB) ── */}
      <button
        type="button"
        className={`ai-voice-fab ${isListening ? 'ai-voice-fab--listening' : ''} ${isSpeaking ? 'ai-voice-fab--speaking' : ''}`}
        onClick={() => setIsOpen(true)}
        title="Open AI Voice Chat Assistant (English & தமிழ்)"
        aria-label="AI Voice Chat Assistant"
      >
        <span className="fab-pulse-ring" />
        <span className="fab-pulse-ring fab-pulse-ring--delay" />
        <div className="fab-icon-inner">
          <span className="fab-icon">🎙️</span>
        </div>
        <div className="fab-label-group">
          <span className="fab-text">AI Voice Chat</span>
          <span className="fab-subtext">Direct Add to List</span>
        </div>
        <span className="fab-badge">தமிழ் / EN</span>
      </button>

      {/* ── Modal / Voice Chat Window ── */}
      {isOpen && (
        <div className="ai-modal-overlay fade-in" onClick={handleClose}>
          <div
            className="ai-chat-window glass-card slide-up"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* ── Chat Header ── */}
            <div className="ai-chat-header">
              <div className="ai-chat-brand">
                <div className="ai-bot-avatar">
                  <span>🤖</span>
                  <span className={`ai-bot-status-dot ${isListening ? 'status--listening' : isSpeaking ? 'status--speaking' : 'status--ready'}`} />
                </div>
                <div>
                  <div className="ai-title-row">
                    <h2 className="ai-chat-title">
                      VF <span className="text-accent">Voice AI</span> Assistant
                    </h2>
                    <span className="ai-live-pill">Direct Product Add</span>
                  </div>
                  <p className="ai-chat-sub">
                    {lang === 'ta'
                      ? 'குரல் வழியே தயாரிப்பு பெயர், கிலோ & அளவு விவரங்களை நேரடியாக பட்டியலில் சேர்க்கலாம்'
                      : 'Hears product name, kg/liters & details — directly adds to your shopping list'}
                  </p>
                </div>
              </div>

              <div className="ai-header-actions">
                <button
                  type="button"
                  className="ai-icon-btn ai-close-btn"
                  onClick={handleClose}
                  aria-label="Close voice chat"
                  title="Close Assistant"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* ── Control Bar: Language, TTS, & Hands-Free Mode ── */}
            <div className="ai-controls-bar">
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
                  🇮🇳 தமிழ்
                </button>
              </div>

              <div className="ai-toggles-group">
                {/* Voice Audio Feedback Toggle */}
                <button
                  type="button"
                  className={`ai-toggle-pill ${voiceEnabled ? 'ai-toggle-pill--active' : ''}`}
                  onClick={() => {
                    if (voiceEnabled) stopSpeaking();
                    setVoiceEnabled(!voiceEnabled);
                  }}
                  title={voiceEnabled ? 'Mute AI voice audio' : 'Enable AI voice audio'}
                >
                  {voiceEnabled ? '🔊 Voice ON' : '🔇 Voice OFF'}
                </button>

                {/* Auto-Listen / Hands-Free Toggle */}
                <button
                  type="button"
                  className={`ai-toggle-pill ai-autolisten-pill ${autoListen ? 'ai-autolisten--on' : ''}`}
                  onClick={() => {
                    const next = !autoListen;
                    setAutoListen(next);
                    if (next && !isListening) startListening();
                  }}
                  title="Hands-free auto-listen: Automatically resumes listening after each product is added"
                >
                  {autoListen ? '⚡ Hands-Free: ON' : '🎙️ Hands-Free: OFF'}
                </button>
              </div>
            </div>

            {/* ── Visualizer & Speech Recognition Banner ── */}
            <div className={`ai-speech-status-banner ${isListening ? 'status-banner--listening' : isSpeaking ? 'status-banner--speaking' : ''}`}>
              <div className="ai-visualizer-left">
                <div
                  className={`ai-mini-orb ${isListening ? 'ai-mini-orb--listening' : isSpeaking ? 'ai-mini-orb--speaking' : ''}`}
                  onClick={toggleListening}
                  role="button"
                  tabIndex={0}
                  title={isListening ? 'Tap to finish speaking' : 'Tap to start speaking'}
                >
                  <span className="mini-orb-icon">
                    {isSpeaking ? '🔊' : isListening ? '🎙️' : '✨'}
                  </span>
                </div>

                <div className="ai-speech-text-wrap">
                  <div className="ai-speech-status-title">
                    {isListening ? (
                      <span className="text-listening">
                        <span className="dot pulse" /> {lang === 'ta' ? 'கேட்கிறது... பேசுங்கள்' : 'Listening... Speak now'}
                      </span>
                    ) : isSpeaking ? (
                      <span className="text-speaking">
                        <span className="dot pulse" /> {lang === 'ta' ? 'AI பேசுகிறது...' : 'AI Speaking...'}
                      </span>
                    ) : (
                      <span className="text-ready">
                        {lang === 'ta' ? 'பேச மைக் தட்டவும் அல்லது தட்டச்சு செய்யவும்' : 'Ready — Tap mic or type below to add products'}
                      </span>
                    )}
                  </div>

                  {/* Real-time Live Speech Transcript */}
                  {(transcript || interimText) ? (
                    <div className="ai-live-transcript">
                      <strong>{transcript}</strong> <span className="ai-interim">{interimText}</span>
                    </div>
                  ) : isListening ? (
                    <div className="ai-live-hint">
                      {lang === 'ta'
                        ? 'எ.கா: "2 கிலோ தக்காளி மற்றும் 1 கிலோ வெங்காயம் சேர்"'
                        : 'e.g., "Add 2kg Tomato, 1kg Onion and 500g Green Chilli"'}
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Reactive Wave Bars (When Listening) */}
              {isListening && (
                <div className="ai-wave-bars">
                  <span className="wave-bar bar-1" />
                  <span className="wave-bar bar-2" />
                  <span className="wave-bar bar-3" />
                  <span className="wave-bar bar-4" />
                  <span className="wave-bar bar-5" />
                  <span className="wave-bar bar-6" />
                </div>
              )}

              {isListening && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm ai-done-btn"
                  onClick={toggleListening}
                >
                  ✓ {lang === 'ta' ? 'முடிந்தது' : 'Done'}
                </button>
              )}
            </div>

            {/* ── Conversational Chat Messages Stream ── */}
            <div className="ai-chat-messages">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`chat-bubble-row ${msg.sender === 'user' ? 'chat-row--user' : 'chat-row--ai'} fade-in`}
                >
                  {msg.sender === 'ai' && (
                    <div className="chat-avatar-ai">🤖</div>
                  )}

                  <div className={`chat-bubble ${msg.sender === 'user' ? 'bubble--user' : 'bubble--ai'} ${msg.isError ? 'bubble--error' : ''}`}>
                    {/* Header info */}
                    <div className="chat-bubble-meta">
                      <span className="chat-bubble-sender">
                        {msg.sender === 'user' ? (msg.isVoice ? '🎙️ You (Voice)' : '💬 You') : '✨ VF Voice AI'}
                      </span>
                      <span className="chat-bubble-time">{msg.timestamp}</span>
                    </div>

                    {/* Message Body */}
                    <div className="chat-bubble-text">
                      {lang === 'ta' && msg.textTa ? msg.textTa : msg.text}
                    </div>

                    {/* Interactive Product Action Cards (Rendered for parsed products) */}
                    {msg.items && msg.items.length > 0 && (
                      <div className="chat-items-grid">
                        {msg.items.map((pi, idx) => {
                          const currentInList = quantities[pi.item.id] || 0;
                          const displayName = lang === 'ta' && pi.item.name_ta
                            ? pi.item.name_ta
                            : (getEnglishName(pi.item) || pi.item.name);
                          const tanglish = getTanglishName(pi.item);

                          return (
                            <div
                              key={idx}
                              className={`chat-product-card ${pi.isRemove ? 'card--removed' : 'card--added'}`}
                            >
                              <div className="card-top">
                                <span className="card-emoji">{pi.item.emoji || '🛍️'}</span>
                                <div className="card-info">
                                  <div className="card-name-row">
                                    <span className="card-name">{displayName}</span>
                                    {tanglish && !displayName.toLowerCase().includes(tanglish.toLowerCase()) && (
                                      <span className="card-tanglish">({tanglish})</span>
                                    )}
                                  </div>
                                  <div className="card-sub-info">
                                    <span className="card-cat-badge">{pi.item.category || 'grocery'}</span>
                                    {pi.item.isCustom && (
                                      <span className="card-custom-badge">✨ Custom Item</span>
                                    )}
                                  </div>
                                </div>

                                <div className="card-qty-tag">
                                  {pi.unit === 'packet' ? `${pi.qty} pkt` :
                                   pi.unit === 'bunch' ? `${pi.qty} bunch` :
                                   pi.unit === 'piece' ? `${pi.qty} pcs` :
                                   pi.isLiquid ? `${pi.qty} L` :
                                   pi.qty >= 1 ? `${pi.qty} kg` : `${Math.round(pi.qty * 1000)} g`}
                                </div>
                              </div>

                              {/* Direct Live List Adjustment Controls */}
                              {!pi.isRemove && (
                                <div className="card-actions-bar">
                                  <span className="card-status-label">
                                    ✓ In Shopping List: <strong>{currentInList > 0 ? (pi.isLiquid ? `${currentInList} L` : `${currentInList} kg`) : '0'}</strong>
                                  </span>

                                  <div className="card-quick-btns">
                                    <button
                                      type="button"
                                      className="card-btn-mini"
                                      onClick={() => handleCardQtyAdjust(pi.item, -1)}
                                      title="Decrease quantity by 250g"
                                    >
                                      −
                                    </button>
                                    <button
                                      type="button"
                                      className="card-btn-mini"
                                      onClick={() => handleCardQtyAdjust(pi.item, 1)}
                                      title="Increase quantity by 250g"
                                    >
                                      +
                                    </button>
                                    <button
                                      type="button"
                                      className="card-btn-mini card-btn-mini--remove"
                                      onClick={() => handleCardRemove(pi.item)}
                                      title="Remove from list"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Preset prompt buttons in welcome message */}
                    {msg.prompts && (
                      <div className="chat-welcome-prompts">
                        <span className="prompts-label">
                          💡 {lang === 'ta' ? 'முயற்சி செய்ய கிளிக் செய்யுங்கள்' : 'Tap to test Voice AI'}:
                        </span>
                        <div className="prompts-chips-list">
                          {(lang === 'ta' && msg.promptsTa ? msg.promptsTa : msg.prompts).map((prompt, pIdx) => (
                            <button
                              key={pIdx}
                              type="button"
                              className="chat-prompt-pill"
                              onClick={() => executeCommand(prompt, false)}
                            >
                              🎙️ {prompt}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {msg.sender === 'user' && (
                    <div className="chat-avatar-user">👤</div>
                  )}
                </div>
              ))}
              <div ref={chatBottomRef} />
            </div>

            {/* ── Quick Prompts Floating Ribbon ── */}
            <div className="ai-prompts-ribbon">
              <span className="ribbon-title">💡 Quick Voice:</span>
              <div className="ribbon-scroll">
                {samplePrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="ai-ribbon-chip"
                    onClick={() => executeCommand(prompt, false)}
                  >
                    🎙️ {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Chat Input & Mic Bar ── */}
            <div className="ai-chat-input-bar">
              <button
                type="button"
                className={`ai-mic-trigger-btn ${isListening ? 'mic-trigger--active' : ''}`}
                onClick={toggleListening}
                title={isListening ? 'Click to stop listening' : 'Click to speak products'}
                aria-label="Toggle Microphone"
              >
                <span className="mic-btn-icon">{isListening ? '⏹️' : '🎙️'}</span>
                <span className="mic-btn-pulse" />
              </button>

              <form className="ai-text-form" onSubmit={handleTextSubmit}>
                <input
                  type="text"
                  className="ai-chat-text-input"
                  placeholder={
                    lang === 'ta'
                      ? 'பொருட்களை குரல் மூலமாகவோ அல்லது தட்டச்சு செய்தோ சேர்க்கலாம்...'
                      : 'Speak or type items (e.g., Add 2kg Tomato, 1kg Onion and 500g Beans)...'
                  }
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                />
                <button
                  type="submit"
                  className="btn btn-primary ai-chat-send-btn"
                  disabled={!textInput.trim()}
                >
                  <span>Send</span>
                  <span className="send-arrow">➔</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

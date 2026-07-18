import { api } from '../services/api.js';
import { toast } from '../components/toast.js';

let activeLanguage = 'en';
let activeVoiceOutput = localStorage.getItem('activeVoiceOutput') !== 'false';
let isVoiceRecording = false;
let speechRecognitionInstance = null;

const LANG_CONFIG = {
  en: { name: 'English', voice: 'en-US', welcome: 'Hello! I am your FIFA Stadium AI Assistant. How can I help you manage MetLife Stadium today?', system: 'You are the official FIFA World Cup 2026 Stadium Operations AI Co-pilot. Respond directly, concisely, and professionally in English.' },
  es: { name: 'Español (Spanish)', voice: 'es-ES', welcome: '¡Hola! Soy tu asistente de IA de operaciones de la Copa Mundial. ¿Cómo puedo ayudarte a gestionar el estadio hoy?', system: 'You are the official FIFA World Cup 2026 Stadium Operations AI Co-pilot. Respond directly, concisely, and professionally in Spanish.' },
  fr: { name: 'Français (French)', voice: 'fr-FR', welcome: 'Bonjour! Je suis votre co-pilote IA des opérations du stade de la Coupe du Monde. Comment puis-je vous aider aujourd\'hui?', system: 'You are the official FIFA World Cup 2026 Stadium Operations AI Co-pilot. Respond directly, concisely, and professionally in French.' },
  hi: { name: 'हिन्दी (Hindi)', voice: 'hi-IN', welcome: 'नमस्ते! मैं आपका फीफा स्टेडियम संचालन एआई को-पायलट हूं। आज मैं आपकी क्या सहायता कर सकता हूं?', system: 'You are the official FIFA World Cup 2026 Stadium Operations AI Co-pilot. Respond directly, concisely, and professionally in Hindi.' },
  ta: { name: 'தமிழ் (Tamil)', voice: 'ta-IN', welcome: 'வணக்கம்! நான் உங்கள் பிபா மைதான செயல்பாட்டு ஏஐ உதவியாளர். இன்று உங்களுக்கு எவ்வாறு உதவ முடியும்?', system: 'You are the official FIFA World Cup 2026 Stadium Operations AI Co-pilot. Respond directly, concisely, and professionally in Tamil.' }
};

const FAQ_SHORTCUTS = {
  en: [
    { label: 'Where is Ticketing support?', query: 'Where is the ticketing help desk located?' },
    { label: 'How to reach the Metro platform?', query: 'Explain how to walk to the NJ Transit Metro platforms.' },
    { label: 'How is general parking occupancy looking?', query: 'What is the current parking occupancy in Zone B?' },
    { label: 'Report a medical emergency call', query: 'Report emergency medical heat exhaustion at Section 104.' }
  ],
  es: [
    { label: '¿Dónde está el soporte de boletos?', query: '¿Dónde se encuentra la mesa de ayuda de boletería?' },
    { label: '¿Cómo llegar a la plataforma del metro?', query: 'Explique cómo caminar hacia las plataformas del metro NJ Transit.' },
    { label: '¿Cómo se ve la ocupación del estacionamiento?', query: '¿Cuál es la ocupación actual del estacionamiento en la Zona B?' },
    { label: 'Reportar una emergencia médica', query: 'Reportar emergencia médica por agotamiento de calor en la Sección 104.' }
  ],
  fr: [
    { label: 'Où se trouve le support billetterie?', query: 'Où se trouve le bureau d\'assistance de billetterie?' },
    { label: 'Comment rejoindre le quai du métro?', query: 'Expliquez comment marcher jusqu\'aux quais du métro NJ Transit.' },
    { label: 'Où en est le parking général?', query: 'Quelle est l\'occupation actuelle du parking de la zone B?' },
    { label: 'Signaler une urgence médicale', query: 'Signaler un épuisement par la chaleur dans la section 104.' }
  ],
  hi: [
    { label: 'टिकट सहायता केंद्र कहां है?', query: 'टिकट सहायता डेस्क कहां स्थित है?' },
    { label: 'मेट्रो प्लेटफॉर्म तक कैसे पहुंचे?', query: 'एनजे ट्रांजिट मेट्रो प्लेटफॉर्म तक पैदल चलने का मार्ग बताएं।' },
    { label: 'सामान्य पार्किंग की क्या स्थिति है?', query: 'ज़ोन बी में वर्तमान पार्किंग अधिभोग दर क्या है?' },
    { label: 'एक चिकित्सा आपातकाल रिपोर्ट करें', query: 'धारा 104 में गर्मी से थकावट के चिकित्सा आपातकाल की रिपोर्ट करें।' }
  ],
  ta: [
    { label: 'டிக்கெட் உதவி மையம் எங்கே உள்ளது?', query: 'டிக்கெட் உதவி மையம் எங்கு அமைந்துள்ளது?' },
    { label: 'மெட்ரோ ரயில் நிலையத்திற்கு எவ்வாறு செல்வது?', query: 'மெட்ரோ தளத்திற்கு செல்லும் வழியை விளக்குங்கள்.' },
    { label: 'பொது வாகன நிறுத்துமிடம் எவ்வாறு உள்ளது?', query: 'மண்டலம் பியில் தற்போதைய வாகன நிறுத்துமிட நிலை என்ன?' },
    { label: 'மருத்துவ அவசரநிலையை அறிவிக்கவும்', query: 'பிரிவு 104 இல் வெப்ப சோர்வு காரணமாக அவசர மருத்துவ அழைப்பை அறிவிக்கவும்.' }
  ]
};

/**
 * Initializes Module 9: Multilingual AI Assistant
 * @param {HTMLElement} container 
 */
export async function init(container) {
  container.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h1 class="h3 fw-bold mb-1" style="letter-spacing: -0.5px;">Multilingual AI Co-pilot</h1>
        <p class="text-secondary mb-0" style="font-size: 0.9rem;">Interact with the Gemini operations model using voice and text in 5 major languages</p>
      </div>
      <div>
        <span class="sportiq-badge sportiq-badge-warning" id="speech-recognition-status">Microphone Ready</span>
      </div>
    </div>

    <div class="row g-4">
      <!-- Left Column: Language Selector & FAQ Shortcuts -->
      <div class="col-xl-4">
        <!-- Language selector card -->
        <div class="sportiq-card p-4 mb-4">
          <h5 class="fw-bold mb-3" style="font-size: 0.95rem;"><i class="fa-solid fa-language text-warning me-2"></i> Voice & Language Settings</h5>
          
          <div class="mb-3">
            <label class="form-label" for="assistant-module-lang-select" style="font-size: 0.8rem; color: var(--text-secondary);">Select Target Language</label>
            <select class="form-select glass-input form-select-sm" style="font-size: 0.8rem;" id="assistant-module-lang-select">
              <option value="en" selected>English (US/UK)</option>
              <option value="es">Español (Spanish)</option>
              <option value="fr">Français (French)</option>
              <option value="hi">हिन्दी (Hindi)</option>
              <option value="ta">தமிழ் (Tamil)</option>
            </select>
          </div>

          <div class="form-check form-switch mb-3">
            <input class="form-check-input" type="checkbox" role="switch" id="voice-output-toggle" ${activeVoiceOutput ? 'checked' : ''}>
            <label class="form-check-label" for="voice-output-toggle" style="font-size: 0.8rem; color: var(--text-secondary);">Voice Output Readout (SpeechSynthesis)</label>
          </div>

          <div style="font-size: 0.7rem; color: var(--text-muted);">
            <i class="fa-solid fa-circle-info text-info me-1"></i> When voice output is enabled, the co-pilot will speak response sentences back to you out loud in the matching language dialect.
          </div>
        </div>

        <!-- FAQ shortcuts list -->
        <div class="sportiq-card p-4">
          <h5 class="fw-bold mb-3" style="font-size: 0.95rem;"><i class="fa-solid fa-clipboard-question text-primary me-2"></i> Quick FAQ Queries</h5>
          <div class="d-flex flex-column gap-2" id="faq-shortcuts-container">
            <!-- Populated based on active language -->
          </div>
        </div>
      </div>

      <!-- Right Column: Chat Console -->
      <div class="col-xl-8">
        <div class="sportiq-card p-4 d-flex flex-column" style="height: 520px;">
          <h5 class="fw-bold mb-3 text-start" style="font-size: 0.95rem;"><i class="fa-solid fa-comments text-info me-2"></i> Co-pilot Communications Console</h5>
          
          <!-- Message logs body -->
          <div class="flex-grow-1 overflow-y-auto px-2 py-3 mb-3 border rounded d-flex flex-column gap-3" id="module-chat-messages-container" style="background: rgba(0,0,0,0.15); border-color: var(--border-color) !important;">
            <!-- Render messages dynamic -->
          </div>

          <!-- Input bar -->
          <div class="input-group">
            <input type="text" class="form-control glass-input" style="font-size: 0.85rem; border-radius: var(--border-radius-sm) 0 0 var(--border-radius-sm);" placeholder="Speak or type co-pilot instructions..." id="module-chat-text-input" aria-label="Speech transcription chat message text input">
            <button class="btn btn-outline-secondary glass-input px-3" style="border-radius: 0;" type="button" id="module-chat-voice-btn" title="Voice Input" aria-label="Speech recognition voice input"><i class="fa-solid fa-microphone" id="module-mic-icon"></i></button>
            <button class="btn btn-warning fw-bold px-4" style="font-size: 0.85rem; border-radius: 0 var(--border-radius-sm) var(--border-radius-sm) 0;" type="button" id="module-chat-send-btn" aria-label="Send message">Send</button>
          </div>
        </div>
      </div>
    </div>
  `;

  _bindActions();
  _initWebSpeechRecognition();
  _updateLanguageState();
}

/**
 * Updates variables on lang change
 */
function _updateLanguageState() {
  const config = LANG_CONFIG[activeLanguage];
  
  // Set welcome message
  const msgContainer = document.getElementById('module-chat-messages-container');
  if (msgContainer) {
    msgContainer.innerHTML = `
      <div class="chat-bubble ai animate-fade-in" style="align-self: flex-start; background: rgba(255,255,255,0.04); border: 1px solid var(--border-color); border-bottom-left-radius: 4px; padding: 12px 16px; font-size:0.8rem; max-width:80%;">
        ${config.welcome}
      </div>
    `;
    msgContainer.scrollTop = msgContainer.scrollHeight;
  }

  // Populate FAQ Shortcuts
  const faqContainer = document.getElementById('faq-shortcuts-container');
  if (faqContainer) {
    const list = FAQ_SHORTCUTS[activeLanguage] || FAQ_SHORTCUTS['en'];
    faqContainer.innerHTML = list.map(item => `
      <button class="btn btn-sm text-start py-2 px-3 fw-bold faq-btn" data-query="${item.query}" style="font-size: 0.75rem; border-radius: var(--border-radius-sm);">
        <i class="fa-solid fa-chevron-right text-muted me-2"></i> ${item.label}
      </button>
    `).join('');

    // Bind clicks
    faqContainer.querySelectorAll('.faq-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const query = e.currentTarget.getAttribute('data-query');
        document.getElementById('module-chat-text-input').value = query;
        _sendMessage();
      });
    });
  }
}

/**
 * Initializes browser SpechRecognition
 */
function _initWebSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const statusBadge = document.getElementById('speech-recognition-status');

  if (SpeechRecognition) {
    speechRecognitionInstance = new SpeechRecognition();
    speechRecognitionInstance.continuous = false;
    speechRecognitionInstance.interimResults = false;

    speechRecognitionInstance.onstart = () => {
      isVoiceRecording = true;
      const micIcon = document.getElementById('module-mic-icon');
      if (micIcon) micIcon.className = 'fa-solid fa-microphone-slash text-danger animate-pulse';
      if (statusBadge) {
        statusBadge.textContent = 'Listening...';
        statusBadge.className = 'sportiq-badge sportiq-badge-danger';
      }
      toast.show('info', 'Microphone Active', 'Speak your operations request now.');
    };

    speechRecognitionInstance.onend = () => {
      isVoiceRecording = false;
      const micIcon = document.getElementById('module-mic-icon');
      if (micIcon) micIcon.className = 'fa-solid fa-microphone';
      if (statusBadge) {
        statusBadge.textContent = 'Microphone Ready';
        statusBadge.className = 'sportiq-badge sportiq-badge-warning';
      }
    };

    speechRecognitionInstance.onresult = (e) => {
      const trans = e.results[0][0].transcript;
      const input = document.getElementById('module-chat-text-input');
      if (input) {
        input.value = trans;
        _sendMessage();
      }
    };

    speechRecognitionInstance.onerror = (e) => {
      console.error('Speech Recognition Error:', e.error);
      if (e.error === 'not-allowed') {
        toast.show('danger', 'Microphone Blocked', 'Please allow microphone access in your browser settings bar.');
      } else if (e.error === 'no-speech') {
        toast.show('warning', 'No Speech Detected', 'No voice detected. Please try speaking again.');
      } else {
        toast.show('danger', 'Voice Error', `Speech recognition error: ${e.error}`);
      }
    };
  } else {
    if (statusBadge) {
      statusBadge.textContent = 'Voice Input Mocked';
    }
  }
}

/**
 * Speech recognition microphone toggler
 */
function _toggleVoiceRecording() {
  if (!speechRecognitionInstance) {
    // Mock transcription fallback
    toast.show('info', 'Microphone Mock', 'Transcribing preset question...');
    setTimeout(() => {
      const input = document.getElementById('module-chat-text-input');
      const sampleQueries = FAQ_SHORTCUTS[activeLanguage] || FAQ_SHORTCUTS['en'];
      if (input) {
        input.value = sampleQueries[0].query;
        _sendMessage();
      }
    }, 1500);
    return;
  }

  if (isVoiceRecording) {
    speechRecognitionInstance.stop();
  } else {
    speechRecognitionInstance.lang = LANG_CONFIG[activeLanguage].voice;
    speechRecognitionInstance.start();
  }
}

/**
 * Voice output SpeechSynthesis read-out
 */
function _speakResponseText(text) {
  if (!activeVoiceOutput) return;

  // Cancel any ongoing speeches
  window.speechSynthesis?.cancel();

  const config = LANG_CONFIG[activeLanguage];
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = config.voice;
  
  // Set voice pitch/rate slightly
  utter.rate = 1.0;
  utter.pitch = 1.0;

  window.speechSynthesis?.speak(utter);
}

/**
 * Submits message to co-pilot
 */
async function _sendMessage() {
  const input = document.getElementById('module-chat-text-input');
  if (!input) return;

  const text = input.value.trim();
  if (!text) return;

  // Append user bubble
  _appendBubble('user', text);
  input.value = '';

  const msgContainer = document.getElementById('module-chat-messages-container');
  const typingId = _appendTypingIndicator();

  try {
    const config = LANG_CONFIG[activeLanguage];
    const prompt = `[Request language is ${config.name}]. User prompt: ${text}`;
    const systemInstruction = config.system;
    
    const reply = await api.callGemini(prompt, systemInstruction);
    _removeTypingIndicator(typingId);
    
    // Append AI bubble
    _appendBubble('ai', reply);

    // Speak response out loud
    _speakResponseText(reply);

  } catch (err) {
    _removeTypingIndicator(typingId);
    const errText = activeLanguage === 'es' ? 'Error al contactar con el copiloto.' : 'Error contacting co-pilot.';
    _appendBubble('ai', errText);
  }
}

function _appendBubble(sender, text) {
  const container = document.getElementById('module-chat-messages-container');
  if (!container) return;

  const isUser = sender === 'user';
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${sender} animate-fade-in`;
  
  // Choose bubble styling
  Object.assign(bubble.style, {
    alignSelf: isUser ? 'flex-end' : 'flex-start',
    background: isUser ? 'var(--accent-blue)' : 'rgba(255,255,255,0.04)',
    border: isUser ? 'none' : '1px solid var(--border-color)',
    color: isUser ? '#000' : 'var(--text-primary)',
    fontWeight: isUser ? '500' : 'normal',
    padding: '12px 16px',
    borderRadius: 'var(--border-radius-md)',
    fontSize: '0.8rem',
    maxWidth: '80%',
    lineHeight: '1.45'
  });
  if (isUser) bubble.style.borderBottomRightRadius = '4px';
  else bubble.style.borderBottomLeftRadius = '4px';

  bubble.textContent = text;
  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
}

function _appendTypingIndicator() {
  const container = document.getElementById('module-chat-messages-container');
  if (!container) return '';

  const id = 'typing_' + Date.now();
  const bubble = document.createElement('div');
  bubble.id = id;
  bubble.className = 'chat-bubble ai animate-fade-in d-flex gap-1 align-items-center';
  Object.assign(bubble.style, {
    alignSelf: 'flex-start',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--border-color)',
    padding: '12px 16px',
    borderRadius: 'var(--border-radius-md)',
    borderBottomLeftRadius: '4px',
    fontSize: '0.8rem',
    maxWidth: '80%'
  });
  
  bubble.innerHTML = `
    <div class="spinner-grow spinner-grow-sm text-warning" style="width: 6px; height: 6px;" role="status"></div>
    <div class="spinner-grow spinner-grow-sm text-warning" style="width: 6px; height: 6px; animation-delay: 0.2s;" role="status"></div>
    <div class="spinner-grow spinner-grow-sm text-warning" style="width: 6px; height: 6px; animation-delay: 0.4s;" role="status"></div>
  `;
  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
  return id;
}

function _removeTypingIndicator(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

/**
 * Binds actions to controls
 */
function _bindActions() {
  // Bind Send Clicks
  document.getElementById('module-chat-send-btn')?.addEventListener('click', _sendMessage);
  document.getElementById('module-chat-text-input')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') _sendMessage();
  });

  // Bind Mic Toggle
  document.getElementById('module-chat-voice-btn')?.addEventListener('click', _toggleVoiceRecording);

  // Bind Lang select
  document.getElementById('assistant-module-lang-select')?.addEventListener('change', (e) => {
    activeLanguage = e.target.value;
    _updateLanguageState();
    toast.show('info', 'Language Changed', `AI System instructed in ${LANG_CONFIG[activeLanguage].name}`);
  });

  // Bind Speech Toggle
  document.getElementById('voice-output-toggle')?.addEventListener('change', (e) => {
    activeVoiceOutput = e.target.checked;
    localStorage.setItem('activeVoiceOutput', activeVoiceOutput);
    if (!activeVoiceOutput) {
      window.speechSynthesis?.cancel();
    }
    toast.show('info', 'Voice Readout Changed', `SpeechSynthesis set to ${activeVoiceOutput}`);
  });
}

/**
 * Stop speech when leaving
 */
export function destroy() {
  window.speechSynthesis?.cancel();
}

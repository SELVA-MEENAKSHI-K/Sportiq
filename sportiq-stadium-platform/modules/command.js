import { api } from '../services/api.js';
import { toast } from '../components/toast.js';

let commandHistory = [];
let activeIncidentPreset = 'gate_surge';
let isCommandRecording = false;
let commandSpeechRecognition = null;

const SITUATION_PRESETS = {
  gate_surge: "Gate 2 crowd is increasing rapidly. Wait times have hit 28 minutes and fans are pushing against security barriers. What should we do?",
  heat_sec104: "A spectator has collapsed in Section 104 showing symptoms of severe heat exhaustion. Concourse tunnel A is congested. Dispatch medical units.",
  parking_gridlock: "Zone A parking lot is 96% full and vehicles are backing up onto the main stadium approach road. Gridlock warning. How do we divert incoming traffic?",
  scanner_outage: "Ticket scanner readers at Gate 4 have suffered a network outage and stopped reading barcode IDs. Gates are backing up. Provide response steps."
};

/**
 * Initializes Module 12: AI Command Center (Flagship Module)
 * @param {HTMLElement} container 
 */
export async function init(container) {
  container.innerHTML = `
    <!-- Top Stats Row -->
    <div class="row g-4 mb-4">
      <!-- Left HUD: Stadium Health Score Dial -->
      <div class="col-lg-4 col-xl-3 animate-fade-in">
        <div class="sportiq-card text-center d-flex flex-column align-items-center justify-content-center" style="height: 310px; border: 1px solid rgba(34,197,94,0.35); background: linear-gradient(135deg, var(--bg-card) 75%, rgba(34,197,94,0.03) 100%);">
          <span class="text-muted fw-bold mb-3" style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px;">Live Stadium Health</span>
          
          <!-- Circular SVG Health Dial -->
          <div class="position-relative d-flex align-items-center justify-content-center" style="width: 140px; height: 140px;">
            <svg width="140" height="140" viewBox="0 0 140 140">
              <circle cx="70" cy="70" r="58" stroke="var(--border-color)" stroke-width="8" fill="transparent"/>
              <circle cx="70" cy="70" r="58" stroke="#22C55E" stroke-width="8" fill="transparent" 
                      stroke-dasharray="364.4" stroke-dashoffset="21.8" 
                      style="transform: rotate(-90deg); transform-origin: 70px 70px; transition: stroke-dashoffset 1s ease-in-out; filter: drop-shadow(0 0 8px rgba(34,197,94,0.4));"/>
            </svg>
            <div class="position-absolute text-center">
              <div style="font-size: 2.2rem; font-weight: 800; color: var(--text-primary); line-height: 1.1;">94<span style="font-size:1.1rem; font-weight:700; color:var(--text-secondary);">%</span></div>
              <div style="font-size: 0.65rem; color: var(--accent-green); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Optimal State</div>
            </div>
          </div>
          
          <div class="text-muted mt-3" style="font-size: 0.7rem; line-height: 1.3;">Real-time safety sensors check index.</div>
        </div>
      </div>

      <!-- Center HUD: Threat Radar and Environmental Telemetry -->
      <div class="col-lg-8 col-xl-6 animate-fade-in" style="animation-delay: 0.05s;">
        <div class="sportiq-card" style="height: 310px;">
          <h5 class="fw-bold mb-4" style="font-size: 0.9rem;"><i class="fa-solid fa-satellite-dish text-primary me-2"></i> Operational Threat Assessment</h5>
          
          <div class="row g-3">
            <!-- Threat Level Meter -->
            <div class="col-md-6">
              <div class="p-3 border rounded mb-3" style="border-color: var(--border-color) !important; background: var(--bg-secondary);">
                <div style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Threat Level Status</div>
                <div class="d-flex align-items-center gap-3 mt-2">
                  <span class="sportiq-badge sportiq-badge-warning animate-pulse" style="font-size:0.85rem; padding: 4px 14px;">MODERATE RISK</span>
                  <span class="text-muted" style="font-size:0.75rem;">Gate 2 Queue surge</span>
                </div>
              </div>
              
              <div style="font-size:0.75rem; color:var(--text-secondary);" class="mt-2">
                <i class="fa-solid fa-circle-nodes text-primary me-1"></i> Connected to 48 operations nodes.
              </div>
            </div>

            <!-- Weather & Climate Sensors -->
            <div class="col-md-6">
              <div class="p-3 border rounded" style="border-color: var(--border-color) !important; background: var(--bg-secondary);">
                <div style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Environmental Climate Sensors</div>
                <div class="d-flex align-items-center justify-content-between mt-2">
                  <div>
                    <div style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary);">29°C</div>
                    <div style="font-size: 0.65rem; color: var(--text-secondary);">Clear Sky • Dry Pitches</div>
                  </div>
                  <i class="fa-solid fa-cloud-sun text-warning" style="font-size: 2rem; opacity: 0.65;"></i>
                </div>
              </div>
              <div class="mt-3 p-2 rounded" style="background: rgba(34,197,94,0.06); border: 1px solid rgba(34,197,94,0.15); font-size: 0.7rem; color: var(--accent-green);">
                <i class="fa-solid fa-circle-check me-1"></i> No weather operational delay alerts predicted.
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right HUD: Tactical History Logger -->
      <div class="col-lg-12 col-xl-3 animate-fade-in" style="animation-delay: 0.1s;">
        <div class="sportiq-card" style="height: 310px; display: flex; flex-direction: column;">
          <h5 class="fw-bold mb-3" style="font-size: 0.9rem;"><i class="fa-solid fa-list-ul text-secondary me-2"></i> Command Logs</h5>
          <div class="flex-grow-1 overflow-y-auto" id="tactical-history-list" style="font-size: 0.75rem;">
            <div class="text-center text-muted py-4">No active tactical directives logged.</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Interactive Operator Console & Dispatch Directives Dashboard -->
    <div class="row g-4">
      <!-- Operator Console Form -->
      <div class="col-xl-4 animate-fade-in" style="animation-delay: 0.15s;">
        <div class="sportiq-card" style="border: 1px solid rgba(239,68,68,0.25);">
          <h5 class="fw-bold mb-3" style="font-size: 0.9rem; color: var(--accent-red);"><i class="fa-solid fa-terminal me-2"></i> Tactical Incident Console</h5>
          
          <div class="mb-3">
            <label class="form-label" style="font-size: 0.75rem; color: var(--text-secondary);">Load Situation Preset</label>
            <select class="form-select glass-input form-select-sm" style="font-size: 0.8rem;" id="situation-preset-select">
              <option value="gate_surge" selected>Gate 2 Crowd Surge</option>
              <option value="heat_sec104">Section 104 Heat Exhaustion</option>
              <option value="parking_gridlock">Zone A Parking Gridlock</option>
              <option value="scanner_outage">Gate 4 Ticket Reader Outage</option>
            </select>
          </div>

          <div class="mb-3">
            <label class="form-label" style="font-size: 0.75rem; color: var(--text-secondary);">Describe MetLife Situation</label>
            <textarea class="form-control glass-input" style="font-size: 0.8rem; font-family: monospace; line-height: 1.45;" rows="6" id="command-situation-input" placeholder="Type tactical stadium situation here..."></textarea>
          </div>

          <div class="d-flex gap-2">
            <button class="btn btn-outline-secondary" type="button" id="command-voice-btn" title="Voice Input" style="border-radius: var(--border-radius-sm); border-color: var(--border-color); color: var(--text-primary);"><i class="fa-solid fa-microphone" id="command-mic-icon"></i></button>
            <button class="btn btn-danger fw-bold flex-grow-1" id="trigger-dispatch-directive-btn" style="font-size:0.85rem;"><i class="fa-solid fa-shield-halved me-1"></i> Dispatch AI Directive</button>
          </div>
        </div>
      </div>

      <!-- High-Fidelity HUD AI Card Display Area -->
      <div class="col-xl-8 animate-fade-in" style="animation-delay: 0.2s;">
        <div id="command-hud-display-zone">
          <div class="sportiq-card text-center d-flex flex-column align-items-center justify-content-center" style="height: 382px; border: 1px dashed var(--border-color);">
            <i class="fa-solid fa-network-wired mb-3 text-muted" style="font-size: 3.5rem; opacity: 0.2;"></i>
            <h5 class="fw-bold mb-2">Tactical HUD Waiting</h5>
            <p class="text-secondary mx-auto mb-0" style="font-size: 0.8rem; max-width: 440px; line-height: 1.45;">
              Input stadium reports in the situation console. Gemini will compile a parsed JSON operations co-pilot card containing response checklists, personnel redeployments, and public announcement scripts.
            </p>
          </div>
        </div>
      </div>
    </div>
  `;

  _bindActions();
  _loadPresetText();
  _initVoiceSystem();
}

/**
 * Loads selected preset text
 */
function _loadPresetText() {
  const select = document.getElementById('situation-preset-select');
  const textarea = document.getElementById('command-situation-input');
  if (select && textarea) {
    textarea.value = SITUATION_PRESETS[activeIncidentPreset];
  }
}

/**
 * Initializes voice microphone speech recognition
 */
function _initVoiceSystem() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    commandSpeechRecognition = new SpeechRecognition();
    commandSpeechRecognition.continuous = false;
    commandSpeechRecognition.interimResults = false;

    commandSpeechRecognition.onstart = () => {
      isCommandRecording = true;
      const icon = document.getElementById('command-mic-icon');
      if (icon) icon.className = 'fa-solid fa-microphone-slash text-danger animate-pulse';
      toast.show('info', 'Microphone Listening', 'Speak stadium incident details clearly.');
    };

    commandSpeechRecognition.onend = () => {
      isCommandRecording = false;
      const icon = document.getElementById('command-mic-icon');
      if (icon) icon.className = 'fa-solid fa-microphone';
    };

    commandSpeechRecognition.onresult = (e) => {
      const trans = e.results[0][0].transcript;
      const text = document.getElementById('command-situation-input');
      if (text) {
        text.value = trans;
        _dispatchDirective();
      }
    };
  }
}

/**
 * Microphone triggers
 */
function _toggleVoiceInput() {
  if (!commandSpeechRecognition) {
    toast.show('info', 'Speech Mocked', 'Transcribing preset details...');
    setTimeout(() => {
      const text = document.getElementById('command-situation-input');
      if (text) {
        text.value = SITUATION_PRESETS[activeIncidentPreset];
        _dispatchDirective();
      }
    }, 1500);
    return;
  }

  if (isCommandRecording) {
    commandSpeechRecognition.stop();
  } else {
    commandSpeechRecognition.start();
  }
}

/**
 * Submits situation to Gemini
 */
async function _dispatchDirective() {
  const input = document.getElementById('command-situation-input');
  const hudZone = document.getElementById('command-hud-display-zone');

  if (!input || !hudZone) return;

  const situation = input.value.trim();
  if (!situation) {
    alert('Please enter stadium details first.');
    return;
  }

  hudZone.innerHTML = `
    <div class="sportiq-card d-flex flex-column justify-content-center align-items-center" style="height: 382px; border-color: var(--accent-blue);">
      <div class="d-flex align-items-center gap-2 mb-3 text-primary">
        <i class="fa-solid fa-wand-magic-sparkles fa-spin text-warning" style="font-size: 1.3rem;"></i>
        <h5 class="fw-bold mb-0">Sportiq Tactical co-pilot compiling crisis parameters...</h5>
      </div>
      <div class="skeleton-loading mb-2" style="height: 10px; width: 60%;"></div>
      <div class="skeleton-loading mb-2" style="height: 10px; width: 50%;"></div>
      <div class="skeleton-loading" style="height: 10px; width: 30%;"></div>
    </div>
  `;

  try {
    const prompt = `
Act as the MetLife Arena tactical operations director co-pilot.
Situation Reported: "${situation}"

Format your response STRICTLY as a valid JSON object matching this schema:
{
  "situationSummary": "A concise single-sentence summary of the incident",
  "rootCause": "Direct operational cause",
  "riskLevel": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  "recommendedActions": ["Action 1", "Action 2", "Action 3"],
  "staffAllocation": "Staff redeployment instructions (E.g. Move 2 volunteers...)",
  "gateRecommendations": "Gate open/close routing rules",
  "publicAnnouncement": "Script to read over PA system in quotes",
  "expectedImpact": "Analytical projected safety outcomes",
  "estimatedResolutionTime": "15 mins"
}

Provide ONLY the raw JSON block without markdown wrappers. Ensure keys match precisely.
`;
    const systemInstruction = "You are the FIFA Stadium Tactical Command Specialist. You communicate strictly in clean JSON variables containing operational parameters.";
    
    const reply = await api.callGemini(prompt, systemInstruction);

    let data;
    try {
      const cleanJson = reply.replace(/```json/g, '').replace(/```/g, '').trim();
      data = JSON.parse(cleanJson);
    } catch (e) {
      console.warn('JSON parsing failed, falling back to regex parser.', e);
      data = _parseTextFallback(reply);
    }

    _renderCommandHUD(data);
    _logHistory(data);

    toast.show('danger', 'AI Directive Dispatched', `Crisis response checklist compiled. Risk Level: ${data.riskLevel}`);

  } catch (err) {
    hudZone.innerHTML = `
      <div class="sportiq-card text-center text-warning" style="border:1px solid var(--accent-orange);">
        <i class="fa-solid fa-triangle-exclamation mb-3" style="font-size: 3rem;"></i>
        <h5>Command links offline.</h5>
        <div style="font-size: 0.75rem;" class="mt-2 text-secondary">
          <strong>Recommended Crisis Action (Offline Fallback):</strong> Manually open auxiliary gates, dispatch nearby volunteer patrols, and verify ticket scanners networks loops.
        </div>
      </div>
    `;
  }
}

/**
 * Fallback parser
 */
function _parseTextFallback(text) {
  return {
    situationSummary: text.substring(0, 100) + '...',
    rootCause: 'Manual bypass logs.',
    riskLevel: 'HIGH',
    recommendedActions: ['Direct staff sweeps to crisis sector', 'Open auxiliary exit portals', 'Notify stadium safety marshalls'],
    staffAllocation: 'Deploy nearest checked-in patrols.',
    gateRecommendations: 'Verify exit lanes clear.',
    publicAnnouncement: 'Please follow local safety guides.',
    expectedImpact: 'Mitigation of bottlenecks.',
    estimatedResolutionTime: '15 mins'
  };
}

/**
 * Draws the parsed tactical directive card
 */
function _renderCommandHUD(data) {
  const hudZone = document.getElementById('command-hud-display-zone');
  if (!hudZone) return;

  // HTML Escaper for dynamic data fields
  function escape(text) {
    if (!text) return '';
    return text.toString()
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  const sSummary = escape(data.situationSummary);
  const rCause = escape(data.rootCause);
  const sAlloc = escape(data.staffAllocation);
  const gRecs = escape(data.gateRecommendations);
  const pAnnounce = escape(data.publicAnnouncement);
  const riskLvl = escape(data.riskLevel);
  const expImpact = escape(data.expectedImpact);
  const estResTime = escape(data.estimatedResolutionTime);

  const riskClass = riskLvl === 'CRITICAL' ? 'danger' : (riskLvl === 'HIGH' ? 'warning' : 'info');
  const alertColor = riskLvl === 'CRITICAL' ? 'var(--accent-red)' : 'var(--accent-blue)';

  hudZone.innerHTML = `
    <div class="sportiq-card animate-fade-in" style="border: 1px solid ${alertColor}; box-shadow: 0 0 25px rgba(37,99,235,0.06); background: linear-gradient(135deg, var(--bg-card) 85%, rgba(37,99,235,0.02) 100%);">
      <div class="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom" style="border-color: var(--border-color) !important;">
        <div class="d-flex align-items-center gap-2">
          <i class="fa-solid fa-tower-observation text-danger animate-pulse" style="font-size: 1.15rem;"></i>
          <span class="fw-bold" style="font-size:0.9rem; text-transform:uppercase; letter-spacing:0.5px;">Sportiq Tactical Directive</span>
        </div>
        <span class="sportiq-badge sportiq-badge-${riskClass} animate-pulse" style="font-weight:800;">
          RISK: ${riskLvl}
        </span>
      </div>

      <div class="row g-3 mb-3">
        <div class="col-md-6">
          <div class="p-3 border rounded h-100" style="border-color: var(--border-color) !important; background: var(--bg-secondary);">
            <div class="fw-bold text-muted mb-1" style="font-size:0.7rem; text-transform:uppercase;">Situation Briefing</div>
            <p class="mb-0" style="font-size:0.75rem; color: var(--text-primary); line-height:1.45;">${sSummary}</p>
          </div>
        </div>
        <div class="col-md-6">
          <div class="p-3 border rounded h-100" style="border-color: var(--border-color) !important; background: var(--bg-secondary);">
            <div class="fw-bold text-muted mb-1" style="font-size:0.7rem; text-transform:uppercase;">Diagnosis</div>
            <p class="mb-0" style="font-size:0.75rem; color: var(--text-secondary); line-height:1.45;">${rCause}</p>
          </div>
        </div>
      </div>

      <div class="p-3 border rounded mb-3" style="border-color: var(--border-color) !important; background: var(--bg-secondary);">
        <div class="fw-bold text-warning mb-2" style="font-size:0.75rem; text-transform:uppercase;"><i class="fa-solid fa-list-check me-1"></i> Tactical Response Checklist</div>
        <div class="d-flex flex-column gap-2" id="tactical-checklist-container">
          ${(data.recommendedActions || []).map((action, idx) => `
            <div class="form-check">
              <input class="form-check-input command-check" type="checkbox" id="check-${idx}">
              <label class="form-check-label" for="check-${idx}" style="font-size:0.75rem; color: var(--text-secondary); cursor:pointer;">
                ${escape(action)}
              </label>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="row g-3 mb-3">
        <div class="col-md-6">
          <div class="p-3 border rounded h-100" style="border-color: var(--border-color) !important; background: var(--bg-secondary);">
            <div class="fw-bold text-info mb-1" style="font-size:0.7rem; text-transform:uppercase;"><i class="fa-solid fa-user-gear me-1"></i> Volunteer Dispatch</div>
            <p class="mb-0" style="font-size:0.75rem; color: var(--text-secondary); line-height:1.45;">${sAlloc}</p>
          </div>
        </div>
        <div class="col-md-6">
          <div class="p-3 border rounded h-100" style="border-color: var(--border-color) !important; background: var(--bg-secondary);">
            <div class="fw-bold text-primary mb-1" style="font-size:0.7rem; text-transform:uppercase;"><i class="fa-solid fa-door-open me-1"></i> Gate Directives</div>
            <p class="mb-0" style="font-size:0.75rem; color: var(--text-secondary); line-height:1.45;">${gRecs}</p>
          </div>
        </div>
      </div>

      <div class="p-3 border rounded mb-3 position-relative" style="border-color: var(--border-color) !important; background: var(--bg-secondary);">
        <div class="fw-bold text-success mb-2" style="font-size:0.75rem; text-transform:uppercase;"><i class="fa-solid fa-bullhorn me-1"></i> Public Address (PA) Broadcast Script</div>
        <blockquote class="blockquote mb-0 p-2 border-start border-success" style="font-size:0.75rem; font-style:italic; background:rgba(34,197,94,0.01); color:var(--text-primary); border-width: 3px !important;">
          "${pAnnounce}"
        </blockquote>
        <button class="btn btn-sm btn-success position-absolute" style="top:10px; right:10px; font-size:0.65rem;" id="sim-pa-btn"><i class="fa-solid fa-bullhorn me-1"></i> Play Broadcast</button>
      </div>

      <div class="d-flex flex-column flex-sm-row justify-content-between align-items-stretch align-items-sm-center gap-2 border-top pt-3" style="border-color: var(--border-color) !important;">
        <div style="font-size:0.75rem; color:var(--text-muted);">
          Expected Outcome: <strong class="text-success">${expImpact}</strong>
        </div>
        <div class="d-flex align-items-center gap-2">
          <span style="font-size:0.7rem; color:var(--text-muted);">Est. Containment Time:</span>
          <span class="badge bg-warning text-dark fw-bold px-3 py-1" style="font-size:0.75rem; border-radius:4px;"><i class="fa-regular fa-clock me-1"></i> ${estResTime}</span>
        </div>
      </div>
    </div>
  `;

  const checks = hudZone.querySelectorAll('.command-check');
  checks.forEach(check => {
    check.addEventListener('change', () => {
      const allChecked = Array.from(checks).every(c => c.checked);
      if (allChecked) {
        toast.show('success', 'Tactical Quest Completed! +100 XP', 'All tactical command actions completed. Operations restored. Level Up progress updated!');
      }
    });
  });

  document.getElementById('sim-pa-btn')?.addEventListener('click', () => {
    toast.show('success', 'PA Broadcast Transmitted', 'Audio warning broadcasted across MetLife stadium speaker arrays.');
  });
}

/**
 * Log commands history
 */
function _logHistory(directive) {
  commandHistory.unshift({
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    summary: directive.situationSummary,
    risk: directive.riskLevel
  });

  const listEl = document.getElementById('tactical-history-list');
  if (listEl) {
    listEl.innerHTML = commandHistory.map(h => `
      <div class="p-2 border-bottom d-flex justify-content-between align-items-start animate-fade-in" style="border-color: var(--border-color) !important;">
        <div>
          <div class="fw-bold text-secondary" style="font-size:0.72rem; line-height: 1.3;">${h.summary}</div>
          <div style="font-size:0.62rem; color:var(--text-muted); margin-top:2px;">Dispatched at ${h.time}</div>
        </div>
        <span class="sportiq-badge sportiq-badge-${h.risk === 'CRITICAL' || h.risk === 'HIGH' ? 'danger' : 'warning'}" style="scale: 0.85; margin-left:8px;">${h.risk}</span>
      </div>
    `).join('');
  }
}

/**
 * Binds events to controls
 */
function _bindActions() {
  document.getElementById('situation-preset-select')?.addEventListener('change', (e) => {
    activeIncidentPreset = e.target.value;
    _loadPresetText();
    toast.show('info', 'Command Preset Loaded', 'Incident details loaded in situations console.');
  });

  document.getElementById('trigger-dispatch-directive-btn')?.addEventListener('click', _dispatchDirective);
  document.getElementById('command-voice-btn')?.addEventListener('click', _toggleVoiceInput);
}

export function destroy() {
  commandHistory = [];
}

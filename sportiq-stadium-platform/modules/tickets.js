import { firebase } from '../services/firebase.js';
import { api } from '../services/api.js';
import { toast } from '../components/toast.js';

let unsubscribeTickets = null;
let currentGate = 'Gate A';
let allowVipAtGate = false;
let selectedTicketPreset = 'valid_ga';

const TICKET_PRESETS = {
  valid_ga: { ticketId: 'TCK-2026-A1X', holder: 'John Doe', assignedGate: 'Gate A', vip: false, mockStatus: 'valid' },
  valid_vip: { ticketId: 'TCK-2026-VIP7', holder: 'Prince Harry', assignedGate: 'VIP Main', vip: true, mockStatus: 'vip' },
  fake: { ticketId: 'TCK-FAKE-999', holder: 'James Bond', assignedGate: 'Gate A', vip: false, mockStatus: 'fake' },
  duplicate: { ticketId: 'TCK-DUPLICATE-333', holder: 'Mark Zuckerberg', assignedGate: 'Gate A', vip: false, mockStatus: 'duplicate' },
  gate_mismatch: { ticketId: 'TCK-GATE-444', holder: 'Bill Gates', assignedGate: 'Gate B', vip: false, mockStatus: 'mismatch' }
};

/**
 * Initializes Ticket & Entry Management Module
 * @param {HTMLElement} container 
 */
export async function init(container) {
  container.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h1 class="h3 fw-bold mb-1" style="letter-spacing: -0.5px;">Ticket & Entry Validation</h1>
        <p class="text-secondary mb-0" style="font-size: 0.9rem;">Validate fan credentials, configure local gate lanes parameters, and run investigations</p>
      </div>
      <div>
        <span class="sportiq-badge sportiq-badge-info" id="active-scanner-gate-badge">Active: Gate A</span>
      </div>
    </div>

    <div class="row g-4">
      <!-- Left Column: Scanner Simulator -->
      <div class="col-lg-5">
        <!-- Scanner Simulator Card -->
        <div class="sportiq-card mb-4">
          <h5 class="fw-bold mb-3" style="font-size: 0.9rem;"><i class="fa-solid fa-qrcode text-primary me-2"></i> Camera Scanner Simulator</h5>
          
          <!-- Mock Camera Feed -->
          <div class="position-relative overflow-hidden mb-3 border rounded" style="height: 240px; background: #000; border-color: var(--border-color) !important;">
            <!-- Laser Scan Line -->
            <div id="scanner-laser" style="position: absolute; left: 0; right: 0; height: 3px; background: rgba(37, 99, 235, 0.8); box-shadow: 0 0 10px rgba(37, 99, 235, 0.8); top: 10%; transition: top 0.05s linear;"></div>
            
            <!-- Scan target overlay -->
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 140px; height: 140px; border: 2px dashed rgba(255, 255, 255, 0.2); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
              <i class="fa-solid fa-expand text-muted" style="font-size: 5rem; opacity: 0.1;"></i>
            </div>
            
            <!-- Dynamic scan result card overlay -->
            <div id="scan-result-overlay" class="position-absolute top-0 bottom-0 start-0 end-0 d-flex flex-column align-items-center justify-content-center" style="background: rgba(7, 17, 31, 0.95); opacity: 0; pointer-events: none; transition: opacity 0.3s ease;">
              <i id="scan-result-icon" class="fa-solid mb-2" style="font-size: 2.5rem;"></i>
              <div id="scan-result-title" class="fw-bold" style="font-size: 0.95rem;"></div>
              <div id="scan-result-message" class="text-secondary mt-1 text-center px-4" style="font-size: 0.75rem;"></div>
            </div>
            
            <div style="position: absolute; bottom: 10px; left: 0; right: 0; text-align: center; font-size: 0.7rem; color: var(--text-muted);" id="scanner-standby-text">
              <i class="fa-solid fa-video me-1"></i> Scanner Feed Active
            </div>
          </div>

          <!-- Scanner controls -->
          <div class="mb-3">
            <label class="form-label" style="font-size: 0.8rem; color: var(--text-secondary);">Select Preset Ticket to Scan</label>
            <select class="form-select glass-input" style="font-size: 0.8rem;" id="scanner-preset-select">
              <option value="valid_ga">Valid GA Ticket (TCK-2026-A1X) - Holder: John Doe</option>
              <option value="valid_vip">Valid VIP Pass (TCK-2026-VIP7) - Holder: Prince Harry</option>
              <option value="fake">Fake/Forged Ticket (TCK-FAKE-999) - Holder: James Bond</option>
              <option value="duplicate">Duplicate/Scanned (TCK-DUPLICATE-333) - Holder: Mark Zuckerberg</option>
              <option value="gate_mismatch">Mismatched Gate Ticket (TCK-GATE-444) - Holder: Bill Gates (Assigned Gate B)</option>
            </select>
          </div>

          <div class="d-grid">
            <button class="btn btn-primary fw-bold py-2" id="trigger-scan-btn"><i class="fa-solid fa-expand me-2"></i> Scan Ticket Code</button>
          </div>
        </div>

        <!-- Lane Settings -->
        <div class="sportiq-card">
          <h5 class="fw-bold mb-3" style="font-size: 0.9rem;"><i class="fa-solid fa-sliders text-warning me-2"></i> Lane Configuration</h5>
          
          <div class="mb-3">
            <label class="form-label" style="font-size: 0.8rem; color: var(--text-secondary);">Current Gate Assignment</label>
            <select class="form-select glass-input" style="font-size: 0.8rem;" id="current-gate-select">
              <option value="Gate A" selected>Gate A (Main Concourse East)</option>
              <option value="Gate B">Gate B (Main Concourse West)</option>
              <option value="Gate C">Gate C (North Plaza)</option>
              <option value="VIP Main">VIP Main Entrance (South Suites)</option>
            </select>
          </div>

          <div class="form-check form-switch mb-3">
            <input class="form-check-input" type="checkbox" role="switch" id="allow-vip-toggle">
            <label class="form-check-label" for="allow-vip-toggle" style="font-size: 0.8rem; color: var(--text-secondary);">Allow VIP entry at this General Gate</label>
          </div>

          <div style="font-size: 0.7rem; color: var(--text-muted);">
            <i class="fa-solid fa-circle-info text-info me-1"></i> Toggling settings updates gate rules instantly. VIP Passes scanned at general gates will generate mismatch alerts unless VIP entry is allowed.
          </div>
        </div>
      </div>

      <!-- Right Column: Database Logs & AI Investigator -->
      <div class="col-lg-7">
        <!-- Gemini Investigator Panel -->
        <div id="rejection-investigator-container" class="mb-4">
          <div class="sportiq-card text-center py-4" style="background: rgba(255,255,255,0.015); border: 1px dashed var(--border-color);">
            <div class="d-flex align-items-center justify-content-center gap-2 mb-2 text-primary">
              <i class="fa-solid fa-wand-magic-sparkles text-primary animate-pulse" style="font-size: 1.15rem; filter: drop-shadow(0 0 4px var(--accent-blue));"></i>
              <h5 class="fw-bold mb-0" style="font-size: 0.9rem;">Gemini Ticket Rejection Investigator</h5>
            </div>
            <p class="text-secondary mb-0 mx-auto" style="font-size: 0.8rem; max-width: 440px; line-height: 1.45;">
              If a credential scan fails, select <strong class="text-warning">Investigate</strong> in the logs table. Gemini will run threat analysis and return step-by-step resolution checklists.
            </p>
          </div>
        </div>

        <!-- Logs database -->
        <div class="sportiq-card">
          <div class="d-flex flex-column flex-sm-row justify-content-between align-items-stretch align-items-sm-center gap-2 mb-3">
            <h5 class="fw-bold mb-0" style="font-size: 0.9rem;">Gate Access Log</h5>
            
            <div class="d-flex gap-2">
              <select class="form-select form-select-sm glass-input" style="font-size: 0.75rem; width: auto;" id="log-filter-status">
                <option value="all">All Scans</option>
                <option value="validated">Success Entries</option>
                <option value="rejected">Rejections</option>
              </select>
            </div>
          </div>

          <div class="mb-3">
            <div class="input-group input-group-sm">
              <span class="input-group-text glass-input" style="border-right: none; border-color: var(--border-color);"><i class="fa-solid fa-magnifying-glass text-muted"></i></span>
              <input type="text" class="form-control glass-input" style="border-left: none; border-color: var(--border-color);" placeholder="Search by Holder Name or Ticket Code..." id="log-search-input">
            </div>
          </div>

          <!-- Log Table -->
          <div class="table-responsive" style="max-height: 380px; overflow-y: auto;">
            <table class="sportiq-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Ticket / Holder</th>
                  <th>Gate Status</th>
                  <th>Status</th>
                  <th class="text-end">Actions</th>
                </tr>
              </thead>
              <tbody id="tickets-table-body">
                <!-- Populated dynamically -->
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;

  _bindActions();
  _startLaserEffect();
  _subscribeLogs();
}

/**
 * Periodically animates laser scan bar for visualization
 */
let laserTimer = null;
function _startLaserEffect() {
  const laser = document.getElementById('scanner-laser');
  if (!laser) return;
  
  let goingDown = true;
  let pos = 10;

  laserTimer = setInterval(() => {
    if (goingDown) {
      pos += 3;
      if (pos >= 90) goingDown = false;
    } else {
      pos -= 3;
      if (pos <= 10) goingDown = true;
    }
    if (laser) laser.style.top = `${pos}%`;
  }, 50);
}

/**
 * Dynamic subscription of entries list
 */
function _subscribeLogs() {
  unsubscribeTickets = firebase.subscribeCollection('tickets', (docs) => {
    _renderTable(docs);
  });
}

/**
 * Filter and search records to print table
 */
function _renderTable(docs) {
  const body = document.getElementById('tickets-table-body');
  if (!body) return;

  const searchVal = document.getElementById('log-search-input')?.value.toLowerCase() || '';
  const filterVal = document.getElementById('log-filter-status')?.value || 'all';

  const filtered = docs.filter(doc => {
    const matchesSearch = doc.holder.toLowerCase().includes(searchVal) || doc.ticketId.toLowerCase().includes(searchVal);
    const matchesFilter = filterVal === 'all' || doc.status === filterVal;
    return matchesSearch && matchesFilter;
  });

  if (filtered.length === 0) {
    body.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">No entry logs found matching queries.</td></tr>`;
    return;
  }

  filtered.sort((a, b) => {
    const timeA = a.createdAt || a.scanTime || '';
    const timeB = b.createdAt || b.scanTime || '';
    return timeB.localeCompare(timeA);
  });

  body.innerHTML = filtered.map(doc => {
    const isSuccess = doc.status === 'validated';
    let label = isSuccess ? 'Access Granted' : 'Rejected';
    let badgeClass = isSuccess ? 'success' : 'danger';
    if (doc.vip && isSuccess) {
      label = 'VIP Granted';
      badgeClass = 'info';
    }

    return `
      <tr class="animate-fade-in">
        <td>${doc.scanTime}</td>
        <td>
          <div class="fw-bold" style="color: var(--text-primary);">${doc.holder}</div>
          <div style="font-size: 0.7rem; color: var(--text-muted);">ID: <code>${doc.ticketId}</code></div>
        </td>
        <td>
          <div style="font-size: 0.75rem;">Scanned: <strong>${doc.gate}</strong></div>
          ${doc.reason ? `<div style="font-size: 0.7rem; color: var(--accent-red);"><i class="fa-solid fa-circle-exclamation me-1"></i> ${doc.reason}</div>` : `<div style="font-size: 0.7rem; color: var(--text-muted);">Assigned: ${doc.assignedGate || doc.gate}</div>`}
        </td>
        <td>
          <span class="sportiq-badge sportiq-badge-${badgeClass}">
            ${label}
          </span>
        </td>
        <td class="text-end">
          ${!isSuccess ? `
            <button class="btn btn-sm btn-outline-warning py-0 px-2 fw-bold investigate-btn" data-id="${doc.id}" style="font-size: 0.7rem; border-radius: var(--border-radius-sm);">
              <i class="fa-solid fa-magnifying-glass-chart me-1"></i> Investigate
            </button>
          ` : `<span class="text-success" style="font-size: 1.15rem;"><i class="fa-solid fa-circle-check"></i></span>`}
        </td>
      </tr>
    `;
  }).join('');

  body.querySelectorAll('.investigate-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      const record = docs.find(d => d.id === id);
      if (record) _runGeminiInvestigation(record);
    });
  });
}

/**
 * Performs ticket validation scanning logic
 */
async function _executeTicketScan() {
  const overlay = document.getElementById('scan-result-overlay');
  const icon = document.getElementById('scan-result-icon');
  const title = document.getElementById('scan-result-title');
  const message = document.getElementById('scan-result-message');
  
  if (!overlay) return;

  overlay.style.opacity = '1';
  icon.className = 'fa-solid fa-spinner fa-spin text-warning';
  title.textContent = 'Processing Barcode...';
  message.textContent = 'Comparing encryption signatures in central central database...';

  const preset = TICKET_PRESETS[selectedTicketPreset];
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  setTimeout(async () => {
    let finalStatus = 'validated';
    let finalReason = '';

    if (preset.mockStatus === 'fake') {
      finalStatus = 'rejected';
      finalReason = 'Fake Code Signature (unrecognized key)';
    } else if (preset.mockStatus === 'duplicate') {
      finalStatus = 'rejected';
      finalReason = 'Duplicate scan detected (already entered Gate B)';
    } else if (preset.mockStatus === 'mismatch' && currentGate !== preset.assignedGate) {
      finalStatus = 'rejected';
      finalReason = `Gate Mismatch (Assigned: ${preset.assignedGate})`;
    } else if (preset.vip && currentGate !== 'VIP Main' && !allowVipAtGate) {
      finalStatus = 'rejected';
      finalReason = 'VIP access restricted at General gate';
    }

    if (finalStatus === 'validated') {
      icon.className = 'fa-solid fa-circle-check text-success';
      title.textContent = preset.vip ? 'VIP ENTRY GRANTED' : 'ACCESS GRANTED';
      title.style.color = 'var(--accent-green)';
      message.textContent = `Welcome, ${preset.holder}! Enjoy the match.`;
      
      toast.show('success', 'Ticket Validated', `${preset.holder} entered via ${currentGate}`);
    } else {
      icon.className = 'fa-solid fa-circle-xmark text-danger';
      title.textContent = 'ACCESS DENIED';
      title.style.color = 'var(--accent-red)';
      message.textContent = `Reason: ${finalReason}`;
      
      toast.show('danger', 'Credential Denied', `Rejection Alert at ${currentGate}: ${finalReason}`);
    }

    await firebase.addDocument('tickets', {
      ticketId: preset.ticketId,
      holder: preset.holder,
      gate: currentGate,
      assignedGate: preset.assignedGate,
      status: finalStatus,
      reason: finalReason,
      vip: preset.vip,
      scanTime: timeStr
    });

    setTimeout(() => {
      overlay.style.opacity = '0';
    }, 2200);

  }, 1200);
}

/**
 * Triggers backend Gemini to generate Ticket Investigation report card
 */
async function _runGeminiInvestigation(ticket) {
  const container = document.getElementById('rejection-investigator-container');
  if (!container) return;

  container.innerHTML = `
    <div class="sportiq-card animate-fade-in" style="border: 1px solid var(--accent-orange);">
      <div class="d-flex align-items-center gap-2 mb-3 text-warning">
        <i class="fa-solid fa-wand-magic-sparkles fa-spin"></i>
        <h5 class="fw-bold mb-0" style="font-size: 0.95rem;">AI Investigating ticket <code>${ticket.ticketId}</code>...</h5>
      </div>
      <div class="skeleton-loading mb-2" style="height: 15px; width: 100%;"></div>
      <div class="skeleton-loading mb-2" style="height: 15px; width: 95%;"></div>
      <div class="skeleton-loading" style="height: 15px; width: 75%;"></div>
    </div>
  `;

  // HTML Escaper & Safe Markdown Formatter
  function _safeMarkdown(text) {
    if (!text) return '';
    let escaped = text.toString()
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
    escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    escaped = escaped.replace(/\*(.*?)\*/g, '<em>$1</em>');
    return escaped.replace(/\n/g, '<br>');
  }

  try {
    const prompt = `
A fan ticket was rejected at MetLife Stadium. Detail the root cause and provide clear resolution steps.
Ticket Details:
- Ticket Code: ${ticket.ticketId}
- Holder Name: ${ticket.holder}
- Scanner Gate location: ${ticket.gate}
- Rejection System Message: ${ticket.reason || 'Assigned gate alignment error'}
- VIP Pass flag: ${ticket.vip}

Please respond with a structured operations guide. Include:
1. Situation Summary: (Briefly describe the scenario)
2. Root Cause: (Specific failure rationale)
3. Action Plan: (List 3 clear, step-by-step instructions for the gate officer)
4. Fan Communication Suggestion: (Text in quotes to guide the officer in explaining the rejection politely)
`;
    const systemInstruction = "You are the FIFA Ticketing Command Center supervisor co-pilot. Your replies are formatted as structured markdown guides with clear highlights for stadium personnel.";
    
    const reply = await api.callGemini(prompt, systemInstruction);
    
    container.innerHTML = `
      <div class="sportiq-card animate-fade-in" style="border: 1px solid var(--accent-orange); background: linear-gradient(135deg, var(--bg-card) 80%, rgba(245, 158, 11, 0.04) 100%);">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <div class="d-flex align-items-center gap-2 text-warning">
            <i class="fa-solid fa-wand-magic-sparkles" style="filter: drop-shadow(0 0 4px var(--accent-orange));"></i>
            <h5 class="fw-bold mb-0" style="font-size: 0.9rem;">AI Investigation: ${ticket.holder}</h5>
          </div>
          <span class="sportiq-badge sportiq-badge-warning">Gemini co-pilot</span>
        </div>
        <div style="font-size: 0.8rem; line-height: 1.5; color: var(--text-primary);">
          ${_safeMarkdown(reply)}
        </div>
        <div class="text-end mt-3 border-top pt-2" style="border-color: var(--border-color) !important;">
          <button class="btn btn-sm btn-link p-0 text-muted text-decoration-none fw-bold" id="close-investigation-btn" style="font-size: 0.75rem;"><i class="fa-solid fa-circle-xmark me-1"></i> Close Investigation</button>
        </div>
      </div>
    `;

    document.getElementById('close-investigation-btn')?.addEventListener('click', () => {
      container.innerHTML = `
        <div class="sportiq-card text-center py-4" style="background: rgba(255,255,255,0.015); border: 1px dashed var(--border-color);">
          <div class="d-flex align-items-center justify-content-center gap-2 mb-2 text-primary">
            <i class="fa-solid fa-wand-magic-sparkles text-primary animate-pulse" style="font-size: 1.15rem; filter: drop-shadow(0 0 4px var(--accent-blue));"></i>
            <h5 class="fw-bold mb-0" style="font-size: 0.9rem;">Gemini Ticket Rejection Investigator</h5>
          </div>
          <p class="text-secondary mb-0 mx-auto" style="font-size: 0.8rem; max-width: 440px; line-height: 1.45;">
            If a credential scan fails, select <strong class="text-warning">Investigate</strong> in the logs table. Gemini will run threat analysis and return step-by-step resolution checklists.
          </p>
        </div>
      `;
    });

  } catch (err) {
    container.innerHTML = `
      <div class="sportiq-card animate-fade-in text-warning" style="border: 1px solid var(--accent-orange);">
        <i class="fa-solid fa-triangle-exclamation me-1"></i> AI Investigation failed to link.
        <div style="font-size: 0.75rem;" class="mt-2 text-secondary">
          <strong>Recommended Action (Offline Fallback):</strong> Redirect candidate ticket to Ticketing Help Desk B immediately.
        </div>
      </div>
    `;
  }
}

/**
 * Bind DOM controls
 */
function _bindActions() {
  document.getElementById('trigger-scan-btn')?.addEventListener('click', _executeTicketScan);

  const presetSelect = document.getElementById('scanner-preset-select');
  if (presetSelect) {
    presetSelect.addEventListener('change', (e) => {
      selectedTicketPreset = e.target.value;
    });
  }

  const gateSelect = document.getElementById('current-gate-select');
  if (gateSelect) {
    gateSelect.addEventListener('change', (e) => {
      currentGate = e.target.value;
      const badge = document.getElementById('active-scanner-gate-badge');
      if (badge) badge.textContent = `Active: ${currentGate}`;
      toast.show('info', 'Scanner Gate Changed', `Local verification terminal updated to ${currentGate}`);
    });
  }

  const vipSwitch = document.getElementById('allow-vip-toggle');
  if (vipSwitch) {
    vipSwitch.addEventListener('change', (e) => {
      allowVipAtGate = e.target.checked;
      toast.show('info', 'Gate Settings Updated', `VIP admissions toggle set to ${allowVipAtGate}`);
    });
  }

  document.getElementById('log-search-input')?.addEventListener('input', () => {
    firebase.getCollection('tickets').then(docs => _renderTable(docs));
  });

  document.getElementById('log-filter-status')?.addEventListener('change', () => {
    firebase.getCollection('tickets').then(docs => _renderTable(docs));
  });
}

export function destroy() {
  if (laserTimer) clearInterval(laserTimer);
  if (unsubscribeTickets) unsubscribeTickets();
}

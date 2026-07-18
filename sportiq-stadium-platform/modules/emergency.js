import { firebase } from '../services/firebase.js';
import { api } from '../services/api.js';
import { toast } from '../components/toast.js';

let unsubscribeEmergencies = null;
let selectedIncidentForReport = null;

/**
 * Initializes Module 5: Emergency Center
 * @param {HTMLElement} container 
 */
export async function init(container) {
  container.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h1 class="h3 fw-bold mb-1" style="letter-spacing: -0.5px;">Emergency Control Center</h1>
        <p class="text-secondary mb-0" style="font-size: 0.9rem;">Dispatch personnel, generate incident reports, and manage tactical response logs</p>
      </div>
      <div>
        <span class="badge bg-danger rounded-pill px-3 py-2 fw-bold" id="total-alerts-badge">0 Active Alerts</span>
      </div>
    </div>

    <div class="row g-4">
      <!-- Left Column: Dispatch Console & Rapid Dispatch -->
      <div class="col-xl-5">
        <!-- Dispatcher Console Card -->
        <div class="sportiq-card p-4 mb-4">
          <h5 class="fw-bold mb-3" style="font-size: 0.95rem; color: var(--color-danger);"><i class="fa-solid fa-truck-medical me-2"></i> Report & Dispatch Incident</h5>
          
          <div class="row g-2 mb-3">
            <div class="col-6">
              <label class="form-label" style="font-size: 0.8rem; color: var(--text-secondary);">Incident Category</label>
              <select class="form-select glass-input form-select-sm" style="font-size: 0.8rem;" id="incident-category-select">
                <option value="Medical - Heat Exhaustion">Medical - Heat Exhaustion</option>
                <option value="Medical - Cardiac Arrest">Medical - Cardiac Event</option>
                <option value="Security - Crowd Surge">Security - Crowd Surge</option>
                <option value="Security - Physical Altercation">Security - Altercation</option>
                <option value="Safety - Fire Alarm Sweep">Safety - Fire/Smoke Sweep</option>
                <option value="Lost & Found - Lost Child">Lost & Found - Lost Child</option>
              </select>
            </div>
            <div class="col-6">
              <label class="form-label" style="font-size: 0.8rem; color: var(--text-secondary);">Location Sector</label>
              <select class="form-select glass-input form-select-sm" style="font-size: 0.8rem;" id="incident-location-select">
                <option value="Section 104 Concourse">Section 104 Concourse</option>
                <option value="Gate 2 Outer Turnstiles">Gate 2 Outer Turnstiles</option>
                <option value="Section 215 Seating">Section 215 Seating</option>
                <option value="Food Court B Plaza">Food Court B Plaza</option>
                <option value="Parking Zone B Exit">Parking Zone B Exit</option>
                <option value="VIP Main Entrance">VIP Main Entrance</option>
              </select>
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label" style="font-size: 0.8rem; color: var(--text-secondary);">Priority Level</label>
            <div class="d-flex gap-3">
              <div class="form-check form-check-inline">
                <input class="form-check-input" type="radio" name="incident-priority" id="priority-medium" value="medium" checked>
                <label class="form-check-label text-warning" for="priority-medium" style="font-size:0.8rem;">Medium</label>
              </div>
              <div class="form-check form-check-inline">
                <input class="form-check-input" type="radio" name="incident-priority" id="priority-high" value="high">
                <label class="form-check-label text-danger" for="priority-high" style="font-size:0.8rem;">High / SOS</label>
              </div>
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label" style="font-size: 0.8rem; color: var(--text-secondary);">Incident Details & Notes</label>
            <textarea class="form-control glass-input" style="font-size: 0.8rem;" rows="3" placeholder="Describe the crisis details (e.g. collapsed spectator, crowd pushing at barriers, smoke reported...)" id="incident-notes-input"></textarea>
          </div>

          <div class="d-grid">
            <button class="btn btn-danger fw-bold py-2" id="log-dispatch-btn"><i class="fa-solid fa-bullhorn me-1"></i> Log Incident & Dispatch</button>
          </div>
        </div>

        <!-- Rapid Dispatch Panel -->
        <div class="sportiq-card p-4">
          <h5 class="fw-bold mb-3" style="font-size: 0.95rem;"><i class="fa-solid fa-bolt text-warning me-2"></i> Rapid Dispatch Hotkeys</h5>
          <div class="d-grid gap-2">
            <button class="btn btn-sm btn-outline-danger text-start py-2 px-3 fw-bold d-flex align-items-center justify-content-between rapid-dispatch-btn" data-preset="heat_ex" style="border-radius: var(--border-radius-sm); font-size: 0.75rem;">
              <span><i class="fa-solid fa-kit-medical me-2"></i> Heat Exhaustion - Sec 104</span>
              <span class="badge bg-danger">HIGH</span>
            </button>
            <button class="btn btn-sm btn-outline-danger text-start py-2 px-3 fw-bold d-flex align-items-center justify-content-between rapid-dispatch-btn" data-preset="crowd_rush" style="border-radius: var(--border-radius-sm); font-size: 0.75rem;">
              <span><i class="fa-solid fa-users-line me-2"></i> Crowd Rush - Gate 2 Outer</span>
              <span class="badge bg-danger">HIGH</span>
            </button>
            <button class="btn btn-sm btn-outline-warning text-start py-2 px-3 fw-bold d-flex align-items-center justify-content-between rapid-dispatch-btn" data-preset="lost_child" style="border-radius: var(--border-radius-sm); font-size: 0.75rem;">
              <span><i class="fa-solid fa-child me-2"></i> Lost Child - Food Court B</span>
              <span class="badge bg-warning text-dark">MEDIUM</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Right Column: Incident Table & AI Report Builder -->
      <div class="col-xl-7">
        <!-- AI Incident Report Container -->
        <div id="emergency-ai-report-container" class="mb-4">
          <div class="sportiq-card p-4" style="background: rgba(255,255,255,0.01);">
            <div class="d-flex align-items-center gap-2 mb-2 text-danger">
              <i class="fa-solid fa-wand-magic-sparkles text-warning animate-pulse"></i>
              <h5 class="fw-bold mb-0" style="font-size: 0.95rem;">AI Emergency Incident Report Generator</h5>
            </div>
            <p class="text-secondary mb-0" style="font-size: 0.8rem; line-height: 1.4;">
              Select an active incident from the database table below and click <strong class="text-warning"><i class="fa-solid fa-wand-magic-sparkles"></i> AI Report</strong>. Google Gemini will compile an official structured Incident Report including crisis priority evaluation, suggested response crews, and recommended tactical directives.
            </p>
          </div>
        </div>

        <!-- Incidents Table Card -->
        <div class="sportiq-card p-4">
          <h5 class="fw-bold mb-3" style="font-size: 0.95rem;">Central Incident Logs</h5>
          
          <div class="table-responsive" style="max-height: 380px; overflow-y: auto;">
            <table class="sportiq-table" style="font-size: 0.8rem;">
              <thead>
                <tr>
                  <th>Incident Details</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th class="text-end">Actions</th>
                </tr>
              </thead>
              <tbody id="emergencies-table-body">
                <!-- Dynamically populated -->
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;

  _bindActions();
  _subscribeEmergencies();
}

/**
 * Real-time active incident logs sync
 */
function _subscribeEmergencies() {
  unsubscribeEmergencies = firebase.subscribeCollection('emergencies', (docs) => {
    _renderTable(docs);
  });
}

/**
 * Renders active incident list table
 */
function _renderTable(docs) {
  const body = document.getElementById('emergencies-table-body');
  const totalBadge = document.getElementById('total-alerts-badge');

  if (!body) return;

  // Filter active alarms (not resolved)
  const activeAlerts = docs.filter(d => d.status !== 'resolved');
  if (totalBadge) {
    totalBadge.textContent = `${activeAlerts.length} Active Alert${activeAlerts.length === 1 ? '' : 's'}`;
    totalBadge.className = `badge rounded-pill px-3 py-2 fw-bold ${activeAlerts.length > 0 ? 'bg-danger animate-pulse' : 'bg-success'}`;
  }

  if (docs.length === 0) {
    body.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-muted">No emergency records logged in database.</td></tr>`;
    return;
  }

  // Sort by created timestamp descending
  docs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  body.innerHTML = docs.map(doc => {
    const isResolved = doc.status === 'resolved';
    const isHigh = doc.priority === 'high';
    const statusClass = isResolved ? 'success' : (doc.status === 'dispatched' ? 'warning' : 'info');

    return `
      <tr class="animate-fade-in ${isResolved ? 'opacity-75' : ''}">
        <td>
          <div class="fw-bold" style="color: ${isResolved ? 'var(--text-secondary)' : (isHigh ? 'var(--color-danger)' : 'var(--color-warning)')};">
            <i class="fa-solid ${isHigh ? 'fa-triangle-exclamation' : 'fa-circle-exclamation'} me-1"></i> ${doc.title}
          </div>
          <div style="font-size: 0.75rem; color: var(--text-secondary); line-height: 1.3;" class="mt-1">${doc.notes}</div>
          <div style="font-size: 0.65rem; color: var(--text-muted); margin-top: 4px;"><i class="fa-regular fa-clock me-1"></i> ${new Date(doc.createdAt).toLocaleTimeString()}</div>
        </td>
        <td><strong>${doc.location}</strong></td>
        <td>
          <span class="sportiq-badge badge-${statusClass}" style="padding: 1px 8px;">
            ${doc.status.toUpperCase()}
          </span>
        </td>
        <td class="text-end">
          <div class="d-flex justify-content-end gap-1">
            ${!isResolved ? `
              <button class="btn btn-sm btn-outline-warning py-0 px-2 fw-bold generate-report-btn" data-id="${doc.id}" style="font-size: 0.65rem; border-radius: var(--border-radius-sm);" title="Compile AI report">
                <i class="fa-solid fa-wand-magic-sparkles"></i> AI Report
              </button>
              <button class="btn btn-sm btn-success py-0 px-2 fw-bold resolve-btn" data-id="${doc.id}" style="font-size: 0.65rem; border-radius: var(--border-radius-sm);">
                Resolve
              </button>
            ` : `<span class="text-success" style="font-size: 1.15rem;"><i class="fa-solid fa-circle-check"></i></span>`}
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Bind Actions (Resolve and AI Report compilation)
  body.querySelectorAll('.resolve-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      await firebase.setDocument('emergencies', id, { status: 'resolved' });
      toast.show('success', 'Incident Resolved', 'Emergency alert has been cleared and logged as resolved.');
    });
  });

  body.querySelectorAll('.generate-report-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      const item = docs.find(d => d.id === id);
      if (item) _runGeminiIncidentReport(item);
    });
  });
}

/**
 * Dispatch logging method
 */
async function _dispatchIncident() {
  const cat = document.getElementById('incident-category-select').value;
  const loc = document.getElementById('incident-location-select').value;
  const isHigh = document.getElementById('priority-high').checked;
  const notes = document.getElementById('incident-notes-input').value.trim();

  if (!notes) {
    alert('Please enter incident details first.');
    return;
  }

  const id = await firebase.addDocument('emergencies', {
    title: cat,
    priority: isHigh ? 'high' : 'medium',
    status: 'dispatched',
    location: loc,
    notes: notes,
    reporter: 'Dispatcher Terminal'
  });

  toast.show(isHigh ? 'danger' : 'warning', 'Incident Logged & Dispatched', `${cat} dispatch initiated to ${loc}`);
  document.getElementById('incident-notes-input').value = ''; // clear input

  // Automatically trigger AI briefing card for newly logged incident
  const record = { id, title: cat, priority: isHigh ? 'high' : 'medium', status: 'dispatched', location: loc, notes };
  _runGeminiIncidentReport(record);
}

/**
 * Triggers backend Gemini to compile Incident briefings
 */
async function _runGeminiIncidentReport(incident) {
  selectedIncidentForReport = incident;
  const container = document.getElementById('emergency-ai-report-container');
  if (!container) return;

  container.innerHTML = `
    <div class="sportiq-card p-4 animate-fade-in" style="border: 1px solid var(--color-danger); box-shadow: 0 0 15px rgba(255, 89, 123, 0.15);">
      <div class="d-flex align-items-center gap-2 mb-3 text-danger">
        <i class="fa-solid fa-wand-magic-sparkles fa-spin"></i>
        <h5 class="fw-bold mb-0" style="font-size: 0.95rem;">AI compiling emergency dispatch briefings...</h5>
      </div>
      <div class="skeleton-loading mb-2" style="height: 12px; width: 100%;"></div>
      <div class="skeleton-loading mb-2" style="height: 12px; width: 95%;"></div>
      <div class="skeleton-loading mb-2" style="height: 12px; width: 80%;"></div>
      <div class="skeleton-loading" style="height: 12px; width: 50%;"></div>
    </div>
  `;

  try {
    const prompt = `
A stadium dispatcher needs an official Incident Dispatch Report for an ongoing emergency at MetLife Stadium.
Crisis Parameters:
- Incident Category: ${incident.title}
- Location Area: ${incident.location}
- Priority Class: ${incident.priority.toUpperCase()}
- Dispatcher Notes: ${incident.notes}

Auto-generate a structured crisis log in standard paragraphs. Include:
1. Situation Summary: (Brief, structured evaluation)
2. Risk Assessment: (Evaluation of crowd safety impact, priority classification: High/Critical/Medium)
3. Suggested Response Team: (Identify exact team, e.g. Medical Squad Delta, Security Gate 2 Marshall, Fire Patrol 4)
4. Recommended Actions: (3 step-by-step containment instructions)
5. Radio Briefing Script: (Quote exactly what the dispatcher should speak over the walkie-talkie channel to the responding squad)
`;
    const systemInstruction = "You are the FIFA Security Dispatch Director co-pilot. Your replies are structured, direct, and highlight safety containment procedures.";
    
    const reply = await api.callGemini(prompt, systemInstruction);

    container.innerHTML = `
      <div class="sportiq-card p-4 animate-fade-in" style="border: 1px solid var(--color-danger); background: linear-gradient(135deg, var(--bg-card) 80%, rgba(255, 89, 123, 0.05) 100%); box-shadow: 0 0 20px rgba(255, 89, 123, 0.15);">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <div class="d-flex align-items-center gap-2 text-danger">
            <i class="fa-solid fa-triangle-exclamation animate-pulse" style="filter: drop-shadow(0 0 4px var(--color-danger));"></i>
            <h5 class="fw-bold mb-0" style="font-size: 0.95rem; text-transform: uppercase;">AI Dispatch Briefing: ${incident.title}</h5>
          </div>
          <span class="badge bg-danger text-white fw-bold animate-pulse" style="font-size: 0.65rem;">Live Advisory</span>
        </div>
        <div style="font-size: 0.75rem; line-height: 1.5; color: var(--text-primary);">
          ${reply.replace(/\n/g, '<br>')}
        </div>
        <div class="d-flex justify-content-between align-items-center mt-3 border-top pt-2" style="border-color: var(--border-color) !important;">
          <button class="btn btn-sm btn-link p-0 text-muted text-decoration-none fw-bold" id="close-report-btn" style="font-size: 0.75rem;"><i class="fa-solid fa-circle-xmark me-1"></i> Clear Briefing</button>
          <button class="btn btn-sm btn-warning fw-bold px-3 py-1" id="broadcast-alert-btn" style="font-size: 0.7rem; border-radius:4px;"><i class="fa-solid fa-circle-chevron-right me-1"></i> Broadcast Radio Script</button>
        </div>
      </div>
    `;

    document.getElementById('close-report-btn')?.addEventListener('click', () => {
      container.innerHTML = `
        <div class="sportiq-card p-4" style="background: rgba(255,255,255,0.01);">
          <div class="d-flex align-items-center gap-2 mb-2 text-danger">
            <i class="fa-solid fa-wand-magic-sparkles text-warning animate-pulse"></i>
            <h5 class="fw-bold mb-0" style="font-size: 0.95rem;">AI Emergency Incident Report Generator</h5>
          </div>
          <p class="text-secondary mb-0" style="font-size: 0.8rem; line-height: 1.4;">
            Select an active incident from the database table below and click <strong class="text-warning"><i class="fa-solid fa-wand-magic-sparkles"></i> AI Report</strong>. Google Gemini will compile an official structured Incident Report including crisis priority evaluation, suggested response crews, and recommended tactical directives.
          </p>
        </div>
      `;
    });

    document.getElementById('broadcast-alert-btn')?.addEventListener('click', () => {
      toast.show('info', 'Briefing Broadcasted', 'Radio briefing details pushed to target field responder tablets.');
    });

  } catch (err) {
    container.innerHTML = `
      <div class="sportiq-card p-4 animate-fade-in text-warning" style="border: 1px solid var(--color-warning);">
        <i class="fa-solid fa-triangle-exclamation me-1"></i> AI link offline.
        <div style="font-size: 0.75rem;" class="mt-2 text-secondary">
          <strong>Recommended Actions (Offline Fallback):</strong> Dispatch closest patrol team immediately. Deploy volunteer sweeps to locate the zone coordinates.
        </div>
      </div>
    `;
  }
}

/**
 * Quick dispatch hot-key simulators
 */
async function _triggerPresetDispatch(presetKey) {
  let title = 'General Incident';
  let location = 'Section 104 Concourse';
  let priority = 'high';
  let notes = 'Active alarms registered. Investigating.';

  if (presetKey === 'heat_ex') {
    title = 'Medical - Heat Exhaustion';
    location = 'Section 104 Concourse';
    notes = 'Spectator collapsed showing symptoms of dehydration. Responding team requested.';
  } else if (presetKey === 'crowd_rush') {
    title = 'Security - Crowd Surge';
    location = 'Gate 2 Outer Turnstiles';
    notes = 'Spectator bottlenecks creating pressure at barricades. Auxiliary gates requested open.';
  } else if (presetKey === 'lost_child') {
    title = 'Lost & Found - Lost Child';
    location = 'Food Court B Plaza';
    priority = 'medium';
    notes = '8-year-old child wearing white Argentina jersey separated from parents near concourse.';
  }

  const id = await firebase.addDocument('emergencies', {
    title, priority, status: 'dispatched', location, notes, reporter: 'Hotkey Command'
  });

  toast.show(priority === 'high' ? 'danger' : 'warning', 'Incident Dispatched', `${title} logged at ${location}`);
  
  const record = { id, title, priority, status: 'dispatched', location, notes };
  _runGeminiIncidentReport(record);
}

/**
 * Binds actions to controls
 */
function _bindActions() {
  document.getElementById('log-dispatch-btn')?.addEventListener('click', _dispatchIncident);

  // Quick dispatch hotkeys
  document.querySelectorAll('.rapid-dispatch-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const preset = e.currentTarget.getAttribute('data-preset');
      _triggerPresetDispatch(preset);
    });
  });
}

/**
 * Cleans hooks
 */
export function destroy() {
  if (unsubscribeEmergencies) unsubscribeEmergencies();
}

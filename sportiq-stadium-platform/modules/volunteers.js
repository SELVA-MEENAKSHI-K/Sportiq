import { firebase } from '../services/firebase.js';
import { api } from '../services/api.js';
import { toast } from '../components/toast.js';

let unsubscribeVolunteers = null;
let unsubscribeEmergencies = null;
let volunteerList = [];
let emergencyList = [];

/**
 * Initializes Module 6: Volunteer Management
 * @param {HTMLElement} container 
 */
export async function init(container) {
  container.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h1 class="h3 fw-bold mb-1" style="letter-spacing: -0.5px;">Volunteer & Staff Operations</h1>
        <p class="text-secondary mb-0" style="font-size: 0.9rem;">Manage rosters, schedule shifts, track live locations, and optimize team deployment</p>
      </div>
      <div id="staff-totals-badge-container">
        <!-- Quick stats badges loaded dynamically -->
      </div>
    </div>

    <!-- Quick stats cards -->
    <div class="row g-4 mb-4" id="volunteer-stats-row">
      <!-- Dynamically rendered statistics cards -->
    </div>

    <div class="row g-4">
      <!-- Left Column: Roster & Task Reassignment -->
      <div class="col-xl-8">
        <!-- Roster Database Card -->
        <div class="sportiq-card p-4">
          <div class="d-flex flex-column flex-sm-row justify-content-between align-items-stretch align-items-sm-center gap-2 mb-3">
            <h5 class="fw-bold mb-0" style="font-size: 0.95rem;">Volunteer Directory</h5>
            
            <!-- Filters -->
            <div class="d-flex gap-2">
              <select class="form-select form-select-sm glass-input" style="font-size: 0.75rem; width: auto;" id="vol-filter-status">
                <option value="all">All Statuses</option>
                <option value="active">Active Patrol</option>
                <option value="on-break">On Break</option>
              </select>
            </div>
          </div>

          <!-- Search filter -->
          <div class="mb-3">
            <div class="input-group input-group-sm">
              <span class="input-group-text glass-input" style="border-right: none;"><i class="fa-solid fa-magnifying-glass text-muted"></i></span>
              <input type="text" class="form-control glass-input" style="border-left: none;" placeholder="Search roster by volunteer name..." id="vol-search-input">
            </div>
          </div>

          <!-- Roster Table -->
          <div class="table-responsive" style="max-height: 420px; overflow-y: auto;">
            <table class="sportiq-table" style="font-size: 0.8rem;">
              <thead>
                <tr>
                  <th>Volunteer</th>
                  <th>Status</th>
                  <th>Location</th>
                  <th>Current Task</th>
                  <th class="text-end">Actions</th>
                </tr>
              </thead>
              <tbody id="volunteers-table-body">
                <!-- Dynamically populated -->
              </tbody>
            </table>
          </div>
        </div>

        <!-- Task Allocation Editor Panel (Hidden by default, shown on select) -->
        <div class="sportiq-card p-4 mt-4 d-none" id="task-editor-panel">
          <h5 class="fw-bold mb-3" style="font-size: 0.95rem; color: var(--accent-blue);"><i class="fa-solid fa-clipboard-question me-2"></i> Reassign Volunteer Task</h5>
          <div class="row g-3">
            <input type="hidden" id="edit-vol-id">
            <div class="col-md-4">
              <label class="form-label" style="font-size: 0.75rem; color: var(--text-secondary);">Volunteer Name</label>
              <input type="text" class="form-control glass-input form-control-sm" id="edit-vol-name" disabled>
            </div>
            <div class="col-md-4">
              <label class="form-label" style="font-size: 0.75rem; color: var(--text-secondary);">Assign Target Location</label>
              <select class="form-select glass-input form-select-sm" style="font-size:0.8rem;" id="edit-vol-location">
                <option value="Section 104 Concourse">Section 104 Concourse</option>
                <option value="Gate 2 Outer Turnstiles">Gate 2 Outer Turnstiles</option>
                <option value="Food Court B Plaza">Food Court B Plaza</option>
                <option value="Gate 4 Entry">Gate 4 Entry</option>
                <option value="VIP Main Entrance">VIP Main Entrance</option>
                <option value="Staff Lounge">Staff Lounge</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label" style="font-size: 0.75rem; color: var(--text-secondary);">Assign Target Task</label>
              <select class="form-select glass-input form-select-sm" style="font-size:0.8rem;" id="edit-vol-task">
                <option value="Standby Safety Patrol">Standby Safety Patrol</option>
                <option value="Gate Crowd Management">Gate Crowd Management</option>
                <option value="Ticket Verification Help">Ticket Verification Help</option>
                <option value="Medical Escort Standby">Medical Escort Standby</option>
                <option value="General Rest/Break">General Rest/Break</option>
              </select>
            </div>
          </div>
          <div class="d-flex justify-content-end gap-2 mt-3">
            <button class="btn btn-sm btn-outline-secondary px-3" id="cancel-task-btn">Cancel</button>
            <button class="btn btn-sm btn-warning fw-bold px-4" id="save-task-btn">Apply Task Assignment</button>
          </div>
        </div>
      </div>

      <!-- Right Column: AI Staff Recommender & Redistribution plans -->
      <div class="col-xl-4">
        <!-- Gemini AI Nearest Responder Card -->
        <div class="sportiq-card p-4 mb-4" style="border: 1px solid rgba(212, 175, 55, 0.35); background: linear-gradient(135deg, var(--bg-card) 80%, rgba(212, 175, 55, 0.05) 100%);">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <div class="d-flex align-items-center gap-2">
              <i class="fa-solid fa-wand-magic-sparkles text-warning animate-pulse" style="font-size: 1.15rem; filter: drop-shadow(0 0 5px var(--accent-blue));"></i>
              <h5 class="fw-bold mb-0" style="font-size: 0.95rem;">AI Responder Dispatch</h5>
            </div>
            <span class="badge bg-warning text-dark fw-bold" style="font-size: 0.65rem;">Gemini Pro</span>
          </div>

          <div class="mb-3">
            <label class="form-label" style="font-size: 0.75rem; color: var(--text-secondary);">Select Active Incident to Respond</label>
            <select class="form-select glass-input form-select-sm" style="font-size: 0.8rem;" id="dispatch-incident-select">
              <!-- Dynamically populated from active incidents -->
            </select>
          </div>

          <div id="ai-dispatch-result-container" style="font-size: 0.75rem; line-height: 1.4;">
            <p class="text-secondary mb-0">Select an emergency call and click calculate. Gemini co-pilot will analyze nearest volunteer coordinates and matching task profiles.</p>
          </div>
          <div class="d-grid mt-3">
            <button class="btn btn-sm btn-warning fw-bold py-2" id="trigger-dispatch-find-btn"><i class="fa-solid fa-calculator me-1"></i> Find Nearest Responder</button>
          </div>
        </div>

        <!-- Gemini AI Redistribution Plan Card -->
        <div class="sportiq-card p-4">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <div class="d-flex align-items-center gap-2">
              <i class="fa-solid fa-wand-magic-sparkles text-warning" style="font-size: 1.15rem; filter: drop-shadow(0 0 5px var(--accent-blue));"></i>
              <h5 class="fw-bold mb-0" style="font-size: 0.95rem;">AI Staffing Redistribution</h5>
            </div>
            <span class="badge bg-warning text-dark fw-bold" style="font-size: 0.65rem;">Gemini Pro</span>
          </div>

          <div id="ai-redistribute-result-container" style="font-size: 0.75rem; line-height: 1.4;">
            <p class="text-secondary mb-0">Request a volunteer redistribution co-pilot plan based on current stadium bottlenecks and crowd densities.</p>
          </div>
          <div class="d-grid mt-3">
            <button class="btn btn-sm btn-outline-warning fw-bold py-2" id="trigger-redistribute-btn"><i class="fa-solid fa-arrows-spin me-1"></i> Generate Redistribution Plan</button>
          </div>
        </div>
      </div>
    </div>
  `;

  _bindActions();
  _subscribeData();
}

/**
 * Double subscription: Volunteers & Emergencies
 */
function _subscribeData() {
  unsubscribeVolunteers = firebase.subscribeCollection('volunteers', (docs) => {
    volunteerList = docs;
    _renderRoster();
    _renderStats();
  });

  unsubscribeEmergencies = firebase.subscribeCollection('emergencies', (docs) => {
    emergencyList = docs.filter(d => d.status !== 'resolved');
    _renderIncidentsDropdown();
  });
}

/**
 * Populates active incidents list dropdown
 */
function _renderIncidentsDropdown() {
  const select = document.getElementById('dispatch-incident-select');
  if (!select) return;

  if (emergencyList.length === 0) {
    select.innerHTML = `<option value="none">No active emergencies found</option>`;
    return;
  }

  select.innerHTML = emergencyList.map(e => `
    <option value="${e.id}">[${e.priority.toUpperCase()}] ${e.title} - ${e.location}</option>
  `).join('');
}

/**
 * Renders quick stats cards
 */
function _renderStats() {
  const row = document.getElementById('volunteer-stats-row');
  if (!row) return;

  const total = volunteerList.length;
  const active = volunteerList.filter(v => v.status === 'active').length;
  const breakCount = volunteerList.filter(v => v.status === 'on-break').length;

  row.innerHTML = `
    <!-- Card 1: Total staff -->
    <div class="col-md-6 col-lg-4 animate-fade-in">
      <div class="sportiq-card kpi-card">
        <div>
          <div class="text-muted" style="font-size: 0.75rem; font-weight: 600; text-transform: uppercase;">Total Volunteers</div>
          <div class="kpi-value">${total}</div>
          <div style="font-size:0.7rem; color: var(--text-muted);"><i class="fa-solid fa-circle-check text-success me-1"></i> Checked-in & assigned</div>
        </div>
        <div class="kpi-icon"><i class="fa-solid fa-users text-primary"></i></div>
      </div>
    </div>

    <!-- Card 2: Active Patrols -->
    <div class="col-md-6 col-lg-4 animate-fade-in" style="animation-delay: 0.1s;">
      <div class="sportiq-card kpi-card">
        <div>
          <div class="text-muted" style="font-size: 0.75rem; font-weight: 600; text-transform: uppercase;">Active Patrols</div>
          <div class="kpi-value">${active}</div>
          <div style="font-size:0.7rem; color: var(--text-muted);"><i class="fa-solid fa-truck-safety text-success me-1"></i> Guarding / Guiding</div>
        </div>
        <div class="kpi-icon"><i class="fa-solid fa-handshake text-success"></i></div>
      </div>
    </div>

    <!-- Card 3: Staff resting -->
    <div class="col-md-6 col-lg-4 animate-fade-in" style="animation-delay: 0.2s;">
      <div class="sportiq-card kpi-card">
        <div>
          <div class="text-muted" style="font-size: 0.75rem; font-weight: 600; text-transform: uppercase;">Staff on Break</div>
          <div class="kpi-value">${breakCount}</div>
          <div style="font-size:0.7rem; color: var(--text-muted);"><i class="fa-solid fa-coffee text-warning me-1"></i> Rest lounge rotation</div>
        </div>
        <div class="kpi-icon"><i class="fa-solid fa-mug-hot text-warning"></i></div>
      </div>
    </div>
  `;
}

/**
 * Renders volunteer roster table
 */
function _renderRoster() {
  const body = document.getElementById('volunteers-table-body');
  if (!body) return;

  const searchVal = document.getElementById('vol-search-input')?.value.toLowerCase() || '';
  const filterVal = document.getElementById('vol-filter-status')?.value || 'all';

  // Apply filters
  const filtered = volunteerList.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(searchVal);
    const matchesFilter = filterVal === 'all' || v.status === filterVal;
    return matchesSearch && matchesFilter;
  });

  if (filtered.length === 0) {
    body.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">No volunteer records found.</td></tr>`;
    return;
  }

  body.innerHTML = filtered.map(v => {
    const isActive = v.status === 'active';
    const badgeClass = isActive ? 'success' : 'warning';
    const statusLabel = isActive ? 'Active Duty' : 'On Break';

    return `
      <tr class="animate-fade-in">
        <td>
          <div class="fw-bold" style="color: var(--text-primary);"><i class="fa-solid fa-user me-1 text-muted"></i> ${v.name}</div>
          <div style="font-size: 0.7rem; color: var(--text-muted);">Contact: ${v.phone || '+1-555-xxxx'}</div>
        </td>
        <td>
          <span class="sportiq-badge badge-${badgeClass}" style="padding: 1px 8px;">
            ${statusLabel}
          </span>
        </td>
        <td><strong>${v.location}</strong></td>
        <td><div style="font-size: 0.75rem;">${v.task || 'Standby Patrol'}</div></td>
        <td class="text-end">
          <div class="d-flex justify-content-end gap-1">
            <button class="btn btn-sm btn-outline-warning py-0 px-2 fw-bold edit-task-btn" data-id="${v.id}" style="font-size: 0.65rem; border-radius: var(--border-radius-sm);">
              Task Reassign
            </button>
            <button class="btn btn-sm btn-outline-secondary py-0 px-2 fw-bold toggle-break-btn" data-id="${v.id}" style="font-size: 0.65rem; border-radius: var(--border-radius-sm);">
              ${isActive ? 'Break' : 'Active'}
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Bind Actions
  body.querySelectorAll('.toggle-break-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      const item = volunteerList.find(v => v.id === id);
      if (item) {
        const nextStatus = item.status === 'active' ? 'on-break' : 'active';
        const nextTask = nextStatus === 'on-break' ? 'General Rest/Break' : 'Standby Safety Patrol';
        const nextLoc = nextStatus === 'on-break' ? 'Staff Lounge' : item.location;
        await firebase.setDocument('volunteers', id, { status: nextStatus, task: nextTask, location: nextLoc });
        toast.show('info', 'Staff Status Updated', `${item.name} status updated to ${nextStatus}`);
      }
    });
  });

  body.querySelectorAll('.edit-task-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      const item = volunteerList.find(v => v.id === id);
      if (item) {
        document.getElementById('task-editor-panel').classList.remove('d-none');
        document.getElementById('edit-vol-id').value = item.id;
        document.getElementById('edit-vol-name').value = item.name;
        document.getElementById('edit-vol-location').value = item.location;
        document.getElementById('edit-vol-task').value = item.task || 'Standby Safety Patrol';
        document.getElementById('task-editor-panel').scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

/**
 * Triggers backend Gemini to recommend nearest responder
 */
async function _runAiResponderDispatch() {
  const incidentId = document.getElementById('dispatch-incident-select').value;
  const container = document.getElementById('ai-dispatch-result-container');
  
  if (incidentId === 'none' || !incidentId) {
    alert('Please select an active emergency incident first.');
    return;
  }

  const incident = emergencyList.find(e => e.id === incidentId);
  if (!incident) return;

  container.innerHTML = `
    <div class="d-flex align-items-center gap-2 mb-2 text-warning">
      <i class="fa-solid fa-wand-magic-sparkles fa-spin"></i>
      <div>Gemini computing volunteer coordinates...</div>
    </div>
    <div class="skeleton-loading mb-2" style="height:10px; width:100%;"></div>
    <div class="skeleton-loading mb-2" style="height:10px; width:90%;"></div>
    <div class="skeleton-loading" style="height:10px; width:50%;"></div>
  `;

  try {
    const prompt = `
Recommend the best and nearest volunteer responder to dispatch to the following crisis:
Incident Details:
- Category: ${incident.title}
- Location: ${incident.location}
- Priority: ${incident.priority.toUpperCase()}
- Details: ${incident.notes}

Available Volunteer Roster:
${volunteerList.map(v => `- Name: ${v.name}, Status: ${v.status}, Location: ${v.location}, Assigned Task: ${v.task}`).join('\n')}

Format your recommendation as a structured co-pilot briefing. Highlight:
1. Optimal Responder: (Specify name and current location)
2. Dispatch Rationale: (Why they are chosen, e.g. distance/location alignment, checked-in status)
3. Immediate Radio Call Script: (Exact short instructions for dispatcher to speak to the volunteer)
`;
    const systemInstruction = "You are the FIFA Logistics Staffing co-pilot. Your replies are structured, highly concise, and optimize for response time.";
    
    const reply = await api.callGemini(prompt, systemInstruction);
    
    container.innerHTML = `
      <div class="animate-fade-in text-secondary" style="font-size: 0.75rem; line-height: 1.45;">
        <div class="fw-bold text-warning mb-2"><i class="fa-solid fa-truck-safety me-1"></i> AI Match Recommendation</div>
        ${reply.replace(/\n/g, '<br>')}
      </div>
    `;

    toast.show('success', 'Optimal Responder Found', `Recommended dispatcher briefing ready.`);
  } catch (err) {
    container.innerHTML = `
      <div class="text-warning animate-fade-in">
        <i class="fa-solid fa-triangle-exclamation me-1"></i> co-pilot link congested.
        <div class="mt-2 text-secondary">
          <strong>Offline recommendation:</strong> Deploy volunteer Sarah Connor (located in Section 104) immediately to Section 104 call.
        </div>
      </div>
    `;
  }
}

/**
 * Triggers backend Gemini to plan staff redistributions
 */
async function _runAiRedistributionPlan() {
  const container = document.getElementById('ai-redistribute-result-container');
  if (!container) return;

  container.innerHTML = `
    <div class="d-flex align-items-center gap-2 mb-2 text-warning">
      <i class="fa-solid fa-wand-magic-sparkles fa-spin"></i>
      <div>Gemini evaluating stadium bottlenecks...</div>
    </div>
    <div class="skeleton-loading mb-2" style="height:10px; width:100%;"></div>
    <div class="skeleton-loading mb-2" style="height:10px; width:80%;"></div>
    <div class="skeleton-loading" style="height:10px; width:40%;"></div>
  `;

  try {
    const prompt = `
A stadium operations supervisor requests a volunteer staff redistribution plan.
Current State:
- MetLife Stadium is at 83% attendance.
- Pre-Match entry bottlenecks detected at Gate 2 outer gates. Queue wait time is 28 minutes.
- Food concession courts (Food Court B Plaza) are currently quiet (3-5 mins queues).
- Seating stands (North, South, East, West) are steadily filling.

Active Staff Deployment:
${volunteerList.map(v => `- Name: ${v.name}, Location: ${v.location}, Current Task: ${v.task}`).join('\n')}

Generate a structured Staff Redistribution Plan detailing:
1. Operations Bottleneck Assessment: (Brief explanation of understaffed areas)
2. Redeployment Action Matrix: (List concrete staffing changes. E.g. "Move 2 volunteers from Concourse lounge/Food court to Gate 2 entrance")
3. Expected Safety Outcome: (Expected reduction in queue delays)
`;
    const systemInstruction = "You are the FIFA World Cup Chief Logistics co-pilot. Your replies are brief, structured, and prioritize staffing efficiencies.";
    
    const reply = await api.callGemini(prompt, systemInstruction);
    
    container.innerHTML = `
      <div class="animate-fade-in text-secondary" style="font-size: 0.75rem; line-height: 1.45;">
        <div class="fw-bold text-warning mb-2"><i class="fa-solid fa-network-wired me-1"></i> AI Redistribution Strategy</div>
        ${reply.replace(/\n/g, '<br>')}
      </div>
    `;

    toast.show('success', 'Staffing Strategy Compiled', 'AI staff redistribution matrix generated successfully.');
  } catch (err) {
    container.innerHTML = `
      <div class="text-warning animate-fade-in">
        <i class="fa-solid fa-triangle-exclamation me-1"></i> Connection to logistics co-pilot timed out.
        <div class="mt-2 text-secondary">
          <strong>Offline recommendation:</strong> Manually redeploy 2 volunteers from Staff Lounge to Gate 2 outer portals to support credential checking.
        </div>
      </div>
    `;
  }
}

/**
 * Binds actions to directory controls
 */
function _bindActions() {
  // Bind search text filters
  document.getElementById('vol-search-input')?.addEventListener('input', () => _renderRoster());

  // Bind status filter selection
  document.getElementById('vol-filter-status')?.addEventListener('change', () => _renderRoster());

  // Task editor actions
  document.getElementById('cancel-task-btn')?.addEventListener('click', () => {
    document.getElementById('task-editor-panel').classList.add('d-none');
  });

  document.getElementById('save-task-btn')?.addEventListener('click', async () => {
    const id = document.getElementById('edit-vol-id').value;
    const loc = document.getElementById('edit-vol-location').value;
    const taskVal = document.getElementById('edit-vol-task').value;
    
    await firebase.setDocument('volunteers', id, { location: loc, task: taskVal, status: taskVal === 'General Rest/Break' ? 'on-break' : 'active' });
    document.getElementById('task-editor-panel').classList.add('d-none');
    toast.show('success', 'Task Reassigned Successfully', ' Roster details modified in database.');
  });

  // Gemini buttons
  document.getElementById('trigger-dispatch-find-btn')?.addEventListener('click', _runAiResponderDispatch);
  document.getElementById('trigger-redistribute-btn')?.addEventListener('click', _runAiRedistributionPlan);
}

/**
 * Clean data subscriptions
 */
export function destroy() {
  if (unsubscribeVolunteers) unsubscribeVolunteers();
  if (unsubscribeEmergencies) unsubscribeEmergencies();
}

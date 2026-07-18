import { firebase } from '../services/firebase.js';
import { api } from '../services/api.js';
import { toast } from '../components/toast.js';

let crowdChart = null;
let gateChart = null;
let unsubscribeCrowd = null;
let unsubscribeEmergencies = null;

/**
 * Initializes Module 1: Dashboard
 * @param {HTMLElement} container 
 */
export async function init(container) {
  container.innerHTML = `
    <!-- Hero Section -->
    <div class="d-flex flex-column flex-md-row justify-content-between align-items-stretch align-items-md-center gap-3 mb-4" style="background: linear-gradient(90deg, rgba(37,99,235,0.06) 0%, transparent 100%); padding: 24px; border-radius: var(--border-radius-lg); border: 1px solid var(--border-color);">
      <div>
        <h1 class="h3 fw-bold mb-1" style="letter-spacing: -0.8px;">Command Center Dashboard</h1>
        <p class="text-secondary mb-0" style="font-size: 0.9rem;">Real-time telemetry, stadium capacity analysis, and automated AI insight logs</p>
      </div>
      <div class="d-flex align-items-center gap-3">
        <div class="d-flex align-items-center gap-2">
          <span class="status-dot status-dot-green"></span>
          <span class="fw-bold" style="font-size: 0.8rem; color: var(--text-secondary);">MetLife Live Operations</span>
        </div>
        <button class="btn btn-sm btn-outline-secondary" id="refresh-dashboard-btn" style="font-size: 0.75rem; border-radius: var(--border-radius-sm); border-color: var(--border-color);"><i class="fa-solid fa-sync me-1"></i> Sync</button>
      </div>
    </div>

    <!-- Live Statistics (KPI Grid) -->
    <div class="row g-4 mb-4" id="kpi-container">
      <!-- Skeletons loaded dynamically -->
      <div class="col-md-6 col-lg-3"><div class="skeleton-loading" style="height: 110px;"></div></div>
      <div class="col-md-6 col-lg-3"><div class="skeleton-loading" style="height: 110px;"></div></div>
      <div class="col-md-6 col-lg-3"><div class="skeleton-loading" style="height: 110px;"></div></div>
      <div class="col-md-6 col-lg-3"><div class="skeleton-loading" style="height: 110px;"></div></div>
    </div>
    
    <div class="row g-4">
      <!-- Main Visuals & Tables -->
      <div class="col-xl-8">
        <!-- Interactive Charts Cards -->
        <div class="row g-4 mb-4">
          <div class="col-md-6">
            <div class="sportiq-card" style="height: 330px; display: flex; flex-direction: column; padding: 20px;">
              <h5 class="fw-bold mb-3" style="font-size: 0.9rem;"><i class="fa-solid fa-chart-line text-primary me-2"></i> Attendance Inflow Rate</h5>
              <div style="flex-grow: 1; position: relative;">
                <canvas id="crowdInflowChart"></canvas>
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="sportiq-card" style="height: 330px; display: flex; flex-direction: column; padding: 20px;">
              <h5 class="fw-bold mb-3" style="font-size: 0.9rem;"><i class="fa-solid fa-hourglass-half text-warning me-2"></i> Gate Queue Average Delay</h5>
              <div style="flex-grow: 1; position: relative;">
                <canvas id="gateQueueChart"></canvas>
              </div>
            </div>
          </div>
        </div>

        <!-- Today's Match Card & Recent Activity Table -->
        <div class="row g-4">
          <div class="col-md-5">
            <div class="sportiq-card h-100" style="padding: 20px;">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <span class="text-muted fw-bold" style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px;">Today's Event Match</span>
                <span class="sportiq-badge sportiq-badge-danger animate-pulse">55' Live</span>
              </div>
              <div class="text-center py-2">
                <div class="d-flex align-items-center justify-content-around mb-3">
                  <div>
                    <img src="https://flagcdn.com/w80/ar.png" alt="ARG" style="width: 50px; height: 33px; border-radius: 4px; box-shadow: 0 4px 10px rgba(0,0,0,0.3); object-fit: cover;">
                    <div class="fw-bold mt-2" style="font-size: 0.85rem;">Argentina</div>
                  </div>
                  <div>
                    <div style="font-size: 1.7rem; font-weight: 800; letter-spacing: 1px; color: var(--text-primary);">2 - 1</div>
                    <div style="font-size: 0.65rem; color: var(--text-muted);">Quarter-Finals</div>
                  </div>
                  <div>
                    <img src="https://flagcdn.com/w80/fr.png" alt="FRA" style="width: 50px; height: 33px; border-radius: 4px; box-shadow: 0 4px 10px rgba(0,0,0,0.3); object-fit: cover;">
                    <div class="fw-bold mt-2" style="font-size: 0.85rem;">France</div>
                  </div>
                </div>
                <div class="progress-bar-custom my-3" style="background: rgba(255,255,255,0.06); height: 6px; border-radius: 50px; overflow: hidden;">
                  <div class="progress-bar-fill bg-warning" style="width: 61%; height: 100%;"></div>
                </div>
                <div class="text-muted" style="font-size: 0.75rem; line-height: 1.4;">First Half Goals: Messi (12' Pen), Martinez (38') - Mbappé (43')</div>
              </div>
            </div>
          </div>
          
          <div class="col-md-7">
            <div class="sportiq-card h-100" style="display: flex; flex-direction: column; padding: 20px;">
              <h5 class="fw-bold mb-3" style="font-size: 0.9rem;"><i class="fa-solid fa-list-check text-success me-2"></i> Recent Scanner Logs</h5>
              <div class="table-responsive" style="flex-grow: 1;">
                <table class="sportiq-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Ticket Holder</th>
                      <th>Ticket ID</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody id="dashboard-activity-body">
                    <!-- Dynamic Log rows loaded here -->
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: AI Insights & Emergency HUD -->
      <div class="col-xl-4">
        <!-- AI Operations Insight Panel (glowing border) -->
        <div class="sportiq-card mb-4" style="border: 1px solid rgba(37,99,235,0.35); background: linear-gradient(135deg, var(--bg-card) 75%, rgba(37,99,235,0.04) 100%);">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <div class="d-flex align-items-center gap-2">
              <i class="fa-solid fa-wand-magic-sparkles text-primary" style="font-size: 1.1rem; filter: drop-shadow(0 0 4px var(--accent-blue));"></i>
              <h5 class="fw-bold mb-0" style="font-size: 0.9rem;">AI Decision Support</h5>
            </div>
            <span class="sportiq-badge sportiq-badge-info">Gemini Pro</span>
          </div>
          <div id="ai-insight-content" style="font-size: 0.8rem; line-height: 1.5; min-height: 100px;">
            <div class="skeleton-loading mb-2" style="height: 14px; width: 100%;"></div>
            <div class="skeleton-loading mb-2" style="height: 14px; width: 95%;"></div>
            <div class="skeleton-loading mb-2" style="height: 14px; width: 85%;"></div>
          </div>
        </div>

        <!-- Active Alerts Notifications HUD -->
        <div class="sportiq-card mb-4">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h5 class="fw-bold mb-0" style="font-size: 0.9rem;"><i class="fa-solid fa-bell text-danger me-2"></i> Active Incidents</h5>
            <span class="sportiq-badge sportiq-badge-danger" id="incident-counter-badge">0 Active</span>
          </div>
          <div class="d-flex flex-column gap-3" id="incident-dispatch-list">
            <!-- Dynamic Incident list -->
          </div>
        </div>

        <!-- Gamified Matchday Quest Board -->
        <div class="sportiq-card">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h5 class="fw-bold mb-0" style="font-size: 0.9rem;"><i class="fa-solid fa-trophy text-warning me-2"></i> Matchday Quest Board</h5>
            <span class="sportiq-badge sportiq-badge-info" style="font-size: 0.65rem;">3 Active</span>
          </div>
          <div class="d-flex flex-column gap-2">
            <!-- Quest 1 -->
            <div class="p-2 border rounded d-flex align-items-center justify-content-between" style="border-color: var(--border-color) !important; background: rgba(255,255,255,0.015); border-radius: var(--border-radius-sm);">
              <div>
                <div class="fw-bold" style="font-size: 0.75rem; color: var(--text-primary);">Resolve Gate 2 Congestion</div>
                <div style="font-size: 0.65rem; color: var(--text-muted);">Quest Reward: <strong class="text-warning">+50 XP</strong></div>
              </div>
              <button class="btn btn-sm btn-outline-warning py-1 px-2 fw-bold" id="simulate-gate-congest" style="font-size: 0.65rem; border-radius: 4px;">Start Quest</button>
            </div>
            
            <!-- Quest 2 -->
            <div class="p-2 border rounded d-flex align-items-center justify-content-between" style="border-color: var(--border-color) !important; background: rgba(255,255,255,0.015); border-radius: var(--border-radius-sm);">
              <div>
                <div class="fw-bold" style="font-size: 0.75rem; color: var(--text-primary);">Dispatch Sec 104 Medical</div>
                <div style="font-size: 0.65rem; color: var(--text-muted);">Quest Reward: <strong class="text-warning">+40 XP</strong></div>
              </div>
              <button class="btn btn-sm btn-outline-danger py-1 px-2 fw-bold" id="trigger-sos-btn" style="font-size: 0.65rem; border-radius: 4px;">Start SOS</button>
            </div>

            <!-- Quest 3 -->
            <div class="p-2 border rounded d-flex align-items-center justify-content-between" style="border-color: var(--border-color) !important; background: rgba(255,255,255,0.015); border-radius: var(--border-radius-sm);">
              <div>
                <div class="fw-bold" style="font-size: 0.75rem; color: var(--text-primary);">Deploy Sector Patrols</div>
                <div style="font-size: 0.65rem; color: var(--text-muted);">Quest Reward: <strong class="text-warning">+30 XP</strong></div>
              </div>
              <button class="btn btn-sm btn-outline-primary py-1 px-2 fw-bold" id="dispatch-volunteer-btn" style="font-size: 0.65rem; border-radius: 4px;">Deploy</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  _bindActions();
  await _loadDataAndCharts();
}

/**
 * Loads KPI data, runs charts construction, and fetches Gemini reports.
 */
async function _loadDataAndCharts() {
  const kpiContainer = document.getElementById('kpi-container');
  
  unsubscribeCrowd = firebase.subscribeCollection('crowd', (crowdLogs) => {
    if (crowdLogs.length === 0) return;
    const latest = crowdLogs[crowdLogs.length - 1];
    
    kpiContainer.innerHTML = `
      <!-- Card 1: Attendance -->
      <div class="col-md-6 col-lg-3 animate-fade-in">
        <div class="sportiq-card" style="padding: 20px; display: flex; align-items: center; justify-content: space-between; height: 110px;">
          <div>
            <div class="text-muted" style="font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Active Attendance</div>
            <div class="kpi-value" style="font-size: 1.6rem; font-weight: 800; color: var(--text-primary); margin-top: 4px;">${latest.totalCount.toLocaleString()}</div>
            <div class="d-flex align-items-center gap-2 mt-1" style="font-size: 0.7rem; color: var(--text-secondary);">
              <span class="status-dot status-dot-green"></span>
              <span>${Math.round(latest.totalCount / 82500 * 100)}% capacity</span>
            </div>
          </div>
          <i class="fa-solid fa-users text-primary" style="font-size: 1.8rem; opacity: 0.25;"></i>
        </div>
      </div>

      <!-- Card 2: Entry Gates -->
      <div class="col-md-6 col-lg-3 animate-fade-in" style="animation-delay: 0.05s;">
        <div class="sportiq-card" style="padding: 20px; display: flex; align-items: center; justify-content: space-between; height: 110px;">
          <div>
            <div class="text-muted" style="font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Active Entry Gates</div>
            <div class="kpi-value" style="font-size: 1.6rem; font-weight: 800; color: var(--text-primary); margin-top: 4px;">11 / 12</div>
            <div class="mt-1">
              <span class="sportiq-badge sportiq-badge-warning" style="font-size: 0.6rem;">Gate 2 Congested</span>
            </div>
          </div>
          <i class="fa-solid fa-door-open text-warning" style="font-size: 1.8rem; opacity: 0.25;"></i>
        </div>
      </div>

      <!-- Card 3: Parking occupancies -->
      <div class="col-md-6 col-lg-3 animate-fade-in" style="animation-delay: 0.1s;">
        <div class="sportiq-card" style="padding: 20px; display: flex; align-items: center; justify-content: space-between; height: 110px;">
          <div>
            <div class="text-muted" style="font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Parking Occupancy</div>
            <div class="kpi-value" style="font-size: 1.6rem; font-weight: 800; color: var(--text-primary); margin-top: 4px;">78%</div>
            <div class="d-flex align-items-center gap-2 mt-1" style="font-size: 0.7rem; color: var(--text-secondary);">
              <span>2,200 / 2,800 Lots</span>
            </div>
          </div>
          <i class="fa-solid fa-square-parking text-info" style="font-size: 1.8rem; opacity: 0.25;"></i>
        </div>
      </div>

      <!-- Card 4: Weather intelligence -->
      <div class="col-md-6 col-lg-3 animate-fade-in" style="animation-delay: 0.15s;">
        <div class="sportiq-card" style="padding: 20px; display: flex; align-items: center; justify-content: space-between; height: 110px;">
          <div>
            <div class="text-muted" style="font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Weather Forecast</div>
            <div class="kpi-value" style="font-size: 1.6rem; font-weight: 800; color: var(--text-primary); margin-top: 4px;">29°C</div>
            <div class="mt-1" style="font-size: 0.7rem; color: var(--text-secondary);">
              <i class="fa-solid fa-sun text-warning me-1"></i> Clear sky • Dry
            </div>
          </div>
          <i class="fa-solid fa-cloud-sun text-success" style="font-size: 1.8rem; opacity: 0.25;"></i>
        </div>
      </div>
    `;

    _renderCharts(crowdLogs);
  });

  // Load active emergency incidents
  unsubscribeEmergencies = firebase.subscribeCollection('emergencies', (logs) => {
    const listEl = document.getElementById('incident-dispatch-list');
    const counterBadge = document.getElementById('incident-counter-badge');
    const activeLogs = logs.filter(log => log.status !== 'resolved');
    
    if (counterBadge) {
      counterBadge.textContent = `${activeLogs.length} Active`;
      counterBadge.className = `sportiq-badge sportiq-badge-${activeLogs.length > 0 ? 'danger' : 'success'}`;
    }

    if (!listEl) return;

    if (activeLogs.length === 0) {
      listEl.innerHTML = `
        <div class="text-center py-4 text-muted animate-fade-in" style="font-size: 0.75rem;">
          <i class="fa-solid fa-circle-check text-success mb-2" style="font-size: 1.5rem; filter: drop-shadow(0 0 5px var(--accent-green));"></i>
          <div>All stadium zones clear. No active emergencies.</div>
        </div>
      `;
      return;
    }

    listEl.innerHTML = activeLogs.map(log => `
      <div class="p-3 border rounded animate-fade-in" style="border-color: var(--border-color) !important; background: rgba(255, 255, 255, 0.015);">
        <div class="d-flex justify-content-between align-items-start">
          <div class="fw-bold text-danger" style="font-size: 0.8rem;">
            <i class="fa-solid fa-triangle-exclamation me-1"></i> ${log.title}
          </div>
          <span class="sportiq-badge sportiq-badge-${log.priority === 'high' ? 'danger' : 'warning'}" style="font-size: 0.65rem;">
            ${log.priority.toUpperCase()}
          </span>
        </div>
        <div class="text-secondary mt-1" style="font-size: 0.75rem;">Location: <strong>${log.location}</strong></div>
        <div class="text-muted mt-1" style="font-size: 0.7rem; line-height: 1.3;">${log.notes}</div>
        <div class="d-flex justify-content-between align-items-center mt-2 border-top pt-2" style="border-color: var(--border-color) !important;">
          <span style="font-size: 0.65rem; color: var(--text-muted);"><i class="fa-regular fa-clock me-1"></i> ${new Date(log.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          <span class="sportiq-badge sportiq-badge-info" style="font-size: 0.65rem;">${log.status.toUpperCase()}</span>
        </div>
      </div>
    `).join('');
  });

  // Recent logs
  const ticketDocs = await firebase.getCollection('tickets');
  const activityBody = document.getElementById('dashboard-activity-body');
  if (activityBody) {
    activityBody.innerHTML = ticketDocs.slice(-3).reverse().map(doc => `
      <tr>
        <td>${doc.scanTime || '18:10'}</td>
        <td>Ticket scan: <strong>${doc.holder}</strong></td>
        <td><code>${doc.ticketId}</code></td>
        <td>
          <span class="sportiq-badge sportiq-badge-${doc.status === 'validated' ? 'success' : 'danger'}">
            ${doc.status === 'validated' ? 'Entry Granted' : 'Access Denied'}
          </span>
        </td>
      </tr>
    `).join('') || `<tr><td colspan="4" class="text-center text-muted">No recent operations logs found.</td></tr>`;
  }

  await _loadAiInsights();
}

/**
 * Calls Gemini to generate decision support reports
 */
async function _loadAiInsights() {
  const panel = document.getElementById('ai-insight-content');
  if (!panel) return;

  try {
    const prompt = `
Generate a stadium operations warning and optimization summary based on this MetLife Stadium current status:
- Attendance: 68,500 / 82,500 (83% Capacity)
- Incident: Heat exhaustion under control at Section 104
- Alert: Gate 2 Congestion (Queue time 28 mins; gate density 0.89)
- Parking: Zone A Full (96%), Zone B (77%), Zone C (60%)
- Match Status: Argentina vs France 55th Minute (Live)

Provide a 3-sentence executive alert in standard paragraphs with professional instructions. Be crisp.
`;
    const systemInstruction = "You are the FIFA World Cup Stadium Operations AI Lead. You provide highly action-oriented dashboard insights for operators.";
    
    const reply = await api.callGemini(prompt, systemInstruction);
    panel.innerHTML = `
      <div style="color: var(--text-primary);" class="animate-fade-in">
        ${reply.replace(/\n/g, '<br>')}
      </div>
      <div class="d-flex justify-content-between align-items-center mt-3 border-top pt-2" style="border-color: var(--border-color) !important;">
        <span style="font-size: 0.65rem; color: var(--text-muted);"><i class="fa-solid fa-clock me-1"></i> Generated just now</span>
        <button class="btn btn-link p-0 text-primary text-decoration-none fw-bold" style="font-size: 0.7rem;" id="explain-insights-btn">Simulate Operations Briefing</button>
      </div>
    `;
    
    document.getElementById('explain-insights-btn')?.addEventListener('click', () => {
      toast.show('success', 'Operations Briefing Sent', 'Co-pilot suggestions broadcasted to team leaders.');
    });
  } catch (err) {
    panel.innerHTML = `
      <div class="text-warning" style="font-size: 0.75rem;">
        <i class="fa-solid fa-triangle-exclamation me-1"></i> AI co-pilot link timed out.
        <div class="mt-2 text-secondary"><strong>Recommendation:</strong> Direct entry traffic away from congested Gate 2 to Gate 3. Retain Volunteer Sarah Connor in Section 104 concourse to patrol for heat exhaustion signs.</div>
      </div>
    `;
  }
}

/**
 * Creates Chart.js instances matching Sportiq color accents
 */
function _renderCharts(crowdLogs) {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const gridColor = 'rgba(255, 255, 255, 0.05)';
  const textColor = '#94a3b8';

  const crowdCtx = document.getElementById('crowdInflowChart');
  if (crowdCtx) {
    if (crowdChart) crowdChart.destroy();
    
    const labels = crowdLogs.map(l => l.time);
    const data = crowdLogs.map(l => l.totalCount);

    crowdChart = new Chart(crowdCtx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Total Attendance',
          data: data,
          borderColor: '#2563EB', // Accent Blue
          backgroundColor: 'rgba(37, 99, 235, 0.05)',
          fill: true,
          tension: 0.35,
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: '#2563EB'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 8 } } },
          y: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 8 } } }
        }
      }
    });
  }

  const gateCtx = document.getElementById('gateQueueChart');
  if (gateCtx) {
    if (gateChart) gateChart.destroy();
    gateChart = new Chart(gateCtx, {
      type: 'bar',
      data: {
        labels: ['Gate 1', 'Gate 2', 'Gate 3', 'Gate 4'],
        datasets: [{
          label: 'Delay (mins)',
          data: [8, 28, 6, 12],
          backgroundColor: ['#22C55E', '#EF4444', '#22C55E', '#F59E0B'],
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 8 } } },
          y: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 8 } } }
        }
      }
    });
  }
}

/**
 * Binding click helpers
 */
function _bindActions() {
  document.getElementById('refresh-dashboard-btn')?.addEventListener('click', async () => {
    toast.show('info', 'Syncing Data', 'Connecting to Sportiq telemetry nodes...');
    await _loadDataAndCharts();
    toast.show('success', 'Sync Complete', 'Operations database records are fully synchronized.');
  });

  document.getElementById('trigger-sos-btn')?.addEventListener('click', async () => {
    toast.show('danger', 'Reporting Crisis', 'Adding SOS item to emergencies database...');
    await firebase.setDocument('emergencies', 'em_sos_' + Date.now(), {
      title: 'Power grid fluctuation',
      location: 'Section 220 East',
      notes: 'Power levels fluctuating in outer corridor blocks.',
      priority: 'high',
      status: 'reported',
      createdAt: Date.now()
    });
    toast.show('success', 'SOS incident logged', 'Broadcasting details to all volunteer patrols.');
  });

  document.getElementById('simulate-gate-congest')?.addEventListener('click', async () => {
    toast.show('warning', 'Modifying Gate Parameters', 'Increasing wait times at Gate 2...');
    await firebase.setDocument('crowd', 'c_log_congest', {
      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      totalCount: 78500,
      activeGates: 11
    });
    toast.show('success', 'Wait times updated', 'Gate 2 wait time increased to 35 mins.');
  });

  document.getElementById('dispatch-volunteer-btn')?.addEventListener('click', () => {
    toast.show('info', 'Opening Volunteers dispatch', 'Navigating coordinates...');
    window.location.hash = '#/volunteers';
  });
}

export function destroy() {
  if (unsubscribeCrowd) unsubscribeCrowd();
  if (unsubscribeEmergencies) unsubscribeEmergencies();
  if (crowdChart) crowdChart.destroy();
  if (gateChart) gateChart.destroy();
}

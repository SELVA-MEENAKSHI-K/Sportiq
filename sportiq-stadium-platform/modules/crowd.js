import { firebase } from '../services/firebase.js';
import { api } from '../services/api.js';
import { toast } from '../components/toast.js';

let trendChart = null;
let activeMode = 'pre-match';

const SIMULATION_MODES = {
  'pre-match': {
    name: 'Pre-Match Entry (Fans Arriving)',
    gates: { 'gate-1': 0.75, 'gate-2': 0.92, 'gate-3': 0.42, 'gate-4': 0.58, 'gate-vip': 0.25 },
    zones: { 'zone-north': 0.35, 'zone-south': 0.28, 'zone-east': 0.40, 'zone-west': 0.32, 'zone-concourse': 0.72 },
    routes: [
      { id: 'alpha', label: 'Route Alpha (Gate 3 to Metro Link)', status: 'success', desc: 'Optimal flow. Clear pathways.' },
      { id: 'beta', label: 'Route Beta (Gate 2 to Parking Zone A)', status: 'danger', desc: 'Severe queue backup. Direct general tickets to Gate 3.' },
      { id: 'gamma', label: 'Route Gamma (Gate 1 to Parking Zone B)', status: 'warning', desc: 'Moderate queue time (~14 mins).' }
    ],
    chartData: [15000, 32000, 54000, 68500]
  },
  'kickoff': {
    name: 'Kickoff Standby (National Anthems / Game Start)',
    gates: { 'gate-1': 0.30, 'gate-2': 0.35, 'gate-3': 0.20, 'gate-4': 0.22, 'gate-vip': 0.10 },
    zones: { 'zone-north': 0.95, 'zone-south': 0.92, 'zone-east': 0.96, 'zone-west': 0.94, 'zone-concourse': 0.15 },
    routes: [
      { id: 'alpha', label: 'Route Alpha (Gate 3 to Metro Link)', status: 'success', desc: 'Clear exit corridors. Operations normal.' },
      { id: 'beta', label: 'Route Beta (Gate 2 to Parking Zone A)', status: 'success', desc: 'Congestion cleared. Outer turnstiles stand down.' },
      { id: 'gamma', label: 'Route Gamma (Gate 1 to Parking Zone B)', status: 'success', desc: 'Clear entry routes.' }
    ],
    chartData: [32000, 54000, 68500, 78200]
  },
  'half-time': {
    name: 'Half-Time Concourse Rush (Concessions & Restrooms)',
    gates: { 'gate-1': 0.08, 'gate-2': 0.12, 'gate-3': 0.05, 'gate-4': 0.06, 'gate-vip': 0.02 },
    zones: { 'zone-north': 0.60, 'zone-south': 0.58, 'zone-east': 0.62, 'zone-west': 0.55, 'zone-concourse': 0.94 },
    routes: [
      { id: 'alpha', label: 'Route Alpha (Gate 3 to Metro Link)', status: 'success', desc: 'Exit pathways clear. No traffic.' },
      { id: 'beta', label: 'Route Beta (Gate 2 to Parking Zone A)', status: 'success', desc: 'Clean outer terminals.' },
      { id: 'gamma', label: 'Route Gamma (Gate 1 to Parking Zone B)', status: 'warning', desc: 'Concourse A tunnel entrance congested. Direct to tunnel B.' }
    ],
    chartData: [54000, 68500, 78200, 79100]
  },
  'post-match': {
    name: 'Post-Match Exit (Mass Egress)',
    gates: { 'gate-1': 0.88, 'gate-2': 0.94, 'gate-3': 0.85, 'gate-4': 0.90, 'gate-vip': 0.40 },
    zones: { 'zone-north': 0.40, 'zone-south': 0.35, 'zone-east': 0.45, 'zone-west': 0.38, 'zone-concourse': 0.88 },
    routes: [
      { id: 'alpha', label: 'Route Alpha (Gate 3 to Metro Link)', status: 'warning', desc: 'Heavy exit columns. Metro platform holding trains.' },
      { id: 'beta', label: 'Route Beta (Gate 2 to Parking Zone A)', status: 'danger', desc: 'Bottleneck at outer crossing. High volume parking exits.' },
      { id: 'gamma', label: 'Route Gamma (Gate 1 to Parking Zone B)', status: 'success', desc: 'Flowing smoothly. Recommended egress for West stands.' }
    ],
    chartData: [78200, 79100, 48000, 18000]
  }
};

/**
 * Initializes Crowd Management Module
 * @param {HTMLElement} container 
 */
export async function init(container) {
  container.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h1 class="h3 fw-bold mb-1" style="letter-spacing: -0.5px;">Crowd Management & Safety</h1>
        <p class="text-secondary mb-0" style="font-size: 0.9rem;">Monitor real-time crowd density, egress routing, and predictive queues</p>
      </div>
      <div>
        <span class="sportiq-badge sportiq-badge-warning" id="crowd-phase-badge">Phase: Pre-Match</span>
      </div>
    </div>

    <!-- Match Phase Selectors -->
    <div class="sportiq-card p-3 mb-4 d-flex flex-wrap gap-2 justify-content-center align-items-center">
      <span class="fw-bold me-2 text-muted" style="font-size: 0.8rem; text-transform: uppercase;">Simulate Match Phase:</span>
      <button class="btn btn-sm btn-outline-warning sim-phase-btn active" data-phase="pre-match" style="font-size: 0.75rem;">Pre-Match Entry</button>
      <button class="btn btn-sm btn-outline-warning sim-phase-btn" data-phase="kickoff" style="font-size: 0.75rem;">Kickoff Standby</button>
      <button class="btn btn-sm btn-outline-warning sim-phase-btn" data-phase="half-time" style="font-size: 0.75rem;">Half-Time Rush</button>
      <button class="btn btn-sm btn-outline-warning sim-phase-btn" data-phase="post-match" style="font-size: 0.75rem;">Post-Match Exit</button>
    </div>

    <div class="row g-4">
      <!-- Left Column: Heatmap and Trend Chart -->
      <div class="col-xl-8">
        <!-- SVG Stadium Heatmap Card -->
        <div class="sportiq-card p-4 mb-4 text-center">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h5 class="fw-bold mb-0 text-start" style="font-size: 0.95rem;">Interactive Zone Heatmap</h5>
            <div class="d-flex gap-3" style="font-size: 0.7rem;">
              <span class="d-flex align-items-center gap-1"><span class="d-inline-block" style="width:10px; height:10px; border-radius:50%; background:#00dfa2;"></span> Low</span>
              <span class="d-flex align-items-center gap-1"><span class="d-inline-block" style="width:10px; height:10px; border-radius:50%; background:#ffb84c;"></span> Mod</span>
              <span class="d-flex align-items-center gap-1"><span class="d-inline-block" style="width:10px; height:10px; border-radius:50%; background:#ff597b;"></span> High</span>
            </div>
          </div>
          
          <!-- Stadium SVG Outer Container -->
          <div class="d-flex justify-content-center p-3" style="background: rgba(0,0,0,0.2); border-radius: var(--border-radius-md);">
            <svg viewBox="0 0 500 400" width="100%" style="max-width: 480px; height: auto;">
              <!-- Outer Stadium Border Ring -->
              <ellipse cx="250" cy="200" rx="230" ry="180" fill="none" stroke="var(--border-color)" stroke-width="4" />
              
              <!-- Concourse ring path -->
              <ellipse id="zone-concourse" cx="250" cy="200" rx="210" ry="160" fill="rgba(255, 255, 255, 0.05)" stroke="var(--border-color)" stroke-width="2" style="transition: fill 0.5s ease;" />
              
              <!-- Seating Stand Blocks -->
              <!-- North Stand Block -->
              <path id="zone-north" d="M 120 70 Q 250 10 380 70 L 340 120 Q 250 80 160 120 Z" fill="rgba(0, 223, 162, 0.3)" stroke="var(--border-color)" stroke-width="1.5" style="transition: fill 0.5s ease;" />
              <text x="250" y="55" fill="var(--text-primary)" font-size="10" font-weight="700" text-anchor="middle">NORTH STAND</text>
              
              <!-- South Stand Block -->
              <path id="zone-south" d="M 120 330 Q 250 390 380 330 L 340 280 Q 250 320 160 280 Z" fill="rgba(0, 223, 162, 0.3)" stroke="var(--border-color)" stroke-width="1.5" style="transition: fill 0.5s ease;" />
              <text x="250" y="350" fill="var(--text-primary)" font-size="10" font-weight="700" text-anchor="middle">SOUTH STAND</text>
              
              <!-- East Stand Block -->
              <path id="zone-east" d="M 390 90 Q 470 200 390 310 L 345 270 Q 400 200 345 130 Z" fill="rgba(0, 223, 162, 0.3)" stroke="var(--border-color)" stroke-width="1.5" style="transition: fill 0.5s ease;" />
              <text x="410" y="205" fill="var(--text-primary)" font-size="10" font-weight="700" text-anchor="middle" transform="rotate(90, 410, 205)">EAST STAND</text>
              
              <!-- West Stand Block -->
              <path id="zone-west" d="M 110 90 Q 30 200 110 310 L 155 270 Q 100 200 155 130 Z" fill="rgba(0, 223, 162, 0.3)" stroke="var(--border-color)" stroke-width="1.5" style="transition: fill 0.5s ease;" />
              <text x="90" y="205" fill="var(--text-primary)" font-size="10" font-weight="700" text-anchor="middle" transform="rotate(-90, 90, 205)">WEST STAND</text>
              
              <!-- Center Soccer Pitch -->
              <rect x="200" y="160" width="100" height="80" rx="4" fill="rgba(0, 223, 162, 0.15)" stroke="var(--border-color)" stroke-width="2" />
              <circle cx="250" cy="200" r="16" fill="none" stroke="var(--border-color)" stroke-width="2" />
              <line x1="250" y1="160" x2="250" y2="240" stroke="var(--border-color)" stroke-width="2" />

              <!-- Outer Entry Gate Nodes -->
              <!-- Gate 1 (Top Left) -->
              <circle id="gate-1" cx="80" cy="80" r="12" fill="rgba(0, 223, 162, 0.7)" stroke="#fff" stroke-width="1.5" style="transition: fill 0.5s ease;" />
              <text x="80" y="83" fill="#000" font-size="9" font-weight="800" text-anchor="middle">G1</text>
              
              <!-- Gate 2 (Top Right) -->
              <circle id="gate-2" cx="420" cy="80" r="12" fill="rgba(0, 223, 162, 0.7)" stroke="#fff" stroke-width="1.5" style="transition: fill 0.5s ease;" />
              <text x="420" y="83" fill="#000" font-size="9" font-weight="800" text-anchor="middle">G2</text>
              
              <!-- Gate 3 (Bottom Right) -->
              <circle id="gate-3" cx="420" cy="320" r="12" fill="rgba(0, 223, 162, 0.7)" stroke="#fff" stroke-width="1.5" style="transition: fill 0.5s ease;" />
              <text x="420" y="323" fill="#000" font-size="9" font-weight="800" text-anchor="middle">G3</text>
              
              <!-- Gate 4 (Bottom Left) -->
              <circle id="gate-4" cx="80" cy="320" r="12" fill="rgba(0, 223, 162, 0.7)" stroke="#fff" stroke-width="1.5" style="transition: fill 0.5s ease;" />
              <text x="80" y="323" fill="#000" font-size="9" font-weight="800" text-anchor="middle">G4</text>
              
              <!-- VIP Main Gate (Center Bottom) -->
              <circle id="gate-vip" cx="250" cy="380" r="12" fill="rgba(0, 223, 162, 0.7)" stroke="#fff" stroke-width="1.5" style="transition: fill 0.5s ease;" />
              <text x="250" y="383" fill="#000" font-size="8" font-weight="800" text-anchor="middle">VIP</text>
            </svg>
          </div>
          <div style="font-size: 0.75rem; color: var(--text-muted);" class="mt-2">
            <i class="fa-solid fa-hand-pointer me-1"></i> Interactive Heatmap layers represent dynamic density levels.
          </div>
        </div>

        <!-- Crowd Flow Trend Chart -->
        <div class="sportiq-card p-4">
          <h5 class="fw-bold mb-3" style="font-size: 0.95rem;">Attendance Timeline Inflow</h5>
          <div style="height: 220px; position: relative;">
            <canvas id="crowdTrendChart"></canvas>
          </div>
        </div>
      </div>

      <!-- Right Column: Predictive Forecaster & Egress Routes -->
      <div class="col-xl-4">
        <!-- Gemini Predictive Advisory Card -->
        <div class="sportiq-card p-4 mb-4" style="border: 1px solid rgba(212, 175, 55, 0.35); background: linear-gradient(135deg, var(--bg-card) 75%, rgba(212, 175, 55, 0.05) 100%);">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <div class="d-flex align-items-center gap-2">
              <i class="fa-solid fa-wand-magic-sparkles text-warning animate-pulse" style="font-size: 1.15rem; filter: drop-shadow(0 0 5px var(--accent-blue));"></i>
              <h5 class="fw-bold mb-0" style="font-size: 0.95rem;">AI Predictive Forecasting</h5>
            </div>
            <span class="badge bg-warning text-dark fw-bold" style="font-size: 0.65rem;">Gemini Pro</span>
          </div>

          <div id="crowd-ai-forecast-content" style="font-size: 0.8rem; line-height: 1.5;">
            <p class="text-secondary">AI Co-pilot is ready to analyze this phase's densities and forecast safety queues.</p>
            <div class="d-grid mt-3">
              <button class="btn btn-sm btn-warning fw-bold py-2" id="trigger-ai-forecast-btn"><i class="fa-solid fa-calculator me-1"></i> Run AI Safety Forecast</button>
            </div>
          </div>
        </div>

        <!-- Safe Exit Route Recommendations -->
        <div class="sportiq-card p-4 mb-4">
          <h5 class="fw-bold mb-3" style="font-size: 0.95rem;"><i class="fa-solid fa-compass text-info me-2"></i> Egress Route Recommendations</h5>
          <div class="d-flex flex-column gap-3" id="egress-routes-list">
            <!-- Dynamic Routes loaded -->
          </div>
        </div>

        <!-- Density Alert Thresholds -->
        <div class="sportiq-card p-4">
          <h5 class="fw-bold mb-3" style="font-size: 0.95rem;"><i class="fa-solid fa-circle-nodes text-danger me-2"></i> Active Warnings Log</h5>
          <div class="d-flex flex-column gap-2" id="density-warnings-log" style="font-size: 0.75rem;">
            <!-- Dynamically populated -->
          </div>
        </div>
      </div>
    </div>
  `;

  _bindActions();
  _updateSimulationState();
}

/**
 * Returns Hex color matching density percentages
 */
function _getHeatmapColor(val) {
  if (val < 0.5) return 'rgba(0, 223, 162, 0.4)';  // Green
  if (val < 0.8) return 'rgba(255, 184, 76, 0.5)';  // Yellow
  return 'rgba(255, 89, 123, 0.65)';              // Red
}

/**
 * Triggers state update when changing match phases
 */
function _updateSimulationState() {
  const data = SIMULATION_MODES[activeMode];
  
  // Update phase badges
  const badge = document.getElementById('crowd-phase-badge');
  if (badge) badge.textContent = `Phase: ${activeMode.toUpperCase().replace('-', ' ')}`;

  // Update Seating zones colors
  Object.keys(data.zones).forEach(zoneId => {
    const el = document.getElementById(zoneId);
    if (el) el.setAttribute('fill', _getHeatmapColor(data.zones[zoneId]));
  });

  // Update Gate Node colors
  Object.keys(data.gates).forEach(gateId => {
    const el = document.getElementById(gateId);
    if (el) el.setAttribute('fill', _getHeatmapColor(data.gates[gateId]));
  });

  // Render Egress Routes
  const routesContainer = document.getElementById('egress-routes-list');
  if (routesContainer) {
    routesContainer.innerHTML = data.routes.map(r => `
      <div class="p-3 border rounded animate-fade-in" style="border-color: var(--border-color) !important; background: rgba(255,255,255,0.01);">
        <div class="d-flex justify-content-between align-items-center">
          <div class="fw-bold" style="font-size: 0.8rem; color: var(--text-primary);">${r.label}</div>
          <span class="sportiq-badge badge-${r.status}" style="font-size: 0.65rem; padding: 1px 6px;">
            ${r.status === 'success' ? 'CLEAR' : (r.status === 'warning' ? 'SLOW' : 'BLOCKED')}
          </span>
        </div>
        <div class="text-muted mt-1" style="font-size: 0.75rem; line-height: 1.3;">${r.desc}</div>
      </div>
    `).join('');
  }

  // Render Alerts Log
  const alertsContainer = document.getElementById('density-warnings-log');
  if (alertsContainer) {
    const alerts = [];
    Object.keys(data.gates).forEach(g => {
      const dens = data.gates[g];
      if (dens > 0.8) {
        alerts.push(`<div class="p-2 border-start border-danger bg-danger-subtle text-danger mb-2 rounded" style="background: rgba(255,89,123,0.08) !important;"><i class="fa-solid fa-triangle-exclamation me-1"></i> Critical congestion at <strong>${g.toUpperCase()}</strong> (${Math.round(dens*100)}% capacity). Queue times exceed 25 minutes.</div>`);
      } else if (dens > 0.5) {
        alerts.push(`<div class="p-2 border-start border-warning bg-warning-subtle text-warning mb-2 rounded" style="background: rgba(255,184,76,0.08) !important;"><i class="fa-solid fa-circle-exclamation me-1"></i> Moderate queue build-up at <strong>${g.toUpperCase()}</strong> (${Math.round(dens*100)}%).</div>`);
      }
    });

    Object.keys(data.zones).forEach(z => {
      const dens = data.zones[z];
      if (dens > 0.8) {
        alerts.push(`<div class="p-2 border-start border-danger bg-danger-subtle text-danger mb-2 rounded" style="background: rgba(255,89,123,0.08) !important;"><i class="fa-solid fa-triangle-exclamation me-1"></i> Safety warning: <strong>${z.toUpperCase().replace('-', ' ')}</strong> density is critical (${Math.round(dens*100)}%). Patrols deployed.</div>`);
      }
    });

    alertsContainer.innerHTML = alerts.join('') || `<div class="text-center text-muted py-3">All stadium gates and seating sectors operating normal safety levels.</div>`;
  }

  // Draw Charts
  _renderTrendChart(data.chartData);

  // Reset Gemini report panel instruction
  const forecastPanel = document.getElementById('crowd-ai-forecast-content');
  if (forecastPanel) {
    forecastPanel.innerHTML = `
      <p class="text-secondary" style="font-size:0.75rem;">AI co-pilot is ready to forecast 30m and 1h queue densities based on the simulated <strong>${data.name}</strong> variables.</p>
      <div class="d-grid mt-3">
        <button class="btn btn-sm btn-warning fw-bold py-2" id="trigger-ai-forecast-btn"><i class="fa-solid fa-calculator me-1"></i> Run AI Safety Forecast</button>
      </div>
    `;
    document.getElementById('trigger-ai-forecast-btn')?.addEventListener('click', _runAiForecast);
  }
}

/**
 * Constructs Chart.js Line figures
 */
function _renderTrendChart(points) {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)';
  const textColor = isDark ? '#94a3b8' : '#475569';

  const ctx = document.getElementById('crowdTrendChart');
  if (ctx) {
    if (trendChart) trendChart.destroy();

    trendChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['T-90 Mins', 'T-60 Mins', 'T-30 Mins', 'Current (T-0)'],
        datasets: [{
          label: 'Total Scanned Attendance',
          data: points,
          borderColor: '#0d6efd',
          backgroundColor: 'rgba(13, 110, 253, 0.1)',
          fill: true,
          tension: 0.3,
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: '#0d6efd'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 9 } } },
          y: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 9 } } }
        }
      }
    });
  }
}

/**
 * Triggers backend Gemini to request crowd predictions
 */
async function _runAiForecast() {
  const panel = document.getElementById('crowd-ai-forecast-content');
  if (!panel) return;

  const data = SIMULATION_MODES[activeMode];

  panel.innerHTML = `
    <div class="d-flex align-items-center gap-2 mb-3 text-warning">
      <i class="fa-solid fa-wand-magic-sparkles fa-spin"></i>
      <div style="font-size:0.75rem;">Gemini simulating 30m and 1h queue queues...</div>
    </div>
    <div class="skeleton-loading mb-2" style="height:12px; width:100%;"></div>
    <div class="skeleton-loading mb-2" style="height:12px; width:95%;"></div>
    <div class="skeleton-loading mb-2" style="height:12px; width:80%;"></div>
    <div class="skeleton-loading" style="height:12px; width:45%;"></div>
  `;

  try {
    const prompt = `
A stadium operations manager is requesting a predictive crowd forecast at MetLife Stadium.
Context State: ${data.name}
Current Gates Density:
- Gate 1: ${Math.round(data.gates['gate-1']*100)}%
- Gate 2: ${Math.round(data.gates['gate-2']*100)}% (Wait time is ${data.gates['gate-2'] > 0.8 ? '28 mins' : '10 mins'})
- Gate 3: ${Math.round(data.gates['gate-3']*100)}%
- Gate 4: ${Math.round(data.gates['gate-4']*100)}%
- VIP Main: ${Math.round(data.gates['gate-vip']*100)}%

Sector Densities:
- Stands: North (${Math.round(data.zones['zone-north']*100)}%), South (${Math.round(data.zones['zone-south']*100)}%), East (${Math.round(data.zones['zone-east']*100)}%), West (${Math.round(data.zones['zone-west']*100)}%)
- Concourses: ${Math.round(data.zones['zone-concourse']*100)}%

Generate a structured predictions summary:
1. 30-Minute Forecast: (Predict flow changes)
2. 1-Hour Forecast: (Predict exit/entry movements)
3. Congestion Risk Analysis: (Highlight bottlenecks)
4. Staff Action Recommendations: (Redeploying volunteers, opening gates, security deployment)
`;
    const systemInstruction = "You are the FIFA World Cup Safety Command Specialist co-pilot. Your replies are brief, highly structured, and focus strictly on visitor safety optimization.";
    
    const reply = await api.callGemini(prompt, systemInstruction);
    
    panel.innerHTML = `
      <div class="animate-fade-in" style="font-size: 0.75rem; line-height: 1.4; color: var(--text-primary);">
        ${reply.replace(/\n/g, '<br>')}
      </div>
      <div class="d-grid mt-3">
        <button class="btn btn-sm btn-outline-warning fw-bold" id="re-run-forecast-btn" style="font-size:0.75rem;"><i class="fa-solid fa-rotate-right me-1"></i> Refresh Forecast</button>
      </div>
    `;
    
    document.getElementById('re-run-forecast-btn')?.addEventListener('click', _runAiForecast);

    toast.show('success', 'AI Safety Forecast Generated', 'Advisory reports updated with predictive queues.');
  } catch (err) {
    panel.innerHTML = `
      <div class="text-warning animate-fade-in" style="font-size: 0.75rem;">
        <i class="fa-solid fa-triangle-exclamation me-1"></i> Connection lost to co-pilot.
        <div class="mt-2 text-secondary">
          <strong>Offline recommendation:</strong> Direct crowd flow from Gate 2 to Gate 3. Monitor Concourse density during peak half-time minutes.
        </div>
      </div>
    `;
  }
}

/**
 * Bind click switches to phase buttons
 */
function _bindActions() {
  const buttons = document.querySelectorAll('.sim-phase-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      // Remove active class
      buttons.forEach(b => b.classList.remove('active'));
      
      // Make clicked button active
      e.currentTarget.classList.add('active');
      
      // Update state
      activeMode = e.currentTarget.getAttribute('data-phase');
      toast.show('info', 'Stadium Phase Simulated', `Stadium shifted to: ${SIMULATION_MODES[activeMode].name}`);
      _updateSimulationState();
    });
  });
}

/**
 * Cleanup timers and canvas
 */
export function destroy() {
  if (trendChart) trendChart.destroy();
}

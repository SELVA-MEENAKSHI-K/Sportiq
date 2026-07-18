import { api } from '../services/api.js';
import { toast } from '../components/toast.js';

let salesChart = null;
let gateChart = null;
let incidentChart = null;
let staffChart = null;

const ANALYTICS_METRICS = {
  revenue: '$9,650,000',
  ticketsChecked: '74,200',
  safetyIndex: '98.8%',
  staffRatio: '48 / 50'
};

/**
 * Initializes Module 10: Analytics Dashboard
 * @param {HTMLElement} container 
 */
export async function init(container) {
  container.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h1 class="h3 fw-bold mb-1" style="letter-spacing: -0.5px;">Operations Analytics</h1>
        <p class="text-secondary mb-0" style="font-size: 0.9rem;">Examine performance stats across tickets checkout, safety incidents, and volunteer logs</p>
      </div>
      <div>
        <button class="btn btn-sm btn-warning fw-bold px-3" id="refresh-analytics-btn" style="border-radius:var(--border-radius-sm);"><i class="fa-solid fa-rotate-right me-1"></i> Sync Stats</button>
      </div>
    </div>

    <!-- Quick Executive Cards -->
    <div class="row g-4 mb-4">
      <!-- Card 1: Revenue -->
      <div class="col-md-6 col-lg-3 animate-fade-in">
        <div class="sportiq-card kpi-card">
          <div>
            <div class="text-muted" style="font-size: 0.75rem; font-weight: 600; text-transform: uppercase;">Total Ticket Revenue</div>
            <div class="kpi-value">${ANALYTICS_METRICS.revenue}</div>
            <div style="font-size:0.7rem; color: var(--text-muted);"><i class="fa-solid fa-circle-dollar-to-slot text-success me-1"></i> Matchday sales goal met</div>
          </div>
          <div class="kpi-icon"><i class="fa-solid fa-file-invoice-dollar text-success"></i></div>
        </div>
      </div>

      <!-- Card 2: Tickets Scanned -->
      <div class="col-md-6 col-lg-3 animate-fade-in" style="animation-delay: 0.05s;">
        <div class="sportiq-card kpi-card">
          <div>
            <div class="text-muted" style="font-size: 0.75rem; font-weight: 600; text-transform: uppercase;">Credentials Scanned</div>
            <div class="kpi-value">${ANALYTICS_METRICS.ticketsChecked}</div>
            <div style="font-size:0.7rem; color: var(--text-muted);"><i class="fa-solid fa-ticket text-primary me-1"></i> 90% of total check-in</div>
          </div>
          <div class="kpi-icon"><i class="fa-solid fa-qrcode text-primary"></i></div>
        </div>
      </div>

      <!-- Card 3: Safety index -->
      <div class="col-md-6 col-lg-3 animate-fade-in" style="animation-delay: 0.1s;">
        <div class="sportiq-card kpi-card">
          <div>
            <div class="text-muted" style="font-size: 0.75rem; font-weight: 600; text-transform: uppercase;">Safety Clearance Index</div>
            <div class="kpi-value">${ANALYTICS_METRICS.safetyIndex}</div>
            <div style="font-size:0.7rem; color: var(--text-muted);"><i class="fa-solid fa-shield-halved text-success me-1"></i> 7 of 8 incidents resolved</div>
          </div>
          <div class="kpi-icon"><i class="fa-solid fa-circle-check text-info"></i></div>
        </div>
      </div>

      <!-- Card 4: Staff Active -->
      <div class="col-md-6 col-lg-3 animate-fade-in" style="animation-delay: 0.15s;">
        <div class="sportiq-card kpi-card">
          <div>
            <div class="text-muted" style="font-size: 0.75rem; font-weight: 600; text-transform: uppercase;">Active Staff Roster</div>
            <div class="kpi-value">${ANALYTICS_METRICS.staffRatio}</div>
            <div style="font-size:0.7rem; color: var(--text-muted);"><i class="fa-solid fa-handshake text-success me-1"></i> 96% attendance rate</div>
          </div>
          <div class="kpi-icon"><i class="fa-solid fa-user-check text-warning"></i></div>
        </div>
      </div>
    </div>

    <!-- Main Analytics Grid -->
    <div class="row g-4">
      <div class="col-xl-8">
        <!-- Visualizations Grid -->
        <div class="row g-4">
          <!-- Chart 1: Ticket Sales & Revenue -->
          <div class="col-md-6">
            <div class="sportiq-card p-4" style="height: 300px; display: flex; flex-direction: column;">
              <h5 class="fw-bold mb-3" style="font-size: 0.95rem;">Checked-In vs Revenue (hourly)</h5>
              <div class="flex-grow-1 position-relative">
                <canvas id="salesRevenueChart"></canvas>
              </div>
            </div>
          </div>

          <!-- Chart 2: Gate Bottlenecks -->
          <div class="col-md-6">
            <div class="sportiq-card p-4" style="height: 300px; display: flex; flex-direction: column;">
              <h5 class="fw-bold mb-3" style="font-size: 0.95rem;">Gate Wait Times Timeline</h5>
              <div class="flex-grow-1 position-relative">
                <canvas id="gateWaitTrendsChart"></canvas>
              </div>
            </div>
          </div>

          <!-- Chart 3: Incident categories -->
          <div class="col-md-6">
            <div class="sportiq-card p-4" style="height: 300px; display: flex; flex-direction: column;">
              <h5 class="fw-bold mb-3" style="font-size: 0.95rem;">Incident Categories</h5>
              <div class="flex-grow-1 position-relative d-flex justify-content-center">
                <div style="width: 200px; height: 100%;">
                  <canvas id="incidentCategoriesChart"></canvas>
                </div>
              </div>
            </div>
          </div>

          <!-- Chart 4: Staff workloads -->
          <div class="col-md-6">
            <div class="sportiq-card p-4" style="height: 300px; display: flex; flex-direction: column;">
              <h5 class="fw-bold mb-3" style="font-size: 0.95rem;">Sector Staff Workload Allocation</h5>
              <div class="flex-grow-1 position-relative">
                <canvas id="staffWorkloadChart"></canvas>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: AI Report Compiler -->
      <div class="col-xl-4">
        <!-- Gemini AI Executive briefing card -->
        <div class="sportiq-card p-4 h-100" style="border: 1px solid rgba(212, 175, 55, 0.35); background: linear-gradient(135deg, var(--bg-card) 80%, rgba(212, 175, 55, 0.05) 100%); display: flex; flex-direction: column;">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <div class="d-flex align-items-center gap-2">
              <i class="fa-solid fa-wand-magic-sparkles text-warning animate-pulse" style="font-size: 1.15rem; filter: drop-shadow(0 0 5px var(--accent-blue));"></i>
              <h5 class="fw-bold mb-0" style="font-size: 0.95rem;">AI Executive Report Compiler</h5>
            </div>
            <span class="badge bg-warning text-dark fw-bold" style="font-size: 0.65rem;">Gemini Pro</span>
          </div>

          <div id="ai-report-compilation-content" style="font-size: 0.75rem; line-height: 1.45; flex-grow: 1;">
            <p class="text-secondary mb-0">Generate a comprehensive operational analytics summary briefing. Gemini co-pilot will aggregate financial results, crowd parameters, and incident indexes.</p>
          </div>
          <div class="d-grid mt-3">
            <button class="btn btn-warning fw-bold py-2" id="trigger-compile-report-btn"><i class="fa-solid fa-file-signature me-1"></i> Compile Executive Briefing</button>
          </div>
        </div>
      </div>
    </div>
  `;

  _bindActions();
  _renderCharts();
}

/**
 * Initializes and draws Chart.js figures
 */
function _renderCharts() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)';
  const textColor = isDark ? '#94a3b8' : '#475569';

  // Chart 1: Checked-In vs Revenue (double axis)
  const salesCtx = document.getElementById('salesRevenueChart');
  if (salesCtx) {
    if (salesChart) salesChart.destroy();
    salesChart = new Chart(salesCtx, {
      type: 'bar',
      data: {
        labels: ['15:00', '16:00', '17:00', '18:00'],
        datasets: [
          {
            label: 'Checked In',
            data: [15000, 32000, 54000, 74200],
            backgroundColor: 'rgba(13, 110, 253, 0.6)',
            yAxisID: 'y'
          },
          {
            label: 'Revenue ($)',
            data: [2000000, 4200000, 7100000, 9650000],
            type: 'line',
            borderColor: '#d4af37',
            backgroundColor: 'transparent',
            yAxisID: 'y1',
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 8 } } },
          y: { grid: { color: gridColor }, position: 'left', ticks: { color: textColor, font: { size: 8 } } },
          y1: { grid: { drawOnChartArea: false }, position: 'right', ticks: { color: textColor, font: { size: 8 } } }
        }
      }
    });
  }

  // Chart 2: Gate Wait time Trends
  const gateCtx = document.getElementById('gateWaitTrendsChart');
  if (gateCtx) {
    if (gateChart) gateChart.destroy();
    gateChart = new Chart(gateCtx, {
      type: 'line',
      data: {
        labels: ['15:00', '16:00', '17:00', '18:00'],
        datasets: [
          { label: 'Gate 1', data: [5, 12, 18, 8], borderColor: '#00dfa2', backgroundColor: 'transparent', tension: 0.3 },
          { label: 'Gate 2', data: [12, 22, 28, 14], borderColor: '#ff597b', backgroundColor: 'transparent', tension: 0.3 },
          { label: 'Gate 3', data: [4, 8, 10, 6], borderColor: '#0d6efd', backgroundColor: 'transparent', tension: 0.3 }
        ]
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

  // Chart 3: Incident Categories
  const incidentCtx = document.getElementById('incidentCategoriesChart');
  if (incidentCtx) {
    if (incidentChart) incidentChart.destroy();
    incidentChart = new Chart(incidentCtx, {
      type: 'doughnut',
      data: {
        labels: ['Medical', 'Security', 'Safety', 'Lost & Found'],
        datasets: [{
          data: [4, 2, 1, 1],
          backgroundColor: ['#ff597b', '#ffb84c', '#0d6efd', '#00dfa2'],
          borderColor: isDark ? '#0d1430' : '#fff',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } }
      }
    });
  }

  // Chart 4: Staff workloads (Horizontal Bar)
  const staffCtx = document.getElementById('staffWorkloadChart');
  if (staffCtx) {
    if (staffChart) staffChart.destroy();
    staffChart = new Chart(staffCtx, {
      type: 'bar',
      data: {
        labels: ['Gate Entry', 'Concourses', 'Stands', 'Lounge/Lobby'],
        datasets: [{
          label: 'Deployed Volunteers',
          data: [18, 12, 14, 4],
          backgroundColor: 'rgba(212, 175, 55, 0.7)',
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: 'y',
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
 * Triggers backend Gemini to compile executive briefings
 */
async function _runAiReportCompiler() {
  const container = document.getElementById('ai-report-compilation-content');
  if (!container) return;

  container.innerHTML = `
    <div class="d-flex align-items-center gap-2 mb-2 text-warning">
      <i class="fa-solid fa-wand-magic-sparkles fa-spin"></i>
      <div>Gemini compiling matchday database...</div>
    </div>
    <div class="skeleton-loading mb-2" style="height:10px; width:100%;"></div>
    <div class="skeleton-loading mb-2" style="height:10px; width:90%;"></div>
    <div class="skeleton-loading mb-2" style="height:10px; width:80%;"></div>
    <div class="skeleton-loading" style="height:10px; width:40%;"></div>
  `;

  try {
    const prompt = `
A stadium operations director requests a comprehensive executive Matchday Analytics Briefing at MetLife Stadium.
Current Metrics Summary:
- Total Checked-in Spectators: ${ANALYTICS_METRICS.ticketsChecked} fans
- Total Ticket Revenue: ${ANALYTICS_METRICS.revenue}
- Safety clearance Index: ${ANALYTICS_METRICS.safetyIndex} (7 of 8 calls resolved)
- Active Staff Ratio: ${ANALYTICS_METRICS.staffRatio} volunteers checked in (96% attendance)

Operational Bottlenecks:
- Gate 2 wait times peaked at 28 mins due to congestion.
- Medical call (heat exhaustion Section 104) successfully resolved.
- Concession orders placed: 120+ digital orders with 15% promotional apply.

Please compile an Executive Briefing:
1. Daily Summary: (High-level matches operations review)
2. Match Summary: (Operations numbers: revenue, gate flows, check-in progression)
3. AI Insights: (Logistics takeaways, concession digital ordering performance)
4. Risk Analysis: (Liability check: gate congestion bottlenecks, emergency containment times)
5. Operations Recommendations: (3 concrete actions for the next match day)
`;
    const systemInstruction = "You are the FIFA World Cup Executive Operations Director co-pilot. Your replies are formatted as highly professional, structured corporate briefing summaries.";
    
    const reply = await api.callGemini(prompt, systemInstruction);
    
    container.innerHTML = `
      <div class="animate-fade-in text-secondary" style="font-size: 0.75rem; line-height: 1.45;">
        <div class="fw-bold text-warning mb-2"><i class="fa-solid fa-file-invoice-dollar me-1"></i> Executive Matchday Report</div>
        ${reply.replace(/\n/g, '<br>')}
      </div>
    `;

    toast.show('success', 'Briefing Compiled', 'Match analytics briefing generated successfully.');
  } catch (err) {
    container.innerHTML = `
      <div class="text-warning animate-fade-in">
        <i class="fa-solid fa-triangle-exclamation me-1"></i> Connection to executive co-pilot lost.
        <div class="mt-2 text-secondary">
          <strong>Offline analytics summary:</strong> Checked-in 74,200 fans. Revenue $9.65M. Safety Index 98.8%. Recommends additional volunteer lanes at Gate 2 for future high-attendance final matches.
        </div>
      </div>
    `;
  }
}

/**
 * Binds actions to controls
 */
function _bindActions() {
  document.getElementById('refresh-analytics-btn')?.addEventListener('click', () => {
    toast.show('info', 'Syncing Analytics', 'Re-drawing Chart datasets...');
    _renderCharts();
    toast.show('success', 'Stats Synchronized', 'Operations databases up to date.');
  });

  // Gemini buttons
  document.getElementById('trigger-compile-report-btn')?.addEventListener('click', _runAiReportCompiler);
}

/**
 * Clears charts when leaving
 */
export function destroy() {
  if (salesChart) salesChart.destroy();
  if (gateChart) gateChart.destroy();
  if (incidentChart) incidentChart.destroy();
  if (staffChart) staffChart.destroy();
}

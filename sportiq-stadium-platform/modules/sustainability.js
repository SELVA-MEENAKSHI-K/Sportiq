import { api } from '../services/api.js';
import { toast } from '../components/toast.js';

let resourceChart = null;
let currentElectricity = 11400; // kW
let currentWater = 145000;      // Gallons
let currentRecyclingRate = 64;   // %
let currentCarbonOffset = 8.2;   // Tons CO2

const LIMIT_ELECTRICITY = 15000;
const LIMIT_WATER = 200000;

/**
 * Initializes Module 11: Sustainability
 * @param {HTMLElement} container 
 */
export async function init(container) {
  container.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h1 class="h3 fw-bold mb-1" style="letter-spacing: -0.5px;">Resource & Sustainability</h1>
        <p class="text-secondary mb-0" style="font-size: 0.9rem;">Monitor live grid electrical load, water consumption flow, waste recycling indexes, and carbon offsets</p>
      </div>
      <div>
        <span class="sportiq-badge sportiq-badge-success" id="sustainability-global-status">Stadium Grid Stable</span>
      </div>
    </div>

    <div class="row g-4">
      <!-- Left Column: Utility Meters & Timeline -->
      <div class="col-xl-7">
        <!-- Resource Meters list -->
        <div class="row g-3 mb-4" id="sustainability-meters-grid">
          <!-- Populated dynamically -->
        </div>

        <!-- Resource usage timeline -->
        <div class="sportiq-card p-4 mb-4">
          <h5 class="fw-bold mb-3" style="font-size: 0.95rem;"><i class="fa-solid fa-chart-area text-success me-2"></i> Hourly Utility Consumption Profile</h5>
          <div style="height: 220px; position: relative;">
            <canvas id="resourceConsumptionChart"></canvas>
          </div>
        </div>

        <!-- Carbon Footprint Calculator -->
        <div class="sportiq-card p-4">
          <h5 class="fw-bold mb-3" style="font-size: 0.95rem;"><i class="fa-solid fa-leaf text-success me-2"></i> Matchday Carbon Footprint Calculator</h5>
          
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label" for="calc-attendance" style="font-size: 0.75rem; color: var(--text-secondary);">Estimated Match Attendance</label>
              <input type="number" class="form-control glass-input form-control-sm" id="calc-attendance" value="65000" min="0" max="90000" style="font-size:0.75rem;">
            </div>
            
            <div class="col-md-6">
              <label class="form-label" for="calc-transit" style="font-size: 0.75rem; color: var(--text-secondary);">Fan Public Transit Usage (%)</label>
              <input type="number" class="form-control glass-input form-control-sm" id="calc-transit" value="60" min="0" max="100" style="font-size:0.75rem;">
            </div>

            <div class="col-md-6">
              <label class="form-label" for="calc-orders" style="font-size: 0.75rem; color: var(--text-secondary);">Concession Food Orders</label>
              <input type="number" class="form-control glass-input form-control-sm" id="calc-orders" value="45000" min="0" style="font-size:0.75rem;">
            </div>

            <div class="col-md-6">
              <label class="form-label" for="calc-grid-load" style="font-size: 0.75rem; color: var(--text-secondary);">Energy Grid Load (kW)</label>
              <input type="number" class="form-control glass-input form-control-sm" id="calc-grid-load" value="11400" min="0" style="font-size:0.75rem;">
            </div>
          </div>

          <!-- Calculation outputs -->
          <div class="mt-4 p-3 border rounded d-flex align-items-center justify-content-between" style="border-color: var(--border-color) !important; background: var(--bg-secondary);">
            <div>
              <div style="font-size:0.7rem; color: var(--text-muted); text-transform:uppercase; font-weight:700;">Est. Carbon Footprint</div>
              <div class="fw-bold mb-1" style="font-size: 1.45rem; color: var(--text-primary);" id="calc-footprint-result">263.6 Tons CO₂</div>
              <div style="font-size: 0.7rem; color: var(--text-secondary);" id="calc-footprint-status">Click Calculate to evaluate telemetry footprints.</div>
            </div>
            <button class="btn btn-sm btn-success fw-bold px-3 py-2" id="trigger-calc-footprint-btn" style="font-size: 0.75rem;"><i class="fa-solid fa-calculator me-1"></i> Calculate</button>
          </div>

          <!-- Emission breakdown (updated dynamically) -->
          <div class="mt-3 p-3 border rounded" id="calc-breakdown-container" style="border-color: var(--border-color) !important; background: rgba(255,255,255,0.01); display: none;">
            <div class="d-flex justify-content-between align-items-center mb-2" style="font-size: 0.72rem;">
              <span class="text-secondary"><i class="fa-solid fa-car text-primary me-2"></i> Fan Commuting Travel</span>
              <span class="fw-bold text-secondary" id="breakdown-travel">--- Tons CO₂</span>
            </div>
            <div class="d-flex justify-content-between align-items-center mb-2" style="font-size: 0.72rem;">
              <span class="text-secondary"><i class="fa-solid fa-utensils text-success me-2"></i> Concessions & Dining</span>
              <span class="fw-bold text-secondary" id="breakdown-food">--- Tons CO₂</span>
            </div>
            <div class="d-flex justify-content-between align-items-center" style="font-size: 0.72rem;">
              <span class="text-secondary"><i class="fa-solid fa-bolt text-warning me-2"></i> Grid Power Consumption</span>
              <span class="fw-bold text-secondary" id="breakdown-power">--- Tons CO₂</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: AI green audits co-pilot & alerts -->
      <div class="col-xl-5">
        <!-- AI Green Advisor Card -->
        <div class="sportiq-card p-4 mb-4" style="border: 1px solid rgba(0, 223, 162, 0.35); background: linear-gradient(135deg, var(--bg-card) 80%, rgba(0, 223, 162, 0.05) 100%);">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <div class="d-flex align-items-center gap-2">
              <i class="fa-solid fa-wand-magic-sparkles text-success animate-pulse" style="font-size: 1.15rem; filter: drop-shadow(0 0 5px var(--color-success));"></i>
              <h5 class="fw-bold mb-0" style="font-size: 0.95rem;">AI Sustainability Advisor</h5>
            </div>
            <span class="badge bg-success text-dark fw-bold" style="font-size: 0.65rem;">Gemini Pro</span>
          </div>

          <div id="ai-sustainability-brief-container" style="font-size: 0.75rem; line-height: 1.45;">
            <p class="text-secondary mb-0">AI co-pilot is ready to analyze utility grids and formulate optimization recommendations. Click calculate to request carbon offsets and power dimming plans.</p>
          </div>
          <div class="d-grid mt-3">
            <button class="btn btn-success fw-bold py-2" id="trigger-green-audit-btn"><i class="fa-solid fa-seedling me-1"></i> Compile Sustainability Audit</button>
          </div>
        </div>

        <!-- Utility Grid active alerts log -->
        <div class="sportiq-card p-4">
          <h5 class="fw-bold mb-3" style="font-size: 0.95rem;"><i class="fa-solid fa-triangle-exclamation text-danger me-2"></i> Grid Advisories Log</h5>
          <div class="d-flex flex-column gap-2" id="sustainability-alerts-container" style="font-size: 0.75rem;">
            <!-- Dynamic alerts generated based on slider thresholds -->
          </div>
        </div>
      </div>
    </div>
  `;

  _bindActions();
  _updateState();
}

/**
 * Updates dials percentages, alerts triggers, and draws charts
 */
function _updateState() {
  // Update Global grid status badge
  const statusBadge = document.getElementById('sustainability-global-status');
  const alertContainer = document.getElementById('sustainability-alerts-container');
  const alerts = [];

  const elecPercent = Math.round((currentElectricity / LIMIT_ELECTRICITY) * 100);
  const waterPercent = Math.round((currentWater / LIMIT_WATER) * 100);

  const isElecHigh = currentElectricity > 12000;
  const isWaterHigh = currentWater > 160000;

  if (statusBadge) {
    if (isElecHigh || isWaterHigh) {
      statusBadge.textContent = 'Grid Demand Warnings';
      statusBadge.className = 'sportiq-badge sportiq-badge-warning';
    } else {
      statusBadge.textContent = 'Stadium Grid Stable';
      statusBadge.className = 'sportiq-badge sportiq-badge-success';
    }
  }

  // Populate alerts log
  if (isElecHigh) {
    alerts.push(`<div class="p-2 border-start border-warning bg-warning-subtle text-warning mb-2 rounded" style="background: rgba(255,184,76,0.06) !important;"><i class="fa-solid fa-bolt me-1"></i> Peak Electrical Grid Load Alert: Stadium grid is drawing <strong>${currentElectricity.toLocaleString()} kW</strong> (${elecPercent}% capacity). Recommend dims concourse boards.</div>`);
  }
  if (isWaterHigh) {
    alerts.push(`<div class="p-2 border-start border-warning bg-warning-subtle text-warning mb-2 rounded" style="background: rgba(255,184,76,0.06) !important;"><i class="fa-solid fa-droplet me-1"></i> High Water Flow Rate: Bathrooms concourse line B drawing <strong>${currentWater.toLocaleString()} Gallons</strong> (${waterPercent}% capacity).</div>`);
  }
  
  if (alertContainer) {
    alertContainer.innerHTML = alerts.join('') || `<div class="text-center text-muted py-3">All stadium grids and utilities running green energy indices.</div>`;
  }

  // Render Meters Grid
  const metersGrid = document.getElementById('sustainability-meters-grid');
  if (metersGrid) {
    metersGrid.innerHTML = `
      <!-- Electricity Meter -->
      <div class="col-md-6 animate-fade-in">
        <div class="sportiq-card p-3 h-100 d-flex flex-column justify-content-between">
          <div>
            <div class="d-flex justify-content-between align-items-center mb-1">
              <span class="fw-bold" style="font-size:0.85rem; color: var(--text-primary);"><i class="fa-solid fa-bolt text-warning me-1"></i> Power demand</span>
              <span class="sportiq-badge badge-${isElecHigh ? 'warning' : 'success'}" style="font-size: 0.6rem; padding: 1px 6px;">${isElecHigh ? 'Peak' : 'Optimal'}</span>
            </div>
            <div class="kpi-value" style="font-size:1.45rem;">${currentElectricity.toLocaleString()} <span style="font-size:0.7rem; color:var(--text-muted);">kW</span></div>
          </div>
          <div class="progress-bar-custom mb-3">
            <div class="progress-bar-fill ${isElecHigh ? 'bg-warning' : 'bg-success'}" style="width: ${elecPercent}%;"></div>
          </div>
          <div class="d-flex align-items-center gap-2">
            <input type="range" class="form-range flex-grow-1 load-slider" data-type="elec" min="5000" max="15000" value="${currentElectricity}" style="height:4px;">
            <span class="fw-bold text-secondary" style="font-size: 0.7rem;">${elecPercent}%</span>
          </div>
        </div>
      </div>

      <!-- Water Meter -->
      <div class="col-md-6 animate-fade-in" style="animation-delay: 0.05s;">
        <div class="sportiq-card p-3 h-100 d-flex flex-column justify-content-between">
          <div>
            <div class="d-flex justify-content-between align-items-center mb-1">
              <span class="fw-bold" style="font-size:0.85rem; color: var(--text-primary);"><i class="fa-solid fa-droplet text-info me-1"></i> Water Consumption</span>
              <span class="sportiq-badge badge-${isWaterHigh ? 'warning' : 'success'}" style="font-size: 0.6rem; padding: 1px 6px;">${isWaterHigh ? 'High' : 'Optimal'}</span>
            </div>
            <div class="kpi-value" style="font-size:1.45rem;">${currentWater.toLocaleString()} <span style="font-size:0.7rem; color:var(--text-muted);">Gal</span></div>
          </div>
          <div class="progress-bar-custom mb-3">
            <div class="progress-bar-fill ${isWaterHigh ? 'bg-warning' : 'bg-success'}" style="width: ${waterPercent}%;"></div>
          </div>
          <div class="d-flex align-items-center gap-2">
            <input type="range" class="form-range flex-grow-1 load-slider" data-type="water" min="50000" max="200000" value="${currentWater}" style="height:4px;">
            <span class="fw-bold text-secondary" style="font-size: 0.7rem;">${waterPercent}%</span>
          </div>
        </div>
      </div>

      <!-- Waste & Recycling -->
      <div class="col-md-6 animate-fade-in" style="animation-delay: 0.1s;">
        <div class="sportiq-card p-3 h-100 d-flex flex-column justify-content-between">
          <div>
            <div class="d-flex justify-content-between align-items-center mb-1">
              <span class="fw-bold" style="font-size:0.85rem; color: var(--text-primary);"><i class="fa-solid fa-recycle text-success me-1"></i> Recycling Index</span>
              <span class="sportiq-badge sportiq-badge-success" style="font-size: 0.6rem; padding: 1px 6px;">Eco Positive</span>
            </div>
            <div class="kpi-value" style="font-size:1.45rem;">${currentRecyclingRate}% <span style="font-size:0.7rem; color:var(--text-muted);">Recycled</span></div>
          </div>
          <div class="progress-bar-custom mb-3">
            <div class="progress-bar-fill bg-success" style="width: ${currentRecyclingRate}%;"></div>
          </div>
          <div class="d-flex align-items-center gap-2">
            <input type="range" class="form-range flex-grow-1 load-slider" data-type="recycle" min="30" max="95" value="${currentRecyclingRate}" style="height:4px;">
            <span class="fw-bold text-secondary" style="font-size: 0.7rem;">Target: 75%</span>
          </div>
        </div>
      </div>

      <!-- Carbon Offset Offset -->
      <div class="col-md-6 animate-fade-in" style="animation-delay: 0.15s;">
        <div class="sportiq-card p-3 h-100 d-flex flex-column justify-content-between" style="background: linear-gradient(135deg, var(--bg-card) 80%, rgba(0,223,162,0.04) 100%);">
          <div>
            <span class="fw-bold" style="font-size:0.85rem; color: var(--text-primary);"><i class="fa-solid fa-leaf text-success me-1"></i> Solar CO2 Offsets</span>
            <div class="kpi-value" style="font-size:1.45rem;">${currentCarbonOffset} <span style="font-size:0.7rem; color:var(--text-muted);">Tons CO2 Offset</span></div>
            <div style="font-size: 0.7rem; color: var(--text-muted);" class="mt-2"><i class="fa-solid fa-solar-panel text-success me-1"></i> Generated via roof solar array panel sweeps.</div>
          </div>
        </div>
      </div>
    `;

    // Re-bind dynamically generated sliders
    _bindSliders();
  }

  // Draw timeline
  _renderResourceChart();
}

/**
 * Binds dynamically rendered meters sliders inputs
 */
function _bindSliders() {
  document.querySelectorAll('.load-slider').forEach(slider => {
    slider.addEventListener('change', (e) => {
      const type = e.target.getAttribute('data-type');
      const val = parseInt(e.target.value);

      if (type === 'elec') {
        currentElectricity = val;
        currentCarbonOffset = parseFloat((val * 0.0007).toFixed(1)); // mock carbon offset logic
        toast.show('info', 'Grid Electricity Modified', `Demand set to ${val} kW`);
      } else if (type === 'water') {
        currentWater = val;
        toast.show('info', 'Water Flow Modified', `Rate set to ${val} Gallons`);
      } else if (type === 'recycle') {
        currentRecyclingRate = val;
        toast.show('info', 'Recycling Target Modified', `Ratios set to ${val}%`);
      }

      _updateState();
    });
  });
}

/**
 * Draws resource lines using Chart.js
 */
function _renderResourceChart() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)';
  const textColor = isDark ? '#94a3b8' : '#475569';

  const ctx = document.getElementById('resourceConsumptionChart');
  if (ctx) {
    if (resourceChart) resourceChart.destroy();
    resourceChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['15:00', '16:00', '17:00', '18:00'],
        datasets: [
          {
            label: 'Electricity Load (kW)',
            data: [8200, 9600, 10800, currentElectricity],
            borderColor: '#ffb84c',
            backgroundColor: 'rgba(255, 184, 76, 0.05)',
            tension: 0.3,
            borderWidth: 2
          },
          {
            label: 'Water Consumption (Gal)',
            data: [90000, 115000, 132000, currentWater],
            borderColor: '#0d6efd',
            backgroundColor: 'rgba(13, 110, 253, 0.05)',
            tension: 0.3,
            borderWidth: 2,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 9 } } },
          y: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 9 } } },
          y1: { grid: { drawOnChartArea: false }, position: 'right', ticks: { color: textColor, font: { size: 9 } } }
        }
      }
    });
  }
}

/**
 * Triggers backend Gemini to compile carbon audit briefings
 */
async function _runAiGreenAudit() {
  const container = document.getElementById('ai-sustainability-brief-container');
  if (!container) return;

  container.innerHTML = `
    <div class="d-flex align-items-center gap-2 mb-2 text-warning">
      <i class="fa-solid fa-wand-magic-sparkles fa-spin"></i>
      <div>Gemini compiling resource offsets...</div>
    </div>
    <div class="skeleton-loading mb-2" style="height:10px; width:100%;"></div>
    <div class="skeleton-loading mb-2" style="height:10px; width:80%;"></div>
    <div class="skeleton-loading" style="height:10px; width:45%;"></div>
  `;

  try {
    const prompt = `
A stadium operations manager requests a detailed Sustainability & Resource Optimization Audit.
Metrics Context:
- Grid Electricity draw: ${currentElectricity.toLocaleString()} kW (limit peak is 15,000 kW)
- Water flow rate: ${currentWater.toLocaleString()} Gallons (limit peak is 200,000 Gallons)
- Concession waste Recycling index: ${currentRecyclingRate}%
- Solar energy carbon offset today: ${currentCarbonOffset} Tons CO2

Please generate a structured Green Audit Report:
1. Grid Load Evaluation: (Briefly analyze efficiency)
2. Energy-Saving Opportunities: (Provide 3 immediate actions. E.g. dimming scoreboards, adjusting concourse temperature zones)
3. Waste Reduction Directives: (Concession guidelines)
4. Long-Term Improvements: (Recommend rain water harvesting or green integrations)
`;
    const systemInstruction = "You are the MetLife Stadium Environmental Operations Director co-pilot. Your replies are structured, direct, and outline green energy containment optimizations.";
    
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

    const reply = await api.callGemini(prompt, systemInstruction);
    
    container.innerHTML = `
      <div class="animate-fade-in text-secondary" style="font-size: 0.75rem; line-height: 1.45;">
        <div class="fw-bold text-success mb-2"><i class="fa-solid fa-leaf me-1"></i> AI Sustainability Audit</div>
        ${_safeMarkdown(reply)}
      </div>
    `;

    toast.show('success', 'Green Audit Generated', 'AI energy recommendations updated.');
  } catch (err) {
    container.innerHTML = `
      <div class="text-warning animate-fade-in">
        <i class="fa-solid fa-triangle-exclamation me-1"></i> Environment co-pilot link timed out.
        <div class="mt-2 text-secondary">
          <strong>Offline Audits Recommendation:</strong> Dim scoreboards by 20% during active halves. Instruct concessions to restrict single-use plastics under local directives.
        </div>
      </div>
    `;
  }
}

/**
 * Computes the carbon footprint based on matchday parameters
 */
function _calculateCarbonFootprint() {
  const attendance = parseFloat(document.getElementById('calc-attendance')?.value) || 0;
  const transit = parseFloat(document.getElementById('calc-transit')?.value) || 0;
  const orders = parseFloat(document.getElementById('calc-orders')?.value) || 0;
  const gridLoad = parseFloat(document.getElementById('calc-grid-load')?.value) || 0;

  // 1. Travel: 0.005 Tons CO2/car driver, 0.001 Tons CO2/transit rider
  const drivingFans = attendance * (1 - transit / 100);
  const transitFans = attendance * (transit / 100);
  const travelEmissions = (drivingFans * 0.005) + (transitFans * 0.001);

  // 2. Concession orders: 0.002 Tons CO2/meal
  const foodEmissions = orders * 0.002;

  // 3. Grid load draw: 0.0004 Tons CO2/kW
  const powerEmissions = gridLoad * 0.0004;

  const total = parseFloat((travelEmissions + foodEmissions + powerEmissions).toFixed(1));

  const resultContainer = document.getElementById('calc-footprint-result');
  if (resultContainer) {
    resultContainer.textContent = `${total.toLocaleString()} Tons CO₂`;
  }

  // Update status summary text
  const statusContainer = document.getElementById('calc-footprint-status');
  if (statusContainer) {
    statusContainer.innerHTML = `<span class="text-success fw-bold"><i class="fa-solid fa-circle-check me-1"></i> Estimated emissions: ${total.toLocaleString()} Tons CO₂</span>`;
  }

  // Update breakdown panels
  const breakdownContainer = document.getElementById('calc-breakdown-container');
  if (breakdownContainer) {
    breakdownContainer.style.display = 'block';
    
    document.getElementById('breakdown-travel').textContent = `${parseFloat(travelEmissions.toFixed(1)).toLocaleString()} Tons CO₂`;
    document.getElementById('breakdown-food').textContent = `${parseFloat(foodEmissions.toFixed(1)).toLocaleString()} Tons CO₂`;
    document.getElementById('breakdown-power').textContent = `${parseFloat(powerEmissions.toFixed(1)).toLocaleString()} Tons CO₂`;
  }

  toast.show('success', 'Carbon Footprint Calculated', `Estimated match emissions computed: ${total} Tons CO₂`);
}

/**
 * Binds click controls
 */
function _bindActions() {
  document.getElementById('trigger-green-audit-btn')?.addEventListener('click', _runAiGreenAudit);
  document.getElementById('trigger-calc-footprint-btn')?.addEventListener('click', _calculateCarbonFootprint);
}

/**
 * Clears charts when leaving
 */
export function destroy() {
  if (resourceChart) resourceChart.destroy();
}

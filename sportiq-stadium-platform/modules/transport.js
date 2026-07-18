import { firebase } from '../services/firebase.js';
import { api } from '../services/api.js';
import { toast } from '../components/toast.js';

let unsubscribeParking = null;
let parkingLots = [];
let activeTransitTab = 'metro';
let activeEgressStart = 'Gate 2';
let activeEgressDest = 'Manhattan';

const TRANSIT_SCHEDULES = {
  metro: [
    { target: 'Secaucus Junction Express', platform: 'Platform 1', time: '4 mins', load: '92% Full', status: 'danger' },
    { target: 'Hoboken Local Connector', platform: 'Platform 2', time: '11 mins', load: '45% Full', status: 'success' },
    { target: 'Secaucus Junction Shuttle', platform: 'Platform 1', time: '18 mins', load: '10% Full', status: 'success' }
  ],
  bus: [
    { target: 'NYC Port Authority Direct (B1)', platform: 'Bay 3', time: '6 mins', load: '78% Full', status: 'warning' },
    { target: 'Newark Penn Station Local (B4)', platform: 'Bay 5', time: '14 mins', load: '52% Full', status: 'success' },
    { target: 'Secaucus Hub Shuttle (B2)', platform: 'Bay 2', time: '22 mins', load: '30% Full', status: 'success' }
  ],
  taxi: [
    { target: 'Uber / Lyft Dispatch Zone', platform: 'Zone A Exit', time: '24 mins wait', load: '88 cars active', status: 'danger' },
    { target: 'Yellow Cab Stand', platform: 'Zone B Circle', time: '16 mins wait', load: '32 cabs active', status: 'warning' }
  ]
};

/**
 * Initializes Module 7: Parking & Transportation
 * @param {HTMLElement} container 
 */
export async function init(container) {
  container.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h1 class="h3 fw-bold mb-1" style="letter-spacing: -0.5px;">Transit & Parking Control</h1>
        <p class="text-secondary mb-0" style="font-size: 0.9rem;">Monitor parking zone occupancy, public metro/bus departures, and optimize egress routing</p>
      </div>
      <div>
        <span class="sportiq-badge sportiq-badge-success">GPS Dispatch Online</span>
      </div>
    </div>

    <div class="row g-4">
      <!-- Left Column: Parking Monitor & Transit Board -->
      <div class="col-xl-7">
        <!-- Parking Monitor Card -->
        <div class="sportiq-card p-4 mb-4">
          <h5 class="fw-bold mb-3" style="font-size: 0.95rem;"><i class="fa-solid fa-square-parking text-info me-2"></i> Parking Lot Occupancy</h5>
          
          <div class="d-flex flex-column gap-3" id="parking-lots-list-container">
            <!-- Dynamically populated progress bars and slots info -->
          </div>
        </div>

        <!-- Public Transit Schedule Board -->
        <div class="sportiq-card p-4">
          <div class="d-flex flex-column flex-sm-row justify-content-between align-items-stretch align-items-sm-center gap-2 mb-3">
            <h5 class="fw-bold mb-0" style="font-size: 0.95rem;"><i class="fa-solid fa-train text-primary me-2"></i> Departure Board</h5>
            
            <!-- Tabs -->
            <div class="btn-group" role="group">
              <input type="radio" class="btn-check" name="transit-tab" id="tab-metro-radio" autocomplete="off" checked>
              <label class="btn btn-sm btn-outline-secondary py-1" style="font-size:0.75rem;" for="tab-metro-radio"><i class="fa-solid fa-train me-1"></i> Metro</label>
              
              <input type="radio" class="btn-check" name="transit-tab" id="tab-bus-radio" autocomplete="off">
              <label class="btn btn-sm btn-outline-secondary py-1" style="font-size:0.75rem;" for="tab-bus-radio"><i class="fa-solid fa-bus me-1"></i> Bus Shuttles</label>
              
              <input type="radio" class="btn-check" name="transit-tab" id="tab-taxi-radio" autocomplete="off">
              <label class="btn btn-sm btn-outline-secondary py-1" style="font-size:0.75rem;" for="tab-taxi-radio"><i class="fa-solid fa-taxi me-1"></i> Rideshare</label>
            </div>
          </div>

          <!-- Transit departures table -->
          <div class="table-responsive">
            <table class="sportiq-table" style="font-size: 0.8rem;">
              <thead>
                <tr>
                  <th>Destination Route</th>
                  <th>Terminal Bay</th>
                  <th>Departure In</th>
                  <th>Queue/Capacity</th>
                  <th class="text-end">Status</th>
                </tr>
              </thead>
              <tbody id="transit-departures-body">
                <!-- Dynamically loaded departures -->
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Right Column: Egress planner & AI transit co-pilot -->
      <div class="col-xl-5">
        <!-- AI Egress Advisor Card -->
        <div class="sportiq-card p-4 mb-4" style="border: 1px solid rgba(212, 175, 55, 0.35); background: linear-gradient(135deg, var(--bg-card) 80%, rgba(212, 175, 55, 0.05) 100%);">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <div class="d-flex align-items-center gap-2">
              <i class="fa-solid fa-wand-magic-sparkles text-warning animate-pulse" style="font-size: 1.15rem; filter: drop-shadow(0 0 5px var(--accent-blue));"></i>
              <h5 class="fw-bold mb-0" style="font-size: 0.95rem;">AI Egress Wayfinder</h5>
            </div>
            <span class="badge bg-warning text-dark fw-bold" style="font-size: 0.65rem;">Gemini Pro</span>
          </div>

          <div class="row g-2 mb-3">
            <div class="col-6">
              <label class="form-label" style="font-size: 0.75rem; color: var(--text-secondary);">Start Location</label>
              <select class="form-select glass-input form-select-sm" style="font-size: 0.8rem;" id="egress-start-select">
                <option value="Gate A" selected>Gate A (East Stands)</option>
                <option value="Gate B">Gate B (West Stands)</option>
                <option value="Gate C">Gate C (North Plaza)</option>
                <option value="VIP Entrance">VIP Main (South Suites)</option>
              </select>
            </div>
            <div class="col-6">
              <label class="form-label" style="font-size: 0.75rem; color: var(--text-secondary);">Egress Target</label>
              <select class="form-select glass-input form-select-sm" style="font-size: 0.8rem;" id="egress-dest-select">
                <option value="Manhattan" selected>Manhattan Direct</option>
                <option value="Secaucus Hub">Secaucus Hub</option>
                <option value="Newark Airport">Newark Airport</option>
                <option value="Local Hotels North">Local Hotels North</option>
              </select>
            </div>
          </div>

          <div id="ai-egress-brief-container" style="font-size: 0.75rem; line-height: 1.45;">
            <p class="text-secondary mb-0">Select departure zones and destinations, then calculate paths. Gemini co-pilot will recommend the fastest exit routing, best lots, and least crowded travel modes.</p>
          </div>
          <div class="d-grid mt-3">
            <button class="btn btn-warning fw-bold py-2" id="trigger-egress-plan-btn"><i class="fa-solid fa-compass me-1"></i> Request AI Egress Guidance</button>
          </div>
        </div>

        <!-- Quick Transport Notifications -->
        <div class="sportiq-card p-4">
          <h5 class="fw-bold mb-3" style="font-size: 0.95rem;"><i class="fa-solid fa-circle-exclamation text-danger me-2"></i> Transport Advisories</h5>
          <div class="d-flex flex-column gap-2" style="font-size: 0.75rem;">
            <div class="p-2 border-start border-danger bg-danger-subtle text-danger rounded" style="background: rgba(255,89,123,0.06) !important;">
              <i class="fa-solid fa-triangle-exclamation me-1"></i> <strong>Rideshare Queue:</strong> Uber/Lyft pickup zones experiencing severe traffic congestion. Wait times exceed 24 minutes.
            </div>
            <div class="p-2 border-start border-warning bg-warning-subtle text-warning rounded" style="background: rgba(255,184,76,0.06) !important;">
              <i class="fa-solid fa-circle-exclamation me-1"></i> <strong>Parking Zone A:</strong> Gold parking lot is 96% full. General entries directed to Zone B.
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  _bindActions();
  _subscribeParking();
  _renderTransitDepartures();
}

/**
 * Subscribes to parking database entries
 */
function _subscribeParking() {
  unsubscribeParking = firebase.subscribeCollection('parking', (docs) => {
    parkingLots = docs;
    _renderParkingLots();
  });
}

/**
 * Renders parking lot occupancies list with sliders
 */
function _renderParkingLots() {
  const container = document.getElementById('parking-lots-list-container');
  if (!container) return;

  if (parkingLots.length === 0) {
    container.innerHTML = `<div class="text-center text-muted py-4">No parking zones database records found.</div>`;
    return;
  }

  container.innerHTML = parkingLots.map(lot => {
    const percent = Math.round((lot.occupied / lot.total) * 100);
    const isFull = percent >= 95;
    const isCrit = percent >= 80 && percent < 95;
    
    let barColor = 'bg-success';
    let statusClass = 'success';
    let statusLabel = lot.status || 'Available';
    
    if (isFull) {
      barColor = 'bg-danger';
      statusClass = 'danger';
      statusLabel = 'Full';
    } else if (isCrit) {
      barColor = 'bg-warning';
      statusClass = 'warning';
      statusLabel = 'Critical';
    }

    return `
      <div class="p-3 border rounded animate-fade-in" style="border-color: var(--border-color) !important; background: rgba(255,255,255,0.01);">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <div>
            <span class="fw-bold" style="font-size: 0.85rem; color: var(--text-primary);">${lot.zone}</span>
            <div style="font-size: 0.7rem; color: var(--text-muted);">Occupancy: <strong>${lot.occupied.toLocaleString()}</strong> / ${lot.total.toLocaleString()} slots</div>
          </div>
          <span class="sportiq-badge badge-${statusClass}" style="font-size: 0.65rem; padding: 1px 8px;">${statusLabel}</span>
        </div>
        <div class="progress-bar-custom mb-3">
          <div class="progress-bar-fill ${barColor}" style="width: ${percent}%;"></div>
        </div>
        <!-- Occupancy adjustment slider -->
        <div class="d-flex align-items-center gap-2">
          <span style="font-size: 0.65rem; color: var(--text-muted); width: 80px;">Modify Slots:</span>
          <input type="range" class="form-range flex-grow-1 lot-slider" data-id="${lot.id}" min="0" max="${lot.total}" value="${lot.occupied}" style="height:4px;">
          <span class="fw-bold text-secondary" style="font-size: 0.7rem; width: 35px; text-align:right;">${percent}%</span>
        </div>
      </div>
    `;
  }).join('');

  // Bind slider changes
  container.querySelectorAll('.lot-slider').forEach(slider => {
    slider.addEventListener('change', async (e) => {
      const id = e.target.getAttribute('data-id');
      const val = parseInt(e.target.value);
      const lot = parkingLots.find(l => l.id === id);
      
      if (lot) {
        const percent = Math.round((val / lot.total) * 100);
        let status = 'Available';
        if (percent >= 95) status = 'Full';
        else if (percent >= 80) status = 'Critical';
        
        await firebase.setDocument('parking', id, { occupied: val, status });
        toast.show('info', 'Parking Slots Modified', `${lot.zone} occupancy set to ${val}`);
      }
    });
  });
}

/**
 * Renders Transit Departure Schedules
 */
function _renderTransitDepartures() {
  const body = document.getElementById('transit-departures-body');
  if (!body) return;

  const data = TRANSIT_SCHEDULES[activeTransitTab];

  body.innerHTML = data.map(item => `
    <tr class="animate-fade-in">
      <td><div class="fw-bold" style="color: var(--text-primary);"><i class="fa-solid fa-circle-chevron-right text-muted me-1"></i> ${item.target}</div></td>
      <td><strong>${item.platform}</strong></td>
      <td class="fw-bold text-warning">${item.time}</td>
      <td>${item.load}</td>
      <td class="text-end">
        <span class="sportiq-badge badge-${item.status}" style="padding: 1px 6px;">
          ${item.status === 'success' ? 'ON TIME' : (item.status === 'warning' ? 'DELAY' : 'HOLD')}
        </span>
      </td>
    </tr>
  `).join('');
}

/**
 * Triggers backend Gemini to plan travel egress paths
 */
async function _runAiEgressPlan() {
  const container = document.getElementById('ai-egress-brief-container');
  if (!container) return;

  container.innerHTML = `
    <div class="d-flex align-items-center gap-2 mb-2 text-warning">
      <i class="fa-solid fa-wand-magic-sparkles fa-spin"></i>
      <div>Gemini computing travel egress paths...</div>
    </div>
    <div class="skeleton-loading mb-2" style="height:10px; width:100%;"></div>
    <div class="skeleton-loading mb-2" style="height:10px; width:90%;"></div>
    <div class="skeleton-loading" style="height:10px; width:50%;"></div>
  `;

  try {
    const prompt = `
Generate a stadium egress travel recommendation for a spectator departing MetLife Stadium.
Egress Parameters:
- Start Arena Gate: ${activeEgressStart}
- Target Destination: ${activeEgressDest}

Staging Metrics Context:
- Parking occupancy: Zone A Gold is 96% full (Full), Zone B General is 77% full.
- Rideshare (Uber/Lyft) wait time: 24 minutes wait, severe congestion.
- Metro departs: Train to Secaucus Platform 1 leaving in 4 mins (92% full), Hobart Connector Platform 2 in 11 mins (45% full).
- Bus Bay departures: NYC Direct coach leaves in 6 mins (78% full).

Generate a structured Travel Advisory Report:
1. Recommended Egress Path: (Fastest walking exit route from ${activeEgressStart} to transport platforms)
2. Optimal Transit Mode: (Recommend the single best, least congested mode: Metro vs Coach Bus vs Rideshare, explaining why)
3. Action Steps: (3 clear, bulleted steps to board or depart)
4. Operations Advice: (Notes on parking exits or ticket validation tips)
`;
    const systemInstruction = "You are the MetLife Stadium Chief Transportation Planner co-pilot. Your advice is brief, structured, and optimizes travel egress efficiency.";
    
    const reply = await api.callGemini(prompt, systemInstruction);
    
    container.innerHTML = `
      <div class="animate-fade-in text-secondary" style="font-size: 0.75rem; line-height: 1.45;">
        <div class="fw-bold text-warning mb-2"><i class="fa-solid fa-signs-post me-1"></i> AI Travel Recommendations</div>
        ${reply.replace(/\n/g, '<br>')}
      </div>
    `;

    toast.show('success', 'Egress Plan Compiled', 'Optimal travel exit routes calculated successfully.');
  } catch (err) {
    container.innerHTML = `
      <div class="text-warning animate-fade-in">
        <i class="fa-solid fa-triangle-exclamation me-1"></i> Egress wayfinder co-pilot link lost.
        <div class="mt-2 text-secondary">
          <strong>Offline Egress Recommendation:</strong> Exit through Gate 3, proceed to NJ Transit platform, board Hobart Connector leaving in 11 mins to avoid NYC rideshare congestions.
        </div>
      </div>
    `;
  }
}

/**
 * Binds actions to controls
 */
function _bindActions() {
  // Bind tabs selectors
  document.getElementById('tab-metro-radio')?.addEventListener('change', () => {
    activeTransitTab = 'metro';
    _renderTransitDepartures();
  });

  document.getElementById('tab-bus-radio')?.addEventListener('change', () => {
    activeTransitTab = 'bus';
    _renderTransitDepartures();
  });

  document.getElementById('tab-taxi-radio')?.addEventListener('change', () => {
    activeTransitTab = 'taxi';
    _renderTransitDepartures();
  });

  // Bind Egress selections
  document.getElementById('egress-start-select')?.addEventListener('change', (e) => {
    activeEgressStart = e.target.value;
  });

  document.getElementById('egress-dest-select')?.addEventListener('change', (e) => {
    activeEgressDest = e.target.value;
  });

  // Gemini buttons
  document.getElementById('trigger-egress-plan-btn')?.addEventListener('click', _runAiEgressPlan);
}

/**
 * Clears hooks
 */
export function destroy() {
  if (unsubscribeParking) unsubscribeParking();
}

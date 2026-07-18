import { api } from '../services/api.js';
import { toast } from '../components/toast.js';

let activeStart = 'Zone B Parking';
let activeDestType = 'seat'; // 'seat' or 'facility'
let activeDestVal = 'Block B, Row 12, Seat 4';

const FACILITY_COORDINATES = {
  'restroom': { label: 'Concourse Restrooms B', x: 180, y: 130 },
  'food': { label: 'Golden Goal Burgers (Food Court A)', x: 320, y: 130 },
  'medical': { label: 'First Aid Station 3 (Medical)', x: 350, y: 270 },
  'parking': { label: 'Zone B Parking Gates', x: 80, y: 320 },
  'exit': { label: 'Emergency Exit Tunnel 4', x: 80, y: 80 }
};

const SEAT_COORDINATES = {
  'Block A': { x: 250, y: 90 },
  'Block B': { x: 355, y: 200 },
  'Block C': { x: 250, y: 300 },
  'Block D': { x: 145, y: 200 }
};

const START_COORDINATES = {
  'Zone B Parking': { x: 60, y: 340 },
  'Gate 1': { x: 80, y: 80 },
  'Gate 2': { x: 420, y: 80 },
  'Gate 3': { x: 420, y: 320 },
  'Gate 4': { x: 80, y: 320 },
  'VIP Main': { x: 250, y: 380 }
};

/**
 * Initializes Module 4: AI Navigation
 * @param {HTMLElement} container 
 */
export async function init(container) {
  container.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h1 class="h3 fw-bold mb-1" style="letter-spacing: -0.5px;">AI Indoor Navigation</h1>
        <p class="text-secondary mb-0" style="font-size: 0.9rem;">Find seats, search restrooms, food courts, medical stations, and plan egress routes</p>
      </div>
      <div>
        <span class="sportiq-badge sportiq-badge-success">GPS Signal Stable</span>
      </div>
    </div>

    <div class="row g-4">
      <!-- Left Column: Input Form & Quick Facilities -->
      <div class="col-xl-4">
        <!-- Navigation Input Form -->
        <div class="sportiq-card p-4 mb-4">
          <h5 class="fw-bold mb-3" style="font-size: 0.95rem;"><i class="fa-solid fa-route text-warning me-2"></i> Plan Navigation Path</h5>
          
          <!-- Starting Location -->
          <div class="mb-3">
            <label class="form-label" style="font-size: 0.8rem; color: var(--text-secondary);">Starting Point</label>
            <select class="form-select glass-input" style="font-size: 0.8rem;" id="nav-start-select">
              <option value="Zone B Parking" selected>Zone B Parking Lot</option>
              <option value="Gate 1">Gate 1 Entry Portal</option>
              <option value="Gate 2">Gate 2 Entry Portal</option>
              <option value="Gate 3">Gate 3 Entry Portal</option>
              <option value="Gate 4">Gate 4 Entry Portal</option>
              <option value="VIP Main">VIP Main Entrance</option>
            </select>
          </div>

          <!-- Destination Type Toggle -->
          <div class="mb-3">
            <label class="form-label d-block" style="font-size: 0.8rem; color: var(--text-secondary);">Destination Category</label>
            <div class="btn-group w-100" role="group">
              <input type="radio" class="btn-check" name="dest-type" id="dest-seat-radio" autocomplete="off" checked>
              <label class="btn btn-sm btn-outline-secondary py-1" style="font-size:0.75rem;" for="dest-seat-radio"><i class="fa-solid fa-chair me-1"></i> Seating Seat</label>
              
              <input type="radio" class="btn-check" name="dest-type" id="dest-facility-radio" autocomplete="off">
              <label class="btn btn-sm btn-outline-secondary py-1" style="font-size:0.75rem;" for="dest-facility-radio"><i class="fa-solid fa-store me-1"></i> Facility / Exits</label>
            </div>
          </div>

          <!-- Dynamic Destination Fields -->
          <div id="destination-input-group">
            <!-- Default Seating View -->
            <div class="row g-2 mb-3">
              <div class="col-7">
                <label class="form-label" style="font-size: 0.75rem; color: var(--text-secondary);">Seating Block</label>
                <select class="form-select glass-input form-select-sm" style="font-size: 0.8rem;" id="seat-block-select">
                  <option value="Block A">Block A (North stands)</option>
                  <option value="Block B" selected>Block B (East stands)</option>
                  <option value="Block C">Block C (South stands)</option>
                  <option value="Block D">Block D (West stands)</option>
                </select>
              </div>
              <div class="col-5">
                <label class="form-label" style="font-size: 0.75rem; color: var(--text-secondary);">Row & Seat</label>
                <input type="text" class="form-control glass-input form-control-sm text-center" style="font-size:0.8rem;" value="Row 12, Seat 4" id="seat-row-input">
              </div>
            </div>
          </div>

          <div class="d-grid mt-2">
            <button class="btn btn-warning fw-bold py-2" id="trigger-routing-btn"><i class="fa-solid fa-compass me-1"></i> Calculate Route & Guide Me</button>
          </div>
        </div>

        <!-- Quick Facility Badges Card -->
        <div class="sportiq-card p-4">
          <h5 class="fw-bold mb-3" style="font-size: 0.95rem;"><i class="fa-solid fa-map-pin text-primary me-2"></i> Quick Facility Finder</h5>
          <div class="d-flex flex-wrap gap-2">
            <button class="btn btn-sm sportiq-card text-start py-2 px-3 fw-bold flex-grow-1 quick-fac-btn" data-facility="restroom" style="font-size: 0.75rem; border-radius: var(--border-radius-sm);">
              <i class="fa-solid fa-restroom text-primary me-2"></i> Restrooms
            </button>
            <button class="btn btn-sm sportiq-card text-start py-2 px-3 fw-bold flex-grow-1 quick-fac-btn" data-facility="food" style="font-size: 0.75rem; border-radius: var(--border-radius-sm);">
              <i class="fa-solid fa-utensils text-success me-2"></i> Food Courts
            </button>
            <button class="btn btn-sm sportiq-card text-start py-2 px-3 fw-bold flex-grow-1 quick-fac-btn" data-facility="medical" style="font-size: 0.75rem; border-radius: var(--border-radius-sm);">
              <i class="fa-solid fa-kit-medical text-danger me-2"></i> Medical Stations
            </button>
            <button class="btn btn-sm sportiq-card text-start py-2 px-3 fw-bold flex-grow-1 quick-fac-btn" data-facility="exit" style="font-size: 0.75rem; border-radius: var(--border-radius-sm);">
              <i class="fa-solid fa-door-open text-warning me-2"></i> Emergency Exits
            </button>
          </div>
        </div>
      </div>

      <!-- Right Column: Map and Gemini Instructions -->
      <div class="col-xl-8">
        <div class="row g-4">
          <!-- Map visualizer (Google maps / Custom Floor plan) -->
          <div class="col-md-7 col-lg-8 col-xl-7">
            <div class="sportiq-card p-4 text-center" style="height: 380px; display: flex; flex-direction: column;">
              <h5 class="fw-bold mb-3 text-start" style="font-size: 0.95rem;"><i class="fa-solid fa-map text-info me-2"></i> MetLife Stadium Floor Plan</h5>
              
              <div id="map-render-area" class="position-relative overflow-hidden flex-grow-1 rounded" style="background: rgba(0,0,0,0.2); border: 1px solid var(--border-color);">
                <!-- Dynamic vector SVG Map -->
                <svg id="nav-floor-map" viewBox="0 0 500 400" width="100%" height="100%">
                  <!-- Stadium boundaries -->
                  <ellipse cx="250" cy="200" rx="200" ry="150" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="3" />
                  <ellipse cx="250" cy="200" rx="160" ry="120" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1.5" />
                  
                  <!-- Field -->
                  <rect x="210" y="170" width="80" height="60" rx="2" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1.5" />
                  
                  <!-- Seating Stand Block polygons for pins reference -->
                  <rect x="220" y="80" width="60" height="20" rx="2" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.05)" />
                  <text x="250" y="93" fill="var(--text-muted)" font-size="7" text-anchor="middle">Block A</text>

                  <rect x="330" y="190" width="60" height="20" rx="2" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.05)" />
                  <text x="360" y="203" fill="var(--text-muted)" font-size="7" text-anchor="middle">Block B</text>

                  <rect x="220" y="300" width="60" height="20" rx="2" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.05)" />
                  <text x="250" y="313" fill="var(--text-muted)" font-size="7" text-anchor="middle">Block C</text>

                  <rect x="110" y="190" width="60" height="20" rx="2" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.05)" />
                  <text x="140" y="203" fill="var(--text-muted)" font-size="7" text-anchor="middle">Block D</text>

                  <!-- Dynamic Route Line Overlay -->
                  <path id="nav-route-path" d="" fill="none" stroke="#d4af37" stroke-width="4" stroke-dasharray="8,5" stroke-linecap="round" style="transition: d 0.5s ease-in-out;" />

                  <!-- Start Pin -->
                  <g id="nav-start-pin" transform="translate(-100, -100)">
                    <circle cx="0" cy="0" r="8" fill="var(--color-info)" />
                    <circle cx="0" cy="0" r="14" fill="none" stroke="var(--color-info)" stroke-width="2" class="animate-pulse" />
                    <text x="0" y="3" fill="#fff" font-size="8" font-weight="800" text-anchor="middle">S</text>
                  </g>

                  <!-- Destination Pin -->
                  <g id="nav-dest-pin" transform="translate(-100, -100)">
                    <circle cx="0" cy="0" r="8" fill="var(--color-warning)" />
                    <circle cx="0" cy="0" r="14" fill="none" stroke="var(--color-warning)" stroke-width="2" class="animate-pulse" />
                    <text x="0" y="3" fill="#000" font-size="8" font-weight="800" text-anchor="middle">D</text>
                  </g>
                </svg>

                <div id="google-maps-target" class="position-absolute top-0 bottom-0 start-0 end-0" style="display: none;"></div>
              </div>
            </div>
          </div>

          <!-- AI Navigation co-pilot assistant instructions -->
          <div class="col-md-5 col-lg-4 col-xl-5">
            <div class="sportiq-card p-4 h-100" style="border: 1px solid rgba(212, 175, 55, 0.35); background: linear-gradient(135deg, var(--bg-card) 80%, rgba(212, 175, 55, 0.05) 100%); display: flex; flex-direction: column;">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <div class="d-flex align-items-center gap-2">
                  <i class="fa-solid fa-wand-magic-sparkles text-warning" style="font-size: 1.15rem; filter: drop-shadow(0 0 4px var(--accent-blue));"></i>
                  <h5 class="fw-bold mb-0" style="font-size: 0.95rem;">AI Route Guidance</h5>
                </div>
                <span class="badge bg-warning text-dark fw-bold" style="font-size: 0.65rem;">Gemini Co-pilot</span>
              </div>

              <div id="nav-ai-guide-content" style="font-size: 0.8rem; line-height: 1.5; flex-grow: 1;">
                <!-- Instructions -->
                <p class="text-secondary mb-0">Select your starting position and desired seat coordinates, then click calculate. Gemini will generate custom navigation briefings.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  _bindActions();
  _checkAndLoadGoogleMaps();
}

/**
 * Checks for Google Maps API keys and initializes maps if found
 */
async function _checkAndLoadGoogleMaps() {
  const config = await api.getConfig();
  if (config.googleMapsApiKey) {
    console.log('Google Maps API key located. Injecting Map module.');
    const mapTarget = document.getElementById('google-maps-target');
    if (mapTarget) {
      mapTarget.style.display = 'block';
      // Load Google Maps API Script
      if (!window.google) {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${config.googleMapsApiKey}&callback=initGMap`;
        script.async = true;
        script.defer = true;
        window.initGMap = () => _initGoogleMapInstance(mapTarget);
        document.head.appendChild(script);
      } else {
        _initGoogleMapInstance(mapTarget);
      }
    }
  }
}

let googleMapInstance = null;
function _initGoogleMapInstance(target) {
  // Center on MetLife Stadium coordinates
  const metlife = { lat: 40.8135, lng: -74.0744 };
  googleMapInstance = new google.maps.Map(target, {
    center: metlife,
    zoom: 16,
    styles: [
      { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
      { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
      { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] }
      // Dark theme styles for Maps
    ]
  });
  new google.maps.Marker({
    position: metlife,
    map: googleMapInstance,
    title: "MetLife Stadium operations center"
  });
}

/**
 * Calculates paths on the local SVG map and triggers Gemini requests
 */
async function _calculateRouting() {
  // Get Start Coordinates
  const startPt = START_COORDINATES[activeStart];
  
  // Get End Coordinates
  let endPt = { x: 250, y: 200 }; // Center pitch fallback
  let destLabel = '';

  if (activeDestType === 'seat') {
    const block = document.getElementById('seat-block-select').value;
    const rowSeat = document.getElementById('seat-row-input').value;
    endPt = SEAT_COORDINATES[block] || endPt;
    destLabel = `${block}, ${rowSeat}`;
  } else {
    const facKey = activeDestVal;
    const coord = FACILITY_COORDINATES[facKey];
    if (coord) {
      endPt = { x: coord.x, y: coord.y };
      destLabel = coord.label;
    }
  }

  // Update SVG Pin placements
  const startPin = document.getElementById('nav-start-pin');
  const destPin = document.getElementById('nav-dest-pin');
  const routePath = document.getElementById('nav-route-path');

  if (startPin && destPin && routePath) {
    startPin.setAttribute('transform', `translate(${startPt.x}, ${startPt.y})`);
    destPin.setAttribute('transform', `translate(${endPt.x}, ${endPt.y})`);

    // Draw routing curve line: Start to middle flex-point, to destination
    const midX = (startPt.x + endPt.x) / 2 + (Math.random() - 0.5) * 40;
    const midY = (startPt.y + endPt.y) / 2 + (Math.random() - 0.5) * 40;
    routePath.setAttribute('d', `M ${startPt.x} ${startPt.y} Q ${midX} ${midY} ${endPt.x} ${endPt.y}`);
  }

  // If Google map is loaded, pan center to coordinates
  if (googleMapInstance) {
    googleMapInstance.panTo({ lat: 40.8135 + (endPt.y - 200) * 0.000005, lng: -74.0744 + (endPt.x - 250) * 0.000005 });
  }

  // Call Gemini to generate step-by-step route directions
  const guidePanel = document.getElementById('nav-ai-guide-content');
  if (guidePanel) {
    guidePanel.innerHTML = `
      <div class="d-flex align-items-center gap-2 mb-3 text-warning">
        <i class="fa-solid fa-wand-magic-sparkles fa-spin"></i>
        <div style="font-size: 0.75rem;">Gemini calculating walking directions...</div>
      </div>
      <div class="skeleton-loading mb-2" style="height: 12px; width: 100%;"></div>
      <div class="skeleton-loading mb-2" style="height: 12px; width: 95%;"></div>
      <div class="skeleton-loading mb-2" style="height: 12px; width: 80%;"></div>
      <div class="skeleton-loading" style="height: 12px; width: 50%;"></div>
    `;

    try {
      const prompt = `
Generate a personalized step-by-step walking navigation briefing at MetLife Stadium.
- Starting Point: ${activeStart}
- Target Destination: ${destLabel}

Please generate an operations briefing containing:
1. Walk Summary: (Estimated distance, walking time at normal pace)
2. Directional Steps: (3-4 friendly, bulleted step-by-step instructions. E.g. "Enter through Gate 1...", "Take elevator A to Concourse Level 2...", "Proceed 50m to block D...")
3. Accessibility Pathing: (Recommend specific lift or ramp adjustments if wheelchairs or strollers are used)
`;
      const systemInstruction = "You are the MetLife Stadium Indoor Wayfinder Assistant co-pilot. You write clear, concise, and structured navigational instructions. Keep it professional and polite.";
      
      const reply = await api.callGemini(prompt, systemInstruction);
      
      guidePanel.innerHTML = `
        <div class="animate-fade-in text-secondary" style="font-size: 0.75rem; line-height: 1.45;">
          <div class="fw-bold text-warning mb-2" style="font-size:0.8rem;"><i class="fa-solid fa-map-location-dot me-1"></i> Path Calculated Successfully</div>
          ${reply.replace(/\n/g, '<br>')}
        </div>
      `;

      toast.show('success', 'Route Calculated', `Path found from ${activeStart} to ${destLabel}`);
    } catch (err) {
      guidePanel.innerHTML = `
        <div class="text-warning animate-fade-in" style="font-size: 0.75rem;">
          <i class="fa-solid fa-triangle-exclamation me-1"></i> Could not contact Wayfinder co-pilot.
          <div class="mt-2 text-secondary">
            <strong>Offline Directions:</strong> Walk 120 meters and enter through closest Gate portal to reach ${destLabel}. Ask nearest volunteer for details.
          </div>
        </div>
      `;
    }
  }
}

/**
 * Renders destination elements depending on category selected
 */
function _toggleDestCategory(category) {
  activeDestType = category;
  const group = document.getElementById('destination-input-group');
  if (!group) return;

  if (category === 'seat') {
    group.innerHTML = `
      <div class="row g-2 mb-3">
        <div class="col-7">
          <label class="form-label" style="font-size: 0.75rem; color: var(--text-secondary);">Seating Block</label>
          <select class="form-select glass-input form-select-sm" style="font-size: 0.8rem;" id="seat-block-select">
            <option value="Block A">Block A (North stands)</option>
            <option value="Block B" selected>Block B (East stands)</option>
            <option value="Block C">Block C (South stands)</option>
            <option value="Block D">Block D (West stands)</option>
          </select>
        </div>
        <div class="col-5">
          <label class="form-label" style="font-size: 0.75rem; color: var(--text-secondary);">Row & Seat</label>
          <input type="text" class="form-control glass-input form-control-sm text-center" style="font-size:0.8rem;" value="Row 12, Seat 4" id="seat-row-input">
        </div>
      </div>
    `;
  } else {
    group.innerHTML = `
      <div class="mb-3">
        <label class="form-label" style="font-size: 0.8rem; color: var(--text-secondary);">Facility / Exit Zone</label>
        <select class="form-select glass-input form-select-sm" style="font-size: 0.8rem;" id="facility-target-select">
          <option value="restroom">Concourse Restrooms B</option>
          <option value="food" selected>Golden Goal Burgers (Food Court A)</option>
          <option value="medical">First Aid Station 3 (Medical)</option>
          <option value="parking">Zone B Parking Gate</option>
          <option value="exit">Emergency Exit Tunnel 4</option>
        </select>
      </div>
    `;
    document.getElementById('facility-target-select')?.addEventListener('change', (e) => {
      activeDestVal = e.target.value;
    });
    activeDestVal = 'food'; // reset default value
  }
}

/**
 * Binds action triggers to forms
 */
function _bindActions() {
  // Bind start location select
  document.getElementById('nav-start-select')?.addEventListener('change', (e) => {
    activeStart = e.target.value;
  });

  // Bind category radio buttons
  document.getElementById('dest-seat-radio')?.addEventListener('change', () => _toggleDestCategory('seat'));
  document.getElementById('dest-facility-radio')?.addEventListener('change', () => _toggleDestCategory('facility'));

  // Calculate trigger button
  document.getElementById('trigger-routing-btn')?.addEventListener('click', _calculateRouting);

  // Quick facility finder buttons
  document.querySelectorAll('.quick-fac-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const facilityKey = e.currentTarget.getAttribute('data-facility');
      _toggleDestCategory('facility');
      
      // Make facility radio active
      const radio = document.getElementById('dest-facility-radio');
      if (radio) radio.checked = true;

      // Select matching value
      const select = document.getElementById('facility-target-select');
      if (select) {
        select.value = facilityKey;
        activeDestVal = facilityKey;
      }

      toast.show('info', 'Quick Find Triggered', `Searching closest ${facilityKey.toUpperCase()}...`);
      _calculateRouting();
    });
  });
}

/**
 * Cleanup map instances
 */
export function destroy() {
  googleMapInstance = null;
}

import { firebase } from '../services/firebase.js';
import { api } from '../services/api.js';
import { toast } from '../components/toast.js';

let unsubscribeFood = null;
let foodStalls = [];
let selectedStallForOrder = 'f_001';
let activeSearchTerm = '';
let activeFoodLocation = 'Gate A Concourse';
let activeDietPref = 'None';

const STALL_MENUS = {
  'f_001': [
    { id: 'm_burger', name: 'Championship Double Burger', price: '$14.50', desc: 'Double beef, cheddar, house secret sauce' },
    { id: 'm_fries', name: 'Golden Goal French Fries', price: '$6.00', desc: 'Crispy salted potatoes with dipping sauce' },
    { id: 'm_soda', name: 'FIFA Stadium Fountain Soda', price: '$5.00', desc: 'Refillable 32oz cups' }
  ],
  'f_002': [
    { id: 'm_taco_veg', name: 'Kickoff Quesadilla (Vegetarian)', price: '$12.00', desc: 'Grilled vegetables, monterey jack, guacamole' },
    { id: 'm_taco_beef', name: 'Tacopedia Beef Tacos (3x)', price: '$13.50', desc: 'Shredded beef, cilantro, onions, lime' },
    { id: 'm_nacho', name: 'Half-time Tortilla Nachos', price: '$9.00', desc: 'Melted cheese sauce, jalapeños, salsa' }
  ],
  'f_003': [
    { id: 'm_espresso', name: 'Double Kickoff Espresso', price: '$4.50', desc: 'Hot robust dark roast' },
    { id: 'm_latte', name: 'Matchday Iced Latte', price: '$6.00', desc: 'Chilled milk, organic vanilla syrup' },
    { id: 'm_donut', name: 'Host City Frosted Donut', price: '$3.50', desc: 'Red, white and blue glaze sprinkle' }
  ],
  'f_004': {
    name: 'FIFA Souvenirs Shop',
    items: [
      { id: 'm_scarf', name: 'Official Argentina vs France Match Scarf', price: '$32.00', desc: 'Commemorative high-stitch scarf' },
      { id: 'm_program', name: 'FIFA World Cup 2026 Official Program', price: '$15.00', desc: 'Glossy collector playbook' },
      { id: 'm_cap', name: 'New York/New Jersey Host City Cap', price: '$28.00', desc: 'Embroidered snapback cap' }
    ]
  }
};

/**
 * Initializes Module 8: Food & Shops
 * @param {HTMLElement} container 
 */
export async function init(container) {
  container.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h1 class="h3 fw-bold mb-1" style="letter-spacing: -0.5px;">Concessions & Shops</h1>
        <p class="text-secondary mb-0" style="font-size: 0.9rem;">Browse directory menus, check queue delays, place digital orders, and manage retail discounts</p>
      </div>
      <div>
        <span class="sportiq-badge sportiq-badge-success">Mobile Ordering Active</span>
      </div>
    </div>

    <div class="row g-4">
      <!-- Left Column: Directory & Ordering Console -->
      <div class="col-xl-7">
        <!-- Concession directory -->
        <div class="sportiq-card p-4 mb-4">
          <div class="d-flex flex-column flex-sm-row justify-content-between align-items-stretch align-items-sm-center gap-2 mb-3">
            <h5 class="fw-bold mb-0" style="font-size: 0.95rem;">Food Court & Retail Directory</h5>
            <input type="text" class="form-control form-control-sm glass-input" style="font-size: 0.75rem; width: auto; max-width: 220px;" placeholder="Search stalls/category..." id="stall-search-input">
          </div>
          
          <div class="row g-3" id="stalls-grid-container">
            <!-- Dynamically populated card directory -->
          </div>
        </div>

        <!-- Digital Order Checkout Simulator -->
        <div class="sportiq-card p-4">
          <h5 class="fw-bold mb-3" style="font-size: 0.95rem; color: var(--accent-blue);"><i class="fa-solid fa-cart-shopping me-2"></i> Digital Order Checkout</h5>
          
          <!-- Order parameters -->
          <div class="row g-3 mb-3">
            <div class="col-md-5">
              <label class="form-label" style="font-size: 0.75rem; color: var(--text-secondary);">Select Stall / Merchant</label>
              <select class="form-select glass-input form-select-sm" style="font-size: 0.8rem;" id="checkout-stall-select">
                <!-- Populated dynamically -->
              </select>
            </div>
            <div class="col-md-5">
              <label class="form-label" style="font-size: 0.75rem; color: var(--text-secondary);">Select Menu Item</label>
              <select class="form-select glass-input form-select-sm" style="font-size: 0.8rem;" id="checkout-item-select">
                <!-- Populated dynamically -->
              </select>
            </div>
            <div class="col-md-2">
              <label class="form-label" style="font-size: 0.75rem; color: var(--text-secondary);">Qty</label>
              <input type="number" class="form-control glass-input form-control-sm text-center" style="font-size: 0.8rem;" value="1" min="1" max="10" id="checkout-qty-input">
            </div>
          </div>

          <div class="p-3 border rounded mb-3" style="border-color: var(--border-color) !important; background: rgba(0,0,0,0.15);">
            <div class="d-flex justify-content-between align-items-center mb-1" style="font-size: 0.75rem;">
              <span class="text-secondary">Subtotal:</span>
              <span class="fw-bold" id="receipt-subtotal">$0.00</span>
            </div>
            <div class="d-flex justify-content-between align-items-center mb-1" style="font-size: 0.75rem;">
              <span class="text-secondary">Active Discount Apply (FIFA26):</span>
              <span class="text-success fw-bold" id="receipt-discount">-$0.00</span>
            </div>
            <div class="d-flex justify-content-between align-items-center mt-2 pt-2 border-top" style="border-color: var(--border-color) !important; font-size: 0.85rem;">
              <span class="fw-bold">Total Bill:</span>
              <span class="fw-bold text-warning" id="receipt-total">$0.00</span>
            </div>
          </div>

          <div class="d-grid">
            <button class="btn btn-warning fw-bold py-2" id="submit-checkout-btn"><i class="fa-solid fa-credit-card me-1"></i> Submit Digital Checkout</button>
          </div>
        </div>
      </div>

      <!-- Right Column: AI concierge & discounts managers -->
      <div class="col-xl-5">
        <!-- AI food co-pilot concierge -->
        <div class="sportiq-card p-4 mb-4" style="border: 1px solid rgba(212, 175, 55, 0.35); background: linear-gradient(135deg, var(--bg-card) 80%, rgba(212, 175, 55, 0.05) 100%);">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <div class="d-flex align-items-center gap-2">
              <i class="fa-solid fa-wand-magic-sparkles text-warning animate-pulse" style="font-size: 1.15rem; filter: drop-shadow(0 0 5px var(--accent-blue));"></i>
              <h5 class="fw-bold mb-0" style="font-size: 0.95rem;">AI Concourse Concierge</h5>
            </div>
            <span class="badge bg-warning text-dark fw-bold" style="font-size: 0.65rem;">Gemini Pro</span>
          </div>

          <div class="row g-2 mb-3">
            <div class="col-6">
              <label class="form-label" style="font-size: 0.75rem; color: var(--text-secondary);">Your Location</label>
              <select class="form-select glass-input form-select-sm" style="font-size: 0.8rem;" id="concierge-loc-select">
                <option value="Gate A Concourse" selected>Gate A East Concourse</option>
                <option value="Gate B Concourse">Gate B West Concourse</option>
                <option value="North Plaza Arena">North Plaza Arena</option>
                <option value="VIP Lounge South">VIP South Suite Level</option>
              </select>
            </div>
            <div class="col-6">
              <label class="form-label" style="font-size: 0.75rem; color: var(--text-secondary);">Dietary / Choice</label>
              <select class="form-select glass-input form-select-sm" style="font-size: 0.8rem;" id="concierge-diet-select">
                <option value="None" selected>No Restrictions</option>
                <option value="Vegetarian">Vegetarian Options</option>
                <option value="Gluten-Free">Gluten-Free Options</option>
                <option value="Quick Caffeine">Quick Coffee/Donut</option>
              </select>
            </div>
          </div>

          <div id="ai-concierge-brief-container" style="font-size: 0.75rem; line-height: 1.45;">
            <p class="text-secondary mb-0">Select your current location and food preferences. Gemini will suggest nearby stalls, compare active queue times, and recommend menu items.</p>
          </div>
          <div class="d-grid mt-3">
            <button class="btn btn-warning fw-bold py-2" id="trigger-concierge-btn"><i class="fa-solid fa-utensils me-1"></i> Ask co-pilot for Recommendations</button>
          </div>
        </div>

        <!-- Active discounts lists -->
        <div class="sportiq-card p-4">
          <h5 class="fw-bold mb-3" style="font-size: 0.95rem;"><i class="fa-solid fa-tags text-success me-2"></i> Active Stadium Promotions</h5>
          <div class="d-flex flex-column gap-2" style="font-size: 0.75rem;">
            <div class="p-2 border border-success rounded d-flex justify-content-between align-items-center" style="border-color: rgba(0,223,162,0.2) !important; background: rgba(0,223,162,0.02);">
              <div>
                <strong class="text-success">FIFA26 Matchday</strong>
                <div style="font-size: 0.7rem; color: var(--text-muted);">15% off food items using digital wallet checkout.</div>
              </div>
              <span class="badge bg-success" style="font-size: 0.7rem;">Active</span>
            </div>
            <div class="p-2 border border-warning rounded d-flex justify-content-between align-items-center" style="border-color: rgba(255,184,76,0.2) !important; background: rgba(255,184,76,0.02);">
              <div>
                <strong class="text-warning">Half-Time Beverage Sweep</strong>
                <div style="font-size: 0.7rem; color: var(--text-muted);">$1.00 off iced latte at Kickoff Coffee.</div>
              </div>
              <span class="badge bg-warning text-dark" style="font-size: 0.7rem;">Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  _bindActions();
  _subscribeFood();
}

/**
 * Subscribes to concession data list
 */
function _subscribeFood() {
  unsubscribeFood = firebase.subscribeCollection('food', (docs) => {
    foodStalls = docs;
    _renderDirectory();
    _renderStallSelections();
  });
}

/**
 * Populates checkout selectors
 */
function _renderStallSelections() {
  const stallSelect = document.getElementById('checkout-stall-select');
  if (!stallSelect) return;

  stallSelect.innerHTML = foodStalls.map(s => `
    <option value="${s.id}" ${s.id === selectedStallForOrder ? 'selected' : ''}>${s.name}</option>
  `).join('');

  // Fallback if Souvenirs not in central DB but we want to display it
  if (!foodStalls.find(s => s.id === 'f_004')) {
    stallSelect.innerHTML += `<option value="f_004">FIFA Souvenirs Shop</option>`;
  }

  _renderMenuSelections();
}

/**
 * Populates menu items selectors matching active stall
 */
function _renderMenuSelections() {
  const itemSelect = document.getElementById('checkout-item-select');
  if (!itemSelect) return;

  const stallId = document.getElementById('checkout-stall-select').value;
  const menu = STALL_MENUS[stallId] || STALL_MENUS['f_004'].items; // fallback to items format
  
  const items = Array.isArray(menu) ? menu : menu.items;

  itemSelect.innerHTML = items.map(i => `
    <option value="${i.id}" data-price="${i.price}">${i.name} (${i.price})</option>
  `).join('');

  _calculateBill();
}

/**
 * Calculates checkout price math
 */
function _calculateBill() {
  const itemSelect = document.getElementById('checkout-item-select');
  const qtyInput = document.getElementById('checkout-qty-input');
  if (!itemSelect || !qtyInput) return;

  const selectedOpt = itemSelect.options[itemSelect.selectedIndex];
  if (!selectedOpt) return;

  const priceStr = selectedOpt.getAttribute('data-price') || '$0.00';
  const priceVal = parseFloat(priceStr.replace('$', ''));
  const qty = parseInt(qtyInput.value) || 1;

  const subtotal = priceVal * qty;
  const discount = subtotal * 0.15; // 15% promotional code apply
  const total = subtotal - discount;

  document.getElementById('receipt-subtotal').textContent = `$${subtotal.toFixed(2)}`;
  document.getElementById('receipt-discount').textContent = `-$${discount.toFixed(2)}`;
  document.getElementById('receipt-total').textContent = `$${total.toFixed(2)}`;
}

/**
 * Renders directory grid with search filters
 */
function _renderDirectory() {
  const container = document.getElementById('stalls-grid-container');
  if (!container) return;

  // Include merchandise in local mock directory array
  const fullDirectory = [...foodStalls];
  if (!fullDirectory.find(s => s.id === 'f_004')) {
    fullDirectory.push({ id: 'f_004', name: 'FIFA Official Store', category: 'Souvenirs', waitTime: '4 min', queueCount: 6, rating: 4.9 });
  }

  const filtered = fullDirectory.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(activeSearchTerm) || s.category.toLowerCase().includes(activeSearchTerm);
    return matchesSearch;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div class="col-12 text-center text-muted py-4">No matching concession stalls located.</div>`;
    return;
  }

  container.innerHTML = filtered.map(s => {
    const isMerch = s.id === 'f_004';
    const tagClass = isMerch ? 'info' : (s.queueCount > 15 ? 'danger' : 'success');
    const metricLabel = isMerch ? 'Checkout Lines' : 'Wait Time';

    return `
      <div class="col-md-6 animate-fade-in">
        <div class="sportiq-card p-3 h-100 d-flex flex-column justify-content-between">
          <div>
            <div class="d-flex justify-content-between align-items-start mb-2">
              <span class="badge bg-secondary" style="font-size:0.65rem;">${s.category}</span>
              <span class="sportiq-badge badge-${tagClass}" style="font-size: 0.65rem; padding: 1px 6px;">${s.waitTime}</span>
            </div>
            <h6 class="fw-bold mb-1" style="font-size: 0.85rem; color: var(--text-primary);">${s.name}</h6>
            <div class="text-secondary" style="font-size: 0.7rem;">Active Queue: <strong>${s.queueCount} fans</strong></div>
          </div>
          <div class="d-flex justify-content-between align-items-center mt-3 border-top pt-2" style="border-color: var(--border-color) !important;">
            <span class="text-warning" style="font-size:0.7rem;"><i class="fa-solid fa-star me-1"></i> ${s.rating}</span>
            <button class="btn btn-sm btn-outline-warning py-0 px-2 fw-bold select-order-btn" data-id="${s.id}" style="font-size: 0.65rem; border-radius: var(--border-radius-sm);">
              Order
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Bind order clicks
  container.querySelectorAll('.select-order-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      selectedStallForOrder = id;
      
      const select = document.getElementById('checkout-stall-select');
      if (select) {
        select.value = id;
        _renderMenuSelections();
      }

      toast.show('info', 'Merchant Selected', 'Menu coordinates updated in checkout form.');
      document.getElementById('checkout-stall-select').scrollIntoView({ behavior: 'smooth' });
    });
  });
}

/**
 * Triggers digital order simulation log
 */
function _submitCheckout() {
  const stallSelect = document.getElementById('checkout-stall-select');
  const itemSelect = document.getElementById('checkout-item-select');
  const qty = document.getElementById('checkout-qty-input').value;

  const stallName = stallSelect.options[stallSelect.selectedIndex].text;
  const itemName = itemSelect.options[itemSelect.selectedIndex].text.split(' ($')[0];
  const total = document.getElementById('receipt-total').textContent;

  toast.show('success', 'Order Submitted', `Digital transaction complete: ${qty}x ${itemName} at ${stallName}. Paid ${total}`);
}

/**
 * Triggers backend Gemini to recommend food selections
 */
async function _runAiFoodConcierge() {
  const container = document.getElementById('ai-concierge-brief-container');
  if (!container) return;

  container.innerHTML = `
    <div class="d-flex align-items-center gap-2 mb-2 text-warning">
      <i class="fa-solid fa-wand-magic-sparkles fa-spin"></i>
      <div>Gemini coordinating dietary menus...</div>
    </div>
    <div class="skeleton-loading mb-2" style="height:10px; width:100%;"></div>
    <div class="skeleton-loading mb-2" style="height:10px; width:90%;"></div>
    <div class="skeleton-loading" style="height:10px; width:50%;"></div>
  `;

  try {
    const prompt = `
Generate a stadium concession recommendation co-pilot briefing.
Fan Parameters:
- Start Sector Location: ${activeFoodLocation}
- Dietary Filter Preference: ${activeDietPref}

Staging Directory Context:
- Golden Goal Burgers (Category: Fast Food, Wait Time: 12 min, Queue size: 22 fans, rating: 4.8)
- Tacopedia FIFA (Category: Mexican, Wait Time: 5 min, Queue size: 8 fans, rating: 4.5, includes vegetarian Kickoff Quesadilla)
- Kickoff Coffee (Category: Beverages, Wait Time: 3 min, Queue size: 4 fans, rating: 4.9, includes iced latte)
- FIFA Souvenirs Shop (Category: Souvenirs, Wait Time: 4 min, Queue size: 6 fans, rating: 4.9, matchday scarves)

Recommend nearby food selections:
1. Recommended Merchant: (Best choice closest to ${activeFoodLocation} matching dietary preferences: ${activeDietPref})
2. Queue Timing Check: (Highlight shortest wait queues)
3. Suggested Meal Combo: (Suggest 2 item selections, pricing estimate, and promotional code directions)
`;
    const systemInstruction = "You are the FIFA Concourse Food Advisor co-pilot. Your replies are brief, structured, and recommend specific shop menu items.";
    
    const reply = await api.callGemini(prompt, systemInstruction);
    
    container.innerHTML = `
      <div class="animate-fade-in text-secondary" style="font-size: 0.75rem; line-height: 1.45;">
        <div class="fw-bold text-warning mb-2"><i class="fa-solid fa-receipt me-1"></i> AI Concourse Guide</div>
        ${reply.replace(/\n/g, '<br>')}
      </div>
    `;

    toast.show('success', 'Food Recommendations Compiled', 'AI dining co-pilot advisory updated.');
  } catch (err) {
    container.innerHTML = `
      <div class="text-warning animate-fade-in">
        <i class="fa-solid fa-triangle-exclamation me-1"></i> dining co-pilot link lost.
        <div class="mt-2 text-secondary">
          <strong>Offline Dining Guide:</strong> Head to Tacopedia FIFA near Gate B (5 mins wait). Try the Kickoff Quesadilla if searching vegetarian options.
        </div>
      </div>
    `;
  }
}

/**
 * Binds actions to controls
 */
function _bindActions() {
  // Search stalls
  document.getElementById('stall-search-input')?.addEventListener('input', (e) => {
    activeSearchTerm = e.target.value.toLowerCase();
    _renderDirectory();
  });

  // Stall select changes menu select list
  document.getElementById('checkout-stall-select')?.addEventListener('change', (e) => {
    selectedStallForOrder = e.target.value;
    _renderMenuSelections();
  });

  // Item select updates subtotal math
  document.getElementById('checkout-item-select')?.addEventListener('change', _calculateBill);
  document.getElementById('checkout-qty-input')?.addEventListener('input', _calculateBill);

  // Submit checkout
  document.getElementById('submit-checkout-btn')?.addEventListener('click', _submitCheckout);

  // Concierge preferences changes
  document.getElementById('concierge-loc-select')?.addEventListener('change', (e) => {
    activeFoodLocation = e.target.value;
  });

  document.getElementById('concierge-diet-select')?.addEventListener('change', (e) => {
    activeDietPref = e.target.value;
  });

  // Gemini concierge button
  document.getElementById('trigger-concierge-btn')?.addEventListener('click', _runAiFoodConcierge);
}

/**
 * Clean data subscriptions
 */
export function destroy() {
  if (unsubscribeFood) unsubscribeFood();
}

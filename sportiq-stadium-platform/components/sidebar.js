/**
 * Sidebar Navigation Component
 */
export class Sidebar {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.menuItems = [
      { id: 'dashboard', label: 'Executive Dashboard', icon: 'fa-gauge-high', path: '#/dashboard' },
      { id: 'tickets', label: 'Ticket & Entry', icon: 'fa-ticket', path: '#/tickets' },
      { id: 'crowd', label: 'Crowd Control', icon: 'fa-users-line', path: '#/crowd' },
      { id: 'navigation', label: 'AI Indoor Nav', icon: 'fa-map-location-dot', path: '#/navigation' },
      { id: 'emergency', label: 'Emergency Center', icon: 'fa-shield-halved', path: '#/emergency' },
      { id: 'volunteers', label: 'Volunteer Mgt', icon: 'fa-handshake', path: '#/volunteers' },
      { id: 'transport', label: 'Parking & Transport', icon: 'fa-square-parking', path: '#/transport' },
      { id: 'food', label: 'Food & Retail', icon: 'fa-utensils', path: '#/food' },
      { id: 'assistant', label: 'Multilingual Assistant', icon: 'fa-language', path: '#/assistant' },
      { id: 'analytics', label: 'Deep Analytics', icon: 'fa-chart-pie', path: '#/analytics' },
      { id: 'sustainability', label: 'Sustainability', icon: 'fa-leaf', path: '#/sustainability' },
      { id: 'command', label: 'AI Command Center', icon: 'fa-tower-observation', path: '#/command' }
    ];
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="sidebar-header">
        <div class="logo-container" style="display:flex; align-items:center; gap:10px;">
          <i class="fa-solid fa-tower-observation text-primary" style="font-size: 1.6rem; filter: drop-shadow(0 0 6px var(--accent-blue));"></i>
          <div>
            <span class="logo-text" style="font-weight: 800; font-size: 1.25rem; letter-spacing: -0.5px;">Sportiq</span>
            <div style="font-size: 0.6rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; margin-top: -2px;">Stadium Control</div>
          </div>
        </div>
      </div>
      <ul class="sidebar-menu">
        ${this.menuItems.map(item => `
          <li class="sidebar-item">
            <a href="${item.path}" class="sidebar-link" id="nav-${item.id}">
              <i class="fa-solid ${item.icon}"></i>
              <span>${item.label}</span>
            </a>
          </li>
        `).join('')}
      </ul>
      <div style="padding: 16px 24px; border-top: 1px solid var(--border-color);">
        <div class="d-flex justify-content-between align-items-center mb-1" style="font-size: 0.7rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase;">
          <span>Ops Level 12</span>
          <span style="color: var(--accent-orange);">2,450 / 3,000 XP</span>
        </div>
        <div class="progress-bar-custom mb-2" style="height: 6px; background: rgba(255,255,255,0.06); border-radius: 50px; overflow: hidden; position: relative;">
          <div class="progress-bar-fill" style="width: 81%; height: 100%; background: var(--accent-orange); transition: width 0.5s ease;"></div>
        </div>
        <div style="font-size: 0.65rem; color: var(--text-muted); text-align: center;">
          Rank: <strong>Stadium Commander</strong>
        </div>
      </div>
    `;
  }

  /**
   * Updates the active class based on current module ID
   * @param {string} activeId - The ID of the active module
   */
  setActive(activeId) {
    // Remove active class from all links
    this.menuItems.forEach(item => {
      const linkEl = document.getElementById(`nav-${item.id}`);
      if (linkEl) {
        linkEl.classList.remove('active');
      }
    });

    // Add active class to matching link
    const activeLink = document.getElementById(`nav-${activeId}`);
    if (activeLink) {
      activeLink.classList.add('active');
    }
  }
}

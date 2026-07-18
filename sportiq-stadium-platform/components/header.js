/**
 * Header Component with Search, Theme toggle, and Notifications
 */
export class Header {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.theme = localStorage.getItem('theme') || 'dark';
    
    // Set initial theme on HTML element
    document.documentElement.setAttribute('data-theme', this.theme);
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="header-search">
        <div class="input-group">
          <span class="input-group-text glass-input" style="border-right: none; border-radius: var(--border-radius-sm) 0 0 var(--border-radius-sm);"><i class="fa-solid fa-magnifying-glass text-muted"></i></span>
          <input type="text" class="form-control glass-input" style="border-left: none; border-radius: 0 var(--border-radius-sm) var(--border-radius-sm) 0;" placeholder="Search gates, assets... (or press Ctrl + K)" id="global-search-input" aria-label="Global search gates or assets">
        </div>
      </div>
      
      <div class="header-controls">
        <!-- Theme Toggle Button -->
        <button class="control-btn" id="theme-toggle-btn" title="Toggle Light/Dark Theme" aria-label="Toggle light or dark theme">
          <i class="fa-solid ${this.theme === 'dark' ? 'fa-sun' : 'fa-moon'}"></i>
        </button>

        <!-- Live Notifications Dropdown -->
        <div class="dropdown">
          <button class="control-btn" id="notification-dropdown-btn" data-bs-toggle="dropdown" aria-expanded="false" title="System Alerts" aria-label="System notifications and alerts">
            <i class="fa-regular fa-bell"></i>
            <span class="badge-dot" id="header-alert-dot"></span>
          </button>
          <ul class="dropdown-menu dropdown-menu-end glass-card p-2" aria-labelledby="notification-dropdown-btn" style="width: 320px; border-radius: var(--border-radius-md); border: 1px solid var(--border-color); background: var(--bg-card);">
            <div class="d-flex justify-content-between align-items-center px-3 py-2 border-bottom" style="border-color: var(--border-color) !important;">
              <span class="fw-bold" style="font-size: 0.9rem;">Operations Alerts</span>
              <span class="badge bg-danger rounded-pill" style="font-size: 0.7rem;" id="notification-count-badge">2 Active</span>
            </div>
            <div id="header-notifications-list" style="max-height: 240px; overflow-y: auto;">
              <!-- Dynamic Alerts Rendered Here -->
              <li class="p-2 border-bottom" style="border-color: var(--border-color) !important; list-style: none;">
                <div style="font-size: 0.8rem;" class="fw-bold text-danger"><i class="fa-solid fa-triangle-exclamation me-1"></i> Crowd Alert: Gate 2</div>
                <div style="font-size: 0.75rem; color: var(--text-secondary);">Crowd levels reaching 88% capacity at outer gates.</div>
                <div style="font-size: 0.65rem; color: var(--text-muted); margin-top: 2px;">5 mins ago</div>
              </li>
              <li class="p-2 border-bottom" style="border-color: var(--border-color) !important; list-style: none;">
                <div style="font-size: 0.8rem;" class="fw-bold text-warning"><i class="fa-solid fa-kit-medical me-1"></i> Incident: Section 104</div>
                <div style="font-size: 0.75rem; color: var(--text-secondary);">Heat exhaustion dispatch reported by Vol_Sarah.</div>
                <div style="font-size: 0.65rem; color: var(--text-muted); margin-top: 2px;">15 mins ago</div>
              </li>
            </div>
            <div class="text-center pt-2">
              <a href="#/emergency" class="text-primary fw-bold text-decoration-none" style="font-size: 0.8rem;">Open Emergency Command</a>
            </div>
          </ul>
        </div>

        <!-- User Profile Dropdown -->
        <div class="dropdown">
          <div class="user-profile" id="profile-dropdown-btn" data-bs-toggle="dropdown" aria-expanded="false">
            <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop" alt="Avatar" class="profile-avatar">
            <div class="d-none d-md-block text-start">
              <div class="fw-bold" style="font-size: 0.85rem; line-height: 1.2;" id="profile-name">Sportiq Operator</div>
              <div style="font-size: 0.7rem; color: var(--text-muted);" id="profile-role">Command Center Admin</div>
            </div>
            <i class="fa-solid fa-angle-down text-muted" style="font-size: 0.8rem;"></i>
          </div>
          <ul class="dropdown-menu dropdown-menu-end glass-card p-2" style="border-radius: var(--border-radius-sm); border: 1px solid var(--border-color); background: var(--bg-card);" aria-labelledby="profile-dropdown-btn">
            <li><a class="dropdown-item py-2" href="#/dashboard" style="font-size: 0.85rem; border-radius: var(--border-radius-sm); color: var(--text-primary);"><i class="fa-solid fa-user me-2 text-muted"></i> My Profile</a></li>
            <li><a class="dropdown-item py-2" href="#/command" style="font-size: 0.85rem; border-radius: var(--border-radius-sm); color: var(--text-primary);"><i class="fa-solid fa-screwdriver-wrench me-2 text-muted"></i> Operations Setup</a></li>
            <li><hr class="dropdown-divider" style="border-color: var(--border-color);"></li>
            <li><button class="dropdown-item py-2 text-danger" style="font-size: 0.85rem; border-radius: var(--border-radius-sm);" id="header-logout-btn"><i class="fa-solid fa-right-from-bracket me-2"></i> Log Out</button></li>
          </ul>
        </div>
      </div>
    `;

    this._bindEvents();
  }

  _bindEvents() {
    const toggleBtn = document.getElementById('theme-toggle-btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const nextTheme = this.theme === 'dark' ? 'light' : 'dark';
        this.theme = nextTheme;
        localStorage.setItem('theme', nextTheme);
        document.documentElement.setAttribute('data-theme', nextTheme);
        
        // Update toggle button icon
        const iconEl = toggleBtn.querySelector('i');
        if (iconEl) {
          iconEl.className = nextTheme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
        }
      });
    }

    const logoutBtn = document.getElementById('header-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        // Implement logout log
        alert('Log Out simulated. Refreshing operations session.');
        window.location.reload();
      });
    }
  }

  setProfile(user) {
    if (!user) return;
    const nameEl = document.getElementById('profile-name');
    const roleEl = document.getElementById('profile-role');
    if (nameEl) nameEl.textContent = user.displayName || user.email;
    if (roleEl) roleEl.textContent = user.role || 'Operator';
  }
}

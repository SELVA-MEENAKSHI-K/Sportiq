/**
 * Glassmorphism Toast Notification Service
 */
class ToastService {
  constructor() {
    this.container = null;
    this._initContainer();
  }

  _initContainer() {
    this.container = document.createElement('div');
    this.container.id = 'toast-notification-container';
    Object.assign(this.container.style, {
      position: 'fixed',
      top: '85px',
      right: '20px',
      zIndex: '9999',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      maxWidth: '380px',
      width: '100%',
      pointerEvents: 'none'
    });
    document.body.appendChild(this.container);
  }

  /**
   * Shows a toast alert on the screen.
   * @param {'success'|'warning'|'danger'|'info'} type - Type of status alert
   * @param {string} title - High-level alert header
   * @param {string} message - Secondary message body text
   * @param {number} duration - Delay in ms before automatic dismissal (defaults to 5000)
   */
  show(type, title, message, duration = 5000) {
    if (!this.container) this._initContainer();

    const toast = document.createElement('div');
    toast.className = 'sportiq-card animate-fade-in p-3 d-flex align-items-start gap-3';
    toast.style.pointerEvents = 'auto';
    toast.style.boxShadow = '0 10px 40px rgba(0, 0, 0, 0.3)';
    toast.style.borderLeft = `4px solid var(--color-${type === 'danger' ? 'danger' : type})`;
    
    // Choose icons
    let iconClass = 'fa-circle-info text-info';
    if (type === 'success') iconClass = 'fa-circle-check text-success';
    if (type === 'warning') iconClass = 'fa-triangle-exclamation text-warning';
    if (type === 'danger') iconClass = 'fa-radiation text-danger';

    toast.innerHTML = `
      <div style="font-size: 1.25rem;">
        <i class="fa-solid ${iconClass}"></i>
      </div>
      <div style="flex-grow: 1;">
        <div class="fw-bold" style="font-size: 0.85rem; color: var(--text-primary);">${title}</div>
        <div class="mt-1" style="font-size: 0.75rem; color: var(--text-secondary); line-height: 1.4;">${message}</div>
      </div>
      <button type="button" class="btn-close btn-close-white" style="font-size: 0.65rem; filter: invert(${document.documentElement.getAttribute('data-theme') === 'light' ? '0' : '1'});" aria-label="Close"></button>
    `;

    // Bind close button
    const closeBtn = toast.querySelector('.btn-close');
    closeBtn.addEventListener('click', () => this._dismiss(toast));

    this.container.appendChild(toast);

    // Auto dismiss
    if (duration > 0) {
      setTimeout(() => {
        this._dismiss(toast);
      }, duration);
    }
  }

  _dismiss(toastEl) {
    toastEl.style.transition = 'all 0.4s ease';
    toastEl.style.opacity = '0';
    toastEl.style.transform = 'translateX(50px)';
    setTimeout(() => {
      if (toastEl.parentNode === this.container) {
        this.container.removeChild(toastEl);
      }
    }, 400);
  }
}

export const toast = new ToastService();
export default toast;

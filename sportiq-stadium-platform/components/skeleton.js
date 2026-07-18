/**
 * Loading Skeletons for UI Views
 */
export const Skeleton = {
  /**
   * Generates a grid of generic KPI cards
   * @param {number} count 
   */
  kpiGrid(count = 4) {
    return `
      <div class="row g-4">
        ${Array(count).fill(0).map(() => `
          <div class="col-md-6 col-lg-3 animate-fade-in">
            <div class="glass-card kpi-card">
              <div style="flex-grow: 1;">
                <div class="skeleton-loading" style="height: 14px; width: 60%; margin-bottom: 8px;"></div>
                <div class="skeleton-loading" style="height: 32px; width: 45%; margin-bottom: 12px;"></div>
                <div class="skeleton-loading" style="height: 10px; width: 75%;"></div>
              </div>
              <div class="kpi-icon skeleton-loading" style="width: 56px; height: 56px; border: none;"></div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  /**
   * Generates a placeholder for a chart panel
   */
  chartCard() {
    return `
      <div class="glass-card p-4 animate-fade-in" style="height: 360px; display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <div class="skeleton-loading" style="height: 18px; width: 40%; margin-bottom: 8px;"></div>
          <div class="skeleton-loading" style="height: 12px; width: 25%;"></div>
        </div>
        <div style="flex-grow: 1; display: flex; align-items: flex-end; gap: 12px; padding: 24px 0 10px 0;">
          <div class="skeleton-loading" style="height: 30%; flex-grow: 1;"></div>
          <div class="skeleton-loading" style="height: 60%; flex-grow: 1;"></div>
          <div class="skeleton-loading" style="height: 45%; flex-grow: 1;"></div>
          <div class="skeleton-loading" style="height: 80%; flex-grow: 1;"></div>
          <div class="skeleton-loading" style="height: 55%; flex-grow: 1;"></div>
          <div class="skeleton-loading" style="height: 90%; flex-grow: 1;"></div>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <div class="skeleton-loading" style="height: 10px; width: 12%;"></div>
          <div class="skeleton-loading" style="height: 10px; width: 12%;"></div>
          <div class="skeleton-loading" style="height: 10px; width: 12%;"></div>
          <div class="skeleton-loading" style="height: 10px; width: 12%;"></div>
        </div>
      </div>
    `;
  },

  /**
   * Generates a skeleton layout for a table
   * @param {number} rows 
   * @param {number} cols 
   */
  table(rows = 5, cols = 4) {
    return `
      <div class="glass-card p-4 animate-fade-in">
        <div class="d-flex justify-content-between mb-4">
          <div class="skeleton-loading" style="height: 20px; width: 30%;"></div>
          <div class="skeleton-loading" style="height: 20px; width: 15%;"></div>
        </div>
        <div class="table-responsive">
          <table class="table table-borderless align-middle" style="margin: 0;">
            <thead>
              <tr>
                ${Array(cols).fill(0).map(() => `
                  <th><div class="skeleton-loading" style="height: 12px; width: 60%;"></div></th>
                `).join('')}
              </tr>
            </thead>
            <tbody>
              ${Array(rows).fill(0).map(() => `
                <tr style="border-bottom: 1px solid var(--glass-border);">
                  ${Array(cols).fill(0).map(() => `
                    <td><div class="skeleton-loading" style="height: 16px; width: 70%; margin: 8px 0;"></div></td>
                  `).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
};
export default Skeleton;

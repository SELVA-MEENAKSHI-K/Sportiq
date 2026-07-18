/**
 * Stadium Operations AI API Service
 */
class ApiService {
  constructor() {
    this.config = null;
    this.baseUrl = window.location.origin;
  }

  /**
   * Fetches client keys and configurations from the backend.
   */
  async getConfig() {
    if (this.config) return this.config;
    try {
      const response = await fetch(`${this.baseUrl}/api/config`);
      if (!response.ok) throw new Error('Failed to load server configurations');
      this.config = await response.json();
      return this.config;
    } catch (error) {
      console.error('API Config Fetch Error:', error);
      // Fallback defaults for standalone frontend operations
      return {
        firebaseConfig: {},
        googleMapsApiKey: ''
      };
    }
  }

  /**
   * Universal helper to interact with the backend Gemini model wrapper.
   * @param {string} prompt - User request or situation description
   * @param {string} systemInstruction - Developer context or persona instructions
   */
  async callGemini(prompt, systemInstruction = '') {
    try {
      const response = await fetch(`${this.baseUrl}/api/gemini`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt, systemInstruction })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Gemini processing failed');
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Gemini API Integration Error:', error);
      throw error;
    }
  }
}

export const api = new ApiService();

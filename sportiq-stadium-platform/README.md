# Sportiq — AI-Powered Stadium Operations & Fan Platform

**Sportiq** is a GenAI-enabled stadium management and tournament experience ecosystem engineered for the **FIFA World Cup 2026**. Leveraging Google Gemini, Sportiq enhances live event coordination, multilingual accessibility, environmental sustainability, and real-time operational decision support at MetLife Stadium.

---

## 🚀 Key AI Features & Integrations

1. **AI Command Center (`#/command`):** An operator cockpit. Incidents typed or dictated via voice are evaluated by Gemini to return threat level diagnostics, tactical checklists, resource deployments, and public address speaker scripts.
2. **Multilingual Co-pilot (`#/assistant`):** Speech-to-speech translation engine supporting **English, Spanish, French, Hindi, and Tamil**, reading responses aloud using browser voice synthesis.
3. **Sustainability Carbon Calculator (`#/sustainability`):** Computes estimated carbon footprints (Metric Tons of CO₂) for matchdays with itemized fan commuting, concession dining, and grid load metrics.
4. **Ticket Investigator (`#/tickets`):** Automatically evaluates credential scan rejection errors (gate mismatches, duplicates, expired passes) and outputs gate officer guidelines.
5. **Gamification Progress Tracker:** Tying incident check-offs and quest completions to experience points (XP) levels displayed in the dashboard and sidebar.

---

## 🛠️ Technology Stack

* **Frontend:** Vanilla HTML5, CSS3, JavaScript (ES modules), Bootstrap 5 Grid.
* **Backend:** Node.js, Express REST API, Vercel Serverless.
* **AI Engine:** Google Gemini (`gemini-1.5-flash` model).

---

## 💻 Local Setup & Execution

### Prerequisites
* **Node.js** (v18.0.0 or higher)
* A valid **Gemini API Key** from Google AI Studio.

### Installation
1. Extract the project ZIP.
2. Open your terminal in the project directory.
3. Install dependencies:
   ```cmd
   npm install
   ```

### Configuration
Create a `.env` file in the root folder:
```env
# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# Google Maps API (Optional)
GOOGLE_MAPS_API_KEY=
```

### Running Locally
Start the local Express server:
```cmd
npm start
```
Open **[http://localhost:3000/](http://localhost:3000/)** in your web browser.

---

## 🧪 Testing

The project includes an automated unit testing suite that verifies arithmetic calculations and security escaping logic:

```cmd
npm test
```
*(Bypasses PowerShell script execution issues on Windows by calling `npm.cmd test`).*

const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Load environment variables
dotenv.config();

const app = express();
app.disable('x-powered-by');

// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Content-Security-Policy', "default-src 'self' https: 'unsafe-inline' 'unsafe-eval'; img-src 'self' data: https:; child-src 'none';");
  next();
});

app.use(cors());
app.use(express.json());

// Load Config Endpoint
app.get('/api/config', (req, res) => {
  res.json({
    firebaseConfig: {
      apiKey: process.env.FIREBASE_API_KEY || '',
      authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
      projectId: process.env.FIREBASE_PROJECT_ID || '',
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
      appId: process.env.FIREBASE_APP_ID || ''
    },
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || ''
  });
});

// Gemini AI Operations Assistant Endpoint
app.post('/api/gemini', async (req, res) => {
  const { prompt, systemInstruction } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const hasApiKey = apiKey && apiKey !== 'your_gemini_api_key_here' && apiKey !== '';

  if (hasApiKey) {
    try {
      const payload = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 1000 }
      };
      
      if (systemInstruction) {
        payload.systemInstruction = {
          parts: [{ text: systemInstruction }]
        };
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (text) {
        return res.json({ response: text });
      }
      throw new Error('Invalid response structure from Gemini API');
    } catch (err) {
      console.error('Gemini API execution error, switching to mock:', err);
      // Fallback to local mock on network or credential error
    }
  }

  // Smart Mock Co-pilot when API key is missing or fails
  const lowerPrompt = prompt.toLowerCase();
  let mockReply = '';

  if (lowerPrompt.includes('parking') || lowerPrompt.includes('zone')) {
    mockReply = `**Zone A (Gold)** is currently at 96% occupancy. I recommend directing incoming general traffic to **Zone B (General)**, which has 460 open slots. The shuttle from Zone B is running every 4 minutes.`;
  } else if (lowerPrompt.includes('ticket') && (lowerPrompt.includes('reject') || lowerPrompt.includes('why'))) {
    mockReply = `The ticket was rejected because the security signature check failed. Recommended Actions:
1. Direct the fan to **Ticketing Help Desk B** near Gate 4.
2. Have the ticket agent verify the barcode ID manually in the main system database.
3. If confirmed valid, issue a manual entry authorization pass.`;
  } else if (lowerPrompt.includes('gate 2') || lowerPrompt.includes('gate crowd') || lowerPrompt.includes('congestion')) {
    mockReply = `**Gate 2 Congestion Alert Response Protocol:**
* **Risk Assessment:** High (Queue delay is 28 mins; gate area density is 0.89).
* **Immediate Actions:**
  1. Open auxiliary gates **2A and 2B**.
  2. Disseminate public announcement text: *"Fans near Gate 2, please utilize the adjacent Gate 3 lanes for expedited entry."*
  3. Deploy **3 volunteers** from the nearby Concourse Lounge to guide fans to Gate 3.
* **Expected Impact:** Queue wait time should drop below 10 minutes within 15 minutes.`;
  } else if (lowerPrompt.includes('emergency') || lowerPrompt.includes('sos') || lowerPrompt.includes('heat') || lowerPrompt.includes('exhaustion')) {
    mockReply = `**Incident Response Summary:**
* **Incident:** Medical - Heat Exhaustion (Section 104)
* **Priority Level:** High
* **Suggested Response Team:** Medical Team Delta (located at First Aid Station 3, 40m away)
* **Recommended Actions:**
  1. Dispatch Volunteer **Sarah Connor** to escort Medical Team Delta to the patient.
  2. Clear path through Concourse A.
  3. Administer cooling packs and hydration.
  4. Update dispatch log status to 'Active'.`;
  } else {
    mockReply = `I've analyzed the request. The current status of MetLife Stadium is stable:
* **Crowd count:** 68,500 active.
* **System Operations:** All systems operational.
* **Recommendation:** Monitor incoming flows at Gate 2 and continue routine patrols near concourses. Let me know if you need specific incident reports or navigation routing.`;
  }

  // Simulate a network delay of 800ms
  setTimeout(() => {
    res.json({ response: mockReply });
  }, 800);
});

// Serve frontend static files
const staticPath = path.join(__dirname, '../');
app.use(express.static(staticPath));

// Catch-all route to serve index.html for frontend routing
app.get('*', (req, res) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

// Start Server locally
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`\n==================================================`);
    console.log(` Stadium Operations AI local server running.`);
    console.log(` URL: http://localhost:${PORT}`);
    console.log(` Press Ctrl+C to terminate the process.`);
    console.log(`==================================================\n`);
  });
}

module.exports = app;

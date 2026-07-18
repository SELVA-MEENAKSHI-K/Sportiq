import { api } from './api.js';

/**
 * Stadium Operations AI Firebase Service (with LocalStorage fallbacks)
 */
class FirebaseService {
  constructor() {
    this.db = null;
    this.auth = null;
    this.isMock = true;
    this.listeners = {};
    
    // Set up mock database store
    this.mockStore = this._initMockStore();
  }

  /**
   * Initializes real Firebase SDKs or falls back to standard simulations.
   */
  async init() {
    try {
      const config = await api.getConfig();
      const hasConfig = config.firebaseConfig && config.firebaseConfig.apiKey && config.firebaseConfig.projectId;
      
      if (hasConfig) {
        // Load Firebase from official SDK CDNs (v10 ES module format)
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js');
        const { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js');
        const { getFirestore, collection, addDoc, getDocs, setDoc, doc, query, onSnapshot, orderBy } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js');
        
        const app = initializeApp(config.firebaseConfig);
        this.auth = getAuth(app);
        this.db = getFirestore(app);
        this.isMock = false;
        
        // Export native references
        this.native = { onAuthStateChanged, signInWithEmailAndPassword, signOut, collection, addDoc, getDocs, setDoc, doc, query, onSnapshot, orderBy };
        console.log('Firebase Service initialized with production config.');
      } else {
        console.warn('No Firebase configs found. Enabling interactive simulation mode.');
        this._initMockAuth();
      }
    } catch (error) {
      console.error('Firebase initialization failed. Falling back to mock.', error);
      this._initMockAuth();
    }
  }

  /* --- Mock Auth Layer --- */
  _initMockAuth() {
    this.currentUser = JSON.parse(localStorage.getItem('operations_user')) || {
      uid: 'mock-operator-11',
      email: 'operator@fifa.org',
      displayName: 'FIFA Operator',
      role: 'Superadmin'
    };
    this.authCallbacks = [];
  }

  onAuthStateChanged(callback) {
    if (!this.isMock) {
      return this.native.onAuthStateChanged(this.auth, callback);
    }
    this.authCallbacks.push(callback);
    // Execute immediately with current state
    callback(this.currentUser);
    return () => {
      this.authCallbacks = this.authCallbacks.filter(cb => cb !== callback);
    };
  }

  async signIn(email, password) {
    if (!this.isMock) {
      return this.native.signInWithEmailAndPassword(this.auth, email, password);
    }
    // Simple mock credential check
    if (email && password) {
      const user = { uid: 'mock-operator-11', email, displayName: email.split('@')[0], role: 'Operator' };
      this.currentUser = user;
      localStorage.setItem('operations_user', JSON.stringify(user));
      this.authCallbacks.forEach(cb => cb(user));
      return { user };
    }
    throw new Error('Authentication failed');
  }

  async signOut() {
    if (!this.isMock) {
      return this.native.signOut(this.auth);
    }
    this.currentUser = null;
    localStorage.removeItem('operations_user');
    this.authCallbacks.forEach(cb => cb(null));
  }

  /* --- Database Operations --- */

  /**
   * Adds a document to a collection.
   */
  async addDocument(colName, data) {
    const timestamped = {
      ...data,
      createdAt: new Date().toISOString()
    };

    if (!this.isMock) {
      const colRef = this.native.collection(this.db, colName);
      const docRef = await this.native.addDoc(colRef, timestamped);
      return docRef.id;
    }

    const id = colName + '_' + Math.random().toString(36).substr(2, 9);
    const docData = { id, ...timestamped };
    this.mockStore[colName].push(docData);
    this._saveMockStore();
    this._notifyListeners(colName);
    return id;
  }

  /**
   * Gets all documents in a collection.
   */
  async getCollection(colName) {
    if (!this.isMock) {
      const colRef = this.native.collection(this.db, colName);
      const snapshot = await this.native.getDocs(colRef);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    return [...this.mockStore[colName]];
  }

  /**
   * Sets/Updates a document.
   */
  async setDocument(colName, docId, data) {
    const timestamped = {
      ...data,
      updatedAt: new Date().toISOString()
    };

    if (!this.isMock) {
      const docRef = this.native.doc(this.db, colName, docId);
      await this.native.setDoc(docRef, timestamped, { merge: true });
      return docId;
    }

    const idx = this.mockStore[colName].findIndex(d => d.id === docId);
    if (idx !== -1) {
      this.mockStore[colName][idx] = { ...this.mockStore[colName][idx], ...timestamped };
    } else {
      this.mockStore[colName].push({ id: docId, ...timestamped });
    }
    this._saveMockStore();
    this._notifyListeners(colName);
    return docId;
  }

  /**
   * Subscribes to real-time collection changes.
   */
  subscribeCollection(colName, callback) {
    if (!this.isMock) {
      const colRef = this.native.collection(this.db, colName);
      const q = this.native.query(colRef, this.native.orderBy('createdAt', 'desc'));
      return this.native.onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(docs);
      });
    }

    if (!this.listeners[colName]) {
      this.listeners[colName] = [];
    }
    this.listeners[colName].push(callback);
    // Initial fetch
    callback([...this.mockStore[colName]]);

    return () => {
      this.listeners[colName] = this.listeners[colName].filter(cb => cb !== callback);
    };
  }

  /* --- Private Mock Helpers --- */
  _initMockStore() {
    const defaultData = {
      tickets: [
        { id: 't_001', ticketId: 'TCK-2026-A1X', holder: 'John Doe', gate: 'Gate A', status: 'validated', scanTime: '17:30', vip: false },
        { id: 't_002', ticketId: 'TCK-2026-B9Y', holder: 'Jane Smith', gate: 'Gate B', status: 'rejected', reason: 'Invalid Signature', scanTime: '17:42', vip: false },
        { id: 't_003', ticketId: 'TCK-2026-VIP7', holder: 'Diego Maradona Jr.', gate: 'VIP Main', status: 'validated', scanTime: '18:01', vip: true }
      ],
      crowd: [
        { id: 'c_001', time: '17:00', totalCount: 42000, density: 0.65 },
        { id: 'c_002', time: '17:30', totalCount: 54000, density: 0.78 },
        { id: 'c_003', time: '18:00', totalCount: 68500, density: 0.89 }
      ],
      emergencies: [
        { id: 'e_001', title: 'Medical - Heat Exhaustion', priority: 'high', status: 'dispatched', reporter: 'Vol_Sarah', location: 'Section 104', notes: 'Patient hydrated and being moved.', createdAt: '2026-07-09T17:55:00Z' },
        { id: 'e_002', title: 'Minor Slip and Fall', priority: 'medium', status: 'resolved', reporter: 'Vol_Alex', location: 'Gate 4 Concourse', notes: 'First aid applied. Area cleaned.', createdAt: '2026-07-09T17:10:00Z' }
      ],
      volunteers: [
        { id: 'v_001', name: 'Sarah Connor', status: 'active', location: 'Section 104', zone: 'Concourse A', phone: '+1-555-0199', checkedIn: true },
        { id: 'v_002', name: 'Alex Mercer', status: 'active', location: 'Gate 4', zone: 'Gate 4 Entry', phone: '+1-555-0182', checkedIn: true },
        { id: 'v_003', name: 'Devi Kumar', status: 'on-break', location: 'Staff Lounge', zone: 'Staff Lounge', phone: '+1-555-0155', checkedIn: true }
      ],
      parking: [
        { id: 'p_001', zone: 'Zone A (Gold)', total: 500, occupied: 480, status: 'Full' },
        { id: 'p_002', zone: 'Zone B (General)', total: 2000, occupied: 1540, status: 'Available' },
        { id: 'p_003', zone: 'Zone C (Bus/Taxi)', total: 300, occupied: 180, status: 'Available' }
      ],
      food: [
        { id: 'f_001', name: 'Golden Goal Burgers', category: 'Fast Food', waitTime: '12 min', queueCount: 22, rating: 4.8 },
        { id: 'f_002', name: 'Tacopedia FIFA', category: 'Mexican', waitTime: '5 min', queueCount: 8, rating: 4.5 },
        { id: 'f_003', name: 'Kickoff Coffee', category: 'Beverages', waitTime: '3 min', queueCount: 4, rating: 4.9 }
      ]
    };

    const stored = localStorage.getItem('operations_db');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Ensure all collections exist
        Object.keys(defaultData).forEach(key => {
          if (!parsed[key]) parsed[key] = defaultData[key];
        });
        return parsed;
      } catch (e) {
        return defaultData;
      }
    }
    localStorage.setItem('operations_db', JSON.stringify(defaultData));
    return defaultData;
  }

  _saveMockStore() {
    localStorage.setItem('operations_db', JSON.stringify(this.mockStore));
  }

  _notifyListeners(colName) {
    if (this.listeners[colName]) {
      this.listeners[colName].forEach(callback => callback([...this.mockStore[colName]]));
    }
  }
}

export const firebase = new FirebaseService();

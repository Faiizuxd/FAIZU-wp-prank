const express = require("express");
const fs = require("fs");
const path = require("path");
const pino = require("pino");
const multer = require("multer");
const {
    makeInMemoryStore,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    Browsers,
    fetchLatestBaileysVersion,
    makeWASocket,
    isJidBroadcast
} = require("@whiskeysockets/baileys");

const app = express();
const PORT = 20120;

// Create necessary directories
if (!fs.existsSync("temp")) {
    fs.mkdirSync("temp");
}
if (!fs.existsSync("uploads")) {
    fs.mkdirSync("uploads");
}
if (!fs.existsSync("logs")) {
    fs.mkdirSync("logs");
}

const upload = multer({ dest: "uploads/" });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Store active client instances and tasks
const activeClients = new Map();
const activeTasks = new Map();
const taskLogs = new Map();
const userSessions = new Map(); // Store user sessions by IP

// Middleware to track user sessions
app.use((req, res, next) => {
    const userIP = req.ip || req.connection.remoteAddress;
    req.userIP = userIP;
    next();
});

app.get("/", (req, res) => {
  res.send(`
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>WhatsApp Server</title>
<style>
  :root {
    --dark-bg: #0a1929;
    --dark-card: #132f4c;
    --dark-border: #1e4976;
    --primary: #00c853;
    --primary-dark: #00b248;
    --primary-light: #5efc82;
    --secondary: #2196f3;
    --text-light: #e0e0e0;
    --text-muted: #90a4ae;
    --success: #4caf50;
    --warning: #ff9800;
    --error: #f44336;
    --shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    --radius: 10px;
    --transition: all 0.3s ease;
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    background: var(--dark-bg);
    color: var(--text-light);
    line-height: 1.6;
    min-height: 100vh;
    padding: 20px;
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
  }

  /* Header */
  .header {
    background: var(--dark-card);
    border-radius: var(--radius);
    padding: 20px 30px;
    margin-bottom: 30px;
    border: 1px solid var(--dark-border);
    box-shadow: var(--shadow);
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 20px;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 15px;
  }

  .logo {
    width: 50px;
    height: 50px;
    background: linear-gradient(135deg, var(--primary), var(--primary-dark));
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 22px;
    color: white;
    box-shadow: 0 4px 15px rgba(0, 200, 83, 0.3);
  }

  .brand-text h1 {
    font-size: 24px;
    font-weight: 700;
    background: linear-gradient(45deg, var(--primary), var(--primary-light));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 5px;
  }

  .brand-text p {
    color: var(--text-muted);
    font-size: 14px;
  }

  .header-controls {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  /* Main Layout */
  .main-grid {
    display: grid;
    grid-template-columns: 1fr 350px;
    gap: 25px;
    margin-bottom: 30px;
  }

  @media (max-width: 900px) {
    .main-grid {
      grid-template-columns: 1fr;
    }
  }

  /* Cards */
  .card {
    background: var(--dark-card);
    border-radius: var(--radius);
    padding: 25px;
    border: 1px solid var(--dark-border);
    box-shadow: var(--shadow);
    margin-bottom: 25px;
    transition: var(--transition);
  }

  .card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
  }

  .card-title {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 20px;
    color: var(--primary-light);
    padding-bottom: 12px;
    border-bottom: 2px solid var(--primary);
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .card-title i {
    font-size: 20px;
  }

  /* Forms */
  .form-group {
    margin-bottom: 20px;
  }

  .form-label {
    display: block;
    margin-bottom: 8px;
    color: var(--text-light);
    font-weight: 500;
    font-size: 14px;
  }

  .form-control {
    width: 100%;
    padding: 12px 15px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--dark-border);
    border-radius: 8px;
    color: var(--text-light);
    font-size: 14px;
    transition: var(--transition);
  }

  .form-control:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 2px rgba(0, 200, 83, 0.2);
  }

  input[type="file"].form-control {
    padding: 10px;
    cursor: pointer;
  }

  select.form-control {
    cursor: pointer;
  }

  /* Buttons */
  .btn {
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    transition: var(--transition);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .btn-primary {
    background: linear-gradient(135deg, var(--primary), var(--primary-dark));
    color: white;
  }

  .btn-primary:hover {
    background: linear-gradient(135deg, var(--primary-dark), var(--primary));
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 200, 83, 0.4);
  }

  .btn-secondary {
    background: rgba(255, 255, 255, 0.1);
    color: var(--text-light);
    border: 1px solid var(--dark-border);
  }

  .btn-secondary:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: var(--primary);
  }

  .btn-group {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-top: 15px;
  }

  /* Status Panel */
  .status-panel {
    background: var(--dark-card);
    border-radius: var(--radius);
    padding: 25px;
    border: 1px solid var(--dark-border);
  }

  .status-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 8px;
    margin-bottom: 12px;
    border: 1px solid var(--dark-border);
  }

  .status-label {
    color: var(--text-muted);
    font-size: 14px;
  }

  .status-value {
    font-weight: 600;
    font-size: 14px;
    padding: 5px 12px;
    border-radius: 20px;
  }

  .status-connected {
    background: rgba(76, 175, 80, 0.15);
    color: var(--success);
  }

  .status-disconnected {
    background: rgba(244, 67, 54, 0.15);
    color: var(--error);
  }

  .session-id {
    font-family: 'Courier New', monospace;
    background: rgba(0, 200, 83, 0.1);
    padding: 8px 12px;
    border-radius: 6px;
    border: 1px solid var(--primary);
    color: var(--primary-light);
    font-size: 13px;
    word-break: break-all;
  }

  /* Logs */
  .logs-container {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    padding: 20px;
    border: 1px solid var(--dark-border);
    margin-top: 25px;
  }

  .logs-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
  }

  .logs-title h3 {
    color: var(--primary-light);
    font-size: 16px;
  }

  .logs-box {
    height: 250px;
    overflow-y: auto;
    background: rgba(0, 0, 0, 0.4);
    border-radius: 6px;
    padding: 15px;
    font-family: 'Courier New', monospace;
    font-size: 12px;
    line-height: 1.5;
    border: 1px solid var(--dark-border);
  }

  .logs-box::-webkit-scrollbar {
    width: 6px;
  }

  .logs-box::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
  }

  .logs-box::-webkit-scrollbar-thumb {
    background: var(--primary);
    border-radius: 3px;
  }

  .log-entry {
    padding: 5px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    color: var(--text-light);
  }

  .log-entry.success {
    color: var(--primary);
  }

  .log-entry.error {
    color: var(--error);
  }

  .log-entry.warning {
    color: var(--warning);
  }

  .log-time {
    color: var(--text-muted);
    margin-right: 10px;
  }

  /* Footer */
  .footer {
    text-align: center;
    padding: 20px;
    color: var(--text-muted);
    font-size: 13px;
    border-top: 1px solid var(--dark-border);
    margin-top: 30px;
  }

  /* Quick Actions */
  .quick-actions {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
    margin-top: 20px;
  }

  .quick-action {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--dark-border);
    border-radius: 8px;
    padding: 15px;
    text-align: center;
    cursor: pointer;
    transition: var(--transition);
  }

  .quick-action:hover {
    background: rgba(0, 200, 83, 0.1);
    border-color: var(--primary);
    transform: translateY(-2px);
  }

  .quick-action i {
    font-size: 24px;
    color: var(--primary);
    margin-bottom: 10px;
  }

  .quick-action span {
    display: block;
    font-size: 13px;
    color: var(--text-light);
  }

  /* Responsive */
  @media (max-width: 768px) {
    .header {
      flex-direction: column;
      text-align: center;
    }
    
    .brand {
      justify-content: center;
    }
    
    .header-controls {
      justify-content: center;
    }
    
    .main-grid {
      gap: 15px;
    }
    
    .card {
      padding: 20px;
    }
    
    .btn {
      width: 100%;
    }
    
    .btn-group {
      flex-direction: column;
    }
  }

  /* Animations */
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.7; }
    100% { opacity: 1; }
  }

  .pulse {
    animation: pulse 2s infinite;
  }

  /* File Input Styling */
  .file-input-wrapper {
    position: relative;
    overflow: hidden;
    display: inline-block;
    width: 100%;
  }

  .file-input-wrapper input[type=file] {
    position: absolute;
    left: 0;
    top: 0;
    opacity: 0;
    width: 100%;
    height: 100%;
    cursor: pointer;
  }

  .file-input-label {
    display: block;
    padding: 12px 15px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px dashed var(--dark-border);
    border-radius: 8px;
    text-align: center;
    color: var(--text-muted);
    cursor: pointer;
    transition: var(--transition);
  }

  .file-input-label:hover {
    border-color: var(--primary);
    color: var(--primary);
  }

  /* Helper Text */
  .helper-text {
    font-size: 12px;
    color: var(--text-muted);
    margin-top: 5px;
    display: block;
  }

  /* Loading Spinner */
  .spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: var(--primary);
    animation: spin 1s ease-in-out infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>
</head>

<body>
  <div class="container">
    <!-- Header -->
    <header class="header">
      <div class="brand">
        <div class="logo">WS</div>
        <div class="brand-text">
          <h1>WhatsApp Server</h1>
          <p>Made By Faizan Rajpoot</p>
        </div>
      </div>
      <div class="header-controls">
        <button class="btn btn-secondary" onclick="showMySessionId()">
          <i>🔑</i> Show Session
        </button>
        <a href="/" style="text-decoration: none;">
          <button class="btn btn-secondary">
            <i>🏠</i> Home
          </button>
        </a>
      </div>
    </header>

    <!-- Main Content -->
    <div class="main-grid">
      <!-- Left Column -->
      <section>
        <!-- Pair Device Card -->
        <div class="card">
          <h2 class="card-title"><i>📱</i> Pair Device</h2>
          <div class="form-group">
            <label for="numberInput" class="form-label">WhatsApp Number (with country code)</label>
            <input 
              type="text" 
              id="numberInput" 
              class="form-control" 
              placeholder="e.g. 92300****** or 91951*****"
            >
          </div>
          <div class="btn-group">
            <button class="btn btn-primary" onclick="generatePairingCode()">
              <i>🔗</i> Generate Pairing Code
            </button>
            <button class="btn btn-secondary" onclick="clearSession()">
              <i>🗑️</i> Clear Session
            </button>
          </div>
          <div id="pairingResult" class="helper-text"></div>
        </div>

        <!-- Send Messages Card -->
        <div class="card">
          <h2 class="card-title"><i>📤</i> Send Messages</h2>
          <form id="sendForm" action="/send-message" method="POST" enctype="multipart/form-data">
            <div class="form-group">
              <label for="targetType" class="form-label">Target Type</label>
              <select id="targetType" name="targetType" class="form-control" required>
                <option value="">-- Select --</option>
                <option value="number">Number</option>
                <option value="group">Group UID</option>
              </select>
            </div>

            <div class="form-group">
              <label for="target" class="form-label">Target Number / Group UID</label>
              <input 
                type="text" 
                id="target" 
                name="target" 
                class="form-control" 
                placeholder="e.g. 92300xxxxxxx or 12345" 
                required
              >
            </div>

            <div class="form-group">
              <label for="messageFile" class="form-label">Message File (.txt)</label>
              <div class="file-input-wrapper">
                <div class="file-input-label" id="fileLabel">
                  <i>📎</i> Click to select .txt file
                </div>
                <input 
                  type="file" 
                  id="messageFile" 
                  name="messageFile" 
                  accept=".txt" 
                  required 
                  onchange="updateFileName()"
                >
              </div>
              <span class="helper-text" id="fileName">No file selected</span>
            </div>

            <div class="form-group">
              <label for="prefix" class="form-label">Message Prefix (Hater Name)</label>
              <input 
                type="text" 
                id="prefix" 
                name="prefix" 
                class="form-control" 
                placeholder="Hello,"
              >
            </div>

            <div class="form-group">
              <label for="delaySec" class="form-label">Delay (seconds)</label>
              <input 
                type="number" 
                id="delaySec" 
                name="delaySec" 
                class="form-control" 
                min="1" 
                value="10" 
                required
              >
            </div>

            <div class="btn-group">
              <button class="btn btn-primary" type="submit">
                <i>🚀</i> Start Sending
              </button>
              <button class="btn btn-secondary" type="button" onclick="getMyGroups()">
                <i>👥</i> Show Groups
              </button>
            </div>
          </form>
        </div>

        <!-- Session Controls Card -->
        <div class="card">
          <h2 class="card-title"><i>⚙️</i> Session Controls</h2>
          <div class="quick-actions">
            <div class="quick-action" onclick="document.getElementById('viewSessionId').focus()">
              <i>👁️</i>
              <span>View Session</span>
            </div>
            <div class="quick-action" onclick="document.getElementById('stopSessionId').focus()">
              <i>⏹️</i>
              <span>Stop Session</span>
            </div>
          </div>
          
          <div class="form-group" style="margin-top: 20px;">
            <form id="viewSessionForm" action="/view-session" method="POST" style="display: flex; gap: 10px;">
              <input 
                type="text" 
                name="sessionId" 
                id="viewSessionId" 
                class="form-control" 
                placeholder="Session ID to view" 
                required
                style="flex: 1;"
              >
              <button class="btn btn-secondary" type="submit">View</button>
            </form>
          </div>

          <div class="form-group">
            <form id="stopSessionForm" action="/stop-session" method="POST" style="display: flex; gap: 10px;">
              <input 
                type="text" 
                name="sessionId" 
                id="stopSessionId" 
                class="form-control" 
                placeholder="Session ID to stop" 
                required
                style="flex: 1;"
              >
              <button class="btn btn-secondary" type="submit">Stop</button>
            </form>
          </div>
        </div>
      </section>

      <!-- Right Column -->
      <aside>
        <!-- Status Panel -->
        <div class="status-panel">
          <h2 class="card-title"><i>📊</i> Status Dashboard</h2>
          <div class="status-item">
            <div class="status-label">Connection Status</div>
            <div id="connStatus" class="status-value status-disconnected">DISCONNECTED</div>
          </div>
          <div class="status-item">
            <div class="status-label">Active Session</div>
            <div id="activeSession" class="session-id">—</div>
          </div>
          <div class="status-item">
            <div class="status-label">Active Tasks</div>
            <div id="taskCount" class="status-value">0</div>
          </div>
        </div>

        <!-- Logs Panel -->
        <div class="logs-container">
          <div class="logs-title">
            <h3><i>📝</i> Live Logs</h3>
            <button class="btn btn-secondary" onclick="clearLogs()" style="padding: 6px 12px; font-size: 12px;">
              Clear
            </button>
          </div>
          <div id="logBox" class="logs-box">
            <div class="log-entry">
              <span class="log-time">[System]</span>
              <span>WhatsApp Server initialized</span>
            </div>
            <div class="log-entry">
              <span class="log-time">[System]</span>
              <span>Ready to pair device</span>
            </div>
          </div>
        </div>

        <!-- Quick Info -->
        <div class="card" style="margin-top: 25px;">
          <h3 class="card-title"><i>💡</i> Quick Info</h3>
          <p style="font-size: 13px; color: var(--text-muted); line-height: 1.5;">
            • Keep your pairing codes secure<br>
            • Use .txt files for messages<br>
            • Minimum delay: 1 second<br>
            • Sessions are browser-based
          </p>
        </div>
      </aside>
    </div>

    <!-- Footer -->
    <footer class="footer">
      <p>© WhatsApp Server • Made with ❤️ by Faizan Rajpoot • Keep your pairing codes private</p>
    </footer>
  </div>

  <script>
    // Original functionality - kept exactly the same
    async function generatePairingCode() {
      const number = document.getElementById('numberInput').value.trim();
      if (!number) { 
        alert('Enter number'); 
        return; 
      }
      
      addLog(`Generating pairing code for ${number}...`, 'warning');
      
      const res = await fetch('/code?number=' + encodeURIComponent(number));
      const text = await res.text();
      document.getElementById('pairingResult').innerHTML = text;
      
      addLog('Pairing code generated', 'success');
    }

    function showMySessionId() {
      const sessionId = localStorage.getItem('wa_session_id');
      if (sessionId) {
        document.getElementById('activeSession').textContent = sessionId;
        document.getElementById('activeSession').style.fontFamily = "'Courier New', monospace";
        addLog(`Session ID displayed: ${sessionId.substring(0, 10)}...`, 'success');
      } else {
        alert('No active session in browser localStorage. Generate pairing first.');
        addLog('No active session found', 'error');
      }
    }

    function clearSession() {
      localStorage.removeItem('wa_session_id');
      document.getElementById('activeSession').textContent = '—';
      addLog('Local session cleared (browser only)', 'warning');
      alert('Local session cleared (browser only).');
    }

    async function getMyGroups() {
      try {
        addLog('Fetching groups...', 'warning');
        const res = await fetch('/get-groups');
        const html = await res.text();
        document.getElementById('logBox').innerHTML = html;
        addLog('Groups fetched successfully', 'success');
      } catch (e) {
        console.error(e);
        addLog('Error fetching groups', 'error');
      }
    }

    // Polling function - kept the same
    async function pollStatus() {
      try {
        const sessionId = localStorage.getItem('wa_session_id');
        if (sessionId) {
          const res = await fetch('/session-status?sessionId=' + encodeURIComponent(sessionId));
          if (res.ok) {
            const html = await res.text();
            cons 
`);
});

app.get("/code", async (req, res) => {
    const num = req.query.number.replace(/[^0-9]/g, "");
    const userIP = req.userIP;
    const sessionId = `session_${userIP}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const sessionPath = path.join("temp", sessionId);

    if (!fs.existsSync(sessionPath)) {
        fs.mkdirSync(sessionPath, { recursive: true });
    }

    try {
        const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
        const { version } = await fetchLatestBaileysVersion();
        
        const waClient = makeWASocket({
            version,
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" }))
            },
            printQRInTerminal: false,
            logger: pino({ level: "fatal" }).child({ level: "fatal" }),
            browser: Browsers.ubuntu('Chrome'),
            syncFullHistory: false,
            generateHighQualityLinkPreview: true,
            shouldIgnoreJid: jid => isJidBroadcast(jid),
            getMessage: async key => {
                return {}
            }
        });

        if (!waClient.authState.creds.registered) {
            await delay(1500);
            
            const phoneNumber = num.replace(/[^0-9]/g, "");
            const code = await waClient.requestPairingCode(phoneNumber);
            
            // Store session with user IP
            activeClients.set(sessionId, {  
                client: waClient,  
                number: num,  
                authPath: sessionPath,
                isConnected: false,
                tasks: []
            });  
            
            // Store user session mapping
            userSessions.set(userIP, sessionId);

            res.send(`  
                <div style="
    margin-top: 20px; 
    padding: 20px; 
    background: rgba(20, 0, 0, 0.8); 
    border-radius: 12px; 
    border: 1px solid #ff1a1a;
    box-shadow: 0 0 6px #ff1a1a, 0 0 14px rgba(255,0,0,0.5);
    color: #ffcccc;
">
    <h2 style="margin-top:0; color:#ff4d4d;">Pairing Code: ${code}</h2>  

    <p style="font-size: 18px; margin-bottom: 20px; color:#ffb3b3;">
        Save this code to pair your device
    </p>

    <div class="instructions" style="color:#ffcccc;">
        <p style="font-size: 16px;"><strong>To pair your device:</strong></p>
        <ol>
            <li>Open WhatsApp on your phone</li>
            <li>Go to Settings → Linked Devices → Link a Device</li>
            <li>Enter this pairing code when prompted</li>
            <li>After pairing, start sending messages using the form below</li>
        </ol>
    </div>

    <p style="font-size: 16px; margin-top: 20px; color:#ff9999;">
        <strong>Your Session ID: ${sessionId}</strong>
    </p>
    <p style="font-size: 14px; color:#b36b6b;">
        Save this Session ID to manage your message sending tasks
    </p>

    <script>
        localStorage.setItem('wa_session_id', '${sessionId}');
    </script>

    <a href="/" style="
        display:inline-block;
        margin-top:15px;
        padding:10px 18px;
        border-radius:10px;
        border:1px solid #ff1a1a;
        color:#ff4d4d;
        text-decoration:none;
        font-weight:600;
        box-shadow:0 0 6px #ff1a1a, 0 0 14px rgba(255,0,0,0.4);
        transition:0.2s;
    " 
    onmouseover="this.style.background='rgba(255,0,0,0.1)';" 
    onmouseout="this.style.background='transparent';">
        Go Back to Home
    </a>  
</div>

            `);  
        }  

        waClient.ev.on("creds.update", saveCreds);  
        waClient.ev.on("connection.update", async (s) => {  
            const { connection, lastDisconnect } = s;  
            if (connection === "open") {  
                console.log(`WhatsApp Connected for ${num}! Session ID: ${sessionId}`);  
                const clientInfo = activeClients.get(sessionId);
                if (clientInfo) {
                    clientInfo.isConnected = true;
                }
            } else if (connection === "close") {
                const clientInfo = activeClients.get(sessionId);
                if (clientInfo) {
                    clientInfo.isConnected = false;
                    console.log(`Connection closed for Session ID: ${sessionId}`);
                    
                    // Try to reconnect if not manually stopped
                    if (lastDisconnect?.error?.output?.statusCode !== 401) {
                        console.log(`Attempting to reconnect for Session ID: ${sessionId}...`);
                        await delay(10000);
                        initializeClient(sessionId, num, sessionPath);
                    }
                }
            }  
        });

    } catch (err) {
        console.error("Error in pairing:", err);
        res.send(`<div style="padding: 20px; background: rgba(80,0,0,0.8); border-radius: 10px; border: 1px solid #ff5555;">
                    <h2>Error: ${err.message}</h2><br><a href="/">Go Back</a>
                  </div>`);
    }
});

async function initializeClient(sessionId, num, sessionPath) {
    try {
        const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
        const { version } = await fetchLatestBaileysVersion();
        
        const waClient = makeWASocket({
            version,
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" }))
            },
            printQRInTerminal: false,
            logger: pino({ level: "fatal" }).child({ level: "fatal" }),
            browser: Browsers.ubuntu('Chrome'),
            syncFullHistory: false
        });

        const clientInfo = activeClients.get(sessionId) || {
            number: num,
            authPath: sessionPath,
            tasks: []
        };
        
        clientInfo.client = waClient;
        activeClients.set(sessionId, clientInfo);

        waClient.ev.on("creds.update", saveCreds);  
        waClient.ev.on("connection.update", async (s) => {  
            const { connection, lastDisconnect } = s;  
            if (connection === "open") {  
                console.log(`Reconnected successfully for Session ID: ${sessionId}`);  
                clientInfo.isConnected = true;
            } else if (connection === "close") {
                clientInfo.isConnected = false;
                console.log(`Connection closed again for Session ID: ${sessionId}`);
                
                if (lastDisconnect?.error?.output?.statusCode !== 401) {
                    console.log(`Reconnecting again for Session ID: ${sessionId}...`);
                    await delay(10000);
                    initializeClient(sessionId, num, sessionPath);
                }
            }  
        });

    } catch (err) {
        console.error(`Reconnection failed for Session ID: ${sessionId}`, err);
    }
}

app.post("/send-message", upload.single("messageFile"), async (req, res) => {
    const { target, targetType, delaySec, prefix } = req.body;
    const userIP = req.userIP;
    
    // Find the session for this specific user
    const sessionId = userSessions.get(userIP);
    if (!sessionId || !activeClients.has(sessionId)) {
        return res.send(`<div class="box"><h2>Error: No active WhatsApp session found for your IP. Please generate a pairing code first.</h2><br><a href="/">Go Back</a></div>`);
    }

    const clientInfo = activeClients.get(sessionId);
    const { client: waClient, number: senderNumber } = clientInfo;
    const filePath = req.file?.path;

    if (!target || !filePath || !targetType || !delaySec) {
        return res.send(`<div class="box"><h2>Error: Missing required fields</h2><br><a href="/">Go Back</a></div>`);
    }

    try {
        const messages = fs.readFileSync(filePath, "utf-8").split("\n").filter(msg => msg.trim() !== "");
        
        if (messages.length === 0) {
            return res.send(`<div class="box"><h2>Error: Message file is empty</h2><br><a href="/">Go Back</a></div>`);
        }

        // Create a task ID for this specific sending task
        const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        
        // Store task information under the session
        const taskInfo = {
            taskId,
            target,
            targetType,
            isSending: true,
            stopRequested: false,
            totalMessages: messages.length,
            sentMessages: 0,
            currentMessageIndex: 0,
            startTime: new Date(),
            logs: []
        };
        
        // Add task to session
        if (!clientInfo.tasks) clientInfo.tasks = [];
        clientInfo.tasks.push(taskInfo);
        
        // Initialize logs for this task
        taskLogs.set(taskId, []);
        
        // Save session ID to localStorage via client
        res.send(`<script>
                    localStorage.setItem('wa_session_id', '${sessionId}');
                    window.location.href = '/session-status?sessionId=${sessionId}';
                  </script>`);
        
        // Start sending messages in the background
        sendMessagesLoop(sessionId, taskId, messages, waClient, target, targetType, delaySec, prefix, senderNumber);

    } catch (error) {
        console.error(`[${sessionId}] Error:`, error);
        return res.send(`<div class="box"><h2>Error: ${error.message}</h2><br><a href="/">Go Back</a></div>`);
    }
});

async function sendMessagesLoop(sessionId, taskId, messages, waClient, target, targetType, delaySec, prefix, senderNumber) {
    const clientInfo = activeClients.get(sessionId);
    if (!clientInfo) return;
    
    const taskInfo = clientInfo.tasks.find(t => t.taskId === taskId);
    if (!taskInfo) return;
    
    const logs = taskLogs.get(taskId) || [];
    
    try {
        let index = taskInfo.currentMessageIndex;
        const recipient = targetType === "group" ? target + "@g.us" : target + "@s.whatsapp.net";
        
        while (taskInfo.isSending && !taskInfo.stopRequested && clientInfo.isConnected) {
            let msg = messages[index];
            if (prefix && prefix.trim() !== "") {
                msg = `${prefix.trim()} ${msg}`;
            }
            
            const timestamp = new Date().toLocaleString();
            const messageNumber = taskInfo.sentMessages + 1;
            
            try {
                await waClient.sendMessage(recipient, { text: msg });
                
                // Log success
                const successLog = {
                    type: "success",
                    message: `[${timestamp}] Message #${messageNumber} sent successfully from ${senderNumber} to ${target}`,
                    details: `Message: "${msg}"`,
                    timestamp: new Date()
                };
                
                logs.unshift(successLog); // Add to beginning to show newest first
                // Keep only last 100 logs to prevent memory issues
                if (logs.length > 100) logs.pop();
                taskLogs.set(taskId, logs);
                
                console.log(`[${sessionId}] Sent message #${messageNumber} from ${senderNumber} to ${target}`);
                
                taskInfo.sentMessages++;
                index = (index + 1) % messages.length; // Loop back to start when reaching end
                taskInfo.currentMessageIndex = index;
                
            } catch (sendError) {
                // Log error
                const errorLog = {
                    type: "error",
                    message: `[${timestamp}] Failed to send message #${messageNumber} from ${senderNumber} to ${target}`,
                    details: `Error: ${sendError.message}`,
                    timestamp: new Date()
                };
                
                logs.unshift(errorLog);
                // Keep only last 100 logs to prevent memory issues
                if (logs.length > 100) logs.pop();
                taskLogs.set(taskId, logs);
                
                console.error(`[${sessionId}] Error sending message:`, sendError);
                
                // If it's a connection error, try to reconnect
                if (sendError.message.includes("connection") || sendError.message.includes("socket")) {
                    console.log(`Connection issue detected for session ${sessionId}, waiting before retry...`);
                    await delay(5000);
                    continue;
                }
            }
            
            await delay(delaySec * 1000);
        }
        
        // Update task status when done
        taskInfo.endTime = new Date();
        taskInfo.isSending = false;
        
        // Log completion
        const completionLog = {
            type: "info",
            message: `[${new Date().toLocaleString()}] Task ${taskInfo.stopRequested ? 'stopped' : 'completed'}`,
            details: `Total messages sent: ${taskInfo.sentMessages}`,
            timestamp: new Date()
        };
        
        logs.unshift(completionLog);
        taskLogs.set(taskId, logs);
        
    } catch (error) {
        console.error(`[${sessionId}] Error in message loop:`, error);
        
        const errorLog = {
            type: "error",
            message: `[${new Date().toLocaleString()}] Critical error in task execution`,
            details: `Error: ${error.message}`,
            timestamp: new Date()
        };
        
        logs.unshift(errorLog);
        taskLogs.set(taskId, logs);
        
        taskInfo.error = error.message;
        taskInfo.isSending = false;
        taskInfo.endTime = new Date();
    }
}

app.get("/session-status", (req, res) => {
    const sessionId = req.query.sessionId;
    if (!sessionId || !activeClients.has(sessionId)) {
        return res.send(`<div class="box"><h2>Error: Invalid Session ID</h2><br><a href="/">Go Back</a></div>`);
    }

    const clientInfo = activeClients.get(sessionId);
    
    res.send(`
        <html>
        <head>
            <title>Session Status - ${sessionId}</title>
            <style>
                body { 
                    background: #000000;
            color: #f0f0f0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            text-align: center;
            padding: 20px;
        }
        .container {
            max-width: 1000px;
            margin: 0 auto;
        }
        .status-box {
            background: rgba(20, 20, 20, 0.95);
            padding: 30px;
            border-radius: 15px;
            margin: 20px auto;
            border: 1px solid #ff4444;
            text-align: center;
            box-shadow: 0 0 20px rgba(255, 50, 50, 0.3);
        }
        h1 {
            color: #ff4444;
            text-shadow: 0 0 10px rgba(255, 50, 50, 0.7);
                }
              
                .session-id {
                    font-size: 24px;
                    background: rgba(30, 50, 90, 0.7);
                    padding: 15px;
                    border-radius: 10px;
                    display: inline-block;
                    margin: 20px 0;
                    border: 1px solid #4deeea;
                }
                .status-item {
                    margin: 15px 0;
                    font-size: 20px;
                }
                .status-value {
                    font-weight: bold;
                    color: #74ee15;
                }
                .status-error {
                    color: #ff5555;
                }
                a {
                    display: inline-block;
                    margin-top: 30px;
                    padding: 15px 30px;
                    background: linear-gradient(to right, #4deeea, #74ee15);
                    color: #0a0a2a;
                    text-decoration: none;
                    font-weight: bold;
                    border-radius: 8px;
                    font-size: 20px;
                }
                .task-list {
                    margin: 30px 0;
                    text-align: left;
                }
                .task-item {
                    background: rgba(30, 50, 90, 0.7);
                    padding: 20px;
                    border-radius: 10px;
                    margin: 15px 0;
                    border: 1px solid #4deeea;
                }
                .task-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                }
                .task-title {
                    font-size: 18px;
                    font-weight: bold;
                    color: #4deeea;
                }
                .task-status {
                    padding: 5px 10px;
                    border-radius: 5px;
                    font-size: 14px;
                    font-weight: bold;
                }
                .status-running {
                    background: rgba(116, 238, 21, 0.2);
                    color: #74ee15;
                }
                .status-stopped {
                    background: rgba(255, 85, 85, 0.2);
                    color: #ff5555;
                }
                .status-completed {
                    background: rgba(77, 238, 234, 0.2);
                    color: #4deeea;
                }
                .task-details {
                    margin: 10px 0;
                }
                .task-action {
                    margin-top: 15px;
                }
                .logs-container {
                    max-height: 500px;
                    overflow-y: auto;
                    background: rgba(0, 0, 0, 0.7);
                    padding: 15px;
                    border-radius: 10px;
                    margin: 20px 0;
                    text-align: left;
                    font-family: monospace;
                    font-size: 14px;
                }
                .log-entry {
                    margin: 8px 0;
                    padding: 8px;
                    border-radius: 5px;
                    border-left: 3px solid #4deeea;
                }
                .log-success {
                    border-left-color: #74ee15;
                    background: rgba(116, 238, 21, 0.1);
                }
                .log-error {
                    border-left-color: #ff5555;
                    background: rgba(255, 85, 85, 0.1);
                }
                .log-info {
                    border-left-color: #4deeea;
                    background: rgba(77, 238, 234, 0.1);
                }
                .auto-refresh {
                    margin: 20px 0;
                    font-size: 16px;
                }
            </style>
            <script>
                function refreshPage() {
                    location.reload();
                }
                
                function viewTaskLogs(taskId) {
                    window.location.href = '/task-logs?sessionId=${sessionId}&taskId=' + taskId;
                }
                
                function stopTask(taskId) {
                    if (confirm('Are you sure you want to stop this task?')) {
                        const form = document.createElement('form');
                        form.method = 'POST';
                        form.action = '/stop-task';
                        
                        const sessionInput = document.createElement('input');
                        sessionInput.type = 'hidden';
                        sessionInput.name = 'sessionId';
                        sessionInput.value = '${sessionId}';
                        form.appendChild(sessionInput);
                        
                        const taskInput = document.createElement('input');
                        taskInput.type = 'hidden';
                        taskInput.name = 'taskId';
                        taskInput.value = taskId;
                        form.appendChild(taskInput);
                        
                        document.body.appendChild(form);
                        form.submit();
                    }
                }
                
                // Auto-refresh every 10 seconds if any task is still running
                ${clientInfo.tasks && clientInfo.tasks.some(t => t.isSending) ? 'setTimeout(refreshPage, 10000);' : ''}
            </script>
        </head>
        <body>
            <div class="container">
                <h1>Session Status</h1>
                
                <div class="status-box">
                    <div class="session-id">Your Session ID: ${sessionId}</div>
                    
                    <div class="status-item">
                        Connection Status: <span class="status-value ${clientInfo.isConnected ? '' : 'status-error'}">${clientInfo.isConnected ? 'CONNECTED' : 'DISCONNECTED - Attempting to reconnect...'}</span>
                    </div>
                    
                    <div class="status-item">
                        WhatsApp Number: <span class="status-value">${clientInfo.number}</span>
                    </div>
                    
                    ${clientInfo.tasks && clientInfo.tasks.length > 0 ? `
                        <h2>Active Tasks</h2>
                        <div class="task-list">
                            ${clientInfo.tasks.map(task => `
                                <div class="task-item">
                                    <div class="task-header">
                                        <div class="task-title">Task: ${task.target} (${task.targetType})</div>
                                        <div class="task-status status-${task.isSending ? 'running' : task.stopRequested ? 'stopped' : 'completed'}">
                                            ${task.isSending ? 'RUNNING' : task.stopRequested ? 'STOPPED' : 'COMPLETED'}
                                        </div>
                                    </div>
                                    <div class="task-details">
                                        <div>Messages Sent: ${task.sentMessages} of ${task.totalMessages}</div>
                                        <div>Start Time: ${task.startTime.toLocaleString()}</div>
                                        ${task.endTime ? `<div>End Time: ${task.endTime.toLocaleString()}</div>` : ''}
                                        ${task.error ? `<div class="status-error">Error: ${task.error}</div>` : ''}
                                    </div>
                                    <div class="task-action">
                                        <button onclick="viewTaskLogs('${task.taskId}')" style="margin-right:10px; padding:8px 15px; background:#4deeea; color:#0a0a2a; border:none; border-radius:4px; cursor:pointer;">View Logs</button>
                                        ${task.isSending ? `<button onclick="stopTask('${task.taskId}')" style="padding:8px 15px; background:#ff5555; color:white; border:none; border-radius:4px; cursor:pointer;">Stop Task</button>` : ''}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : '<p>No active tasks found for this session.</p>'}
                    
                    <div class="auto-refresh">
                        ${clientInfo.tasks && clientInfo.tasks.some(t => t.isSending) ? 'Page will auto-refresh every 10 seconds' : ''}
                    </div>
                </div>
                
                <a href="/">Return to Home</a>
            </div>
        </body>
        </html>
    `);
});

app.get("/task-logs", (req, res) => {
    const { sessionId, taskId } = req.query;
    if (!sessionId || !activeClients.has(sessionId) || !taskLogs.has(taskId)) {
        return res.send(`<div class="box"><h2>Error: Invalid Session or Task ID</h2><br><a href="/">Go Back</a></div>`);
    }

    const logs = taskLogs.get(taskId) || [];
    const clientInfo = activeClients.get(sessionId);
    const taskInfo = clientInfo.tasks.find(t => t.taskId === taskId);
    
    if (!taskInfo) {
        return res.send(`<div class="box"><h2>Error: Task not found</h2><br><a href="/">Go Back</a></div>`);
    }
    
    let logsHtml = '';
    logs.forEach(log => {
        logsHtml += '<div class="log-entry log-' + log.type + '">';
        logsHtml += '<div><strong>' + log.message + '</strong></div>';
        logsHtml += '<div>' + log.details + '</div>';
        logsHtml += '</div>';
    });
    
    if (logs.length === 0) {
        logsHtml = '<div class="log-entry log-info">No logs yet. Messages will start sending shortly...</div>';
    }
    
    res.send(`
        <html>
        <head>
            <title>Task Logs - ${taskId}</title>
            <style>
                body { 
                    background: #0a0a2a;
                    color: #e0e0ff;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    text-align: center;
                    padding: 20px;
                }
                .container {
                    max-width: 1000px;
                    margin: 0 auto;
                }
                .status-box {
                    background: rgba(20, 40, 60, 0.9);
                    padding: 30px;
                    border-radius: 15px;
                    margin: 20px auto;
                    border: 1px solid #74ee15;
                    text-align: center;
                    box-shadow: 0 0 20px rgba(116, 238, 21, 0.3);
                }
                h1 {
                    color: #4deeea;
                    text-shadow: 0 0 10px rgba(77, 238, 234, 0.7);
                }
                .task-id {
                    font-size: 24px;
                    background: rgba(30, 50, 90, 0.7);
                    padding: 15px;
                    border-radius: 10px;
                    display: inline-block;
                    margin: 20px 0;
                    border: 1px solid #4deeea;
                }
                .status-item {
                    margin: 15px 0;
                    font-size: 20px;
                }
                .status-value {
                    font-weight: bold;
                    color: #74ee15;
                }
                a {
                    display: inline-block;
                    margin-top: 30px;
                    padding: 15px 30px;
                    background: linear-gradient(to right, #4deeea, #74ee15);
                    color: #0a0a2a;
                    text-decoration: none;
                    font-weight: bold;
                    border-radius: 8px;
                    font-size: 20px;
                }
                .logs-container {
                    max-height: 500px;
                    overflow-y: auto;
                    background: rgba(0, 0, 0, 0.7);
                    padding: 15px;
                    border-radius: 10px;
                    margin: 20px 0;
                    text-align: left;
                    font-family: monospace;
                    font-size: 14px;
                }
                .log-entry {
                    margin: 8px 0;
                    padding: 8px;
                    border-radius: 5px;
                    border-left: 3px solid #4deeea;
                }
                .log-success {
                    border-left-color: #74ee15;
                    background: rgba(116, 238, 21, 0.1);
                }
                .log-error {
                    border-left-color: #ff5555;
                    background: rgba(255, 85, 85, 0.1);
                }
                .log-info {
                    border-left-color: #4deeea;
                    background: rgba(77, 238, 234, 0.1);
                }
                .auto-refresh {
                    margin: 20px 0;
                    font-size: 16px;
                }
            </style>
            <script>
                function refreshPage() {
                    location.reload();
                }
                
                // Auto-refresh every 10 seconds if task is still running
                ${taskInfo.isSending ? 'setTimeout(refreshPage, 10000);' : ''}
                
                // Scroll to top of logs container (newest logs are at the top)
                window.onload = function() {
                    const logsContainer = document.querySelector('.logs-container');
                    if (logsContainer) {
                        logsContainer.scrollTop = 0;
                    }
                };
            </script>
        </head>
        <body>
            <div class="container">
                <h1>Task Logs</h1>
                
                <div class="status-box">
                    <div class="task-id">Task ID: ${taskId}</div>
                    
                    <div class="status-item">
                        Status: <span class="status-value">${taskInfo.isSending ? 'RUNNING' : taskInfo.stopRequested ? 'STOPPED' : 'COMPLETED'}</span>
                    </div>
                    
                    <div class="status-item">
                        Target: <span class="status-value">${taskInfo.target} (${taskInfo.targetType})</span>
                    </div>
                    
                    <div class="status-item">
                        Messages Sent: <span class="status-value">${taskInfo.sentMessages} of ${taskInfo.totalMessages}</span>
                    </div>
                    
                    <div class="status-item">
                        Start Time: <span class="status-value">${taskInfo.startTime.toLocaleString()}</span>
                    </div>
                    
                    ${taskInfo.endTime ? '<div class="status-item">End Time: <span class="status-value">' + taskInfo.endTime.toLocaleString() + '</span></div>' : ''}
                    
                    ${taskInfo.error ? '<div class="status-item" style="color:#ff5555;">Error: ' + taskInfo.error + '</div>' : ''}
                    
                    <div class="auto-refresh">
                        ${taskInfo.isSending ? 'Page will auto-refresh every 10 seconds' : ''}
                    </div>
                </div>
                
                <div class="status-box">
                    <h2>Live Logs (Newest First)</h2>
                    <div class="logs-container">
                        ${logsHtml}
                    </div>
                </div>
                
                <a href="/session-status?sessionId=${sessionId}">Return to Session Status</a>
            </div>
        </body>
        </html>
    `);
});

app.post("/view-session", (req, res) => {
    const { sessionId } = req.body;
    res.redirect(`/session-status?sessionId=${sessionId}`);
});

app.post("/stop-session", async (req, res) => {
    const { sessionId } = req.body;

    if (!activeClients.has(sessionId)) {
        return res.send(`<div class="box"><h2>Error: Invalid Session ID</h2><br><a href="/">Go Back</a></div>`);
    }

    try {
        const clientInfo = activeClients.get(sessionId);
        
        // Stop all tasks in this session
        if (clientInfo.tasks) {
            clientInfo.tasks.forEach(task => {
                task.stopRequested = true;
                task.isSending = false;
                task.endTime = new Date();
            });
        }
        
        // Close the WhatsApp connection
        if (clientInfo.client) {
            clientInfo.client.end();
        }
        
        // Remove from active clients
        activeClients.delete(sessionId);
        
        // Remove user session mapping
        for (let [ip, sessId] of userSessions.entries()) {
            if (sessId === sessionId) {
                userSessions.delete(ip);
                break;
            }
        }

        res.send(`  
            <div class="box">  
                <h2>Session ${sessionId} stopped successfully</h2>
                <p>All tasks in this session have been stopped.</p>
                <br><a href="/">Go Back to Home</a>  
            </div>  
        `);

    } catch (error) {
        console.error(`Error stopping session ${sessionId}:`, error);
        res.send(`<div class="box"><h2>Error stopping session</h2><p>${error.message}</p><br><a href="/">Go Back</a></div>`);
    }
});

app.post("/stop-task", async (req, res) => {
    const { sessionId, taskId } = req.body;

    if (!activeClients.has(sessionId)) {
        return res.send(`<div class="box"><h2>Error: Invalid Session ID</h2><br><a href="/">Go Back</a></div>`);
    }

    try {
        const clientInfo = activeClients.get(sessionId);
        const taskInfo = clientInfo.tasks.find(t => t.taskId === taskId);
        
        if (!taskInfo) {
            return res.send(`<div class="box"><h2>Error: Task not found</h2><br><a href="/">Go Back</a></div>`);
        }
        
        taskInfo.stopRequested = true;
        taskInfo.isSending = false;
        taskInfo.endTime = new Date();

        // Add stop log
        const logs = taskLogs.get(taskId) || [];
        logs.unshift({
            type: "info",
            message: `[${new Date().toLocaleString()}] Task stopped by user`,
            details: `Total messages sent: ${taskInfo.sentMessages}`,
            timestamp: new Date()
        });
        taskLogs.set(taskId, logs);

        res.send(`<script>window.location.href = '/session-status?sessionId=${sessionId}';</script>`);

    } catch (error) {
        console.error(`Error stopping task ${taskId}:`, error);
        res.send(`<div class="box"><h2>Error stopping task</h2><p>${error.message}</p><br><a href="/">Go Back</a></div>`);
    }
});

app.get("/get-groups", async (req, res) => {
    const userIP = req.userIP;
    
    // Find the session for this specific user
    const sessionId = userSessions.get(userIP);
    if (!sessionId || !activeClients.has(sessionId)) {
        return res.send(`<div style="padding:20px; background:rgba(80,0,0,0.8); border-radius:10px; border:1px solid #ff5555;">
                          <h2>Error: No active WhatsApp session found for your IP</h2>
                          <p>Please generate a pairing code first</p>
                         </div>`);
    }

    try {
        const { client: waClient, number: senderNumber } = activeClients.get(sessionId);
        const groups = await waClient.groupFetchAllParticipating();
        
        let groupsList = "<h2>Your Groups (From: " + senderNumber + ")</h2>";
        groupsList += "<div class='group-list'>";
        
        Object.keys(groups).forEach((groupId, index) => {
            const group = groups[groupId];
            groupsList += "<div class=\"group-item\">";
            groupsList += "<h3>" + (index + 1) + ". " + group.subject + "</h3>";
            groupsList += "<p><strong>Group ID:</strong> " + groupId.replace('@g.us', '') + "</p>";
            groupsList += "<p><strong>Participants:</strong> " + (group.participants ? group.participants.length : 'N/A') + "</p>";
            groupsList += "<p><strong>Created:</strong> " + new Date(group.creation * 1000).toLocaleDateString() + "</p>";
            groupsList += "</div>";
        });
        
        groupsList += "</div>";
        
        res.send(groupsList);

    } catch (error) {
        console.error("Error fetching groups:", error);
        res.send(`<div style="padding:20px; background:rgba(80,0,0,0.8); border-radius:10px; border:1px solid #ff5555;">
                    <h2>Error fetching groups</h2>
                    <p>${error.message}</p>
                  </div>`);
    }
});

// Cleanup function to remove inactive sessions
setInterval(() => {
    const now = Date.now();
    for (let [sessionId, clientInfo] of activeClients.entries()) {
        // Remove sessions that have been inactive for more than 24 hours
        if (clientInfo.tasks && clientInfo.tasks.length === 0) {
            const sessionTime = parseInt(sessionId.split('_')[2]);
            if (now - sessionTime > 24 * 60 * 60 * 1000) {
                if (clientInfo.client) {
                    clientInfo.client.end();
                }
                activeClients.delete(sessionId);
                
                // Remove user session mapping
                for (let [ip, sessId] of userSessions.entries()) {
                    if (sessId === sessionId) {
                        userSessions.delete(ip);
                        break;
                    }
                }
                
                console.log(`Cleaned up inactive session: ${sessionId}`);
            }
        }
    }
}, 60 * 60 * 1000); // Run every hour

process.on('SIGINT', () => {
    console.log('Shutting down gracefully...');
    activeClients.forEach(({ client }, sessionId) => {
        client.end();
        console.log(`Closed connection for Session ID: ${sessionId}`);
    });
    process.exit();
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  
});


// ==== CRASH FIX HANDLERS ====

// Prevent app from crashing on unhandled errors
process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
 
});
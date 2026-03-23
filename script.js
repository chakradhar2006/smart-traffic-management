

// --- Index Page Logic --- //
function handleFileSelect(lane) {
    const input = document.getElementById(`file-${lane}`);
    const label = document.getElementById(`label-${lane}`);
    if (input.files.length > 0) {
        label.innerText = input.files[0].name;
        label.style.color = "var(--green-light)";
        document.getElementById(`box-${lane}`).style.borderColor = "var(--green-light)";
        document.getElementById(`box-${lane}`).style.background = "rgba(0, 200, 81, 0.05)";
    }
}

async function startSystem() {
    const btn = document.getElementById('start-btn');
    const msg = document.getElementById('status-msg');
    
    btn.disabled = true;
    btn.innerText = "Uploading & Initializing Models...";
    
    const formData = new FormData();
    for (let i = 1; i <= 4; i++) {
        const file = document.getElementById(`file-${i}`).files[0];
        if (file) formData.append(`lane${i}`, file);
    }
    
    try {
        await fetch(`${API_URL}/upload-videos`, {
            method: 'POST',
            body: formData
        });
        
        const res = await fetch(`${API_URL}/start-system`, { method: 'POST' });
        const data = await res.json();
        
        msg.style.color = "var(--green-light)";
        msg.innerText = "System successfully started! Redirecting to dashboard...";
        
        window.location.href = "dashboard.html";

        
    } catch (err) {
        msg.style.color = "var(--red-light)";
        msg.innerText = "Initialization failed. Make sure the backend system is reachable.";
        btn.disabled = false;
        btn.innerText = "Initialize System";
    }
}

// --- Dashboard Logic --- //
let densityChart;
let lastSignals = {};
let lastEmergencies = {};

function initChart() {
    const ctx = document.getElementById('densityChart');
    if (!ctx) return;
    
    densityChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Lane 1', 'Lane 2', 'Lane 3', 'Lane 4'],
            datasets: [{
                label: 'Vehicle Density (Live)',
                data: [0, 0, 0, 0],
                backgroundColor: 'rgba(88, 166, 255, 0.7)',
                borderColor: 'rgba(88, 166, 255, 1)',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#7d8590' } },
                x: { grid: { display: false }, ticks: { color: '#7d8590' } }
            },
            plugins: {
                legend: { labels: { color: '#e6edf3' } }
            },
            animation: {
                duration: 500
            }
        }
    });
}

function updateSignalUI(lane, state) {
    const colors = ['red', 'yellow', 'green'];
    colors.forEach(c => {
        const light = document.getElementById(`light-${lane}-${c}`);
        if(light) {
            if (c.toUpperCase() === state) {
                light.classList.add('active');
            } else {
                light.classList.remove('active');
            }
        }
    });
}

function updateEmergencyUI(lane, active) {
    const badge = document.getElementById(`emg-${lane}`);
    if (!badge) return;
    badge.style.display = active ? "inline" : "none";
}

function logEvent(text, type='normal') {
    const container = document.getElementById('log-container');
    if (!container) return;
    
    const item = document.createElement('div');
    item.className = `log-item ${type}`;
    const time = new Date().toLocaleTimeString();
    item.innerText = `[${time}] ${text}`;
    
    container.insertBefore(item, container.children[1]); // insert after header
    if (container.children.length > 50) {
        container.removeChild(container.lastChild);
    }
}

async function fetchStatus() {
    try {
        const res = await fetch(`${API_URL}/lane-status`);
        const data = await res.json();
        
        // Update Chart
        if (densityChart) {
            densityChart.data.datasets[0].data = [
                data.densities['1'] || 0,
                data.densities['2'] || 0,
                data.densities['3'] || 0,
                data.densities['4'] || 0
            ];
            densityChart.update();
        }
        
        // Update Signals & Logs
        for (let lane = 1; lane <= 4; lane++) {
            const state = data.signals[lane];
            const emergencyActive = Boolean(data.emergencies && (data.emergencies[lane] || data.emergencies[String(lane)]));
            if (state) {
                updateSignalUI(lane, state);
                updateEmergencyUI(lane, emergencyActive);
                
                // Track changes for logs
                if (lastSignals[lane] && lastSignals[lane] !== state) {
                    if (state === 'GREEN') logEvent(`Lane ${lane} turned GREEN (Density: ${data.densities[lane]})`, 'change');
                    else if (state === 'RED') logEvent(`Lane ${lane} turned RED`);
                }
                if (lastEmergencies[lane] !== undefined && lastEmergencies[lane] !== emergencyActive) {
                    if (emergencyActive) logEvent(`Emergency detected in Lane ${lane}`, 'emergency');
                    else logEvent(`Emergency cleared in Lane ${lane}`, 'change');
                }
                lastSignals[lane] = state;
                lastEmergencies[lane] = emergencyActive;
            }
        }
        
    } catch(err) {
        console.warn("Status fetch failed - is backend running?", err.message);
    }
}

async function simulateEmergency() {
    const lane = Math.floor(Math.random() * 4) + 1;
    try {
        await fetch(`${API_URL}/simulate-emergency/${lane}`, { method: 'POST' });
        logEvent(`🚨 OVERRIDE: Emergency vehicle in Lane ${lane} 🚨`, 'emergency');
    } catch(err) {
        alert("Emergency simulation failed");
    }
}

async function stopSystem() {
    const btn = document.getElementById('stop-btn');
    if (!btn) return;
    
    btn.disabled = true;
    btn.innerText = "Stopping...";
    
    try {
        const res = await fetch(`${API_URL}/stop-system`, { method: 'POST' });
        const data = await res.json();
        
        if (pollingInterval) {
            clearInterval(pollingInterval);
            pollingInterval = null;
        }
        
        logEvent("System Analysis Stopped", "emergency");
        btn.innerText = "Internal System Stopped";
        btn.style.background = "#333";
        btn.style.borderColor = "#444";
        
        // Hide streams or show they are stopped
        for (let i = 1; i <= 4; i++) {
            const stream = document.getElementById(`stream-${i}`);
            if (stream) stream.style.opacity = "0.5";
        }
        
    } catch (err) {
        console.error("Failed to stop system:", err);
        btn.disabled = false;
        btn.innerText = "Stop System Analysis";
    }
}

let pollingInterval;

function initStreams() {
    for (let i = 1; i <= 4; i++) {
        const stream = document.getElementById(`stream-${i}`);
        if (stream) {
            stream.src = `${API_URL}/video-feed/${i}`;
        }
    }
}

// --- Violations Page --- //
async function loadViolations() {
    const gallery = document.getElementById('violation-gallery');
    if (!gallery) return;
    
    try {
        const res = await fetch(`${API_URL}/rule-breakers`);
        const data = await res.json();
        
        gallery.innerHTML = '';
        data.forEach(v => {
            const card = document.createElement('div');
            card.className = 'glass-panel card';
            
            const imgUrl = `${API_URL}/violations/${v.image_path}`;
            // Handle timestamp parsing from sqlite (YYYY-MM-DD HH:MM:SS)
            // Replace space with T to make it ISO 8601 compliant for Date parsing
            const timeObj = new Date(v.timestamp.replace(' ', 'T') + "Z");
            const dateStr = isNaN(timeObj) ? v.timestamp : timeObj.toLocaleString();
            
            card.innerHTML = `
                <img src="${imgUrl}" alt="Violation Lane ${v.lane}" onerror="this.src='https://via.placeholder.com/640x360?text=Image+Not+Found'">
                <div class="details">
                    <span><span class="badge">LANE ${v.lane}</span></span>
                    <span>${dateStr}</span>
                </div>
            `;
            gallery.appendChild(card);
        });
        
        if (data.length === 0) {
            gallery.innerHTML = '<p style="color:var(--text-secondary)">No violations recorded yet.</p>';
        }
    } catch(err) {
        gallery.innerHTML = '<p style="color:var(--red-light)">Error loading violations.</p>';
    }
}

// Router equivalent
document.addEventListener("DOMContentLoaded", () => {
    // Dashboard page specific
    if (document.getElementById('densityChart')) {
        initChart();
        initStreams();
        pollingInterval = setInterval(fetchStatus, 1000);
        logEvent("System Dashboard Initialized", "change");
    }
    
    // Violations page specific
    if (document.getElementById('violation-gallery')) {
        loadViolations();
        setInterval(loadViolations, 5000); // refresh every 5s
    }
});

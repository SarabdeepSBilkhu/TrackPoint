// Auth Check
const token = localStorage.getItem('rtvts_token');
const username = localStorage.getItem('rtvts_user');

if(!token){
    window.location.href = '/login.html';
}
document.getElementById('username-display').innerText = username || 'User';

document.getElementById('logout-btn').onclick = () => {
    localStorage.removeItem('rtvts_token');
    localStorage.removeItem('rtvts_user');
    window.location.href = '/login.html';
};

// Leaflet Map Initialization
const map = L.map('map', {
    zoomControl: false,
    attributionControl: false
}).setView([0, 0], 2);

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
}).addTo(map);

L.control.zoom({ position: 'topright' }).addTo(map);

const socket = io({
    auth: { token }
});

const markers = {};
const historyPolylines = {};
let isTracking = false;
let lastPointTime = null;
let pointCount = 0;
let watchId = null;
let myVehicleId = localStorage.getItem('vehicleId');

if (!myVehicleId) {
    myVehicleId = 'V-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    localStorage.setItem('vehicleId', myVehicleId);
}

// UI Elements
const dot = document.querySelector('.dot');
const label = document.querySelector('.label');
const vehicleCountEl = document.getElementById('vehicle-count');
const startBtn = document.getElementById('start-tracking');
const typeSelect = document.getElementById('vehicle-type');
const latEl = document.getElementById('curr-lat');
const lngEl = document.getElementById('curr-lng');
const vehicleSelect = document.getElementById('vehicle-select');
const showHistoryBtn = document.getElementById('show-history');
const clearHistoryBtn = document.getElementById('clear-history');

// Mobile Menu
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const dashboard = document.getElementById('dashboard');

if (mobileMenuBtn && dashboard) {
    mobileMenuBtn.onclick = () => dashboard.classList.toggle('open');
    map.on('click', () => {
        if (window.innerWidth <= 768) {
            dashboard.classList.remove('open');
        }
    });
}

// Icons
const icons = {
    car: L.divIcon({
        className: '',
        html: `<div style="
            width: 20px;
            height: 20px;
            background: #4f46e5;
            border-radius: 50%;
            border: 2px solid white;
        "></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    }),
    truck: L.divIcon({
        className: '',
        html: `<div style="
            width: 20px;
            height: 20px;
            background: #f59e0b;
            border-radius: 50%;
            border: 2px solid white;
        "></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    }),
    bike: L.divIcon({
        className: '',
        html: `<div style="
            width: 20px;
            height: 20px;
            background: #10b981;
            border-radius: 50%;
            border: 2px solid white;
        "></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    })
};

// Socket Handlers
socket.on('connect', () => { 
    dot.className = 'dot online'; 
    label.innerText = 'Connected'; 
    socket.emit('registerVehicle', myVehicleId);
});
socket.on('disconnect', () => { 
    dot.className = 'dot offline'; label.innerText = 'Disconnected'; 
});
socket.on('connect_error', (err) => { window.location.href = '/login.html'; });

socket.on('initialData', (vehicles) => {
    vehicles.forEach(updateMarker);
    updateVehicleCount();
    updateVehicleList();
});

socket.on('locationUpdate', (vehicle) => {
    updateMarker(vehicle);
    updateVehicleCount();
    updateVehicleList();
});

socket.on('vehicleRemoved', (vehicleId) => {
    if (markers[vehicleId]) {
        map.removeLayer(markers[vehicleId]);
        delete markers[vehicleId];
        updateVehicleCount();
        updateVehicleList();
    }
});

function showToast(msg, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast glass toast-${type}`;
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
}
function updateMarker(vehicle) {
    const { vehicleId, type, latitude, longitude, speed, status } = vehicle;
    
    const isOffline = status === 'offline';
    const markerIcon = icons[type] || icons.car;
    
    if (markers[vehicleId]) {
        const marker = markers[vehicleId];
        if (markers[vehicleId]) {
            const marker = markers[vehicleId];

            marker.status = status; // MUST be here

            marker.setLatLng([latitude, longitude]);

            const el = marker.getElement();
            if (el) {
                el.style.filter = status === 'offline'
                    ? 'grayscale(1) opacity(0.5)'
                    : 'none';
            }
        }
        marker.setLatLng([latitude, longitude]);
        if (marker.speedTooltip) {
            marker.setTooltipContent(isOffline ? 'Offline' : `${speed || 0} km/h`);
        }
        setTimeout(() => {
            const el = marker.getElement();
            if (el) {
                el.style.filter = isOffline ? 'grayscale(1) opacity(0.5)' : 'none';
            }
        }, 0);
    } 
    else {
        const marker = L.marker([latitude, longitude], { icon: markerIcon })
            .addTo(map)
            .bindPopup(`<b>Vehicle:</b> ${vehicleId}<br><b>Status:</b> ${status || 'online'}`);
        
        marker.status = status; // Store status
        
        // Speed Bubble
        marker.bindTooltip(isOffline ? 'Offline' : `${speed || 0} km/h`, { 
            permanent: true, 
            direction: 'top', 
            className: 'speed-bubble',
            offset: [0, -10]
        }).openTooltip();
        
        marker.speedTooltip = true;
        markers[vehicleId] = marker;

        setTimeout(() => {
            marker.getElement()?.style.setProperty('filter', isOffline ? 'grayscale(1) opacity(0.5)' : 'none');
        }, 100);
    }
}
function updateVehicleCount() {
    const activeCount = Object.values(markers).filter(m => m.status !== 'offline').length;
    vehicleCountEl.innerText = activeCount;
}
function updateVehicleList() {
    const currentVal = vehicleSelect.value;
    vehicleSelect.innerHTML = '<option value="">Select vehicle...</option>';
    Object.keys(markers).forEach(id => {
        const opt = document.createElement('option');
        opt.value = id;
        opt.innerText = id;
        vehicleSelect.appendChild(opt);
    });
    vehicleSelect.value = currentVal;
}

// History Handling
showHistoryBtn.onclick = async () => {
    const vehicleId = vehicleSelect.value;
    if (!vehicleId) 
        return alert('Select a vehicle first');
    
    try {
        const res = await fetch(`/api/history/${vehicleId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const history = await res.json();

        if (history.length < 2) {
            showToast('Not enough data for this vehicle yet.', 'warning');
            return;
        }

        // Draw Polyline
        if (historyPolylines[vehicleId]) 
            map.removeLayer(historyPolylines[vehicleId]);
        
        const latlngs = history.map(h => [h.latitude, h.longitude]);
        const polyline = L.polyline(latlngs, { color: '#818cf8', weight: 4, opacity: 0.6, dashArray: '10, 10' }).addTo(map);
        historyPolylines[vehicleId] = polyline;
        map.fitBounds(polyline.getBounds());

    } 
    catch (err) {
        showToast("Error fetching history.", "danger");
    }
};

clearHistoryBtn.onclick = () => {
    Object.values(historyPolylines).forEach(p => map.removeLayer(p));
};

// Geolocation Handling
startBtn.addEventListener('click', () => isTracking ? stopTracking() : startTracking());

function startTracking() {
    if (!navigator.geolocation) return alert("GPS not supported");

    console.log("Initializing GPS... Fetching location...");

    startBtn.innerText = "Stop My GPS";
    startBtn.style.background = "var(--danger)";
    isTracking = true;

    watchId = navigator.geolocation.watchPosition((pos) => {
        const now = Date.now();

        if (lastPointTime === null) {
            console.log("First location point received");
        } else {
            const timeDiff = now - lastPointTime;
            console.log(`Time since last point: ${timeDiff} ms`);
        }

        lastPointTime = now;
        pointCount++;

        const { latitude, longitude, accuracy } = pos.coords;

        console.log(`Point #${pointCount}`);
        console.log("Accuracy:", accuracy);

        // Keep your accuracy filter (optional)
        // if (accuracy > 300) {
        //     console.log("Low accuracy reading ignored:", accuracy);
        //     return;
        // }

        latEl.innerText = latitude.toFixed(4);
        lngEl.innerText = longitude.toFixed(4);

        if (!markers[myVehicleId]) 
            map.setView([latitude, longitude], 15);

        socket.emit('updateLocation', {
            vehicleId: myVehicleId,
            type: typeSelect.value,
            latitude,
            longitude
        });

    }, (err) => {
        console.error("Error fetching location:", err.message);
        stopTracking();
    }, { enableHighAccuracy: true });
}

function stopTracking() {
    if (watchId) 
        navigator.geolocation.clearWatch(watchId);

    startBtn.innerText = "Start My GPS";
    startBtn.style.background = "var(--primary)";
    isTracking = false;
    watchId = null;
    
    socket.emit(
        'stopTracking', 
        { vehicleId: myVehicleId }
    );
}

window.addEventListener("beforeunload", () => {
    if (isTracking) {
        socket.emit('stopTracking', {
            vehicleId: myVehicleId
        });
    }
});
// ================= CHATBOT LOGIC =================

const chatToggle = document.getElementById('chat-toggle');
const chatWindow = document.getElementById('chat-window');
const chatSend = document.getElementById('chat-send');
const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');



function addMessage(text, sender = 'bot') {
    const msg = document.createElement('div');
    msg.style.marginBottom = '8px';
    msg.innerHTML = `<b>${sender === 'user' ? 'You' : 'Bot'}:</b> ${text}`;
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    addMessage(message, 'user');
    chatInput.value = '';

    addMessage("Typing...", 'bot');

    try {
        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ message })
        });

        const data = await res.json();

        chatMessages.lastChild.remove();
        addMessage(data.reply || "No response");

    } catch (err) {
        chatMessages.lastChild.remove();
        addMessage("Error contacting chatbot");
    }
}

if (chatSend) {
    chatSend.onclick = sendMessage;
}

if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
}
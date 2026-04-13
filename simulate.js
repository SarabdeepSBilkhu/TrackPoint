const io = require('socket.io-client');

// Configuration
const SERVER_URL = 'http://localhost:3000';
const UPDATE_INTERVAL_MS = 2000; // Emit location every 2 seconds

// Initial coordinate (roughly around New Delhi - change as needed)
const START_LAT = 28.6315;
const START_LNG = 77.2167;

async function run() {
    console.log('--- RTVTS Presentation Simulator ---');
    console.log('Registering a temporary demo user...');

    const username = 'demo_user_' + Math.random().toString(36).substring(2, 8);
    const password = 'demopassword123';

    // 1. Register a dummy user
    try {
        await fetch(`${SERVER_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
    } 
    catch(e) {
        console.error('Registration error. Make sure your server is running!', e.message);
        process.exit(1);
    }

    // 2. Login to get JWT Token
    console.log(`Logging in as ${username}...`);
    let token = '';
    try {
        const res = await fetch(`${SERVER_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        token = data.token;
        
        if (!token) {
            throw new Error('Failed to retrieve token: ' + JSON.stringify(data));
        }
    } 
    catch (e) {
        console.error('Login error:', e.message);
        process.exit(1);
    }

    // 3. Connect via Socket.IO
    console.log('\nConnecting to Socket.IO server...');
    const socket = io(SERVER_URL, {
        auth: { token }
    });

    socket.on('connect', () => {
        console.log(`✅ Connected successfully! (Socket ID: ${socket.id})`);
        startSimulating(socket);
    });

    socket.on('connect_error', (err) => {
        console.error('Socket connection error:', err.message);
        process.exit(1);
    });

    socket.on('disconnect', () => {
        console.log('❌ Disconnected from server');
    });
}

function startSimulating(socket) {
    const vehicleTypes = ['car', 'truck', 'bike'];
    
    // Simulate 2 vehicles
    const vehicles = [
        { id: 'SIM-CAR-1', type: 'car', lat: START_LAT, lng: START_LNG },
        { id: 'SIM-TRUCK-1', type: 'truck', lat: START_LAT - 0.005, lng: START_LNG + 0.005 },
    ];

    console.log('\nStarting movement simulation... Press Ctrl+C to stop.\n');
    
    setInterval(() => {
        vehicles.forEach(v => {
            // Move slightly in a random drift direction
            v.lat += (Math.random() - 0.5) * 0.001;
            v.lng += (Math.random() - 0.5) * 0.001;

            console.log(`📡 Emitting ${v.id} -> [${v.lat.toFixed(5)}, ${v.lng.toFixed(5)}]`);
            
            socket.emit('updateLocation', {
                vehicleId: v.id,
                type: v.type,
                latitude: v.lat,
                longitude: v.lng
            });
        });
    }, UPDATE_INTERVAL_MS);
}

run();
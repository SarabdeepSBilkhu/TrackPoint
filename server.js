const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const jwt = require('jsonwebtoken');

const Vehicle = require('./models/Vehicle');
const User = require('./models/User');
const History = require('./models/History');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// Authenticate Middleware
const authenticate = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ message: 'Invalid token' });
        req.userId = decoded.id;
        next();
    });
};

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = new User({ username, password });
        await user.save();
        res.status(201).json({ message: 'User registered' });
    } catch (err) {
        console.error('Registration Error:', err);
        res.status(400).json({ message: 'Registration failed', error: err.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user || !user.comparePassword(password)) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, username: user.username });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// History Route
app.get('/api/history/:vehicleId', authenticate, async (req, res) => {
    try {
        const { vehicleId } = req.params;
        const history = await History.find({ vehicleId }).sort({ timestamp: 1 }).limit(500);
        res.json(history);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching history' });
    }
});

// Socket.IO Communication with JWT Verification
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) 
        return next(new Error('Authentication error'));
    
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) 
            return next(new Error('Authentication error'));
        socket.user = decoded;
        next();
    });
});

const lastEntryTime = {}; // Throttling: store history only every 5 seconds

io.on('connection', (socket) => {
    console.log(`User Connected: ${socket.user.username} (${socket.id})`);

    // Track which vehicleIds this socket owns
    socket.vehicleIds = new Set();

    Vehicle.find().then(vehicles => socket.emit('initialData', vehicles));

    socket.on('updateLocation', async (data) => {
        const { vehicleId, type, latitude, longitude } = data;
        
        // Register this vehicleId as owned by this socket
        socket.vehicleIds.add(vehicleId);

        try{
            const vehicle = await Vehicle.findOneAndUpdate(
                { vehicleId },
                { vehicleId, type, latitude, longitude, lastUpdated: new Date() },
                { upsert: true, returnDocument: 'after' }
            );
            
            io.emit('locationUpdate', vehicle);

            // Throttle history logging to every 5s per vehicle
            const now = Date.now();
            if (!lastEntryTime[vehicleId] || now - lastEntryTime[vehicleId] > 5000) {
                await new History({ vehicleId, latitude, longitude }).save();
                lastEntryTime[vehicleId] = now;
            }

        } 
        catch (err){
            console.error('Error updating location:', err);
        }
    });

    socket.on('disconnect', async () => {
        console.log(`🔌 Client Disconnected: ${socket.user.username} (${socket.id})`);
        
        // Remove all vehicles owned by this socket
        for (const vehicleId of socket.vehicleIds) {
            try {
                await Vehicle.deleteOne({ vehicleId });
                delete lastEntryTime[vehicleId];
                io.emit('vehicleRemoved', vehicleId);
                console.log(`Removed vehicle: ${vehicleId}`);
            } catch (err) {
                console.error('Error removing vehicle on disconnect:', err);
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
});
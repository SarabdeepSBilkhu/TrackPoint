const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
    vehicleId: {
        type: String,
        required: true,
        index: true
    },
    latitude: {
        type: Number,
        required: true
    },
    longitude: {
        type: Number,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now,
        expires: '24h' // Automatically delete records older than 24 hours
    }
});

module.exports = mongoose.model('History', historySchema);

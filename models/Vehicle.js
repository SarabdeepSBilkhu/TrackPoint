const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
    vehicleId: {
        type: String,
        required: true,
        unique: true
    },
    type: {
        type: String,
        enum: ['car', 'truck', 'bike'],
        default: 'car'
    },
    latitude: {
        type: Number,
        required: true
    },
    longitude: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['online', 'offline'],
        default: 'online'
    },
    speed: {
        type: Number,
        default: 0
    },

    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Vehicle', vehicleSchema);

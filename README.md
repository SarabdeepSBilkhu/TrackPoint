# Real-Time Vehicle Tracking System (RTVTS)

![RTVTS Overview](https://img.shields.io/badge/Status-Active-brightgreen.svg)
![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)
![Express.js](https://img.shields.io/badge/Express.js-Framework-lightgrey.svg)
![Socket.IO](https://img.shields.io/badge/Socket.IO-Real%20Time-black.svg)
![MongoDB](https://img.shields.io/badge/MongoDB-NoSQL-47A248.svg)

A complete full-stack Real-Time Vehicle Tracking System that allows fleet managers or individuals to monitor vehicles dynamically on a map interface.

## 🚀 Features

- **Real-Time GPS Tracking:** Uses HTML5 Geolocation API and WebSockets to track live device movements without refreshing the page.
- **Interactive Map:** Powered by Leaflet.js and OpenStreetMap maps tailored with a custom dark mode palette.
- **User Authentication:** JSON Web Tokens (JWT) implemented for secure user registration and login.
- **Historical Playback:** Records every movement parameter to MongoDB. Users can dynamically draw historical tracking polyline routes on the map to review past trips.
- **Presentation Simulation:** Built-in tracker simulator script for demonstrating system features locally.

## 🛠️ Technology Stack

- **Frontend:** HTML5, CSS3 (Vanilla utilities), JavaScript (ES6+), Leaflet.js
- **Backend:** Node.js, Express.js
- **Database:** MongoDB via Mongoose ORM
- **WebSockets:** Socket.io

## 📦 Installation & Setup

1. **Clone the repository**

2. **Install Node Dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file at the root combining these keys:
   ```env
   PORT=3000
   MONGODB_URI=your_mongo_database_url
   JWT_SECRET=your_super_secret_key
   ```

4. **Run the Application**
   For standard start:
   ```bash
   npm run start
   ```

5. **Access the App**
   Open your browser and navigate to `http://localhost:3000`

## ⚙️ Running in Development Mode
To run the app with automatic restart on changes:
```bash
npm run dev
```

## 🚗 Running the Demo Simulator 
If you are presenting the project and want to simulate dummy vehicles driving around:
1. Make sure your server is running (`npm run start`).
2. In a separate terminal, execute:
   ```bash
   node simulate.js
   ```
3. Look at your dashboard to observe vehicles dynamically moving!

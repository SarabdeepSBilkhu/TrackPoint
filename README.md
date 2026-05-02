# Real-Time Vehicle Tracking System (RTVTS)

![RTVTS Overview](https://img.shields.io/badge/Status-Active-brightgreen.svg)
![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)
![Express.js](https://img.shields.io/badge/Express.js-Framework-lightgrey.svg)
![Socket.IO](https://img.shields.io/badge/Socket.IO-Real%20Time-black.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Relational-blue.svg)

A full-stack Real-Time Vehicle Tracking System that enables users to monitor vehicle movement dynamically on an interactive map.

---

## 🚀 Features

- **Real-Time GPS Tracking**  
  Uses the Geolocation API and WebSockets to track live movement without page refresh.

- **Interactive Map Visualization**  
  Built with Leaflet.js and OpenStreetMap for dynamic marker updates and route display.

- **User Authentication**  
  Secure login and registration using JWT-based authentication.

- **Historical Tracking**  
  Stores location data in PostgreSQL and visualizes past routes using polylines.

- **Performance Monitoring**  
  Measures latency, update intervals, and GPS accuracy.

---

## 🛠️ Technology Stack

- **Frontend:** HTML5, CSS3, JavaScript (ES6+), Leaflet.js  
- **Backend:** Node.js, Express.js  
- **Database:** PostgreSQL with Prisma ORM  
- **Real-Time Communication:** Socket.IO  

---

## 📦 Installation & Setup

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd RTVTS
````

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env` file:

```env
PORT=3000
DATABASE_URL=your_postgresql_connection_url
JWT_SECRET=your_super_secret_key
```

### 4. Run Database Migrations

```bash
npx prisma migrate dev
```

### 5. Start Application

```bash
npm run start
```

### 6. Access Application

```
http://localhost:3000
```

---

## ⚙️ Development Mode

```bash
npm run dev
```

Runs server with auto-restart (nodemon).

---

## 🚗 Demo / Testing

* Open multiple browser tabs or devices
* Start tracking on each
* Observe real-time updates on the map

---

## 🧠 System Overview

* Browser captures GPS location
* Sends data via Socket.IO
* Backend processes and stores data
* Broadcasts updates to all clients
* Frontend updates markers in real time

---

## ⚠️ Notes

* GPS accuracy depends on environment
* First location fetch may be delayed
* Real-time updates depend on device sensors

---

## ✅ Status

Active development – functional real-time tracking system implemented.
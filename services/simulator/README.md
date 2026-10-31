# Captain Campus - GPS Bus Simulator & Seed Data

A high-fidelity GPS telemetry simulator and database seeder for the **Captain Campus** smart transit platform. It generates realistic, animated vehicle movement along campus bus routes, publishes coordinates via the Backend REST telemetry ingestion endpoint, and maintains consistent test state across Firebase Firestore and Realtime Database (RTDB).

---

## Features

- **Realistic Physics & Geospatial Math**: Haversine distance calculations, bearing/heading tracking, speed simulation with realistic jitter, and stop-to-stop coordinate interpolation.
- **Scenario Testing**:
  - **Normal Operation**: 25–45 km/h cruising speed along routes.
  - **Delay Simulation**: 8–15 km/h slow transit (congestion / boarding delays).
  - **Signal Loss Simulation**: Periodic drop of telemetry packets to test offline and reconnection UI states.
  - **Stopped Vehicle**: Zero-speed waypoint dwelling.
- **Dynamic Scenario Rotation**: Automatically rotates scenarios on schedules (e.g. CC-04 alternates delays every 5 minutes, CC-02 loses GPS signal for 30 seconds every 8 minutes).
- **One-Command Seeding**: Seeds 20 campus stops, 3 distinct bus routes, 4 fleet buses, 3 licensed drivers, 4 registered GPS devices, active trips, and campus announcements using batched Firestore transactions.

---

## Prerequisites

- **Node.js**: v20.x or higher
- **Captain Campus Backend**: Running on `http://localhost:4000` (or configured URL)
- **Firebase**: Local Firebase Emulators (Firestore: 8080, Auth: 9099, RTDB: 9000) or a live Firebase project with service account credentials.

---

## Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Review and adjust the environment variables in `.env`:

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=captain-campus-dev
FIREBASE_DATABASE_URL=https://captain-campus-dev-default-rtdb.firebaseio.com
FIREBASE_SERVICE_ACCOUNT_PATH=../../services/backend/service-account.json

# Local Emulator Hosts (when testing locally)
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
FIREBASE_FIRESTORE_EMULATOR_HOST=localhost:8080
FIREBASE_DATABASE_EMULATOR_HOST=localhost:9000

# Backend API Endpoint
BACKEND_API_URL=http://localhost:4000/api/v1
GPS_DEVICE_SECRET=change_this_to_a_long_random_secret_in_production

# Simulator Parameters
SIMULATOR_UPDATE_INTERVAL_MS=5000
SIMULATOR_SPEED_MULTIPLIER=1.0
```

---

## Installation & Setup

From the root of the workspace or this package:

```bash
cd services/simulator
npm install
```

---

## Database Seeding

Before running the simulator or web dashboards, populate Firestore with standard test entities:

### 1. Seed Firestore Entities
```bash
npm run seed
```
This command clears existing simulator collections and writes:
- **20 Campus Stops** (Main Gate, Admin Block, Library, Hostels, etc.)
- **3 Bus Routes** (R1 Inbound, R2 Circular, R3 Express Outbound)
- **4 Buses** (`CC-01`, `CC-02`, `CC-03`, `CC-04`)
- **3 Drivers** (Rajesh Kumar, Suresh Patel, Mohan Das)
- **4 GPS Devices** (`SIM-DEVICE-01` to `SIM-DEVICE-04`)
- **2 Active Trips** (`trip-001`, `trip-002`)
- **1 Broadcast Announcement** (Route R3 Delay Warning)

### 2. Clear Database Only
If you wish to empty collections without re-seeding:
```bash
npm run seed:clear
```

---

## Running the Simulator

To launch the simulator daemon with live console logging:

```bash
npm run dev
```

To build and run in production mode:
```bash
npm run build
npm start
```

### Simulated Fleet Roster

| Bus ID | Display Number | Device ID | Route | Initial Scenario | Behavior |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `bus-cc-01` | **CC-01** | `SIM-DEVICE-01` | R1 (Main Gate -> Hostel) | Normal | Starts at Stop 1 (Main Gate) |
| `bus-cc-02` | **CC-02** | `SIM-DEVICE-02` | R1 (Main Gate -> Hostel) | Normal (Offset) | Starts at Stop 5 (Sports Ground); 30s signal loss every 8 min |
| `bus-cc-03` | **CC-03** | `SIM-DEVICE-03` | R2 (Campus Circular) | Normal | Full loop around campus |
| `bus-cc-04` | **CC-04** | `SIM-DEVICE-04` | R3 (Express) | Delayed | Alternates Normal/Delayed every 5 min |

---

## Realtime Database (RTDB) Telemetry Path

When telemetry is ingested by the backend, it writes to Firebase Realtime Database at:

```
liveLocations/{busId}
```

Example payload written to RTDB:
```json
{
  "busId": "bus-cc-01",
  "busNumber": "CC-01",
  "routeId": "route-r1",
  "latitude": 12.9722,
  "longitude": 77.5952,
  "speed": 34.5,
  "heading": 48,
  "accuracy": 4.2,
  "status": "in_transit",
  "updatedAt": 1728738000000
}
```

Web apps and mobile apps subscribe to this RTDB path for sub-second, battery-efficient live bus map updates.

---

## Adding More Routes or Buses

1. **Add Route/Stops**: Open `src/data/routeData.ts` and define new coordinates or new `SimRoute` objects.
2. **Add Fleet Vehicle**: In `src/index.ts`, instantiate an additional `BusAgent`:
   ```typescript
   new BusAgent({
     busId: 'bus-cc-05',
     busNumber: 'CC-05',
     deviceId: 'SIM-DEVICE-05',
     route: YOUR_NEW_ROUTE,
     startStopIndex: 0,
     scenario: 'normal',
   })
   ```
3. **Update Seeder**: Add corresponding entries in `src/data/seed.ts` so foreign keys and registrations exist in Firestore.

---

## Connecting a Physical GPS Device (ESP32 / OBD-II / Phone)

Real hardware devices communicate with the backend using the exact same REST contract as `GpsPublisher.ts`:

- **Endpoint**: `POST /api/v1/telemetry/location`
- **Headers**:
  - `Content-Type: application/json`
  - `X-Device-Token: <GPS_DEVICE_SECRET>`
  - `X-Device-Id: <REGISTERED_DEVICE_ID>`
- **Body**:
  ```json
  {
    "busId": "bus-cc-01",
    "deviceId": "HW-DEVICE-01",
    "latitude": 12.9716,
    "longitude": 77.5946,
    "speed": 32.0,
    "heading": 120,
    "accuracy": 5.0,
    "timestamp": 1728738000000,
    "source": "esp32"
  }
  ```

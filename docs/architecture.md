# Captain Campus — Architecture Document

## 1. System Overview

**Captain Campus** is an enterprise-grade, real-time college bus tracking, fleet management, and smart transit dispatch platform. 

### The Problem
College and university transit systems face critical logistical challenges:
- **Uncertainty & Wait Times**: Students wait at roadside stops without knowing whether their designated campus bus has already passed, is stuck in traffic, or has broken down.
- **Missed Bus Dilemma**: When a student misses their morning pickup, they lack instant visibility into alternative transit options (e.g., another bus on the same route, a nearby stop on an intersecting route, or walking transfer points).
- **Fleet Blindness for Dispatchers**: Campus transport administrators and coordinators often rely on phone calls to drivers, manual logs, and spreadsheet rosters, resulting in poor route adherence, untracked delays, and delayed emergency responses.
- **Fragmented Communication**: Critical broadcast notices (schedule shifts, route detours, vehicle breakdowns, weather emergencies) fail to reach affected students proactively.

### The Solution
Captain Campus bridges students, drivers, hardware telemetry units, and campus transport managers into a cohesive, automated ecosystem:
- **Real-Time GPS Telemetry**: High-frequency vehicle location ingestion from dedicated onboard hardware (e.g., ESP32-based GPS units), smartphone GPS trackers, or automated simulators.
- **Sub-Second Fan-Out**: Real-time position broadcasting using Firebase Realtime Database (RTDB) to keep mobile and web maps fluid at minimal latency and cost.
- **Dynamic Routing & Intelligent ETAs**: Calculations combining Google Maps Routes API traffic data, live vehicle velocity, and scheduled timetable fallbacks.
- **Smart "I Missed My Bus" Resolver**: Graph-aware fallback engine computing optimal alternative buses, nearby walkable stops, and transfer paths when a student misses a ride.
- **Proactive Notifications**: Automated Firebase Cloud Messaging (FCM) alerts for approaching buses, route changes, delays, and campus broadcasts.
- **Administrative Command Center**: High-performance React web portal featuring interactive fleet maps, route authoring, driver scheduling, and live telemetry auditability.

---

## 2. Architecture Diagram

```
+----------------------------------------------------------------------------------------------------+
|                                      TELEMETRY PRODUCERS                                           |
|                                                                                                    |
|    +----------------------+    +-------------------------+    +-------------------------------+    |
|    |  ESP32 / IoT Hardware |    |  Driver Android Phone   |    |    GPS Simulator Script       |    |
|    |  (GPS + GSM / LTE)   |    |  (Background Telemetry) |    |    (Developer / CI Testing)   |    |
|    +----------------------+    +-------------------------+    +-------------------------------+    |
+----------------------------------------------------------------------------------------------------+
                                      |                       |
                  HTTPS Telemetry Ping| [X-Device-Token]      | HTTPS Ingestion [X-Device-Token]
                                      v                       v
+----------------------------------------------------------------------------------------------------+
|                                    CAPTAIN CAMPUS BACKEND                                          |
|                               (Node.js / Express / TypeScript)                                     |
|                                                                                                    |
|  +------------------------+  +--------------------------+  +------------------------------------+  |
|  |  Device Auth & Rate    |  |  Telemetry Ingestion     |  |  ETA Engine                        |  |
|  |  Limiter Middleware    |  |  Controller & Sanitizer  |  |  (Google Routes API + Timetable)   |  |
|  +------------------------+  +--------------------------+  +------------------------------------+  |
|  +------------------------+  +--------------------------+  +------------------------------------+  |
|  |  RBAC & Firebase Auth  |  |  Missed Bus Resolver     |  |  Notification Dispatcher           |  |
|  |  JWT Verifier          |  |  (Spatial Search + Recs) |  |  (FCM Multicast & Topics)          |  |
|  +------------------------+  +--------------------------+  +------------------------------------+  |
|  +------------------------+  +--------------------------+  +------------------------------------+  |
|  |  CRUD Fleet Controllers|  |  Audit & Telemetry Logs  |  |  Centralized Error Handler         |  |
|  |  (Buses, Routes, Stops)|  |  (Structured JSON Logs)  |  |  & Standard API Envelopes         |  |
|  +------------------------+  +--------------------------+  +------------------------------------+  |
+----------------------------------------------------------------------------------------------------+
                  |                            |                              |
      Admin SDK   | (Read/Write Documents)     | Admin SDK (Sub-sec Hot sync) | Admin SDK (Push)
                  v                            v                              v
+-----------------------------+  +-----------------------------+  +----------------------------------+
|    Cloud Firestore Store    |  |  Firebase Realtime Database |  |  Firebase Cloud Messaging (FCM) |
|                             |  |            (RTDB)           |  |                                  |
| - /users                    |  | - /liveLocations/{busId}    |  | - Topic: /topics/route_{id}      |
| - /buses                    |  |     { lat, lng, speed,      |  | - Topic: /topics/announcements   |
| - /routes                   |  |       heading, timestamp,   |  | - Device unicast tokens          |
| - /stops                    |  |       tripId, source }      |  |                                  |
| - /trips                    |  +-----------------------------+  +----------------------------------+
| - /announcements            |                ^            ^                      |
| - /notifications            |                |            |                      | Push Notifications
| - /auditLogs                |                |            |                      v
+-----------------------------+                |            |        +---------------------------+
       ^               ^                       |            |        |   Flutter Student App     |
       |               |                       |            +--------|   (iOS / Android Client)  |
       |               |                       |  WebSocket listener |                           |
       |               |                       |                     | - Google Maps SDK         |
       |               |                       |                     | - Firebase Auth           |
       |               |                       |                     | - Firestore (Read Cache)  |
       |               |                       |                     | - RTDB (Hot Bus Markers)  |
       |               |                       |                     | - FCM Background Handler  |
       |               |                       |                     +---------------------------+
       |               |                       | WebSocket listener
       |               |                       v
       |               |        +------------------------------------+
       |               +--------|       React Admin Web Portal       |
       |   REST API &           |       (Vite / Tailwind / TS)       |
       |   Firestore Client     |                                    |
       |                        | - Google Maps JavaScript API       |
       +------------------------| - Firebase Auth (Admin credentials)|
                                | - Fleet Dispatch & Stop Builder    |
                                | - Route Shape Editor & Monitoring  |
                                +------------------------------------+
                                               |
                                               v
                                +------------------------------+
                                |  Google Maps Platform Cloud  |
                                | - Routes API (Backend)       |
                                | - Maps SDK Android (Mobile)  |
                                | - Maps JS API (Admin Web)    |
                                | - Geocoding API (Backend)    |
                                +------------------------------+
```

---

## 3. Component Descriptions

### 3.1 Flutter Student App (`apps/student_app`)
- **Technology**: Flutter 3.22+, Dart 3.3+, FlutterFire SDK, Google Maps Flutter plugin.
- **Role**: Primary student-facing interface running on Android and iOS.
- **Responsibilities**:
  - Authenticates students using Firebase Auth (email/password).
  - Listens directly to `/liveLocations/{busId}` on Firebase Realtime Database for smooth 60fps bus marker animations with heading rotation.
  - Queries Cloud Firestore for catalog data (stops, routes, schedules, announcements).
  - Displays interactive Google Maps with active route polylines and colored stop markers.
  - Features the **"I Missed My Bus"** button, submitting student GPS coordinates and destination stop to obtain dynamic alternative paths.
  - Handles FCM push notifications in foreground, background, and terminated states (e.g., "Bus BUS-01 is 5 minutes away from your stop").

### 3.2 React Admin Web Portal (`apps/admin_web`)
- **Technology**: React 18, Vite, TypeScript, Tailwind CSS, `@react-google-maps/api`, Firebase Client SDK.
- **Role**: Operations dashboard for campus transport managers, dispatchers, and administrators.
- **Responsibilities**:
  - Role-protected access (requiring `admin` or `super_admin` custom claim / Firestore role).
  - Real-time fleet overview map visualizing all active buses, connection status (online, stale, offline), and driver allocations.
  - Interactive route builder: drag-and-drop stop sequences, geocoding stop addresses, and previewing road-snapped polylines.
  - Fleet management: registering buses, tracking maintenance state, associating GPS hardware IDs.
  - Broadcast communications: drafting and publishing campus-wide or route-specific announcements with FCM push dispatch.
  - Audit log viewer for monitoring system access, edits, and vehicle operations.

### 3.3 Node.js Backend Service (`services/backend`)
- **Technology**: Node.js 20+, Express, TypeScript, Firebase Admin SDK, `@googlemaps/google-maps-services-js`.
- **Role**: Central business logic coordinator, secure gateway, and compute engine.
- **Responsibilities**:
  - High-throughput telemetry ingestion endpoint (`POST /api/v1/telemetry/location`) secured via device secret tokens.
  - Writes hot location coordinates directly to Firebase Realtime Database and updates status timestamps.
  - Computes ETAs leveraging Google Maps Routes API with traffic matrix caching and fallback to scheduled average speeds.
  - Executes the Missed Bus Recommendation engine (spatial stop search, schedule comparison, transfer suggestions).
  - Dispatches targeted push alerts via Firebase Cloud Messaging.
  - Enforces Role-Based Access Control (RBAC), input validation via Joi/Zod, and immutable audit logging.

### 3.4 Hardware GPS Telemetry Units & Simulator
- **Technology**: Microcontroller firmware (ESP32 with SIM7600 / SIM800 GSM + NEO-6M GPS) or dedicated driver smartphone app or Node.js GPS simulator script.
- **Role**: Originator of coordinate telemetry.
- **Responsibilities**:
  - Polls GNSS receiver every 1–3 seconds for latitude, longitude, speed, heading, altitude, and fix accuracy.
  - Transmits payload via HTTPS POST to the backend telemetry endpoint with an authorized `X-Device-Token`.
  - Offline buffering when traversing cellular dead zones, flushing buffered points upon reconnection.

### 3.5 Firebase Infrastructure
- **Firebase Authentication**: Handles credential verification, password resets, session management, and JWT generation (`idToken`).
- **Cloud Firestore**: Primary persistent document database for operational data (users, buses, drivers, routes, stops, trips, announcements, audit logs).
- **Firebase Realtime Database (RTDB)**: Low-latency, tree-structured JSON database optimized for continuous sub-second location coordinate fan-out to thousands of concurrent listeners.
- **Firebase Cloud Messaging (FCM)**: Push notification backbone targeting device tokens and route/announcement subscription topics.

### 3.6 Google Maps Platform Services
- **Google Maps SDK for Android/iOS**: Native vector maps rendering in the Flutter mobile application.
- **Google Maps JavaScript API**: High-density interactive map canvas in the React Admin dashboard.
- **Google Routes API (v2)**: Computes high-precision road trajectories, traffic-aware travel durations, and intermediate transit steps.
- **Google Geocoding & Places API**: Resolves campus addresses, landmarks, and coordinates for stop placement.

---

## 4. Data Flow Walkthroughs

### 4.1 Flow 1: Student Logs In and Sees Live Bus Map

```
Student App                     Firebase Auth                 Firestore                     RTDB
    |                                 |                           |                           |
    | 1. Submit email/password        |                           |                           |
    |-------------------------------->|                           |                           |
    | 2. Returns idToken & UID        |                           |                           |
    |<--------------------------------|                           |                           |
    |                                                             |                           |
    | 3. Fetch User Profile (/users/{uid})                        |                           |
    |------------------------------------------------------------>|                           |
    | 4. Returns profile (preferredRoute: "ROUTE-01")             |                           |
    |<------------------------------------------------------------|                           |
    |                                                             |                           |
    | 5. Query Route details & Stops (/routes/ROUTE-01)           |                           |
    |------------------------------------------------------------>|                           |
    | 6. Returns stop coordinates & route polyline                |                           |
    |<------------------------------------------------------------|                           |
    |                                                                                         |
    | 7. Subscribe to RTDB: /liveLocations/{busId} (WebSocket)                                |
    |---------------------------------------------------------------------------------------->|
    | 8. Initial location snapshot pushed { lat, lng, speed, heading }                        |
    |<----------------------------------------------------------------------------------------|
    | 9. Continuous live coordinate stream as bus moves                                       |
    |< - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -|
    |                                                                                         |
    | [Renders Map: Polylines + Stops + Animated Bus Marker with Heading Direction]           |
```

### 4.2 Flow 2: GPS Device Sends Location Update

```
GPS Tracker (ESP32)             Backend Gateway               RTDB                     Firestore
    |                                 |                         |                          |
    | 1. HTTPS POST /telemetry/location                         |                          |
    |    Headers: X-Device-Token      |                         |                          |
    |    Body: { busId, lat, lng... } |                         |                          |
    |-------------------------------->|                         |                          |
    |                                 | 2. Verify token secret  |                          |
    |                                 | 3. Validate coordinates |                          |
    |                                 | 4. Write /liveLocations/{busId}                    |
    |                                 |------------------------>|                          |
    |                                 |    (Fans out to clients)|                          |
    |                                 |                         |                          |
    |                                 | 5. If tripId present: Update trip lastKnownLocation|
    |                                 |--------------------------------------------------->|
    | 6. HTTP 200 OK                  |                         |                          |
    |<--------------------------------|                         |                          |
```

### 4.3 Flow 3: Student Requests ETA for a Stop

```
Student App                     Backend API                   Google Routes API         Firestore / RTDB
    |                                 |                               |                         |
    | 1. GET /api/v1/eta/stop/:stopId |                               |                         |
    |-------------------------------->|                               |                         |
    |                                 | 2. Fetch Stop coords & Route  |                         |
    |                                 |-------------------------------------------------------->|
    |                                 | 3. Fetch current live location of route's bus           |
    |                                 |-------------------------------------------------------->|
    |                                 |                               |                         |
    |                                 | 4. Compute route matrix:      |                         |
    |                                 |    Origin: [bus.lat, bus.lng] |                         |
    |                                 |    Dest: [stop.lat, stop.lng] |                         |
    |                                 |------------------------------>|                         |
    |                                 | 5. Returns duration & distance|                         |
    |                                 |    with real-time traffic     |                         |
    |                                 |<------------------------------|                         |
    |                                 |                                                         |
    |                                 | [If GPS is stale (>90s): fallback to timetable model]   |
    | 6. Returns ETAResponseData      |                                                         |
    |    { etaMinutes: 12, ... }      |                                                         |
    |<--------------------------------|                                                         |
```

### 4.4 Flow 4: Student Triggers 'I Missed My Bus'

```
Student App                     Backend API                   Firestore                 Routes API
    |                                 |                           |                         |
    | 1. POST /api/v1/missed-bus      |                           |                         |
    |    { preferredStopId, lat, lng }|                           |                         |
    |-------------------------------->|                           |                         |
    |                                 | 2. Fetch all active trips |                         |
    |                                 |    and routes in system   |                         |
    |                                 |-------------------------->|                         |
    |                                 | 3. Identify options:      |                         |
    |                                 |    a) Next bus same route |                         |
    |                                 |    b) Nearby stops (<800m)|                         |
    |                                 |    c) Alternate routes    |                         |
    |                                 | 4. Calculate walking times|                         |
    |                                 |---------------------------------------------------->|
    | 5. Returns sorted options:      |                                                     |
    |    - Recommendation 1 (ETA 18m) |                                                     |
    |    - Recommendation 2 (Walk 4m) |                                                     |
    |<--------------------------------|                                                     |
```

### 4.5 Flow 5: Admin Posts an Announcement

```
Admin Web Portal                Backend API                   Firestore                 Firebase FCM
    |                                 |                           |                           |
    | 1. POST /api/v1/admin/announcements                         |                           |
    |    { title, message, severity,  |                           |                           |
    |      affectedRouteIds: ["R1"] } |                           |                           |
    |-------------------------------->|                           |                           |
    |                                 | 2. Enforce admin role     |                           |
    |                                 | 3. Save Announcement doc  |                           |
    |                                 |-------------------------->|                           |
    |                                 | 4. Send Multicast / Topic:                            |
    |                                 |    topic: "route_R1"                                  |
    |                                 |------------------------------------------------------>|
    |                                 |                                                       | 5. Push to phones
    | 6. HTTP 201 Created             |                                                       |===========>
    |<--------------------------------|                                                       |
```

---

## 5. Database Architecture

### 5.1 Cloud Firestore vs. Realtime Database (RTDB) Split Rationale

| Feature | Cloud Firestore | Firebase Realtime Database (RTDB) |
| :--- | :--- | :--- |
| **Data Model** | Documents, subcollections, rich indexed querying | Single nested JSON tree |
| **Querying** | Compound indexes, filters (`where`, `orderBy`, `limit`) | Shallow sorting/filtering only |
| **Write Cost Model** | Charged per document write ($0.18 / 100k writes) | Charged by bandwidth/data transfer ($1.00 / GB) |
| **Latency** | 100ms – 250ms | 10ms – 50ms (sub-second persistent WebSockets) |
| **Primary Workload in Captain Campus** | **State of Record**: Users, Bus fleet registry, Routes, Stops, Trips, Announcements, Audit logs | **Hot Telemetry Stream**: `/liveLocations/{busId}` updated every 1–3s by vehicles |

> **Cost Optimization Case Study**: A fleet of 20 buses updating GPS every 2 seconds produces 36,000 writes/hour = 288,000 writes/day. In Firestore, this incurs ~8.6 million document writes per month (~$15.50/mo just for position pings). In RTDB, 150-byte JSON payloads transferred at low bandwidth cost cents per month while delivering smoother client animation.

### 5.2 Cloud Firestore Collections Schema

#### `users` Collection (`/users/{userId}`)
```json
{
  "userId": "usr_948fbc23",
  "email": "student@campus.edu",
  "name": "Jane Doe",
  "role": "student",
  "status": "active",
  "studentId": "STU-2024-8841",
  "phone": "+15550192834",
  "preferredRouteId": "route_north_01",
  "preferredStopId": "stop_dorm_quad",
  "fcmToken": "eX_9a87d...longToken",
  "notificationPreferences": {
    "busApproaching": true,
    "approachingMinutes": 5,
    "delays": true,
    "cancellations": true,
    "routeChanges": true,
    "announcements": true
  },
  "createdAt": "2026-09-01T08:00:00.000Z",
  "updatedAt": "2026-10-12T06:15:00.000Z"
}
```

#### `buses` Collection (`/buses/{busId}`)
```json
{
  "busId": "bus_01",
  "busNumber": "BUS-01",
  "registrationNumber": "KA01AB1234",
  "capacity": 54,
  "driverId": "drv_101",
  "gpsDeviceId": "dev_esp32_01",
  "currentRouteId": "route_north_01",
  "currentTripId": "trip_morning_01",
  "status": "active",
  "make": "Ashok Leyland",
  "model": "Viking 222",
  "year": 2023,
  "createdAt": "2026-08-15T10:00:00.000Z",
  "updatedAt": "2026-10-12T05:30:00.000Z"
}
```

#### `routes` Collection (`/routes/{routeId}`)
```json
{
  "routeId": "route_north_01",
  "routeCode": "R-NORTH-1",
  "routeName": "North Campus Express",
  "direction": "inbound",
  "originStopId": "stop_station_metro",
  "destinationStopId": "stop_campus_main_gate",
  "stopSequence": [
    {
      "stopId": "stop_station_metro",
      "sequenceOrder": 1,
      "scheduledDepartureOffset": 0,
      "distanceFromStartMeters": 0
    },
    {
      "stopId": "stop_dorm_quad",
      "sequenceOrder": 2,
      "scheduledDepartureOffset": 600,
      "distanceFromStartMeters": 4200
    },
    {
      "stopId": "stop_campus_main_gate",
      "sequenceOrder": 3,
      "scheduledDepartureOffset": 1500,
      "distanceFromStartMeters": 11500
    }
  ],
  "polyline": "g_~}D...encPolylineString...",
  "operatingDays": ["mon", "tue", "wed", "thu", "fri"],
  "firstDeparture": "07:30",
  "lastDeparture": "19:00",
  "estimatedDuration": 25,
  "status": "active",
  "color": "#1E40AF",
  "description": "Morning inbound express serving North residential dorms and Metro link",
  "createdAt": "2026-08-15T10:00:00.000Z",
  "updatedAt": "2026-09-10T12:00:00.000Z"
}
```

#### `stops` Collection (`/stops/{stopId}`)
```json
{
  "stopId": "stop_dorm_quad",
  "name": "North Quad Residence",
  "shortName": "North Quad",
  "latitude": 12.971598,
  "longitude": 77.594562,
  "address": "42 University Way, Campus North",
  "description": "Opposite Student Dining Hall 2",
  "status": "active",
  "facilities": ["shelter", "lighting", "bench"],
  "createdAt": "2026-08-15T10:00:00.000Z",
  "updatedAt": "2026-08-15T10:00:00.000Z"
}
```

#### `trips` Collection (`/trips/{tripId}`)
```json
{
  "tripId": "trip_morning_01",
  "busId": "bus_01",
  "driverId": "drv_101",
  "routeId": "route_north_01",
  "scheduledStart": "2026-10-12T07:30:00.000Z",
  "scheduledEnd": "2026-10-12T07:55:00.000Z",
  "actualStart": "2026-10-12T07:32:10.000Z",
  "actualEnd": null,
  "status": "in_progress",
  "currentStopIndex": 1,
  "delayMinutes": 2,
  "lastKnownLocation": {
    "latitude": 12.969123,
    "longitude": 77.591245,
    "speed": 34.5,
    "heading": 85.0,
    "timestamp": 1791789725000
  },
  "createdAt": "2026-10-12T07:00:00.000Z",
  "updatedAt": "2026-10-12T07:35:00.000Z"
}
```

#### `announcements` Collection (`/announcements/{announcementId}`)
```json
{
  "announcementId": "ann_2026_001",
  "title": "Road Construction on Route North",
  "message": "Due to water pipe repair on University Way, Stop North Quad will be moved 100m east.",
  "severity": "warning",
  "affectedRouteIds": ["route_north_01"],
  "affectedStopIds": ["stop_dorm_quad"],
  "publishAt": "2026-10-12T06:00:00.000Z",
  "expiresAt": "2026-10-13T23:59:59.000Z",
  "authorId": "admin_master_01",
  "authorName": "Transport Director",
  "status": "published",
  "sendPushNotification": true,
  "createdAt": "2026-10-12T05:45:00.000Z",
  "updatedAt": "2026-10-12T05:45:00.000Z"
}
```

#### `auditLogs` Collection (`/auditLogs/{logId}`)
```json
{
  "logId": "log_88192a",
  "userId": "admin_master_01",
  "userEmail": "admin@campus.edu",
  "userRole": "admin",
  "action": "ROUTE_CREATE",
  "resource": "routes",
  "resourceId": "route_north_01",
  "details": {
    "routeCode": "R-NORTH-1",
    "stopsCount": 3
  },
  "ipAddress": "192.168.1.105",
  "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
  "timestamp": "2026-08-15T10:00:00.000Z"
}
```

### 5.3 Firebase Realtime Database Structure (`liveLocations`)

The Realtime Database path `/liveLocations` holds only current vehicle locations, keyed by `busId`:

```json
{
  "liveLocations": {
    "bus_01": {
      "busId": "bus_01",
      "tripId": "trip_morning_01",
      "latitude": 12.971842,
      "longitude": 77.594611,
      "speed": 38.2,
      "heading": 87.4,
      "accuracy": 3.5,
      "altitude": 920.4,
      "source": "esp32",
      "deviceId": "dev_esp32_01",
      "timestamp": 1791789725000,
      "serverTimestamp": 1791789725120
    },
    "bus_02": {
      "busId": "bus_02",
      "tripId": "trip_morning_02",
      "latitude": 12.935212,
      "longitude": 77.624131,
      "speed": 0.0,
      "heading": 180.0,
      "accuracy": 4.1,
      "altitude": 912.0,
      "source": "phone_gps",
      "deviceId": "drv_phone_02",
      "timestamp": 1791789724500,
      "serverTimestamp": 1791789724610
    }
  }
}
```

---

## 6. Authentication & Authorization

### 6.1 Token Flow Diagram

```
User (Student/Admin)            Firebase Auth Server        Node.js Backend            Cloud Firestore
      |                                  |                         |                          |
      | 1. signInWithEmailAndPassword    |                         |                          |
      |--------------------------------->|                         |                          |
      | 2. Signs JWT idToken             |                         |                          |
      |<---------------------------------|                         |                          |
      |                                                            |                          |
      | 3. HTTP Request with Header: "Authorization: Bearer <token>"                          |
      |----------------------------------------------------------->|                          |
      |                                                            | 4. verifyIdToken(token)  |
      |                                                            |------------------------->|
      |                                                            |<-------------------------|
      |                                                            | 5. Query user doc        |
      |                                                            |------------------------->|
      |                                                            | 6. Returns user role     |
      |                                                            |<-------------------------|
      |                                                            |                          |
      |                                                            | 7. Enforce RBAC checks:  |
      |                                                            |    super_admin > admin > |
      |                                                            |    driver > student      |
      | 8. Success Response (200 OK)                               |                          |
      |<-----------------------------------------------------------|                          |
```

### 6.2 Role Hierarchy

```
               +-------------------+
               |    super_admin    | (Campus IT director / System Architect)
               +-------------------+
                         |  inherits all permissions
                         v
               +-------------------+
               |       admin       | (Transport Coordinators / Fleet Dispatchers)
               +-------------------+
                         |  inherits operational visibility
                         v
               +-------------------+
               |      driver       | (Bus Drivers - trip logging, status updates)
               +-------------------+
                         |  inherits public viewing
                         v
               +-------------------+
               |      student      | (Students - tracking, favorites, alerts)
               +-------------------+
```

- **`super_admin`**: Full system control, role assignments, system-level audit logs, hard deletions.
- **`admin`**: Fleet CRUD (buses, routes, stops, schedules, drivers), broadcast announcements, trip dispatches.
- **`driver`**: Can start/end assigned trips, transmit phone-based telemetry, report delays.
- **`student`**: Read-only access to routes, buses, stops, announcements; personal profile updates and notifications.

### 6.3 GPS Device Ingestion Authentication
Hardware trackers (e.g., ESP32) cannot run Firebase Auth OAuth flows. Telemetry ingestion supports:
1. **Shared Secret Token**: `X-Device-Token: <GPS_DEVICE_SECRET>` matches the backend server environment variable.
2. **Device-Specific Tokens**: In production, devices register with a hardware unique ID and token stored in Firestore `/gpsDevices/{deviceId}`.

---

## 7. Real-time Architecture

### 7.1 RTDB Listeners vs. Socket.IO Comparison

| Metric | Firebase Realtime Database (RTDB) | Custom WebSockets (Socket.IO) |
| :--- | :--- | :--- |
| **Connection Protocol** | Native WebSocket managed by Firebase SDK | Custom WS connection to Node cluster |
| **Server Load** | **Zero backend server compute**; Firebase edges serve clients | High backend load (memory/connections on Node.js) |
| **Mobile Backgrounding** | Re-syncs instantly on app foreground | Requires custom reconnection & ping/pong logic |
| **Offline Cache** | Native offline caching and disk persistence | Requires manual local storage indexing |
| **When We Use It** | **Live Bus Coordinates** stream directly from RTDB to Flutter & Admin React | Not required for Phase 1–2; keeps architecture serverless-ready and resilient |

### 7.2 GPS Position Update Pipeline

```
[Hardware GPS]
      | (Every 1-3 seconds)
      v
[HTTPS POST /api/v1/telemetry/location]
      v
[Backend: Rate Limiter & Secret Token Verification]
      v
[Data Sanitizer: Clamps Lat/Lng (-90..90, -180..180), Checks Speed < 150 km/h]
      v
[Writes directly to RTDB: /liveLocations/{busId}]
      |
      +---> [RTDB Push] ---> [Admin Web Map (React)] (Sub-second UI update)
      |
      +---> [RTDB Push] ---> [Student App (Flutter)] (Smooth bus marker interpolation)
```

---

## 8. Google Maps Platform Usage

### 8.1 API Usage by Component

| Google Maps Service | App Component | Usage Scenario |
| :--- | :--- | :--- |
| **Maps SDK for Android** | Flutter Student App | Vector map rendering, offline tile caching, smooth marker interpolation |
| **Maps JavaScript API** | React Admin Web | Fleet tracking dashboard, route builder canvas, stop placement markers |
| **Routes API (v2)** | Node.js Backend | Road polyline snapping, traffic-aware travel durations, dynamic ETA calculations |
| **Geocoding API** | Node.js Backend & Admin | Translating street addresses into coordinates during stop creation |

### 8.2 API Key Restrictions & Security

1. **Android Maps Key**:
   - Application restriction: SHA-1 fingerprint + Package name (`com.captaincampus.student_app`).
   - API restriction: Maps SDK for Android only.
2. **Web Admin Maps Key**:
   - Application restriction: HTTP Referrers (`https://admin.captaincampus.edu/*`, `http://localhost:5173/*`).
   - API restriction: Maps JavaScript API only.
3. **Backend Server Key**:
   - Application restriction: Static IP addresses of backend cloud instances.
   - API restriction: Routes API, Geocoding API only.

---

## 9. Security Model

### 9.1 Firestore Security Rules
- **Authentication Guard**: All read/write requests must provide `request.auth != null`.
- **Role Isolation**: Students cannot modify bus, route, or stop documents.
- **Notification Privacy**: Students can only read and update notifications where `resource.data.userId == request.auth.uid`.
- **Audit Logs Protection**: Write access to `/auditLogs` is completely blocked from client SDKs (`allow write: if false;`), writeable solely by the backend using the Firebase Admin SDK.

### 9.2 Realtime Database Security Rules
- `/liveLocations`: Read permitted for authenticated users (`auth != null`); writes strictly blocked from all client apps (`.write: false`), ensuring location data can only be written by the authorized backend telemetry ingestor.

### 9.3 Backend Middleware Stack
1. **`requestLogger`**: Assigns a unique `X-Request-Id` and logs method, path, and IP.
2. **`rateLimiter`**: Tiered window limits (e.g., 100 req/min for general API, 300 req/min for telemetry).
3. **`verifyFirebaseToken` / `verifyDeviceToken`**: Validates JWTs or hardware tokens.
4. **`requireRole` (RBAC)**: Validates role hierarchy (`student` < `driver` < `admin` < `super_admin`).
5. **Joi / Zod Validation**: Strict schema checking of request bodies.
6. **Centralized `errorHandler`**: Sanitizes errors and returns consistent JSON envelopes without leaking stack traces.

---

## 10. Scalability Considerations

- **Stateless Backend Nodes**: The Express API maintains no internal session state, allowing horizontal scaling behind a Cloud Load Balancer (GCP Cloud Run / AWS ECS).
- **Decoupled Telemetry Ingestion**: High-frequency vehicle pings bypass the primary transactional Firestore database, keeping Firestore operations within operational tiers.
- **Client Direct Read Scaling**: Thousands of students concurrently tracking buses consume zero backend server CPU because clients listen directly to Firebase Realtime Database edge nodes.
- **ETA Caching**: Traffic route calculations for identical route legs are cached in Redis / memory for 60 seconds to conserve Google Maps Platform API quotas.

---

## 11. Phase Roadmap

- **Phase 1: Foundation & Core Fleet Management (Current)**
  - Monorepo structure, shared TypeScript types, Firebase configuration.
  - Backend REST API: CRUD for Buses, Routes, Stops, and Telemetry Ingestion.
  - Authentication, RBAC, Rate Limiting, Audit Logging.
  - Documentation, unit testing, and mock data suites.
- **Phase 2: Real-time Telemetry & GPS Simulation**
  - High-frequency GPS telemetry ingestion pipeline.
  - Standalone multi-bus GPS simulator script along predefined paths.
  - RTDB listener synchronization and stale detection engine.
- **Phase 3: ETA Engine & Dynamic Routing**
  - Google Maps Routes API integration with road-snapped polylines.
  - Stop ETA calculation engine with timetable fallback.
  - Intelligent "I Missed My Bus" alternative route engine.
- **Phase 4: Notifications & Incident Management**
  - Firebase Cloud Messaging push alerts for approaching buses.
  - Admin announcement system with targeted route alerts.
  - Driver delay and incident reporting workflows.
- **Phase 5: React Admin Web Portal**
  - Live interactive Google Maps fleet tracking dashboard.
  - Visual drag-and-drop route and stop sequence editor.
  - Fleet scheduling, driver assignment, and audit log exploration.
- **Phase 6: Flutter Student Mobile App**
  - Native Android/iOS cross-platform student client.
  - Real-time bus marker map tracking with heading orientation.
  - Stop alerts, favorite routes, and one-tap missed-bus rerouting.
- **Phase 7: Production Hardening & Analytics**
  - CI/CD deployment pipelines, automated end-to-end testing.
  - Fleet punctuality analytics, passenger density metrics, and SLA reports.

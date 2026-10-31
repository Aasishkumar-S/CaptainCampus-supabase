# Captain Campus 🚌

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4.5-blue.svg)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore%20%7C%20RTDB-orange.svg)](https://firebase.google.com/)
[![Flutter](https://img.shields.io/badge/Flutter-3.x-cyan.svg)](https://flutter.dev/)
[![React](https://img.shields.io/badge/React-18.x-61dafb.svg)](https://react.dev/)

**Captain Campus** is an enterprise-grade, real-time college bus tracking, fleet management, and smart transit dispatch platform. It bridges campus transportation fleets, students, drivers, and campus administration through real-time telemetry, Google Maps routing, automated ETAs, proactive delay notifications, and intelligent missed-bus rerouting.

---

## Table of Contents

- [Overview & Key Features](#overview--key-features)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Monorepo Structure](#monorepo-structure)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Environment Variables Reference](#environment-variables-reference)
- [Firebase Emulator Setup](#firebase-emulator-setup)
- [Google Maps API Configuration](#google-maps-api-configuration)
- [Demo GPS Simulator](#demo-gps-simulator)
- [Testing Instructions](#testing-instructions)
- [License](#license)

---

## Overview & Key Features

- **Live Telemetry & Tracking**: Ingestion from hardware trackers (ESP32), Android driver phones, or built-in GPS simulators with sub-second Realtime Database synchronization.
- **Smart ETAs & Routing**: Calculates stop ETAs dynamically leveraging Google Maps Routes API with timetable fallback when telemetry is stale.
- **Missed Bus Fallback**: Intelligent alternative bus/stop discovery if a student misses their designated pickup.
- **Admin Dashboard**: Comprehensive fleet control center built with React/Vite, featuring interactive bus map tracking, driver allocation, route management, stop sequence authoring, and campus broadcast announcements.
- **Student Mobile Experience**: Flutter mobile client for students to set preferred stops, track incoming buses live, and receive push notifications (FCM).

---

## System Architecture

```
+------------------------------------------------------------------------------------+
|                               Telemetry Producers                                  |
|   [ESP32 GPS Device]   /   [Driver Android App]   /   [GPS Simulator Script]       |
+------------------------------------------------------------------------------------+
                                           |
                                           | HTTP / Ingestion Webhook
                                           v
+------------------------------------------------------------------------------------+
|                         Captain Campus Backend Service                             |
|                        (Node.js / Express / TypeScript)                            |
|                                                                                    |
|  - Ingestion Controller: validates telemetry & updates cache                       |
|  - ETA Engine: integrates Google Routes API & timetable models                     |
|  - Notification Dispatcher: triggers Firebase Cloud Messaging (FCM)                |
|  - Missed Bus Resolver: computes nearest alternative routes and walking ranges     |
|  - Audit Logger: immutable audit trail for security & compliance                   |
+------------------------------------------------------------------------------------+
           |                                                      |
           v                                                      v
+-------------------------------+             +--------------------------------------+
|    Firebase Realtime DB       |             |           Cloud Firestore            |
|  - /liveLocations/{busId}     |             |  - Users, Buses, Drivers, Routes     |
|  - High-frequency GPS pings   |             |  - Stops, Trips, Announcements, Logs |
+-------------------------------+             +--------------------------------------+
           |                                                      |
           +--------------------------+---------------------------+
                                      |
         +----------------------------+----------------------------+
         |                                                         |
         v                                                         v
+----------------------------------+             +-----------------------------------+
|         Admin Web Portal         |             |       Student Mobile App          |
|       (React 18 / Vite / TS)     |             |         (Flutter 3.x)             |
|  - Live Map Fleet Dashboard      |             |  - Live Bus Tracking Map          |
|  - Route & Stop Builder          |             |  - Proactive ETA & Arrival Alerts |
|  - Dispatch, Trips & Drivers     |             |  - Missed Bus Suggestions         |
+----------------------------------+             +-----------------------------------+
```

---

## Tech Stack

| Domain | Technology / Library | Description |
| :--- | :--- | :--- |
| **Monorepo** | NPM Workspaces | Multi-package workspace management |
| **Shared Types** | TypeScript 5.4.5 | Canonical type definitions, contracts & schemas |
| **Backend API** | Node.js (>=20), Express, TypeScript | REST API, Telemetry Ingestion, ETA service |
| **Database (Hot Telemetry)** | Firebase Realtime Database (RTDB) | Sub-second low-latency GPS position fan-out |
| **Database (Primary)** | Google Cloud Firestore | Document store for users, routes, stops, trips |
| **Authentication & Messaging** | Firebase Auth & Firebase Cloud Messaging (FCM) | Secure JWTs, role-based access, push alerts |
| **Maps & Routing** | Google Maps Platform (Routes & Places API) | Polylines, travel duration, traffic estimates |
| **Admin Web App** | React 18, Vite, TypeScript, Tailwind CSS | Management portal for fleet dispatchers |
| **Mobile Application** | Flutter 3.x, Dart | Cross-platform student mobile application |

---

## Monorepo Structure

```
captain-campus/
├── apps/
│   └── admin_web/              # React 18 + Vite Web Admin Portal
├── packages/
│   └── shared_types/           # Shared TypeScript models, API request/response types
├── services/
│   └── backend/                # Node.js + Express API & telemetry processor
├── firebase/
│   ├── firebase.json           # Firebase CLI & emulator configuration
│   └── firestore.rules         # Security rules for Cloud Firestore
├── .gitignore                  # Monorepo ignore rules
├── package.json                # Root workspace configuration
├── README.md                   # Project documentation
└── tsconfig.base.json          # Shared compiler options
```

---

## Prerequisites

- **Node.js**: `v20.0.0` or higher
- **NPM**: `v9.0.0` or higher
- **Firebase CLI**: `npm install -g firebase-tools`
- **Java JRE/JDK**: 11 or higher (required for Firebase Local Emulator Suite)
- **Flutter SDK**: `3.x` (for running the student mobile application)

---

## Quick Start

### 1. Clone & Install Dependencies

```bash
cd "c:\Users\HP\Desktop\new 1\captain-campus"
npm install
```

### 2. Build the Shared Types Package

The shared types must be compiled before running or building the dependent services:

```bash
npm run shared:build
```

### 3. Start Backend in Development Mode

```bash
npm run backend:dev
```

### 4. Start Admin Web Portal

```bash
npm run admin:dev
```

---

## Environment Variables Reference

### Backend (`services/backend/.env`)

| Variable | Required | Default | Description |
| :--- | :---: | :---: | :--- |
| `PORT` | No | `5000` | HTTP port for backend server |
| `NODE_ENV` | No | `development` | Environment mode (`development`, `production`, `test`) |
| `FIREBASE_PROJECT_ID` | Yes | - | Firebase Project identifier |
| `FIREBASE_CLIENT_EMAIL` | Yes | - | Service account client email |
| `FIREBASE_PRIVATE_KEY` | Yes | - | Service account private key (escaped newlines) |
| `FIREBASE_DATABASE_URL` | Yes | - | Realtime Database URL (e.g. `https://<proj>.firebaseio.com`) |
| `GOOGLE_MAPS_API_KEY` | Yes | - | Google Maps Platform API key (Routes & Geocoding) |
| `CORS_ORIGIN` | No | `http://localhost:5173` | Allowed frontend origin for CORS |

### Admin Web (`apps/admin_web/.env`)

| Variable | Required | Default | Description |
| :--- | :---: | :---: | :--- |
| `VITE_API_BASE_URL` | Yes | `http://localhost:5000/api` | Backend base endpoint URL |
| `VITE_FIREBASE_API_KEY` | Yes | - | Firebase Web Client API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Yes | - | Firebase Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Yes | - | Firebase Project ID |
| `VITE_FIREBASE_DATABASE_URL` | Yes | - | Firebase Realtime Database URL |
| `VITE_GOOGLE_MAPS_API_KEY` | Yes | - | Google Maps JavaScript API key |

### Flutter Mobile App (`flutter_app/.env` or compile-time flags)

| Variable | Required | Description |
| :--- | :---: | :--- |
| `API_BASE_URL` | Yes | Host address of Captain Campus API |
| `FIREBASE_PROJECT_ID` | Yes | Firebase Project ID |
| `GOOGLE_MAPS_API_KEY` | Yes | Google Maps SDK key for Android / iOS |

---

## Firebase Emulator Setup

For local testing without live cloud resources, run the Firebase Local Emulator Suite:

1. Initialize Firebase emulators:
   ```bash
   npm run firebase:emulator
   ```
2. The emulators provide:
   - **Firestore Emulator**: `localhost:8080`
   - **Realtime Database Emulator**: `localhost:9000`
   - **Auth Emulator**: `localhost:9099`
   - **Emulator UI**: `http://localhost:4000`

---

## Google Maps API Configuration

1. Visit [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select your project and enable the following APIs:
   - **Maps JavaScript API** (for Admin Web interactive map)
   - **Routes API** & **Directions API** (for ETA calculation and polyline pathing)
   - **Places API** & **Geocoding API** (for stop geocoding and search)
3. Create an API Key under **Credentials**.
4. Restrict key usage by HTTP referrers (for Admin Web) and IP addresses / API restrictions (for Backend).

---

## Demo GPS Simulator

To simulate live moving buses without physical tracker hardware:

```bash
# In services/backend:
npm run simulate:gps -- --busId=BUS-01 --routeId=ROUTE-A --interval=3000
```

The simulator reads coordinates from predefined stop sequences or custom coordinates, injecting telemetry into `/api/v1/telemetry/ingest` or directly into RTDB `/liveLocations/BUS-01`.

---

## Testing Instructions

Run automated test suites across all workspaces:

```bash
# Run unit and integration tests across monorepo workspaces
npm test

# Run tests with code coverage reporting
npm test -- --coverage
```

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

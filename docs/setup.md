# Captain Campus — Setup & Developer Guide

This guide walks you through setting up, configuring, running, and troubleshooting the entire **Captain Campus** monorepo on your local development machine.

---

## 1. Prerequisites & Required Tools

Ensure the following tools are installed and accessible in your system `PATH`:

| Tool | Required Version | Verification Command | Notes |
| :--- | :--- | :--- | :--- |
| **Node.js** | `v20.0.0` or higher | `node -v` | LTS recommended (e.g. Node 20 LTS or 22 LTS) |
| **npm** | `v9.0.0` or higher | `npm -v` | Installed with Node.js |
| **Flutter SDK** | `3.22.0` or higher | `flutter --version` | Configured with Android toolchain |
| **Dart SDK** | `3.3.0` or higher | `dart --version` | Bundled with Flutter SDK |
| **Java JDK** | `11` or higher | `java -version` | Required by Firebase Emulator & Android build |
| **Firebase CLI** | `v13.0.0` or higher | `firebase --version` | Install via `npm install -g firebase-tools` |
| **FlutterFire CLI** | Latest | `flutterfire --version` | Install via `dart pub global activate flutterfire_cli` |
| **Git** | `2.30+` | `git --version` | Source control |
| **IDE** | VS Code / Android Studio | - | Install Flutter & Dart extensions |

---

## 2. Repository Setup

Clone the repository and install dependencies at the monorepo root:

```bash
# Clone the repository
git clone https://github.com/your-org/captain-campus.git
cd captain-campus

# Install root & workspace dependencies
npm install

# Build shared types package (critical prerequisite for other packages)
npm run shared:build
```

---

## 3. Firebase Project Setup

### 3.1 Create Firebase Project in Console
1. Navigate to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project**, name it `captain-campus-dev` (or your campus name), and create the project.
3. Once created, activate the following services from the left sidebar:
   - **Authentication**: Click *Get Started* -> Select **Email/Password** -> Enable and Save.
   - **Cloud Firestore**: Click *Create database* -> Choose region closest to you -> Select **Start in test mode** (we deploy strict rules later).
   - **Realtime Database**: Click *Create database* -> Select location -> Select **Start in test mode**.
   - **Cloud Storage**: Click *Get Started* -> Choose default bucket options.
   - **Cloud Messaging (FCM)**: Enabled automatically under Project Settings -> Cloud Messaging.

### 3.2 Service Account Key (for Node.js Backend)
1. In Firebase Console, click the gear icon (Project Settings) -> **Service accounts**.
2. Select **Node.js**, then click **Generate new private key**.
3. Save the JSON file securely to your backend directory:
   ```bash
   # Place the downloaded key here:
   services/backend/service-account.json
   ```
   *(Note: This file is ignored by `.gitignore` — never commit it to source control!)*

### 3.3 Firebase CLI Authentication & Initialization
In your terminal:
```bash
# Log in to your Firebase account
firebase login

# Verify your project is linked
firebase projects:list

# Navigate to the firebase folder in the repo
cd firebase
firebase use <your-firebase-project-id>
```

---

## 4. Google Maps Platform Setup

The platform uses Google Maps APIs across Web, Mobile, and Backend.

### 4.1 Enable Google Cloud APIs
1. Navigate to [Google Cloud Console](https://console.cloud.google.com/) under the same project.
2. Go to **APIs & Services** -> **Library** and enable:
   - **Maps SDK for Android** (for Flutter student app)
   - **Maps JavaScript API** (for React admin web portal)
   - **Routes API** (for backend route snapping and dynamic ETAs)
   - **Geocoding API** (for backend and admin stop address searches)

### 4.2 Create Keys & Set Restrictions

Create 3 distinct API keys under **Credentials** to follow security best practices:

1. **Key 1: Mobile App Key (`GOOGLE_MAPS_ANDROID_KEY`)**
   - **Application restriction**: Android apps
   - Add Package Name: `com.captaincampus.student_app`
   - Add SHA-1 certificate fingerprint (obtain via `cd apps/student_app/android && ./gradlew signingReport`)
   - **API restrictions**: Restrict to *Maps SDK for Android*.

2. **Key 2: Admin Web Key (`VITE_GOOGLE_MAPS_API_KEY`)**
   - **Application restriction**: Websites (HTTP referrers)
   - Add Referrers: `http://localhost:5173/*`, `https://your-admin-domain.web.app/*`
   - **API restrictions**: Restrict to *Maps JavaScript API*.

3. **Key 3: Backend Server Key (`GOOGLE_MAPS_API_KEY`)**
   - **Application restriction**: IP addresses (or None for local development)
   - **API restrictions**: Restrict to *Routes API* and *Geocoding API*.

---

## 5. Backend Setup (`services/backend`)

1. Open `services/backend`:
   ```bash
   cd services/backend
   ```
2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
3. Open `.env` and fill in your values:
   ```env
   PORT=5000
   NODE_ENV=development
   CORS_ORIGIN=http://localhost:5173

   # Firebase Configuration
   FIREBASE_PROJECT_ID=captain-campus-dev
   FIREBASE_SERVICE_ACCOUNT_PATH=./service-account.json
   FIREBASE_DATABASE_URL=https://captain-campus-dev-default-rtdb.firebaseio.com

   # Google Maps Platform
   GOOGLE_MAPS_API_KEY=AIzaSyYourBackendServerKeyHere

   # Ingestion Secret for Hardware Trackers & Simulators
   GPS_DEVICE_SECRET=dev_shared_gps_secret_token_12345
   ```
4. Build and start the development server:
   ```bash
   npm run dev
   ```
5. Test the health endpoint:
   ```bash
   curl http://localhost:5000/api/v1/health
   # Returns: {"success":true,"data":{"status":"ok",...}}
   ```

---

## 6. Admin Web Setup (`apps/admin_web`)

1. Navigate to the admin web application directory:
   ```bash
   cd apps/admin_web
   ```
2. Copy the environment template:
   ```bash
   cp .env.example .env
   ```
3. Populate `.env` with your web client keys (found in Firebase Console -> Project Settings -> General -> Web apps):
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   VITE_FIREBASE_API_KEY=AIzaSyYourFirebaseWebApiKey
   VITE_FIREBASE_AUTH_DOMAIN=captain-campus-dev.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=captain-campus-dev
   VITE_FIREBASE_DATABASE_URL=https://captain-campus-dev-default-rtdb.firebaseio.com
   VITE_GOOGLE_MAPS_API_KEY=AIzaSyYourMapsJavaScriptApiKey
   VITE_USE_FIREBASE_EMULATOR=false
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   ```
5. Open your browser at `http://localhost:5173`.

---

## 7. Flutter Student App Setup (`apps/student_app`)

1. Verify Flutter environment health:
   ```bash
   flutter doctor
   ```
2. Link Firebase credentials using FlutterFire CLI:
   ```bash
   cd apps/student_app
   flutterfire configure
   ```
   Follow the interactive prompts to link `captain-campus-dev` and generate `lib/firebase_options.dart` and `android/app/google-services.json`.

3. Configure Google Maps Android Key:
   - Create or edit `apps/student_app/android/local.properties`:
     ```properties
     MAPS_API_KEY=AIzaSyYourAndroidMapsKeyHere
     ```
   - The app's `AndroidManifest.xml` automatically binds `MAPS_API_KEY` to the meta-data tag.

4. Fetch Flutter packages and run the app:
   ```bash
   flutter pub get
   flutter run
   ```

---

## 8. Firebase Emulator Suite (Local Development Without Cloud)

The Firebase Emulator Suite allows you to run Auth, Firestore, and Realtime Database entirely on your local machine with zero cloud costs.

### 8.1 Starting the Emulators
From the repository root or the `firebase/` directory:
```bash
# From root:
npm run firebase:emulator

# Or inside firebase/:
cd firebase
firebase emulators:start
```

The emulators spin up the following endpoints:
- **Emulator UI**: `http://localhost:4000`
- **Authentication**: `localhost:9099`
- **Cloud Firestore**: `localhost:8080`
- **Realtime Database**: `localhost:9000`

### 8.2 Configuring Apps for Emulator Mode

- **Backend**: Set the following environment variables in `services/backend/.env`:
  ```env
  FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
  FIRESTORE_EMULATOR_HOST=localhost:8080
  FIREBASE_DATABASE_EMULATOR_HOST=localhost:9000
  ```
- **Admin Web**: Set in `apps/admin_web/.env`:
  ```env
  VITE_USE_FIREBASE_EMULATOR=true
  ```
- **Flutter App**: Initialize emulators in code before running Firebase instances:
  ```dart
  if (kDebugMode) {
    await FirebaseAuth.instance.useAuthEmulator('10.0.2.2', 9099); // 10.0.2.2 for Android Emulator
    FirebaseFirestore.instance.useFirestoreEmulator('10.0.2.2', 8080);
    FirebaseDatabase.instance.useDatabaseEmulator('10.0.2.2', 9000);
  }
  ```

---

## 9. Running Everything Together (Full Monorepo)

For an active development session, open 4 terminal windows:

| Terminal | Path | Command | Description |
| :--- | :--- | :--- | :--- |
| **Terminal 1** | `captain-campus` | `npm run firebase:emulator` | Local Auth, Firestore & RTDB |
| **Terminal 2** | `captain-campus` | `npm run backend:dev` | Express API on port 5000 |
| **Terminal 3** | `captain-campus` | `npm run admin:dev` | React Admin Web on port 5173 |
| **Terminal 4** | `apps/student_app` | `flutter run` | Mobile Student app on emulator/phone |

---

## 10. Creating Your First Admin User

To access administrative routes on the backend and log in to the Admin Web portal:

### Option A: Using Firebase Emulator UI (Local Mode)
1. Open `http://localhost:4000` in your browser.
2. Go to **Authentication** tab -> Click **Add user**.
   - Email: `admin@campus.edu`
   - Password: `Password123!`
   - Note down the generated `User UID` (e.g. `usr_admin_123`).
3. Go to **Firestore** tab:
   - Click **Start collection** -> Collection ID: `users`
   - Document ID: `usr_admin_123` (Must match the UID from step 2!)
   - Add fields:
     - `userId`: `usr_admin_123` (string)
     - `email`: `admin@campus.edu` (string)
     - `name`: `System Administrator` (string)
     - `role`: `super_admin` (string)
     - `status`: `active` (string)
     - `createdAt`: `2026-10-12T00:00:00.000Z` (string)
     - `updatedAt`: `2026-10-12T00:00:00.000Z` (string)

### Option B: Using the Backend Seed Script
```bash
cd services/backend
npm run seed:admin
```
Follow the interactive prompt to set admin email and password.

---

## 11. GPS Simulator Usage

To test live moving buses on your web dashboard and mobile app without physical hardware:

```bash
# In services/backend:
npm run simulate:gps -- --busId=BUS-01 --routeId=R-NORTH-1 --speed=40 --interval=2000
```

### Simulator Flags:
- `--busId`: The identifier of the bus to animate (default: `BUS-01`).
- `--routeId`: The route coordinates to travel along.
- `--speed`: Speed in km/h to simulate.
- `--interval`: Milliseconds between GPS telemetry pings (default: `2000` ms).
- `--jitter`: Adds simulated GPS sensor drift/accuracy noise.

The simulator pings `POST /api/v1/telemetry/location` with the configured `GPS_DEVICE_SECRET`, updating `/liveLocations/BUS-01` in real-time.

---

## 12. Troubleshooting & FAQ

### Issue: `Cannot find module '@captain-campus/shared_types'`
- **Cause**: The shared types package hasn't been built yet.
- **Fix**: Run `npm run shared:build` from the repository root.

### Issue: `Firebase ID token has expired (401 TOKEN_EXPIRED)`
- **Cause**: Client authentication token expired (Firebase tokens expire after 1 hour).
- **Fix**: Re-login in the client app or call `user.getIdToken(true)` to force refresh.

### Issue: `UNAUTHORIZED_DEVICE (401) on /telemetry/location`
- **Cause**: The `X-Device-Token` header sent by the simulator or device does not match `GPS_DEVICE_SECRET` in `services/backend/.env`.
- **Fix**: Verify your `.env` contains `GPS_DEVICE_SECRET` and the client sends header `X-Device-Token: dev_shared_gps_secret_token_12345`.

### Issue: Android Google Map shows blank grid / gray canvas
- **Cause**: Incorrect Google Maps API key, missing package name restriction, or wrong SHA-1 fingerprint.
- **Fix**: Verify `local.properties` contains `MAPS_API_KEY`. Check Logcat for `Google Maps Android API: Authorization failure`.

### Issue: Firebase Emulator port collision (e.g. `Port 8080 is already in use`)
- **Cause**: Another service (or an earlier hung emulator instance) is using the port.
- **Fix**: 
  - Windows: `netstat -ano | findstr :8080` followed by `taskkill /PID <PID> /F`.
  - Alternatively, edit `firebase/firebase.json` to change the emulator port.

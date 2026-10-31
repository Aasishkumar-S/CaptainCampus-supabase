/**
 * CAPTAIN CAMPUS — Physical GPS Hardware Firmware (ESP32)
 *
 * Microcontroller: ESP32 NodeMCU / DevKit V1
 * Peripherals:
 *  - GPS Module: NEO-6M / NEO-M8N (UART Serial2: RX 16, TX 17)
 *  - Cellular or Wi-Fi connectivity: Wi-Fi (for campus intranet) or SIM800L (GSM/GPRS)
 *  - Status LEDs:
 *    - GPIO 2 (Built-in Blue): GPS Fix acquired
 *    - GPIO 4 (Green): HTTP Telemetry successfully pushed
 *    - GPIO 5 (Red): Error / Reconnecting
 *
 * Data Pipeline:
 *  1. Reads NMEA sentences (GPRMC / GPGGA) via TinyGPS++.
 *  2. Extracts Latitude, Longitude, Speed (km/h), Heading (course in degrees), and Satellites.
 *  3. Formats an authenticated JSON telemetry payload.
 *  4. Performs HTTP POST to `http://<server-ip>:4000/api/v1/telemetry/location`
 *     Header: `X-Device-Token: <GPS_DEVICE_SECRET>`
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <HardwareSerial.h>
#include <TinyGPS++.h>
#include <ArduinoJson.h>

// ======================== Configuration ========================
const char* WIFI_SSID     = "CAMPUS_SHUTTLE_WIFI";
const char* WIFI_PASSWORD = "CampusTransportPassword2026";

// Backend API Telemetry Endpoint
const char* SERVER_URL    = "http://192.168.1.100:4000/api/v1/telemetry/location";
const char* DEVICE_SECRET = "change_this_to_a_long_random_secret_in_production";

// Vehicle & Hardware Identifiers
const char* BUS_ID        = "bus-cc-01";
const char* DEVICE_ID     = "ESP32-GPS-UNIT-01";

// GPS Pins (Serial2 on ESP32)
static const int RXPin = 16;
static const int TXPin = 17;
static const uint32_t GPSBaud = 9600;

// LED Indicator Pins
static const int LED_GPS_FIX = 2;
static const int LED_TX_OK   = 4;
static const int LED_ERROR   = 5;

// Telemetry interval (ms)
const unsigned long TELEMETRY_INTERVAL_MS = 5000;
unsigned long lastTelemetryTime = 0;

// Hardware Objects
TinyGPSPlus gps;
HardwareSerial gpsSerial(2);

// ======================== Function Prototypes ========================
void connectWiFi();
void sendTelemetry(double lat, double lng, double speedKmh, double headingDeg, double hdop);

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n[Captain Campus] Initializing ESP32 GPS Tracker Unit...");

  pinMode(LED_GPS_FIX, OUTPUT);
  pinMode(LED_TX_OK, OUTPUT);
  pinMode(LED_ERROR, OUTPUT);

  digitalWrite(LED_GPS_FIX, LOW);
  digitalWrite(LED_TX_OK, LOW);
  digitalWrite(LED_ERROR, HIGH);

  // Initialize GPS UART
  gpsSerial.begin(GPSBaud, SERIAL_8N1, RXPin, TXPin);
  Serial.println("[GPS] UART initialized on GPIO 16 (RX) and 17 (TX).");

  connectWiFi();
}

void loop() {
  // Feed GPS parser from Serial2
  while (gpsSerial.available() > 0) {
    gps.encode(gpsSerial.read());
  }

  // Check if GPS has fixed location
  bool hasFix = gps.location.isValid() && (gps.location.age() < 2000);
  digitalWrite(LED_GPS_FIX, hasFix ? HIGH : LOW);

  // Time-triggered telemetry transmission
  if (millis() - lastTelemetryTime >= TELEMETRY_INTERVAL_MS) {
    lastTelemetryTime = millis();

    if (hasFix) {
      double lat = gps.location.lat();
      double lng = gps.location.lng();
      double speed = gps.speed.kmh();
      double heading = gps.course.deg();
      double hdop = gps.hdop.hdop();

      Serial.printf("[GPS] Lat: %.6f, Lng: %.6f, Speed: %.1f km/h, Course: %.1f deg\n",
                    lat, lng, speed, heading);

      sendTelemetry(lat, lng, speed, heading, hdop);
    } else {
      Serial.printf("[GPS] Searching for satellites... (Sats visible: %d)\n", gps.satellites.value());
      digitalWrite(LED_ERROR, HIGH);
    }
  }
}

void connectWiFi() {
  Serial.printf("[WiFi] Connecting to %s", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int retries = 0;
  while (WiFi.status() != WL_CONNECTED && retries < 20) {
    delay(500);
    Serial.print(".");
    retries++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WiFi] Connected successfully!");
    Serial.printf("[WiFi] IP address: %s\n", WiFi.localIP().toString().c_str());
    digitalWrite(LED_ERROR, LOW);
  } else {
    Serial.println("\n[WiFi] Connection timeout. Retrying in background...");
    digitalWrite(LED_ERROR, HIGH);
  }
}

void sendTelemetry(double lat, double lng, double speedKmh, double headingDeg, double hdop) {
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
    if (WiFi.status() != WL_CONNECTED) return;
  }

  HTTPClient http;
  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Token", DEVICE_SECRET);
  http.addHeader("X-Device-Id", DEVICE_ID);

  // Prepare JSON Document
  StaticJsonDocument<256> doc;
  doc["busId"]     = BUS_ID;
  doc["deviceId"]  = DEVICE_ID;
  doc["latitude"]  = lat;
  doc["longitude"] = lng;
  doc["speed"]     = speedKmh;
  doc["heading"]   = headingDeg;
  doc["accuracy"]  = hdop * 3.0; // Approximation from HDOP to meters
  doc["source"]    = "esp32";
  doc["timestamp"] = (uint64_t)millis(); // Unix ms timestamp if NTP synced

  String jsonPayload;
  serializeJson(doc, jsonPayload);

  int httpCode = http.POST(jsonPayload);

  if (httpCode == HTTP_CODE_OK || httpCode == HTTP_CODE_CREATED) {
    Serial.printf("[HTTP 200] Telemetry transmitted successfully. Payload: %s\n", jsonPayload.c_str());
    digitalWrite(LED_TX_OK, HIGH);
    digitalWrite(LED_ERROR, LOW);
    delay(100);
    digitalWrite(LED_TX_OK, LOW);
  } else {
    Serial.printf("[HTTP ERROR] Server responded with code: %d\n", httpCode);
    digitalWrite(LED_ERROR, HIGH);
  }

  http.end();
}

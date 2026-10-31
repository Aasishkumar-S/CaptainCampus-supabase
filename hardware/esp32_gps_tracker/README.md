# ESP32 GPS Tracker Hardware Setup & Deployment Guide

This guide describes how to wire, flash, and deploy physical ESP32 GPS tracking hardware inside campus shuttle buses to stream real-time coordinates to Captain Campus.

---

## 1. Required Components

| Component | Purpose | Recommended Model |
|---|---|---|
| **Microcontroller** | Processing & transmission | ESP32 DevKit V1 (30-pin or 38-pin) |
| **GPS Receiver** | GPS/GLONASS positioning | u-blox NEO-6M or NEO-M8N with patch antenna |
| **Power Supply** | Step down vehicle 12V/24V to 5V | 12V-to-5V 3A DC Buck Converter with micro-USB |
| **Status LEDs** | Diagnostic indicators | 3x 5mm LEDs (Blue, Green, Red) + 330Ω resistors |
| **Enclosure** | Vehicle mounting | Weatherproof ABS plastic enclosure |

---

## 2. Wiring & Pinout Diagram

Connect the ESP32 and NEO-6M GPS module:

```
ESP32 DevKit V1               NEO-6M GPS Module
-----------------             -----------------
3V3 or VIN (5V)       ----->  VCC
GND                   ----->  GND
GPIO 16 (UART2 RX)    ----->  TX
GPIO 17 (UART2 TX)    ----->  RX (Optional)

Status LEDs:
GPIO 2 (Built-in)     ----->  Blue LED (GPS Lock Active)
GPIO 4                ----->  Green LED (HTTP Telemetry OK)
GPIO 5                ----->  Red LED (Error / No Network)
```

> **Note on Antenna Placement**: Place the active GPS ceramic patch antenna facing unobstructed sky near the shuttle windshield.

---

## 3. Firmware Flashing Instructions

1. Install [Arduino IDE](https://www.arduino.cc/en/software) or the **PlatformIO** extension in VS Code.
2. Add ESP32 board support via the Arduino Board Manager:
   - URL: `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`
3. Install required libraries from Library Manager:
   - **TinyGPS++** by Mikal Hart
   - **ArduinoJson** (v6 or v7) by Benoît Blanchon
4. Open [`esp32_gps_tracker.ino`](file:///c:/Users/HP/Desktop/new%201/captain-campus/hardware/esp32_gps_tracker/esp32_gps_tracker.ino).
5. Configure your variables:
   ```cpp
   const char* WIFI_SSID     = "CAMPUS_BUS_WIFI";
   const char* SERVER_URL    = "http://your-backend-ip:4000/api/v1/telemetry/location";
   const char* DEVICE_SECRET = "YOUR_CONFIGURED_GPS_DEVICE_SECRET";
   const char* BUS_ID        = "bus-cc-01";
   const char* DEVICE_ID     = "ESP32-GPS-UNIT-01";
   ```
6. Select Board: **DOIT ESP32 DEVKIT V1**, Baud: **115200**, and click **Upload**.

---

## 4. Telemetry Payload Format

The device transmits authenticated telemetry via HTTP POST:

```http
POST /api/v1/telemetry/location HTTP/1.1
Host: campus-transport.edu:4000
Content-Type: application/json
X-Device-Token: change_this_to_a_long_random_secret_in_production
X-Device-Id: ESP32-GPS-UNIT-01

{
  "busId": "bus-cc-01",
  "deviceId": "ESP32-GPS-UNIT-01",
  "latitude": 12.9716,
  "longitude": 77.5946,
  "speed": 28.4,
  "heading": 85.0,
  "accuracy": 4.5,
  "source": "esp32",
  "timestamp": 1729312000000
}
```

The backend ingests this event, updates Firebase Realtime Database at `/liveLocations/{busId}`, and pushes notifications to students awaiting that route.

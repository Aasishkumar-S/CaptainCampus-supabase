# Captain Campus — REST API Documentation

This document describes the Captain Campus REST API, covering all Phase 1 implemented endpoints, data envelopes, security, rate limiting, and upcoming Phase 2+ endpoints.

---

## 1. Authentication & Authorization

All authenticated endpoints require a valid Firebase ID Token passed in the `Authorization` HTTP header using the Bearer schema:

```http
Authorization: Bearer <Firebase_ID_Token>
```

### Obtaining an ID Token
1. Client logs in with Firebase Authentication (e.g., `signInWithEmailAndPassword`).
2. Client retrieves the JWT ID token via `await user.getIdToken()`.
3. Client includes the token in the `Authorization` header for all requests to the backend.

### Device Authentication (Telemetry Ingestion)
Hardware GPS trackers and simulators authenticate using the `X-Device-Token` header:
```http
X-Device-Token: <GPS_DEVICE_SECRET_OR_REGISTERED_TOKEN>
X-Device-Id: dev_esp32_01
```

### Role-Based Access Control (RBAC) Hierarchy
```
super_admin > admin > driver > student
```
- **Public**: Accessible without authentication (e.g. `/api/v1/health`).
- **Student**: Any verified authenticated user (student, driver, or admin).
- **Driver**: Driver accounts and above.
- **Admin**: Fleet administrators, coordinators, and super admins.
- **Super Admin**: System architects, infrastructure directors.

---

## 2. Standard Response & Error Format

All API responses follow a uniform JSON structure.

### Success Envelope (`ApiResponse<T>`)
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully",
  "timestamp": "2026-10-12T06:30:00.000Z"
}
```

### Error Envelope
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Field 'busNumber' is required and must not be empty",
    "details": [
      {
        "field": "busNumber",
        "issue": "is required"
      }
    ]
  },
  "timestamp": "2026-10-12T06:30:00.000Z"
}
```

### Common HTTP Status Codes
| Code | Status | Meaning |
| :--- | :--- | :--- |
| `200` | OK | Request succeeded. |
| `201` | Created | Resource successfully created. |
| `400` | Bad Request | Validation failure or malformed payload. |
| `401` | Unauthorized | Missing, expired, or invalid token. |
| `403` | Forbidden | Insufficient role permissions or account disabled. |
| `404` | Not Found | Requested entity was not found. |
| `409` | Conflict | Duplicate resource (e.g., duplicate registration plate or code). |
| `429` | Too Many Requests | Rate limit threshold exceeded. |
| `500` | Internal Server Error | Unhandled server exception. |

---

## 3. Rate Limiting

The backend applies window-based rate limiting via Express middleware:

- **General Endpoints**: 100 requests per 15-minute window per IP.
- **Telemetry Ingestion (`/api/v1/telemetry/*`)**: 300 requests per 1-minute window per device/IP.
- Exceeding the quota returns HTTP status `429 Too Many Requests` with a `Retry-After` header.

---

## 4. Pagination Standard

Endpoints supporting pagination accept query parameters:
- `page`: 1-based page index (default: `1`).
- `pageSize`: Number of items per page (default: `20`, maximum: `100`).

Paginated response data wraps items in a `PaginatedResponse<T>` envelope:
```json
{
  "items": [ ... ],
  "total": 45,
  "page": 1,
  "pageSize": 20,
  "totalPages": 3,
  "hasMore": true
}
```

---

## 5. Endpoints Reference

---

### GET /api/v1/health
**Auth**: None  
**Role**: Public  
**Description**: Performs a health check on the backend service, reporting uptime and connected database connectivity status.

**Request Headers**: None required.

**Response 200**:
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "uptimeSeconds": 14285.3,
    "timestamp": "2026-10-12T06:30:00.000Z",
    "version": "1.0.0",
    "services": {
      "firestore": "connected",
      "realtimeDatabase": "connected"
    }
  },
  "message": "Service is healthy",
  "timestamp": "2026-10-12T06:30:00.000Z"
}
```

**Response Errors**:
| Status | Code | Meaning |
| :--- | :--- | :--- |
| `503` | SERVICE_UNAVAILABLE | Firebase services unreachable. |

---

### GET /api/v1/me
**Auth**: Required  
**Role**: Any (`student`, `driver`, `admin`, `super_admin`)  
**Description**: Returns the authenticated user's profile, role, preferences, and assigned favorites.

**Request Headers**:
| Header | Value | Description |
| :--- | :--- | :--- |
| `Authorization` | `Bearer <Firebase_ID_Token>` | Required Firebase ID token. |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "userId": "usr_948fbc23",
    "email": "student@campus.edu",
    "name": "Jane Doe",
    "role": "student",
    "status": "active",
    "studentId": "STU-2024-8841",
    "phone": "+15550192834",
    "preferredRouteId": "route_north_01",
    "preferredStopId": "stop_dorm_quad",
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
  },
  "timestamp": "2026-10-12T06:30:00.000Z"
}
```

**Response Errors**:
| Status | Code | Meaning |
| :--- | :--- | :--- |
| `401` | UNAUTHORIZED / TOKEN_EXPIRED | Missing or expired token. |
| `403` | ACCOUNT_DISABLED | Account is suspended or inactive. |
| `404` | NOT_FOUND | User profile does not exist in Firestore. |

---

### POST /api/v1/auth/register-profile
**Auth**: Required  
**Role**: Any  
**Description**: Creates a user profile document in Firestore immediately following initial Firebase Authentication registration.

**Request Headers**:
| Header | Value | Description |
| :--- | :--- | :--- |
| `Authorization` | `Bearer <Firebase_ID_Token>` | Required Firebase ID token. |
| `Content-Type` | `application/json` | JSON format. |

**Request Body**:
```json
{
  "name": "Jane Doe",
  "studentId": "STU-2024-8841",
  "phone": "+15550192834",
  "preferredRouteId": "route_north_01",
  "preferredStopId": "stop_dorm_quad"
}
```

**Response 201**:
```json
{
  "success": true,
  "data": {
    "userId": "usr_948fbc23",
    "email": "student@campus.edu",
    "name": "Jane Doe",
    "role": "student",
    "status": "active",
    "studentId": "STU-2024-8841",
    "phone": "+15550192834",
    "preferredRouteId": "route_north_01",
    "preferredStopId": "stop_dorm_quad",
    "notificationPreferences": {
      "busApproaching": true,
      "approachingMinutes": 5,
      "delays": true,
      "cancellations": true,
      "routeChanges": true,
      "announcements": true
    },
    "createdAt": "2026-10-12T06:30:00.000Z",
    "updatedAt": "2026-10-12T06:30:00.000Z"
  },
  "message": "User profile successfully registered",
  "timestamp": "2026-10-12T06:30:00.000Z"
}
```

**Response Errors**:
| Status | Code | Meaning |
| :--- | :--- | :--- |
| `400` | VALIDATION_ERROR | Missing required fields (`name`). |
| `401` | UNAUTHORIZED | Invalid or missing token. |
| `409` | CONFLICT | Profile already exists for this UID. |

---

### GET /api/v1/buses
**Auth**: Required  
**Role**: Any (`student` or higher)  
**Description**: Returns a list of campus transit buses, including their active route assignments and cached live location state.

**Query Parameters**:
- `status`: Filter by status (`active`, `inactive`, `maintenance`, `decommissioned`).
- `routeId`: Filter buses currently assigned to a specific route.

**Request Headers**:
| Header | Value | Description |
| :--- | :--- | :--- |
| `Authorization` | `Bearer <Firebase_ID_Token>` | Required token. |

**Response 200**:
```json
{
  "success": true,
  "data": [
    {
      "busId": "bus_01",
      "busNumber": "BUS-01",
      "registrationNumber": "KA01AB1234",
      "capacity": 54,
      "driverId": "drv_101",
      "driverName": "Robert Vance",
      "currentRouteId": "route_north_01",
      "routeName": "North Campus Express",
      "status": "active",
      "liveLocation": {
        "busId": "bus_01",
        "latitude": 12.971842,
        "longitude": 77.594611,
        "speed": 38.2,
        "heading": 87.4,
        "isStale": false,
        "source": "esp32",
        "timestamp": 1791789725000
      },
      "createdAt": "2026-08-15T10:00:00.000Z",
      "updatedAt": "2026-10-12T05:30:00.000Z"
    }
  ],
  "timestamp": "2026-10-12T06:30:00.000Z"
}
```

**Response Errors**:
| Status | Code | Meaning |
| :--- | :--- | :--- |
| `401` | UNAUTHORIZED | Authentication required. |

---

### GET /api/v1/buses/:busId
**Auth**: Required  
**Role**: Any  
**Description**: Fetches detailed information for a single bus, including its assigned driver, active route details, and current trip.

**Request Headers**:
| Header | Value | Description |
| :--- | :--- | :--- |
| `Authorization` | `Bearer <Firebase_ID_Token>` | Required token. |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "bus": {
      "busId": "bus_01",
      "busNumber": "BUS-01",
      "registrationNumber": "KA01AB1234",
      "capacity": 54,
      "driverId": "drv_101",
      "gpsDeviceId": "dev_esp32_01",
      "currentRouteId": "route_north_01",
      "status": "active",
      "make": "Ashok Leyland",
      "model": "Viking 222",
      "year": 2023,
      "createdAt": "2026-08-15T10:00:00.000Z",
      "updatedAt": "2026-10-12T05:30:00.000Z"
    },
    "assignedDriver": {
      "driverId": "drv_101",
      "name": "Robert Vance",
      "phone": "+15559876543"
    },
    "assignedRoute": {
      "routeId": "route_north_01",
      "routeCode": "R-NORTH-1",
      "routeName": "North Campus Express"
    },
    "liveLocation": {
      "busId": "bus_01",
      "latitude": 12.971842,
      "longitude": 77.594611,
      "speed": 38.2,
      "heading": 87.4,
      "isStale": false,
      "source": "esp32",
      "timestamp": 1791789725000
    }
  },
  "timestamp": "2026-10-12T06:30:00.000Z"
}
```

**Response Errors**:
| Status | Code | Meaning |
| :--- | :--- | :--- |
| `401` | UNAUTHORIZED | Token invalid or missing. |
| `404` | NOT_FOUND | Bus ID does not exist. |

---

### GET /api/v1/buses/:busId/location
**Auth**: Required  
**Role**: Any  
**Description**: Fetches the latest live telemetry coordinates for a specific bus directly from Realtime Database with staleness calculation.

**Request Headers**:
| Header | Value | Description |
| :--- | :--- | :--- |
| `Authorization` | `Bearer <Firebase_ID_Token>` | Required token. |

**Response 200**:
```json
{
  "success": true,
  "data": {
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
    "isStale": false,
    "staleSinceMs": 0
  },
  "timestamp": "2026-10-12T06:30:00.000Z"
}
```

**Response Errors**:
| Status | Code | Meaning |
| :--- | :--- | :--- |
| `401` | UNAUTHORIZED | Authentication required. |
| `404` | NOT_FOUND | Location data unavailable for this bus ID. |

---

### POST /api/v1/admin/buses
**Auth**: Required  
**Role**: `admin` or `super_admin`  
**Description**: Registers a new bus vehicle in the fleet catalog.

**Request Headers**:
| Header | Value | Description |
| :--- | :--- | :--- |
| `Authorization` | `Bearer <Firebase_ID_Token>` | Admin token required. |
| `Content-Type` | `application/json` | JSON format. |

**Request Body**:
```json
{
  "busNumber": "BUS-15",
  "registrationNumber": "KA01MN9988",
  "capacity": 45,
  "driverId": "drv_204",
  "gpsDeviceId": "dev_esp32_15",
  "currentRouteId": "route_east_02",
  "make": "Tata Motors",
  "model": "Starbus",
  "year": 2024,
  "status": "active"
}
```

**Response 201**:
```json
{
  "success": true,
  "data": {
    "busId": "bus_15",
    "busNumber": "BUS-15",
    "registrationNumber": "KA01MN9988",
    "capacity": 45,
    "driverId": "drv_204",
    "gpsDeviceId": "dev_esp32_15",
    "currentRouteId": "route_east_02",
    "status": "active",
    "make": "Tata Motors",
    "model": "Starbus",
    "year": 2024,
    "createdAt": "2026-10-12T06:30:00.000Z",
    "updatedAt": "2026-10-12T06:30:00.000Z"
  },
  "message": "Bus created successfully",
  "timestamp": "2026-10-12T06:30:00.000Z"
}
```

**Response Errors**:
| Status | Code | Meaning |
| :--- | :--- | :--- |
| `400` | VALIDATION_ERROR | Missing required fields (`busNumber`, `registrationNumber`, `capacity`). |
| `403` | FORBIDDEN | User does not have `admin` or `super_admin` role. |
| `409` | CONFLICT | A bus with this registration number or bus number already exists. |

---

### PATCH /api/v1/admin/buses/:busId
**Auth**: Required  
**Role**: `admin` or `super_admin`  
**Description**: Updates vehicle properties, assigned driver, or operational status.

**Request Headers**:
| Header | Value | Description |
| :--- | :--- | :--- |
| `Authorization` | `Bearer <Firebase_ID_Token>` | Admin token required. |
| `Content-Type` | `application/json` | JSON format. |

**Request Body**:
```json
{
  "status": "maintenance",
  "driverId": null,
  "currentRouteId": null
}
```

**Response 200**:
```json
{
  "success": true,
  "data": {
    "busId": "bus_15",
    "busNumber": "BUS-15",
    "registrationNumber": "KA01MN9988",
    "capacity": 45,
    "driverId": null,
    "currentRouteId": null,
    "status": "maintenance",
    "updatedAt": "2026-10-12T06:35:00.000Z"
  },
  "message": "Bus updated successfully",
  "timestamp": "2026-10-12T06:35:00.000Z"
}
```

**Response Errors**:
| Status | Code | Meaning |
| :--- | :--- | :--- |
| `400` | VALIDATION_ERROR | Invalid update fields. |
| `403` | FORBIDDEN | Insufficient permissions. |
| `404` | NOT_FOUND | Bus not found. |

---

### DELETE /api/v1/admin/buses/:busId
**Auth**: Required  
**Role**: `admin` or `super_admin`  
**Description**: Deactivates (soft deletes) a bus from the active transit fleet by setting status to `decommissioned`.

**Request Headers**:
| Header | Value | Description |
| :--- | :--- | :--- |
| `Authorization` | `Bearer <Firebase_ID_Token>` | Admin token required. |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "busId": "bus_15",
    "status": "decommissioned",
    "updatedAt": "2026-10-12T06:40:00.000Z"
  },
  "message": "Bus decommissioned successfully",
  "timestamp": "2026-10-12T06:40:00.000Z"
}
```

**Response Errors**:
| Status | Code | Meaning |
| :--- | :--- | :--- |
| `403` | FORBIDDEN | Insufficient permissions. |
| `404` | NOT_FOUND | Bus not found. |

---

### GET /api/v1/routes
**Auth**: Required  
**Role**: Any  
**Description**: Lists all active campus transit routes with summary stops, origin, destination, and schedule details.

**Query Parameters**:
- `direction`: Filter by `inbound`, `outbound`, or `circular`.
- `status`: Filter by `active`, `suspended`, `draft`.

**Request Headers**:
| Header | Value | Description |
| :--- | :--- | :--- |
| `Authorization` | `Bearer <Firebase_ID_Token>` | Required token. |

**Response 200**:
```json
{
  "success": true,
  "data": [
    {
      "routeId": "route_north_01",
      "routeCode": "R-NORTH-1",
      "routeName": "North Campus Express",
      "direction": "inbound",
      "originStopName": "Metro Link",
      "destinationStopName": "Main Gate",
      "stopsCount": 5,
      "estimatedDuration": 25,
      "color": "#1E40AF",
      "status": "active"
    }
  ],
  "timestamp": "2026-10-12T06:30:00.000Z"
}
```

---

### GET /api/v1/routes/:routeId
**Auth**: Required  
**Role**: Any  
**Description**: Fetches comprehensive route configuration, complete ordered stop sequence with coordinates, road polyline, and currently active buses on this route.

**Request Headers**:
| Header | Value | Description |
| :--- | :--- | :--- |
| `Authorization` | `Bearer <Firebase_ID_Token>` | Required token. |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "route": {
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
        }
      ],
      "polyline": "g_~}D_c_vO...",
      "operatingDays": ["mon", "tue", "wed", "thu", "fri"],
      "firstDeparture": "07:30",
      "lastDeparture": "19:00",
      "estimatedDuration": 25,
      "color": "#1E40AF",
      "status": "active"
    },
    "stops": [
      {
        "stopId": "stop_station_metro",
        "name": "Metro Link Station",
        "latitude": 12.981000,
        "longitude": 77.580000
      },
      {
        "stopId": "stop_dorm_quad",
        "name": "North Quad Residence",
        "latitude": 12.971598,
        "longitude": 77.594562
      }
    ],
    "activeBuses": [
      {
        "busId": "bus_01",
        "busNumber": "BUS-01",
        "status": "active"
      }
    ]
  },
  "timestamp": "2026-10-12T06:30:00.000Z"
}
```

**Response Errors**:
| Status | Code | Meaning |
| :--- | :--- | :--- |
| `404` | NOT_FOUND | Route ID not found. |

---

### POST /api/v1/admin/routes
**Auth**: Required  
**Role**: `admin` or `super_admin`  
**Description**: Creates a new transit route with ordered stops and operating schedules.

**Request Headers**:
| Header | Value | Description |
| :--- | :--- | :--- |
| `Authorization` | `Bearer <Firebase_ID_Token>` | Admin token required. |
| `Content-Type` | `application/json` | JSON format. |

**Request Body**:
```json
{
  "routeCode": "R-SOUTH-2",
  "routeName": "South Housing Shuttle",
  "direction": "outbound",
  "originStopId": "stop_campus_main_gate",
  "destinationStopId": "stop_south_dorm",
  "stopSequence": [
    {
      "stopId": "stop_campus_main_gate",
      "sequenceOrder": 1,
      "scheduledDepartureOffset": 0,
      "distanceFromStartMeters": 0
    },
    {
      "stopId": "stop_south_dorm",
      "sequenceOrder": 2,
      "scheduledDepartureOffset": 900,
      "distanceFromStartMeters": 5800
    }
  ],
  "operatingDays": ["mon", "tue", "wed", "thu", "fri"],
  "firstDeparture": "08:00",
  "lastDeparture": "20:00",
  "estimatedDuration": 15,
  "color": "#10B981"
}
```

**Response 201**:
```json
{
  "success": true,
  "data": {
    "routeId": "route_south_02",
    "routeCode": "R-SOUTH-2",
    "routeName": "South Housing Shuttle",
    "status": "active",
    "createdAt": "2026-10-12T06:30:00.000Z",
    "updatedAt": "2026-10-12T06:30:00.000Z"
  },
  "message": "Route created successfully",
  "timestamp": "2026-10-12T06:30:00.000Z"
}
```

**Response Errors**:
| Status | Code | Meaning |
| :--- | :--- | :--- |
| `400` | VALIDATION_ERROR | Stop sequence must contain at least 2 stops. |
| `403` | FORBIDDEN | Admin permissions required. |
| `409` | CONFLICT | Route code already in use. |

---

### PATCH /api/v1/admin/routes/:routeId
**Auth**: Required  
**Role**: `admin` or `super_admin`  
**Description**: Updates route configuration, stop ordering, operating days, or color.

**Request Headers**:
| Header | Value | Description |
| :--- | :--- | :--- |
| `Authorization` | `Bearer <Firebase_ID_Token>` | Admin token required. |
| `Content-Type` | `application/json` | JSON format. |

**Request Body**:
```json
{
  "estimatedDuration": 18,
  "color": "#059669",
  "status": "active"
}
```

**Response 200**:
```json
{
  "success": true,
  "data": {
    "routeId": "route_south_02",
    "estimatedDuration": 18,
    "color": "#059669",
    "updatedAt": "2026-10-12T06:45:00.000Z"
  },
  "message": "Route updated successfully",
  "timestamp": "2026-10-12T06:45:00.000Z"
}
```

---

### DELETE /api/v1/admin/routes/:routeId
**Auth**: Required  
**Role**: `admin` or `super_admin`  
**Description**: Soft-deletes a transit route by updating its status to `suspended`.

**Request Headers**:
| Header | Value | Description |
| :--- | :--- | :--- |
| `Authorization` | `Bearer <Firebase_ID_Token>` | Admin token required. |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "routeId": "route_south_02",
    "status": "suspended",
    "updatedAt": "2026-10-12T06:50:00.000Z"
  },
  "message": "Route deactivated successfully",
  "timestamp": "2026-10-12T06:50:00.000Z"
}
```

---

### GET /api/v1/stops
**Auth**: Required  
**Role**: Any  
**Description**: Returns all transit stops, with optional spatial bounding box or nearby coordinates search.

**Query Parameters**:
- `lat`: User latitude for distance sorting.
- `lng`: User longitude for distance sorting.
- `radiusMeters`: Search radius in meters (default: 5000).

**Request Headers**:
| Header | Value | Description |
| :--- | :--- | :--- |
| `Authorization` | `Bearer <Firebase_ID_Token>` | Required token. |

**Response 200**:
```json
{
  "success": true,
  "data": [
    {
      "stopId": "stop_dorm_quad",
      "name": "North Quad Residence",
      "shortName": "North Quad",
      "latitude": 12.971598,
      "longitude": 77.594562,
      "address": "42 University Way, Campus North",
      "status": "active",
      "facilities": ["shelter", "lighting", "bench"]
    }
  ],
  "timestamp": "2026-10-12T06:30:00.000Z"
}
```

---

### GET /api/v1/stops/:stopId
**Auth**: Required  
**Role**: Any  
**Description**: Fetches details for a specific stop, including associated routes serving this stop.

**Request Headers**:
| Header | Value | Description |
| :--- | :--- | :--- |
| `Authorization` | `Bearer <Firebase_ID_Token>` | Required token. |

**Response 200**:
```json
{
  "success": true,
  "data": {
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
  },
  "timestamp": "2026-10-12T06:30:00.000Z"
}
```

---

### POST /api/v1/admin/stops
**Auth**: Required  
**Role**: `admin` or `super_admin`  
**Description**: Creates a new transit stop location.

**Request Headers**:
| Header | Value | Description |
| :--- | :--- | :--- |
| `Authorization` | `Bearer <Firebase_ID_Token>` | Admin token required. |
| `Content-Type` | `application/json` | JSON format. |

**Request Body**:
```json
{
  "name": "Science Complex East",
  "shortName": "Science East",
  "latitude": 12.973412,
  "longitude": 77.598210,
  "address": "88 Research Boulevard",
  "facilities": ["shelter", "lighting"],
  "status": "active"
}
```

**Response 201**:
```json
{
  "success": true,
  "data": {
    "stopId": "stop_sci_east_01",
    "name": "Science Complex East",
    "shortName": "Science East",
    "latitude": 12.973412,
    "longitude": 77.598210,
    "address": "88 Research Boulevard",
    "facilities": ["shelter", "lighting"],
    "status": "active",
    "createdAt": "2026-10-12T06:30:00.000Z",
    "updatedAt": "2026-10-12T06:30:00.000Z"
  },
  "message": "Stop created successfully",
  "timestamp": "2026-10-12T06:30:00.000Z"
}
```

**Response Errors**:
| Status | Code | Meaning |
| :--- | :--- | :--- |
| `400` | VALIDATION_ERROR | Latitude must be between -90 and 90, Longitude between -180 and 180. |
| `403` | FORBIDDEN | Admin permissions required. |

---

### PATCH /api/v1/admin/stops/:stopId
**Auth**: Required  
**Role**: `admin` or `super_admin`  
**Description**: Updates stop metadata, coordinates, or facility tags.

**Request Headers**:
| Header | Value | Description |
| :--- | :--- | :--- |
| `Authorization` | `Bearer <Firebase_ID_Token>` | Admin token required. |
| `Content-Type` | `application/json` | JSON format. |

**Request Body**:
```json
{
  "name": "Science Complex East Hub",
  "facilities": ["shelter", "lighting", "realtime_display"]
}
```

**Response 200**:
```json
{
  "success": true,
  "data": {
    "stopId": "stop_sci_east_01",
    "name": "Science Complex East Hub",
    "facilities": ["shelter", "lighting", "realtime_display"],
    "updatedAt": "2026-10-12T06:55:00.000Z"
  },
  "message": "Stop updated successfully",
  "timestamp": "2026-10-12T06:55:00.000Z"
}
```

---

### DELETE /api/v1/admin/stops/:stopId
**Auth**: Required  
**Role**: `admin` or `super_admin`  
**Description**: Deactivates a transit stop.

**Request Headers**:
| Header | Value | Description |
| :--- | :--- | :--- |
| `Authorization` | `Bearer <Firebase_ID_Token>` | Admin token required. |

**Response 200**:
```json
{
  "success": true,
  "data": {
    "stopId": "stop_sci_east_01",
    "status": "inactive",
    "updatedAt": "2026-10-12T07:00:00.000Z"
  },
  "message": "Stop deactivated successfully",
  "timestamp": "2026-10-12T07:00:00.000Z"
}
```

---

### POST /api/v1/telemetry/location
**Auth**: Device Token  
**Role**: Hardware Device / Simulator  
**Description**: High-throughput GPS position ingestion endpoint called by vehicle GPS hardware, driver apps, and simulators. Immediately broadcasts coordinate updates to Firebase Realtime Database at `/liveLocations/{busId}`.

**Request Headers**:
| Header | Value | Description |
| :--- | :--- | :--- |
| `X-Device-Token` | `<GPS_DEVICE_SECRET>` | Shared secret or device-specific security token. |
| `X-Device-Id` | `dev_esp32_01` | Optional hardware unique identifier. |
| `Content-Type` | `application/json` | JSON format. |

**Request Body**:
```json
{
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
  "timestamp": 1791789725000
}
```

**Response 200**:
```json
{
  "success": true,
  "data": {
    "received": true,
    "busId": "bus_01",
    "serverTimestamp": 1791789725120
  },
  "message": "Location telemetry ingested successfully",
  "timestamp": "2026-10-12T06:30:00.000Z"
}
```

**Response Errors**:
| Status | Code | Meaning |
| :--- | :--- | :--- |
| `400` | VALIDATION_ERROR | Invalid coordinate format or impossible speed (> 150 km/h). |
| `401` | UNAUTHORIZED_DEVICE | Missing or incorrect `X-Device-Token`. |
| `429` | RATE_LIMIT_EXCEEDED | Device sending faster than allowed threshold (> 5 pings/sec). |

---

## 6. Phase 2+ Planned Endpoints

The following endpoints will be introduced in subsequent phases of the roadmap:

| Method | Path | Phase | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/v1/eta/stop/:stopId` | Phase 3 | Dynamic arrival ETAs for all incoming buses to a stop |
| `GET` | `/api/v1/eta/bus/:busId` | Phase 3 | Stop-by-stop upcoming ETAs along a bus's active route |
| `POST` | `/api/v1/routes/missed-bus` | Phase 3 | Computes alternative bus, nearby stop, and walking transfers |
| `GET` | `/api/v1/trips` | Phase 4 | Paginated list of scheduled and active transit trips |
| `POST` | `/api/v1/trips/:tripId/start` | Phase 4 | Driver endpoint to commence scheduled trip |
| `POST` | `/api/v1/trips/:tripId/complete`| Phase 4 | Driver endpoint to mark trip finished |
| `POST` | `/api/v1/trips/:tripId/delay` | Phase 4 | Report unexpected delays and notify waiting passengers |
| `GET` | `/api/v1/drivers` | Phase 4 | Driver registry and current shift status |
| `POST` | `/api/v1/admin/announcements`| Phase 4 | Publish campus broadcast alert with FCM push |
| `GET` | `/api/v1/announcements` | Phase 4 | List active campus announcements |
| `GET` | `/api/v1/notifications` | Phase 4 | Get user notification history |
| `PATCH`| `/api/v1/notifications/:id/read`| Phase 4 | Mark notification as read |
| `GET` | `/api/v1/admin/dashboard/stats` | Phase 5 | High-level fleet metrics, punctuality, and active counts |
| `GET` | `/api/v1/admin/audit-logs` | Phase 5 | Immutable administrative audit trails |

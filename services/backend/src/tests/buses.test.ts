import express, { Express } from 'express';

// Mock dependencies
const mockDocGet = jest.fn();
const mockDocSet = jest.fn();
const mockDocUpdate = jest.fn();
const mockDocRef = {
  get: mockDocGet,
  set: mockDocSet,
  update: mockDocUpdate,
};

const mockWhere = jest.fn();
const mockLimit = jest.fn();
const mockGet = jest.fn();

const mockCollectionRef: any = {
  doc: jest.fn(() => mockDocRef),
  where: mockWhere,
  get: mockGet,
};

mockWhere.mockReturnValue({
  where: mockWhere,
  limit: mockLimit,
  get: mockGet,
});

mockLimit.mockReturnValue({
  get: mockGet,
});

const mockRtdbRef = {
  once: jest.fn().mockResolvedValue({
    exists: () => false,
    val: () => null,
  }),
};

jest.mock('../config/firebase', () => ({
  db: {
    collection: jest.fn(() => mockCollectionRef),
  },
  rtdb: {
    ref: jest.fn(() => mockRtdbRef),
  },
  auth: {
    verifyIdToken: jest.fn(),
  },
}));

jest.mock('../utils/auditLogger', () => ({
  writeAuditLog: jest.fn().mockResolvedValue(undefined),
}));

// Mock middlewares to test router logic directly with different user credentials
let mockCurrentUser: any = {
  uid: 'admin-uid',
  email: 'admin@captaincampus.edu',
  role: 'admin',
};

jest.mock('../middleware/auth', () => ({
  verifyFirebaseToken: (req: any, res: any, next: any) => {
    if (!mockCurrentUser) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'No auth' },
        timestamp: new Date().toISOString(),
      });
    }
    req.user = mockCurrentUser;
    next();
  },
}));

jest.mock('../middleware/rbac', () => ({
  requireAdmin: (req: any, res: any, next: any) => {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super_admin')) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Admin required' },
        timestamp: new Date().toISOString(),
      });
    }
    next();
  },
}));

import busesRouter from '../routes/buses';
import { errorHandler } from '../middleware/errorHandler';

// Helper to simulate HTTP requests without external network / supertest dependency
async function executeRequest(
  app: Express,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  body: any = null
): Promise<{ status: number; body: any }> {
  // Use a lightweight mock request/response pipeline
  return new Promise((resolve) => {
    const req: any = {
      method,
      url: path,
      originalUrl: path,
      path: path.split('?')[0],
      query: {},
      params: {},
      body: body || {},
      headers: {},
      get: () => '',
      header: () => '',
      ip: '127.0.0.1',
      socket: {
        remoteAddress: '127.0.0.1',
      },
      connection: {
        remoteAddress: '127.0.0.1',
      },
    };

    let statusCode = 200;
    const headersMap: Record<string, any> = {};

    const res: any = {
      statusCode: 200,
      status(code: number) {
        statusCode = code;
        this.statusCode = code;
        return this;
      },
      setHeader(name: string, value: any) {
        headersMap[name.toLowerCase()] = value;
        return this;
      },
      getHeader(name: string) {
        return headersMap[name.toLowerCase()];
      },
      json(payload: any) {
        resolve({ status: statusCode, body: payload });
      },
      send(payload: any) {
        resolve({ status: statusCode, body: payload });
      },
      end(payload: any) {
        resolve({ status: statusCode, body: payload });
      },
    };

    app(req, res, (err: any) => {
      if (err) {
        errorHandler(err, req, res, (() => {}) as any);
      }
    });
  });
}

describe('Buses Route Suite', () => {
  let app: Express;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser = {
      uid: 'admin-uid',
      email: 'admin@captaincampus.edu',
      role: 'admin',
    };

    app = express();
    app.use(express.json());
    app.use('/buses', busesRouter);
    app.use(errorHandler);
  });

  // Case 1: GET /buses - List active buses
  it('Case 1: GET /buses returns active buses successfully', async () => {
    const mockBus1 = {
      busId: 'bus-1',
      busNumber: 'B101',
      registrationNumber: 'KA01AB1234',
      capacity: 40,
      status: 'active',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };

    mockGet.mockResolvedValueOnce({
      forEach: (callback: any) => {
        callback({ data: () => mockBus1 });
      },
    });

    const res = await executeRequest(app, 'GET', '/buses');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].busNumber).toBe('B101');
  });

  // Case 2: GET /buses/:busId - Single bus found
  it('Case 2: GET /buses/:busId returns bus details when found', async () => {
    const mockBus = {
      busId: 'bus-1',
      busNumber: 'B101',
      registrationNumber: 'KA01AB1234',
      capacity: 40,
      status: 'active',
    };

    mockDocGet.mockResolvedValueOnce({
      exists: true,
      data: () => mockBus,
    });

    const res = await executeRequest(app, 'GET', '/buses/bus-1');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.busId).toBe('bus-1');
  });

  // Case 3: GET /buses/:busId - Bus not found returns 404
  it('Case 3: GET /buses/:busId returns 404 when bus does not exist', async () => {
    mockDocGet.mockResolvedValueOnce({
      exists: false,
    });

    const res = await executeRequest(app, 'GET', '/buses/non-existent-bus');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('BUS_NOT_FOUND');
  });

  // Case 4: POST /buses - Admin creates bus successfully
  it('Case 4: POST /buses creates bus with valid input and admin auth', async () => {
    // Unique registration query check: return empty
    mockGet.mockResolvedValueOnce({ empty: true });
    mockDocSet.mockResolvedValueOnce(undefined);

    const newBusData = {
      busNumber: 'B102',
      registrationNumber: 'KA01CD5678',
      capacity: 50,
      status: 'active',
    };

    const res = await executeRequest(app, 'POST', '/buses', newBusData);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.busNumber).toBe('B102');
    expect(res.body.data.registrationNumber).toBe('KA01CD5678');
    expect(mockDocSet).toHaveBeenCalled();
  });

  // Case 5: POST /buses - Reject duplicate registrationNumber
  it('Case 5: POST /buses returns 409 when registrationNumber already exists', async () => {
    // Unique registration query returns an existing doc
    mockGet.mockResolvedValueOnce({
      empty: false,
      docs: [{ id: 'existing-bus-id' }],
    });

    const duplicateBusData = {
      busNumber: 'B103',
      registrationNumber: 'KA01CD5678',
      capacity: 50,
      status: 'active',
    };

    const res = await executeRequest(app, 'POST', '/buses', duplicateBusData);
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('DUPLICATE_REGISTRATION');
  });

  // Case 6: POST /buses - Reject non-admin role with 403
  it('Case 6: POST /buses returns 403 when user is not admin', async () => {
    mockCurrentUser = {
      uid: 'student-uid',
      email: 'student@captaincampus.edu',
      role: 'student',
    };

    const newBusData = {
      busNumber: 'B104',
      registrationNumber: 'KA01EF9999',
      capacity: 35,
      status: 'active',
    };

    const res = await executeRequest(app, 'POST', '/buses', newBusData);
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  // Case 7: DELETE /buses/:busId - Soft delete bus (status: decommissioned)
  it('Case 7: DELETE /buses/:busId deactivates bus and sets decommissioned', async () => {
    const existingBus = {
      busId: 'bus-to-delete',
      busNumber: 'B105',
      registrationNumber: 'KA01GH1111',
      capacity: 30,
      status: 'active',
    };

    mockDocGet.mockResolvedValueOnce({
      exists: true,
      data: () => existingBus,
    });
    mockDocUpdate.mockResolvedValueOnce(undefined);

    const res = await executeRequest(app, 'DELETE', '/buses/bus-to-delete');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('decommissioned');
    expect(mockDocUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'decommissioned',
      })
    );
  });
});

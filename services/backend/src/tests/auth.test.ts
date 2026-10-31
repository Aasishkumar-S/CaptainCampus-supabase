import { Request, Response, NextFunction } from 'express';

// Mock firebase-admin before importing middleware
const mockVerifyIdToken = jest.fn();
const mockDocGet = jest.fn();
const mockDoc = jest.fn(() => ({
  get: mockDocGet,
}));
const mockCollection = jest.fn(() => ({
  doc: mockDoc,
}));

jest.mock('../config/firebase', () => ({
  auth: {
    verifyIdToken: mockVerifyIdToken,
  },
  db: {
    collection: mockCollection,
  },
}));

import { verifyFirebaseToken } from '../middleware/auth';
import { requireAdmin, requireRole } from '../middleware/rbac';
import { AppError } from '../middleware/errorHandler';

function createMockContext(headers: Record<string, string> = {}) {
  const req = {
    headers,
    ip: '127.0.0.1',
    user: undefined as any,
    get: jest.fn(),
  } as unknown as Request;

  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;

  const next = jest.fn() as unknown as NextFunction;

  return { req, res, next };
}

describe('verifyFirebaseToken Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects request when Authorization header is missing', async () => {
    const { req, res, next } = createMockContext();

    await verifyFirebaseToken(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('UNAUTHORIZED');
  });

  it('rejects request when Authorization header does not start with Bearer', async () => {
    const { req, res, next } = createMockContext({ authorization: 'Basic 123456' });

    await verifyFirebaseToken(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(401);
  });

  it('rejects request when Bearer token is empty', async () => {
    const { req, res, next } = createMockContext({ authorization: 'Bearer ' });

    await verifyFirebaseToken(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(401);
  });

  it('authenticates user and loads role from Firestore doc', async () => {
    const { req, res, next } = createMockContext({ authorization: 'Bearer valid-token-123' });

    mockVerifyIdToken.mockResolvedValueOnce({
      uid: 'user-123',
      email: 'student@example.com',
    });

    mockDocGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({
        role: 'student',
        status: 'active',
      }),
    });

    await verifyFirebaseToken(req, res, next);

    expect(mockVerifyIdToken).toHaveBeenCalledWith('valid-token-123');
    expect(mockCollection).toHaveBeenCalledWith('users');
    expect(mockDoc).toHaveBeenCalledWith('user-123');
    expect(req.user).toBeDefined();
    expect(req.user?.uid).toBe('user-123');
    expect(req.user?.role).toBe('student');
    expect(req.user?.email).toBe('student@example.com');
    expect(next).toHaveBeenCalledWith();
  });

  it('falls back to custom token claim role if Firestore doc does not exist', async () => {
    const { req, res, next } = createMockContext({ authorization: 'Bearer claim-token-456' });

    mockVerifyIdToken.mockResolvedValueOnce({
      uid: 'user-456',
      email: 'admin@example.com',
      role: 'admin',
    });

    mockDocGet.mockResolvedValueOnce({
      exists: false,
    });

    await verifyFirebaseToken(req, res, next);

    expect(req.user?.role).toBe('admin');
    expect(next).toHaveBeenCalledWith();
  });

  it('rejects user when account status is suspended in Firestore', async () => {
    const { req, res, next } = createMockContext({ authorization: 'Bearer valid-token-suspended' });

    mockVerifyIdToken.mockResolvedValueOnce({
      uid: 'user-suspended',
      email: 'suspended@example.com',
    });

    mockDocGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({
        role: 'student',
        status: 'suspended',
      }),
    });

    await verifyFirebaseToken(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe('ACCOUNT_DISABLED');
  });

  it('handles invalid or expired token from Firebase Auth', async () => {
    const { req, res, next } = createMockContext({ authorization: 'Bearer expired-token' });

    mockVerifyIdToken.mockRejectedValueOnce({
      code: 'auth/id-token-expired',
      message: 'Token has expired',
    });

    await verifyFirebaseToken(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('TOKEN_EXPIRED');
  });
});

describe('requireAdmin and requireRole RBAC Middleware', () => {
  it('calls next with 401 when req.user is undefined', () => {
    const { req, res, next } = createMockContext();

    requireAdmin(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(401);
  });

  it('denies access (403) when user role is student', () => {
    const { req, res, next } = createMockContext();
    req.user = { uid: 'user-1', email: 'stu@example.com', role: 'student', decodedToken: {} as any };

    requireAdmin(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = (next as jest.Mock).mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe('FORBIDDEN');
  });

  it('allows access when user role is admin', () => {
    const { req, res, next } = createMockContext();
    req.user = { uid: 'admin-1', email: 'admin@example.com', role: 'admin', decodedToken: {} as any };

    requireAdmin(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('allows access when user role is super_admin', () => {
    const { req, res, next } = createMockContext();
    req.user = { uid: 'super-1', email: 'super@example.com', role: 'super_admin', decodedToken: {} as any };

    requireAdmin(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });
});

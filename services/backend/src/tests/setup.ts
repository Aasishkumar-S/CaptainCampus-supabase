// Test environment configuration and emulator flags
process.env.NODE_ENV = 'test';
process.env.PORT = '4001';
process.env.FIREBASE_PROJECT_ID = 'captain-campus-test';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
process.env.FIREBASE_FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_DATABASE_EMULATOR_HOST = 'localhost:9000';
process.env.GPS_DEVICE_SECRET = 'test_device_secret';

// Disable noisy logs during test runs
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'info').mockImplementation(() => {});
jest.spyOn(console, 'warn').mockImplementation(() => {});

import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configure emulator host environment variables if specified
if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  process.env.FIREBASE_AUTH_EMULATOR_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST;
}
if (process.env.FIREBASE_FIRESTORE_EMULATOR_HOST) {
  process.env.FIREBASE_FIRESTORE_EMULATOR_HOST = process.env.FIREBASE_FIRESTORE_EMULATOR_HOST;
}
if (process.env.FIREBASE_DATABASE_EMULATOR_HOST) {
  process.env.FIREBASE_DATABASE_EMULATOR_HOST = process.env.FIREBASE_DATABASE_EMULATOR_HOST;
}

// Ensure app is only initialized once
if (!admin.apps.length) {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const databaseURL = process.env.FIREBASE_DATABASE_URL;

  let credential: ReturnType<typeof admin.credential.applicationDefault>;

  if (serviceAccountPath) {
    const resolvedPath = path.isAbsolute(serviceAccountPath)
      ? serviceAccountPath
      : path.resolve(process.cwd(), serviceAccountPath);

    if (fs.existsSync(resolvedPath)) {
      credential = admin.credential.cert(resolvedPath);
    } else if (
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
    ) {
      credential = admin.credential.cert({
        projectId: projectId || 'captain-campus-dev',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      });
    } else if (
      process.env.FIREBASE_AUTH_EMULATOR_HOST ||
      process.env.FIREBASE_FIRESTORE_EMULATOR_HOST
    ) {
      // In emulator mode, project ID is sufficient without full service account key
      credential = admin.credential.applicationDefault();
    } else {
      throw new Error(
        `Firebase service account file not found at: ${resolvedPath}. Please check FIREBASE_SERVICE_ACCOUNT_PATH or provide FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY.`
      );
    }
  } else if (
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    credential = admin.credential.cert({
      projectId: projectId || 'captain-campus-dev',
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    });
  } else if (
    process.env.FIREBASE_AUTH_EMULATOR_HOST ||
    process.env.FIREBASE_FIRESTORE_EMULATOR_HOST ||
    process.env.NODE_ENV === 'test'
  ) {
    credential = admin.credential.applicationDefault();
  } else {
    // Fallback to applicationDefault or mock for development/seed
    try {
      credential = admin.credential.applicationDefault();
    } catch {
      credential = admin.credential.applicationDefault();
    }
  }

  admin.initializeApp({
    credential,
    projectId: projectId || 'captain-campus-dev',
    databaseURL: databaseURL || (projectId ? `https://${projectId}-default-rtdb.firebaseio.com` : undefined),
  });
}

export const db = admin.firestore();
export const rtdb = admin.database();
export const auth = admin.auth();
export const messaging = admin.messaging();

/**
 * Returns Firestore server timestamp sentinel
 */
export function getServerTimestamp(): admin.firestore.FieldValue {
  return admin.firestore.FieldValue.serverTimestamp();
}

export { admin };

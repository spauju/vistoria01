import * as admin from 'firebase-admin';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : undefined;

if (!admin.apps.length) {
  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    // This fallback is for environments where the service account is not set.
    // It's useful for local development if you've logged in with `gcloud auth application-default login`.
    // However, it can cause issues in some environments if not configured correctly.
    // A service account is the most reliable method.
    admin.initializeApp();
  }
}

export const adminApp = admin.apps[0]!;
export const adminDb = admin.firestore();

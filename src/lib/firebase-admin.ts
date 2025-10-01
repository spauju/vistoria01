import * as admin from 'firebase-admin';

// This function should be called only on the server,
// where environment variables like FIREBASE_SERVICE_ACCOUNT are available.
let adminApp: admin.app.App | undefined;
let adminDb: admin.firestore.Firestore | undefined;

function initializeAdmin() {
  if (admin.apps.length > 0) {
    adminApp = admin.apps[0]!;
    adminDb = admin.firestore();
    return;
  }

  const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (serviceAccountString) {
    try {
      const serviceAccount = JSON.parse(serviceAccountString);
      adminApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      adminDb = admin.firestore();
    } catch (error) {
      console.error('Error parsing FIREBASE_SERVICE_ACCOUNT or initializing Firebase Admin:', error);
      // Fallback to a non-initialized state if parsing or init fails.
      // This will prevent crashes, but admin features will not work.
    }
  } else {
    // If service account is not provided, admin features will be disabled.
    // This prevents the app from crashing in local/dev environments.
    console.warn('FIREBASE_SERVICE_ACCOUNT is not set. Firebase Admin features will be disabled.');
  }
}

// Initialize on module load.
initializeAdmin();

// Export the initialized instances, which might be undefined if initialization failed.
export { adminApp, adminDb };

import * as admin from 'firebase-admin';

let adminApp: admin.app.App | undefined;
let adminDb: admin.firestore.Firestore | undefined;

function initializeAdmin() {
  // Prevent re-initialization
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
    }
  } else {
    // This warning is crucial for local development.
    console.warn('FIREBASE_SERVICE_ACCOUNT is not set. Firebase Admin features that require auth (like setting custom claims) will be disabled.');
  }
}

// Initialize on module load.
initializeAdmin();

// Export the initialized instances, which might be undefined if initialization failed.
export { adminApp, adminDb };

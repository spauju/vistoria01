
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

  try {
    if (serviceAccountString) {
        const serviceAccount = JSON.parse(serviceAccountString);
        adminApp = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
    } else {
        // This is for local development and other environments where GOOGLE_APPLICATION_CREDENTIALS might be set.
        adminApp = admin.initializeApp();
    }
    adminDb = admin.firestore();
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
  }
}

// Initialize on module load.
initializeAdmin();

// Export the initialized instances, which might be undefined if initialization failed.
export { adminApp, adminDb };


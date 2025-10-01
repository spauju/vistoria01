
import admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let adminApp: admin.app.App;

try {
  if (!admin.apps.length) {
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccountString) {
      const serviceAccount = JSON.parse(serviceAccountString);
      adminApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      // Para desenvolvimento local ou ambientes que usam GOOGLE_APPLICATION_CREDENTIALS.
      adminApp = admin.initializeApp();
    }
  } else {
    adminApp = admin.app();
  }
} catch (error: any) {
  if (error.code === 'app/no-app') {
    // This can happen in some environments, try initializing without checks.
    adminApp = admin.initializeApp();
  } else {
    console.error('Falha na inicialização do Firebase Admin SDK:', error);
  }
}

// @ts-ignore
const adminDb = getFirestore(adminApp);
// @ts-ignore
const adminAuth = getAuth(adminApp);


export { adminApp, adminDb, adminAuth };

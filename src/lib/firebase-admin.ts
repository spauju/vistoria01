
import admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let adminApp: admin.app.App;

if (!admin.apps.length) {
  try {
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
  } catch (error: any) {
    console.error('Falha na inicialização do Firebase Admin SDK:', error);
    // Mesmo em caso de erro, definimos app para evitar mais erros de "não inicializado"
    // Embora as operações autenticadas provavelmente falharão.
    if (!admin.apps.length) {
        // @ts-ignore
        adminApp = admin.initializeApp();
    } else {
        adminApp = admin.app();
    }
  }
} else {
  adminApp = admin.app();
}

const adminDb = getFirestore(adminApp);
const adminAuth = getAuth(adminApp);


export { adminApp, adminDb, adminAuth };

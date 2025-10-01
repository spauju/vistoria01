
import * as admin from 'firebase-admin';

let adminApp: admin.app.App;
let adminDb: admin.firestore.Firestore;

if (!admin.apps.length) {
  try {
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccountString) {
      const serviceAccount = JSON.parse(serviceAccountString);
      adminApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      adminApp = admin.initializeApp();
    }
  } catch (error: any) {
    console.error('Falha na inicialização do Firebase Admin SDK:', error);
    // Em um ambiente de desenvolvimento, lançar o erro pode ajudar a diagnosticar problemas de configuração.
    // Não relançar o erro se for 'app/duplicate-app' para evitar quebras no hot-reload.
    if (error.code !== 'app/duplicate-app') {
       throw error;
    } else {
       adminApp = admin.app(); // Se já existe, pega a instância padrão.
    }
  }
} else {
  adminApp = admin.app();
}

adminDb = adminApp.firestore();

export { adminDb, adminApp };

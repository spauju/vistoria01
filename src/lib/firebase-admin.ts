
import * as admin from 'firebase-admin';

// Verifica se o SDK já foi inicializado para evitar erros.
if (!admin.apps.length) {
  try {
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccountString) {
      // Usa a conta de serviço da variável de ambiente, se disponível.
      const serviceAccount = JSON.parse(serviceAccountString);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      // Para desenvolvimento local ou ambientes que usam GOOGLE_APPLICATION_CREDENTIALS.
      admin.initializeApp();
    }
  } catch (error: any) {
    console.error('Falha na inicialização do Firebase Admin SDK:', error);
    // Lançar o erro pode ajudar a diagnosticar problemas de configuração do ambiente.
    // Em produção, talvez queira lidar com isso de forma diferente.
    if (error.code !== 'app/duplicate-app') {
       throw error;
    }
  }
}

// Exporta a instância do Firestore após garantir a inicialização.
const adminDb = admin.firestore();
const adminApp = admin.apps[0];

export { adminDb, adminApp };

import * as admin from "firebase-admin";

/**
 * Singleton do Firebase Admin SDK.
 * Suporta service account via variável de ambiente (JSON em base64 ou JSON direto).
 */
if (!admin.apps.length) {
  const serviceAccountEnv = process.env.ADMIN_SERVICE_ACCOUNT;

  if (serviceAccountEnv) {
    try {
      // Aceita JSON puro ou base64-encoded
      const json = serviceAccountEnv.startsWith("{")
        ? serviceAccountEnv
        : Buffer.from(serviceAccountEnv, "base64").toString("utf-8");
      const serviceAccount = JSON.parse(json);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } catch {
      admin.initializeApp();
    }
  } else {
    // Ambiente local com Application Default Credentials (gcloud auth)
    admin.initializeApp();
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();

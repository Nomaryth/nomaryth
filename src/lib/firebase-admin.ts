
import admin from 'firebase-admin';
import { getApps, initializeApp, getApp, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const serviceAccount = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

function initializeAdminApp(): App {
    if (getApps().length) {
        return getApp();
    }
    
    // Check if all required service account properties are present
    if (serviceAccount.projectId && serviceAccount.privateKey && serviceAccount.clientEmail) {
        return initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
    }

    // This case might happen in environments where env vars are not set.
    // We throw an error to make it explicit that the admin app cannot be initialized.
    throw new Error("Firebase Admin SDK service account credentials are not fully set in environment variables.");
}

function getAdminAuth() {
    // Ensure the app is initialized before getting auth
    initializeAdminApp();
    return getAuth();
}

export { initializeAdminApp, getAdminAuth };

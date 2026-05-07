import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin SDK
function initFirebaseAdmin() {
  const apps = getApps();

  if (!apps.length) {
    try {
      const hasRequiredEnv = process.env.FIREBASE_PROJECT_ID && 
                             process.env.FIREBASE_CLIENT_EMAIL && 
                             process.env.FIREBASE_PRIVATE_KEY;
      
      if (!hasRequiredEnv) {
        throw new Error("Missing Firebase admin credentials in environment variables");
      }

      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // Replace newlines in the private key
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
      });
    } catch (error: any) {
      console.error("Firebase Admin initialization failed:", error.message);
      console.log("Falling back to mock mode - Firebase Firestore operations will not be available");
      // Throw error so we can handle it in the caller
      throw error;
    }
  }

  return {
    auth: getAuth(),
    db: getFirestore(),
  };
}

let firebaseAdmin: any = null;
try {
  firebaseAdmin = initFirebaseAdmin();
} catch (error) {
  // Firebase will be unavailable - that's OK for development
  console.log("Firebase Admin SDK disabled - using fallback/mock implementations");
}

export const auth = firebaseAdmin?.auth || null;
export const db = firebaseAdmin?.db || null;

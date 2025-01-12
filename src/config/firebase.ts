import admin from "firebase-admin";
import path from "path";
import { fileURLToPath } from "url";
import serviceAccountKey from "../../serviceAccountKey.json" assert { type: "json" };

// Define __dirname manually
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Type assertion for serviceAccountKey
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountKey as admin.ServiceAccount), // Cast to ServiceAccount
    databaseURL: "https://<your-database-name>.firebaseio.com", // Replace with your database URL
  });
}

const db = admin.firestore(); // Firestore reference
const auth = admin.auth(); // Auth reference (if needed)
export { db, auth };

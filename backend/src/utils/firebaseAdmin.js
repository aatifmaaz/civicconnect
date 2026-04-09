const admin = require('firebase-admin');

// Initialize Firebase Admin
try {
  // If the user provides a service account key path, use it. Otherwise, initialize empty.
  // In production, you would typically use admin.credential.applicationDefault() or cert
  if (process.env.FIREBASE_PRIVATE_KEY) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Handle escaped newlines in the private key string
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
  } else {
    // If no credentials are provided yet, try default initialization or warn
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'civicconnect-mock',
    });
    console.warn('⚠️ Firebase Admin initialized without explicit credentials. Verification might fail if used in production.');
  }
} catch (error) {
  console.error('Firebase Admin initialization error', error.stack);
}

/**
 * Verify Firebase ID Token
 * @param {string} idToken - The JWT token from the frontend
 * @returns {Promise<Object>} Decoded token
 */
const verifyFirebaseToken = async (idToken) => {
  try {
    // For development, if no token or mock token is passed
    if (process.env.NODE_ENV === 'development' && (!idToken || idToken.length < 20)) {
        return { phone_number: '+919876543210' }; // Mock decode
    }
    
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Firebase token verification error:', error);
    throw new Error('Invalid Firebase Auth Token');
  }
};

module.exports = { admin, verifyFirebaseToken };

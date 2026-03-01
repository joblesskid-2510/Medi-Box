// ═══════════════════════════════════════════════
// MediBox — Firebase Configuration
// ═══════════════════════════════════════════════

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyAaMNIrwiXU9x76JhUNFXlgZ_8hwHfH1hc",
    authDomain: "medibox-app-joy.firebaseapp.com",
    projectId: "medibox-app-joy",
    storageBucket: "medibox-app-joy.firebasestorage.app",
    messagingSenderId: "825417733787",
    appId: "1:825417733787:web:107aab465c8df2f651d83e"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;

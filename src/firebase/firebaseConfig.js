import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore/lite';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: 'ai-troll-lab.firebaseapp.com',
  projectId: 'ai-troll-lab',
  storageBucket: 'ai-troll-lab.firebasestorage.app',
  messagingSenderId: '571164774680',
  appId: '1:571164774680:web:9d38987290813e57a60e6d'
};

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey);
export const firestore = isFirebaseConfigured
  ? getFirestore(initializeApp(firebaseConfig))
  : null;

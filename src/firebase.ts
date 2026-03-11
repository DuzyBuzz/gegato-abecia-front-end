// Firebase initialization for app-wide usage
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';
import { environment } from './environments/environment';

const firebaseConfig = environment.firebase;

export const firebaseApp = initializeApp(firebaseConfig);
export const db = getFirestore(firebaseApp);
export const auth = getAuth(firebaseApp);
export const analytics = (typeof window !== 'undefined' && firebaseConfig && firebaseConfig.measurementId)
  ? getAnalytics(firebaseApp)
  : null;

export default firebaseApp;

import {initializeApp} from 'firebase/app';
import {getFirestore} from 'firebase/firestore';
import {getAuth} from 'firebase/auth';
import {getStorage} from 'firebase/storage';

// Using extracted config from existing mobile assets
const firebaseConfig = {
  apiKey: 'AIzaSyCmJUundZ9xZRd5BgoIxr1uRdIgwRXI-4A',
  authDomain: 'hsordersystem.firebaseapp.com',
  projectId: 'hsordersystem',
  storageBucket: 'hsordersystem.firebasestorage.app',
  messagingSenderId: '997148333257',
  appId: '1:997148333257:web:d5670e682d4438bf14a918', // Pattern-based placeholder
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

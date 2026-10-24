import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyCIzCr0vo_zTWGpTA7_f67U97_M9Zarl0M",
  authDomain: "hotel-de-port.firebaseapp.com",
  projectId: "hotel-de-port",
  storageBucket: "hotel-de-port.firebasestorage.app",
  messagingSenderId: "220961191544",
  appId: "1:220961191544:web:45e05afcf31b7aebc15f8d"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);


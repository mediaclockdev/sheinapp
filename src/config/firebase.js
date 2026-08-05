import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyBhpLkw62UKqbvCF3ZICLnla2h1cbiBn44",
  authDomain: "shien-backend.firebaseapp.com",
  projectId: "shien-backend",
  storageBucket: "shien-backend.firebasestorage.app",
  messagingSenderId: "41084014958",
  appId: "1:41084014958:web:0937ec7c89aa379856b17f",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const messaging = getMessaging(app);

export const requestFirebaseToken = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_VAPID_KEY,
      });
      return token;
    } else {
      console.warn("User denied push notification permissions!");
    }
    return null;
  } catch (error) {
    console.error("Failed to get Firebase token:", error);
    return null;
  }
};

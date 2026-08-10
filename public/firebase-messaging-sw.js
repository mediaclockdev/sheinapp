importScripts(
  "https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js",
);

firebase.initializeApp({
  apiKey: "AIzaSyBhpLkw62UKqbvCF3ZICLnla2h1cbiBn44",
  authDomain: "shien-backend.firebaseapp.com",
  projectId: "shien-backend",
  storageBucket: "shien-backend.firebasestorage.app",
  messagingSenderId: "41084014958",
  appId: "1:41084014958:web:0937ec7c89aa379856b17f",
});

const messaging = firebase.messaging();

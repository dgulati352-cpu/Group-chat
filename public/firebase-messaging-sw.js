importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBcAKx1O3Iwk5kwm-52EhYz5tjVLmYUATY",
  authDomain: "chat-6a8cd.firebaseapp.com",
  projectId: "chat-6a8cd",
  storageBucket: "chat-6a8cd.firebasestorage.app",
  messagingSenderId: "680132984752",
  appId: "1:680132984752:web:ec54fb52190249733a6075"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.image || '/logo192.png',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

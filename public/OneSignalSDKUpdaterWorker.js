/* eslint-disable no-undef */

// 1. Okamžitá registrace handleru (řeší chybu sw.ts:20)
self.addEventListener('message', (event) => {
    console.log("SW: Message received", event.data);
});

// 2. DONUTÍME WORKER, ABY SE AKTIVOVAL HNED (řeší chybu postMessage)
self.addEventListener('install', () => {
    self.skipWaiting(); 
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim()); 
});

// 3. Import OneSignal SDK
importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');
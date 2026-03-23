/* eslint-disable no-undef */

// 1. Musíme definovat self.onmessage PŘED importem, 
// aby prohlížeč viděl, že je tam handler hned od začátku.
self.onmessage = function(event) {
    console.log("SW: Počáteční zpráva zachycena:", event.data);
};

// 2. Přidáme listener pro jistotu i takto
self.addEventListener('message', (event) => {
    // Tady už to loguješ, to je v pořádku
});

// 3. Vynutíme okamžitou aktivaci
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(clients.claim()));

// 4. TEPRVE TEĎ importujeme SDK
importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');
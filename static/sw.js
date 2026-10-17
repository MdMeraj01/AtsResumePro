// Minimal service worker.
// The previous version intercepted every request but never cached anything (pure overhead) and
// replied with a fake "408 Request timed out" whenever the network hiccuped.
// This one does not touch requests at all: the browser (and Render's CDN) handle caching natively.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((names) => Promise.all(names.map((n) => caches.delete(n))))
            .then(() => self.clients.claim())
    );
});


const CACHE_NAME = 'al-hisn-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/index.tsx',
  '/App.tsx',
  '/data.ts',
  '/types.ts',
  '/services/geminiService.ts',
  '/components/Dashboard.tsx',
  '/components/ZikrCard.tsx',
  '/components/AdhiyaSection.tsx',
  '/components/QuranSection.tsx'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached asset or fetch from network
      return response || fetch(event.request).then((fetchRes) => {
        // Cache Quran API calls dynamically
        if (event.request.url.includes('alquran.cloud')) {
          return caches.open('quran-api-cache').then((cache) => {
            cache.put(event.request.url, fetchRes.clone());
            return fetchRes;
          });
        }
        return fetchRes;
      });
    }).catch(() => {
      // Offline fallback for JSON/API if not cached
      return new Response(JSON.stringify({ error: 'Offline mode: content not cached' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    })
  );
});

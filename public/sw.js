// Self-destroying service worker.
//
// Bahari Click does not use a service worker. This file exists only to clean up
// a stale service worker that a previous app on the same origin (e.g.
// localhost:3000) may have registered. A registered SW keeps fetching its
// script URL (/sw.js); serving this unregisters it and reloads open tabs so
// outdated cached JS chunks can no longer cause hydration mismatches.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      try {
        await self.registration.unregister();
        const clients = await self.clients.matchAll({ type: "window" });
        for (const client of clients) client.navigate(client.url);
      } catch {
        // Best-effort cleanup; ignore failures.
      }
    })(),
  );
});

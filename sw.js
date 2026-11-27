// SkupOS — service worker wspólny dla aplikacji właściciela i portalu klienta.
// Najpierw sieć (zawsze najnowsza wersja po każdej zmianie), cache tylko gdy brak internetu.
const CACHE = "skupos-v65";
const SHELL = ["./", "./index.html", "./skupos.bundle.js", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png", "./klient/", "./klient/index.html", "./klient/manifest.webmanifest"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const req = e.request, url = req.url;
  if (req.method !== "GET") return;
  // nigdy nie cache'uj konfiguracji, bazy ani API
  if (url.indexOf("config.js") !== -1 || url.indexOf("supabase.co") !== -1 || url.indexOf("api.anthropic") !== -1) return;
  if (new URL(url).origin !== self.location.origin) return;
  e.respondWith(fetch(req).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {}); return res; }).catch(() => caches.match(req)));
});

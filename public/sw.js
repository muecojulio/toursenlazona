const CACHE = "tours-historia-v4";
const CACHE_PREFIX = "tours-historia-";
const APP_SHELL = [
  "/",
  "/privacidad",
  "/manifest.webmanifest",
  "/icon.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
];
const APP_PAGES = new Set(["/", "/privacidad"]);

// Estas dos páginas son públicas y no personalizadas: se precargan para que
// la guía conserve una portada legible cuando el dispositivo queda sin red.
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await cache.addAll(APP_SHELL);
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

function puedeGuardar(request, response, url) {
  if (!response.ok || response.type === "opaque" || response.headers.has("set-cookie")) return false;
  const control = response.headers.get("Cache-Control")?.toLowerCase() || "";
  if (control.includes("private") || control.includes("no-store")) return false;

  if (url.pathname.startsWith("/_next/static/")) return true;
  if (APP_PAGES.has(url.pathname) && !url.searchParams.has("_rsc")) return true;
  if (APP_SHELL.includes(url.pathname)) return true;

  return url.pathname.startsWith("/api/") &&
    request.url.length <= 1_024 &&
    control.includes("public");
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || request.cache === "no-store") return;

  event.respondWith(
    (async () => {
      try {
        const response = await fetch(request);
        if (puedeGuardar(request, response, url)) {
          const cache = await caches.open(CACHE);
          await cache.put(request, response.clone()).catch(() => {});
        }
        return response;
      } catch {
        const cached = await caches.match(request);
        if (cached) return cached;

        if (request.mode === "navigate") {
          const appShell = await caches.match("/");
          if (appShell) return appShell;
        }

        return Response.error();
      }
    })()
  );
});

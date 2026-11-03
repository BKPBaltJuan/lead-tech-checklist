/* Lead Tech Daily Checklist — app-shell service worker.
 *
 * Strategy: cache-first with background revalidation (stale-while-
 * revalidate) for the page and every same-origin asset. After a tech
 * opens the app once while online, the whole shell — page, manifest,
 * BK logo, kangaroo icons — is in the cache, so the app opens, fills,
 * auto-saves (localStorage), builds the PDF, and downloads/shares it
 * with no network at all. Online visits quietly refresh the cache in
 * the background, and a version bump (new CACHE name) replaces the old
 * shell wholesale on activate.
 *
 * The page has no CDN dependencies — its styles, scripts, and the PDF
 * writer are all inline in index.html — so caching the page plus the
 * assets below covers everything the app needs to run offline.
 *
 * Layout note: this artifact serves only index.html plus files under
 * assets/, so on the Muse host this script lives in assets/ and its
 * scope is limited to that folder — it cannot control the page there.
 * The SHELL list therefore carries both relative forms ("./x" for when
 * the worker sits next to the assets, "assets/x" for when it is served
 * from the site root, e.g. GitHub Pages): each entry is added on its
 * own, so whichever form doesn't apply simply fails and is skipped.
 * Nothing here touches localStorage, so per-job auto-save is unaffected.
 */
var CACHE = "ltc-shell-v3";
var SHELL = [
  "../",
  "../index.html",
  "./",
  "./index.html",
  "./bk-packoutz-logo.png",
  "assets/bk-packoutz-logo.png",
  "./manifest.webmanifest",
  "assets/manifest.webmanifest",
  "./icon-192.png",
  "assets/icon-192.png",
  "./icon-512.png",
  "assets/icon-512.png",
  "./icon-maskable-512.png",
  "assets/icon-maskable-512.png",
  "./apple-touch-icon.png",
  "assets/apple-touch-icon.png"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      // Add files one by one so a single missing file can't fail the install.
      return Promise.all(SHELL.map(function (url) {
        return cache.add(url).catch(function () { /* optional shell file */ });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (key) {
        return key === CACHE ? null : caches.delete(key);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (event) {
  var req = event.request;
  if (req.method !== "GET") { return; }

  var url;
  try { url = new URL(req.url); } catch (e) { return; }
  // Cross-origin requests (none in the app today) pass straight through.
  if (url.origin !== self.location.origin) { return; }

  // Cache-first with background revalidation for the page and all
  // same-origin assets: serve the cached copy immediately when there
  // is one (that is what makes offline opens work), and refresh the
  // cache from the network in the background so the next visit picks
  // up any update. ignoreSearch lets a morning link's ?job=… query
  // reuse the cached page instead of missing the cache.
  event.respondWith(
    caches.open(CACHE).then(function (cache) {
      return cache.match(req, { ignoreSearch: true }).then(function (hit) {
        var network = fetch(req).then(function (res) {
          if (res && res.ok) {
            var copy = res.clone();
            cache.put(req, copy).catch(function () { /* cache write is best-effort */ });
          }
          return res;
        }).catch(function () { return null; });

        if (hit) {
          // Serve the cache now; the network promise above keeps
          // running to revalidate for next time.
          return hit;
        }
        return network.then(function (res) {
          if (res) { return res; }
          // Offline with nothing cached for this request: for a page
          // load, hand back the cached checklist page itself.
          if (req.mode === "navigate") {
            return cache.match("../index.html", { ignoreSearch: true })
              .then(function (page) { return page || cache.match("index.html", { ignoreSearch: true }); })
              .then(function (page) { return page || cache.match("./index.html", { ignoreSearch: true }); });
          }
          return new Response("", { status: 504, statusText: "Offline" });
        });
      });
    })
  );
});

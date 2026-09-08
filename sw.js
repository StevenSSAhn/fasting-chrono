// Offline shell. Bump CACHE when the app files change.
var CACHE = "fastchrono-6";
var ASSETS = ["./", "./index.html", "./manifest.webmanifest",
              "./icon-180.png", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(ASSETS); }).then(function(){
    return self.skipWaiting();
  }));
});

self.addEventListener("activate", function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.map(function(k){ return k === CACHE ? null : caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});

self.addEventListener("fetch", function(e){
  var req = e.request;
  if(req.method !== "GET") return;
  // Same-origin only; let the font CDN go straight to the network.
  if(new URL(req.url).origin !== self.location.origin) return;

  if(req.mode === "navigate"){
    // Fresh app when online, cached shell when not.
    e.respondWith(fetch(req).then(function(res){
      var copy = res.clone();
      caches.open(CACHE).then(function(c){ c.put("./index.html", copy); });
      return res;
    }).catch(function(){ return caches.match("./index.html"); }));
    return;
  }
  e.respondWith(caches.match(req).then(function(hit){ return hit || fetch(req); }));
});

'use strict';
// 修改发布内容时更新 VERSION；新版本会在旧页面全部关闭后接管。
const VERSION = 'v5-20261106-2';
const PREFIX = 'elbow-calibrator:' + self.registration.scope + ':';
const CACHE = PREFIX + VERSION;
const ASSETS = ['./', './index.html', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png'];
const INDEX = new URL('./index.html', self.registration.scope).href;
const ALLOWED = new Set(ASSETS.map(path => new URL(path, self.registration.scope).href));
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(PREFIX) && name !== CACHE)
      .map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if(request.method !== 'GET') return;
  const url = new URL(request.url);
  url.search = '';
  url.hash = '';
  if(!ALLOWED.has(url.href)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if(request.mode === 'navigate'){
      try{
        const response = await fetch(request);
        if(response.ok) return response;
      }catch(error){}
      return (await cache.match(INDEX)) || Response.error();
    }
    return (await cache.match(url.href)) || fetch(request);
  })());
});

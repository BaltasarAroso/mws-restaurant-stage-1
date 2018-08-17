const staticCacheName = 'mws-stage1-cache-v7';

/*
 * Open cache named 'mws-stage1-cache'
 * Add cache all the urls needed in this project
 */
self.addEventListener('install', function(event) {
	// console.log('Service Worker in the installing mode...');
	event.waitUntil(
		caches.open(staticCacheName).then(function(cache) {
			// console.log('Service Worker caching all the urls');
			return cache.addAll([
				'/',
				'/index.html',
				'/restaurant.html',
				'/sw.js',
				'/dist/js/idb.js',
				'/dist/js/dbhelper.js',
				'/dist/js/main.js',
				'/dist/js/restaurant_info.js',
				'/dist/js/register.js',
				'/dist/css/styles.css',
				'/dist/img/1.webp',
				'/dist/img/2.webp',
				'/dist/img/3.webp',
				'/dist/img/4.webp',
				'/dist/img/5.webp',
				'/dist/img/6.webp',
				'/dist/img/7.webp',
				'/dist/img/8.webp',
				'/dist/img/9.webp',
				'/dist/img/10.webp',
				'/dist/img/icons-192.webp',
				'/dist/img/icons-512.webp',
				'/dist/img/star_empty.svg',
				'/dist/img/star_full.svg',
				'/dist/img/favicon.webp'
			]);
		})
	);
});

/*
 * Respond with an entry from the cache if there is one
 * If there isn't, fetch from the network
 */
self.addEventListener('fetch', function(event) {
	// console.log('Service Worker in the fetching mode...');
	event.respondWith(
		caches.open(staticCacheName).then(cache => {
			return cache.match(event.request).then(function(response) {
				// console.log(
				// 	'Service Worker fetching the responses or ' +
				// 		'just the event requests (if there is no responses aka offline mode)'
				// );
				return (
					response ||
					fetch(event.request).then(function(response) {
						cache.put(event.request, response.clone());
						return response;
					})
				);
			});
		})
	);
});

/*
 * Remove the old caches (not the actual one aka staticCacheName)
 * Update the Service Worker with the reload
 * (the checkbox of the inspector in the browser is no longer needed)
 */
self.addEventListener('activate', function(event) {
	// console.log('Service Worker in the activating mode...');
	event.waitUntil(
		caches.keys().then(function(cacheNames) {
			return Promise.all(
				cacheNames
					.filter(function(selfCacheName) {
						return selfCacheName !== staticCacheName;
					})
					.map(function(selfCacheName) {
						return caches.delete(selfCacheName);
					})
			);
		})
	);
});

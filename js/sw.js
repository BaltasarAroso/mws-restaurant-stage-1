const staticCacheName = 'mws-stage1-cache-v1';

/*
 * Open cache named 'mws-stage1-cache'
 * Add cache all the urls needed in this project
 */

self.addEventListener('install', function(event) {
	console.log('Service Worker in the installing mode...');
	event.waitUntil(
		caches.open(staticCacheName).then(function(cache) {
			console.log('Service Worker caching all the urls');
			return cache.addAll([
				'/',
				'/restaurant.html',
				'/js/idb.js',
				'/js/dbhelper.js',
				'/js/main.js',
				'/js/restaurant_info.js',
				'/js/register.js',
				'/js/sw.js',
				'/css/styles.css',
				'/css/media-queries.css',
				'/data/restaurants.json',
				'/img/1.jpg',
				'/img/2.jpg',
				'/img/3.jpg',
				'/img/4.jpg',
				'/img/5.jpg',
				'/img/6.jpg',
				'/img/7.jpg',
				'/img/8.jpg',
				'/img/9.jpg',
				'/img/10.jpg'
			]);
		})
	);
});

/*
 * Respond with an entry from the cache if there is one
 * If there isn't, fetch from the network
 */

self.addEventListener('fetch', function(event) {
	console.log('Service Worker in the fetching mode...');
	event.respondWith(
		caches.match(event.request).then(function(response) {
			console.log(
				'Service Worker fetching the responses or ' +
					'just the event requests (if there is no responses aka offline mode)'
			);
			return response || fetch(event.request);
		})
	);
});

/*
 * Remove the old caches (not the actual one aka staticCacheName)
 * Update the Service Worker with the reload
 * (the checkbox of the inspector in the browser is no longer needed)
 */
self.addEventListener('activate', function(event) {
	console.log('Service Worker in the activating mode...');
	event.waitUntil({
		caches: keys().then(function(cacheNames) {
			return Promise.all(
				cacheNames
					.filter(function(selfCacheName) {
						return cacheNames.startsWith('mws-stage-cache-v') && selfCacheName !== staticCacheName;
					})
					.map(function(selfCacheName) {
						return cache.delete(selfCacheName);
					})
			);
		})
	});
});

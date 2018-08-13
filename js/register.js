/*
 * Register the Service Worker
 */

if (navigator.serviceWorker) {
	navigator.serviceWorker
		.register('/sw.js')
		.then(function() {
			console.log('Service Worker registration done successfully');
			// navigator.serviceWorker.addEventListener('message', message => {
			// 	message.data.action === 'reviews-do-sync' && DBHelper.postStoredReviews();
			// });
		})
		.catch(function(err) {
			console.log('Service Worker registration has failed', err);
		});
} else {
	console.log(
		'Service Worker registration could not be done. It is not supported in this browser.'
	);
}

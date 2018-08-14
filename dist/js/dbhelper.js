/**
 * Define variables
 */
var RESTAURANT = 1;
var REVIEW = 0;

/**
 * Common database helper functions.
 */
class DBHelper {
	/**
	 * Database URL.
	 * Change this to restaurants.json file location on your server.
	 */
	static get DATABASE_URL() {
		const port = 1337; // Change this to your server port
		return `http://localhost:${port}`;
	}

	//============================ Configure IndexedDB functions ============================//
	/**
	 * Open IndexedDB
	 */
	static openDB(name) {
		return idb.open(name, 1, function(upgradeDB) {
			if (!upgradeDB.objectStoreNames.contains('restaurants')) {
				upgradeDB.createObjectStore('restaurants', {
					keyPath: 'id'
				});
			}
			for (var i = 1; i <= 10; i++) {
				if (!upgradeDB.objectStoreNames.contains(`reviews-${i}`)) {
					upgradeDB.createObjectStore(`reviews-${i}`, {
						keyPath: 'id'
					});
				}
			}
			if (!upgradeDB.objectStoreNames.contains('reviews-on-hold')) {
				upgradeDB.createObjectStore('reviews-on-hold', {
					keyPath: 'updatedAt'
				});
			}
			if (!upgradeDB.objectStoreNames.contains('favorites-on-hold')) {
				upgradeDB.createObjectStore('favorites-on-hold', {
					keyPath: 'id'
				});
			}
		});
	}

	/**
	 * Read All From IndexedDB
	 */
	static readAllFromDB(dbElementName) {
		return DBHelper.openDB('restaurant-review-DB').then(function(db) {
			var tx = db.transaction(dbElementName);
			var objStore = tx.objectStore(dbElementName);
			return objStore.getAll();
		});
	}

	/**
	 * Write/Save to IndexedDB
	 */
	static writeToDB(data, dbElementName, ReviewOnHold) {
		return DBHelper.openDB('restaurant-review-DB').then(function(db) {
			var tx = db.transaction(dbElementName, 'readwrite');
			var objStore = tx.objectStore(dbElementName);
			ReviewOnHold ? objStore.put(data) : Array.from(data).forEach(item => objStore.put(item));
			return tx.complete;
		});
	}

	/**
	 * Delete All From IDB
	 */
	static deleteAllFromDB(dbElementName) {
		return DBHelper.openDB('restaurant-review-DB').then(function(db) {
			var tx = db.transaction(dbElementName, 'readwrite');
			var objStore = tx.objectStore(dbElementName);
			objStore.clear();
			return tx.complete;
		});
	}

	/**
	 * Get Data From URL
	 */
	static getDataFromURL(tag) {
		if (tag) {
			return fetch(`${DBHelper.DATABASE_URL}/restaurants`)
				.then(response => {
					return response.json();
				})
				.then(data => {
					DBHelper.writeToDB(data, 'restaurants', false);
					return data;
				});
		} else {
			return fetch(`${DBHelper.DATABASE_URL}/reviews?restaurant_id=${self.restaurant.id}`)
				.then(response => {
					return response.json();
				})
				.then(data => {
					DBHelper.writeToDB(data, `reviews-${self.restaurant.id}`, false);
					return data;
				});
		}
	}
	//========================================================================================//

	//================================ Configure POST Reviews ================================//

	/**
	 * POST New Review to API and respective DB
	 */
	static postNewReview(review) {
		if (!review) {
			return;
		}
		return fetch(`${DBHelper.DATABASE_URL}/reviews`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json; charset=utf-8' },
			body: JSON.stringify(review)
		})
			.then(response => response.json())
			.then(data => {
				// Besides adding to API we need to save the review in the respectivelly IDB
				DBHelper.writeToDB(data, `reviews-${self.restaurant.id}`, true);
				return data;
			})
			.catch(error => {
				// In Offline mode we need to save the review in the IDB reviews-on-hold
				DBHelper.writeToDB(review, 'reviews-on-hold', true);
				console.log(`ERROR: Review on hold due to ${error}`);
				return review;
			});
	}

	/**
	 * Check Connection, POST offline data to API and Delete it from the 'on hold' IDB
	 */
	static checkConnectionPOST(review) {
		if (navigator.connection.downlink) {
			delete review.id;
			DBHelper.postNewReview(review).then(function() {
				DBHelper.deleteAllFromDB('reviews-on-hold');
			});
		}
	}

	/**
	 * POST Stored Reviews in offline mode to API and IDB
	 */
	static postStoredReviews() {
		DBHelper.readAllFromDB('reviews-on-hold')
			.then(data => {
				if (data.length == 0) {
					return;
				}
				data.forEach(review => {
					DBHelper.checkConnectionPOST(review);
				});
				return data;
			})
			.catch(error => {
				console.log(`ERROR: Load from reviews on hold DB failed due to ${error}`);
			});
	}

	//========================================================================================//

	//============================ Configure Favorite Restaurants ============================//

	/**
	 * Favorite a restaurant
	 */
	static favorite(restaurant_id) {
		return fetch(`${DBHelper.DATABASE_URL}/restaurants/${restaurant_id}/?is_favorite=true`, {
			method: 'PUT'
		})
			.then(response => response.json())
			.then(data => {
				DBHelper.writeToDB(data, 'restaurants', true);
				return data;
			})
			.catch(error => {
				console.log(`ERROR: Unable to favorite restaurant due to ${error}`);
			});
	}

	/**
	 * Unfavorite a restaurant
	 */
	static unfavorite(restaurant_id) {
		return fetch(`${DBHelper.DATABASE_URL}/restaurants/${restaurant_id}/?is_favorite=false`, {
			method: 'PUT'
		})
			.then(response => response.json())
			.then(data => {
				DBHelper.writeToDB(data, 'restaurants', true);
				return data;
			})
			.catch(error => {
				console.log(`ERROR: Unable to unfavorite restaurant due to ${error}`);
			});
	}

	/**
	 * Handle Favorite
	 */
	static handleFavorite(restaurant) {
		if (navigator.connection.downlink) {
			if (restaurant.is_favorite == 'true') {
				DBHelper.unfavorite(restaurant.id).then(function() {
					window.location.reload();
				});
			} else {
				DBHelper.favorite(restaurant.id).then(function() {
					window.location.reload();
				});
			}
		} else {
			// Only allow one entry in favorite-on-hold database, because in offline mode only can navigate between the pages in cache
			// and let's assume that only changes one restaurant preference in offline mode, so first delete all them add new.
			DBHelper.deleteAllFromDB('favorites-on-hold');
			DBHelper.writeToDB(restaurant, 'favorites-on-hold', true);
			alert(
				'User in Offline Mode.\n' +
					'Submitted favorite restaurant will be added to API when online, now it is only added to a temporary IDB.'
			);
		}
	}

	/**
	 * Check Connection, POST offline data to API and Delete it from the 'on hold' IDB
	 */
	static checkConnectionPUT(restaurant) {
		if (navigator.connection.downlink) {
			DBHelper.putFavorite(restaurant).then(function() {
				DBHelper.deleteAllFromDB('favorites-on-hold').then(function() {
					window.location.reload();
				});
			});
		}
	}

	/**
	 * Put Favorite added in offline mode
	 */
	static putFavorite(restaurant) {
		if (restaurant.is_favorite == 'true') {
			return DBHelper.unfavorite(restaurant.id);
		} else {
			return DBHelper.favorite(restaurant.id);
		}
	}

	/**
	 * POST Stored Reviews in offline mode to API and IDB
	 */
	static putStoredFavorites() {
		DBHelper.readAllFromDB('favorites-on-hold')
			.then(data => {
				if (data.length == 0) {
					return;
				}
				DBHelper.checkConnectionPUT(data[0]);
				return data;
			})
			.catch(error => {
				console.log(`ERROR: Load from Favorites on hold DB failed due to ${error}`);
			});
	}

	//========================================================================================//

	/**
	 * Fetch all restaurants.
	 */
	static fetchRestaurants(callback) {
		DBHelper.readAllFromDB('restaurants')
			.then(data => {
				if (data.length == 0) {
					return DBHelper.getDataFromURL(RESTAURANT);
				}
				return data;
			})
			.then(restaurants => {
				callback(null, restaurants);
			});
	}

	/**
	 * Fetch a restaurant by its ID.
	 */
	static fetchRestaurantById(id, callback) {
		// fetch all restaurants with proper error handling.
		DBHelper.fetchRestaurants((error, restaurants) => {
			if (error) {
				callback(error, null);
			} else {
				const restaurant = restaurants.find(r => r.id == id);
				if (restaurant) {
					// Got the restaurant
					callback(null, restaurant);
				} else {
					// Restaurant does not exist in the database
					callback('Restaurant does not exist', null);
				}
			}
		});
	}

	/**
	 * Fetch restaurants by a cuisine type with proper error handling.
	 */
	static fetchRestaurantByCuisine(cuisine, callback) {
		// Fetch all restaurants  with proper error handling
		DBHelper.fetchRestaurants((error, restaurants) => {
			if (error) {
				callback(error, null);
			} else {
				// Filter restaurants to have only given cuisine type
				const results = restaurants.filter(r => r.cuisine_type == cuisine);
				callback(null, results);
			}
		});
	}

	/**
	 * Fetch restaurants by a neighborhood with proper error handling.
	 */
	static fetchRestaurantByNeighborhood(neighborhood, callback) {
		// Fetch all restaurants
		DBHelper.fetchRestaurants((error, restaurants) => {
			if (error) {
				callback(error, null);
			} else {
				// Filter restaurants to have only given neighborhood
				const results = restaurants.filter(r => r.neighborhood == neighborhood);
				callback(null, results);
			}
		});
	}

	/**
	 * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
	 */
	static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
		// Fetch all restaurants
		DBHelper.fetchRestaurants((error, restaurants) => {
			if (error) {
				callback(error, null);
			} else {
				let results = restaurants;
				if (cuisine != 'all') {
					// filter by cuisine
					results = results.filter(r => r.cuisine_type == cuisine);
				}
				if (neighborhood != 'all') {
					// filter by neighborhood
					results = results.filter(r => r.neighborhood == neighborhood);
				}
				callback(null, results);
			}
		});
	}

	/**
	 * Fetch all neighborhoods with proper error handling.
	 */
	static fetchNeighborhoods(callback) {
		// Fetch all restaurants
		DBHelper.fetchRestaurants((error, restaurants) => {
			if (error) {
				callback(error, null);
			} else {
				// Get all neighborhoods from all restaurants
				const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
				// Remove duplicates from neighborhoods
				const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);
				callback(null, uniqueNeighborhoods);
			}
		});
	}

	/**
	 * Fetch all cuisines with proper error handling.
	 */
	static fetchCuisines(callback) {
		// Fetch all restaurants
		DBHelper.fetchRestaurants((error, restaurants) => {
			if (error) {
				callback(error, null);
			} else {
				// Get all cuisines from all restaurants
				const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
				// Remove duplicates from cuisines
				const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);
				callback(null, uniqueCuisines);
			}
		});
	}

	/**
	 * Restaurant page URL.
	 */
	static urlForRestaurant(restaurant) {
		return `./restaurant.html?id=${restaurant.id}`;
	}

	/**
	 * Restaurant image URL.
	 */
	static imageUrlForRestaurant(restaurant) {
		var image = restaurant['photograph'];
		// problem with data file from the server that don´t have the 'photograph' field defined in the 10th restaurant
		if (!image) {
			image = 10;
		}
		return `../dist/img/${image}.webp`;
	}

	/**
	 * Map marker for a restaurant.
	 */
	static mapMarkerForRestaurant(restaurant, map) {
		const marker = new google.maps.Marker({
			position: restaurant.latlng,
			title: restaurant.name,
			url: DBHelper.urlForRestaurant(restaurant),
			map: map,
			animation: google.maps.Animation.DROP
		});
		return marker;
	}

	//========================== Added to fetch reviews according to IDB ========================== //

	/**
	 * Fetch all restaurant reviews by its ID.
	 */
	static fetchReviewsById(id, callback) {
		DBHelper.readAllFromDB(`reviews-${id}`)
			.then(data => {
				if (data.length == 0) {
					return DBHelper.getDataFromURL(REVIEW);
				}
				return data;
			})
			.then(reviews => {
				callback(null, reviews);
			});

		/* Fetch the reviews added in offline mode in the 'on hold' IDB */
		DBHelper.readAllFromDB('reviews-on-hold')
			.then(data => {
				return data;
			})
			.then(reviews => {
				callback(null, reviews);
			});
		// TODO: Remove Reviews Header extra
	}
}

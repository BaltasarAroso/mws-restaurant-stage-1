// import idb from 'idb';
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
		return `http://localhost:${port}/restaurants`;
	}

	/**
	 * Fetch all restaurants.
	 */
	// static fetchRestaurants(callback) {
	// 	let xhr = new XMLHttpRequest();
	// 	xhr.open('GET', DBHelper.DATABASE_URL);
	// 	xhr.onload = () => {
	// 		if (xhr.status === 200) {
	// 			// Got a success response from server!
	// 			const json = JSON.parse(xhr.responseText);
	// 			const restaurants = json.restaurants;
	// 			callback(null, restaurants);
	// 		} else {
	// 			// Oops!. Got an error from server.
	// 			const error = `Request failed. Returned status of ${xhr.status}`;
	// 			callback(error, null);
	// 		}
	// 	};
	// 	xhr.send();
	// }

	//============================ Configure IndexedDB functions ============================//

	/**
	 * Open IndexedDB
	 */
	static OpenDB(name) {
		return idb.open(name, 1, function(upgradeDB) {
			if (!upgradeDB.objectStoreNames.contains('restaurants')) {
				upgradeDB.createObjectStore('restaurants', {
					keyPath: 'id'
				});
			}
			var restaurantStore = upgradeDB.transaction.objectStore('restaurants');
			restaurantStore.getAll().then(function(results) {
				for (var i = 1; i <= results.length; i++) {
					if (!upgradeDB.objectStoreNames.contains(`reviews-${i}`)) {
						upgradeDB.createObjectStore(`reviews-${i}`, {
							keyPath: 'id'
						});
					}
				}
			});
		});
	}

	/**
	 * Read From IndexedDB
	 */
	static ReadFromDB(dbPromise, objName, key) {
		return dbPromise.then(function(db) {
			var tx = db.transaction(objName);
			var objStore = tx.objectStore(objName);
			return objStore.get(key);
		});
		// .then(function(val) {
		// 	console.log('The value of ', key, ' is:', val);
		// });
	}

	static ReadAllFromDB(dbPromise, objName) {
		return dbPromise.then(function(db) {
			var tx = db.transaction(objName);
			var objStore = tx.objectStore(objName);
			return objStore.getAll();
		});
		// .then(function(val) {
		// 	console.log(objName, ': ', val);
		// });
	}

	static ReadAllInOrderFromDB(dbPromise, objName, order) {
		return dbPromise
			.then(function(db) {
				var tx = db.transaction(objName);
				var objStore = tx.objectStore(objName);
				var objIndex = objStore.index(order);
				return objIndex.getAll();
			})
			.then(function(val) {
				console.log(objName, 'by ', order, ': ', val);
			});
	}

	/**
	 * Write/Save to IndexedDB
	 */
	static WriteKeyValueToDB(dbPromise, objName, key2write, value2write) {
		return dbPromise.then(function(db) {
			var tx = db.transaction(objName, 'readwrite');
			var objStore = tx.objectStore(objName);
			objStore.put(key2write, value2write);
			return tx.complete;
		});
		// .then(function() {
		// 	console.log('Added ', key2write, ':', value2write, 'to ', objName);
		// });
	}

	static WriteToDB(dbPromise, data, objName, tag) {
		return dbPromise.then(function(db) {
			var tx = db.transaction(objName, 'readwrite');
			var objStore = tx.objectStore(objName);
			// tag = 1 means 'restaurants' objStore and tag = 0 means 'reviews' objStore
			tag ? Array.from(data).forEach(item => objStore.put(item)) : objStore.put(data);
			return tx.complete;
		});
		// .then(function() {
		// 	console.log('Added ', obj2write, 'to ', objName);
		// });
	}

	/**
	 * Get Data From URL
	 */
	static GetDataFromURL(dbPromise, tag) {
		return fetch(DBHelper.DATABASE_URL)
			.then(response => {
				return response.json();
			})
			.then(data => {
				if (tag) {
					DBHelper.WriteToDB(dbPromise, data, 'restaurants', 1);
				} else {
					DBHelper.WriteToDB(dbPromise, data, `reviews-${self.restaurant.id}`, 0);
					console.log(`Reviews data from API for restaurant: ${self.restaurant.id}`);
					console.log(data);
				}
				// callback(null, data);
				return data;
			});
	}

	//============================ Using Fetch API ============================//

	static fetchRestaurants(callback) {
		var dbPromise = DBHelper.OpenDB('restaurant-review-DB');
		DBHelper.ReadAllFromDB(dbPromise, 'restaurants')
			.then(data => {
				if (data.length == 0) {
					return DBHelper.GetDataFromURL(dbPromise, RESTAURANT);
				}
				return data;
			})
			.then(restaurants => {
				callback(null, restaurants);
			});
		// DBHelper.WriteKeyValueToDB(dbPromise, 'keyval', 'bar', 'foo');
		// DBHelper.WriteToDB(dbPromise, 'people', { name: 'John', age: '21', favouriteAnimal: 'dog' });
		// DBHelper.WriteToDB(dbPromise, 'people', { name: 'Helton', age: '34', favouriteAnimal: 'cat' });
		// DBHelper.WriteToDB(dbPromise, 'people', { name: 'Peter', age: '15', favouriteAnimal: 'cat' });
		// DBHelper.ReadFromDB(dbPromise, 'keyval', 'hello');
		// DBHelper.ReadAllFromDB(dbPromise, 'people');
		// DBHelper.ReadAllInOrderFromDB(dbPromise, 'restaurants', 'reviews');
	}

	//	============================== With LocalStorage ==============================//

	// /**
	//  * Save Restaurants
	//  */
	// static saveRestaurants(restaurants) {
	// 	localStorage.setItem('restaurants', restaurants);
	// }

	// /**
	//  * Get Restaurants from Local Storage
	//  */
	// static getRestaurantsFromLocalStorage(callback) {
	// 	return localStorage.getItem('restaurants');
	// }

	// /**
	//  * Get Restaurants remotelly from the server (DATABASE_URL)
	//  */
	// static getRestaurantsFromServer(callback = () => null) {
	// 	fetch(DBHelper.DATABASE_URL)
	// 		.then(response => {
	// 			return response.json();
	// 		})
	// 		.then(data => {
	// 			DBHelper.saveRestaurants(data);
	// 			callback(null, data);
	// 		})
	// 		.catch(err => {
	// 			const error = `Request failed. Returned status of ${err}`;
	// 			callback(error, null);
	// 		});
	// }

	// /**
	//  * Fetch all restaurants.
	//  */
	// static fetchRestaurants(callback) {
	// 	fetch(DBHelper.DATABASE_URL)
	// 		.then(response => {
	// 			return response.json();
	// 		})
	// 		.then(restaurants => {
	// 			DBHelper.saveRestaurants(restaurants);
	// 			callback(null, restaurants);
	// 		})
	// 		.catch(err => {
	// 			const error = `Connection to server failed. Returned status of ${err}`;
	// 			callback(error, null);
	// 			return DBHelper.getRestaurants()
	// 				.then(response => {
	// 					return callback(null, response);
	// 				})
	// 				.catch(err => {
	// 					const error = `Request failed. Returned status of ${err}`;
	// 					callback(error, null);
	// 				});
	// 		});
	// }

	//=======================================================================================//

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
		return `../img/${image}.jpg`;
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

	//========================== Added to fetch reviews by the IDB ========================== //
	/**
	 * Fetch all restaurant reviws by its ID.
	 */
	static fetchReviewsById(id, callback) {
		var dbPromise = DBHelper.OpenDB('restaurant-review-DB');
		DBHelper.ReadAllFromDB(dbPromise, `reviews-${id}`)
			.then(data => {
				if (data.length == 0) {
					return DBHelper.GetDataFromURL(dbPromise, REVIEW);
				}
				return data;
			})
			.then(reviews => {
				callback(null, reviews);
			});
	}
}

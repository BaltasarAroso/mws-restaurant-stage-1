// import idb from 'idb';
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
			// switch (upgradeDB.oldVersion) {
			// 	case 0:
			// 		var keyValStore = upgradeDB.createObjectStore('keyval');
			// 		keyValStore.put('world', 'hello');
			// 		break;
			// 	case 1:
			// 		upgradeDB.createObjectStore('people', { keyPath: 'name' });
			// 		break;
			// 	case 2:
			// 		var peopleStore = upgradeDB.transaction.objectStore('people');
			// 		peopleStore.createIndex('animal', 'favoriteAnimal');
			// 		peopleStore.createIndex('age', 'age');
			// }
			if (!upgradeDB.objectStoreNames.contains('restaurants')) {
				var restaurantStore = upgradeDB.createObjectStore('restaurants', { keyPath: 'id' });
			}
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
		return dbPromise.then(function(db) {
			var tx = db.transaction(objName);
			var objStore = tx.objectStore(objName);
			var objIndex = objStore.index(order);
			return objIndex.getAll();
		});
		// .then(function(val) {
		// 	console.log(objName, 'by ', order, ': ', val);
		// });
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

	static WriteToDB(dbPromise, data, objName) {
		return dbPromise.then(function(db) {
			var tx = db.transaction(objName, 'readwrite');
			var objStore = tx.objectStore(objName);
			for (var key in data) {
				objStore.put(key);
			}
			return tx.complete;
		});
		// .then(function() {
		// 	console.log('Added ', obj2write, 'to ', objName);
		// });
	}

	/**
	 * Get Data From URL
	 */
	static GetDataFromURL(dbPromise) {
		return fetch(DBHelper.DATABASE_URL)
			.then(response => {
				return response.json();
			})
			.then(data => {
				this.WriteToDB(dbPromise, data, 'restaurants');
				callback(null, data);
			});
	}

	//============================ Using Fetch API ============================//

	static fetchRestaurants(callback) {
		var dbPromise = this.OpenDB('restaurant-review-DB');
		this.ReadAllFromDB(dbPromise, 'restaurants')
			.then(data => {
				if (data.length == 0) {
					return this.GetDataFromURL(dbPromise);
				}
				return data;
			})
			.then(restaurants => {
				callback(null, restaurants);
			});
		// this.WriteKeyValueToDB(dbPromise, 'keyval', 'bar', 'foo');
		// this.WriteToDB(dbPromise, 'people', { name: 'John', age: '21', favouriteAnimal: 'dog' });
		// this.WriteToDB(dbPromise, 'people', { name: 'Helton', age: '34', favouriteAnimal: 'cat' });
		// this.WriteToDB(dbPromise, 'people', { name: 'Peter', age: '15', favouriteAnimal: 'cat' });
		// this.ReadFromDB(dbPromise, 'keyval', 'hello');
		// this.ReadAllFromDB(dbPromise, 'people');
		// this.ReadAllInOrderFromDB(dbPromise, 'people', 'age');
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
}

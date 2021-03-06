let restaurants;
let neighborhoods;
let cuisines;
var map;
var markers = [];

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', () => {
	fetchNeighborhoods();
	fetchCuisines();
	putAllStoredFavorites();
	const mapButton = document.getElementById('map-button');
	mapButton.addEventListener('click', handleMap);
});

//============================ Configure Favorite Restaurants ============================//
/**
 * POST All Stored Reviews in offline mode to API and IDB
 */
putAllStoredFavorites = () => {
	DBHelper.readAllFromDB('all-favorites-on-hold')
		.then(data => {
			if (data.length == 0) {
				return;
			}
			data.forEach(restaurant => {
				DBHelper.checkConnectionPUT(restaurant, true);
			});
			return data;
		})
		.catch(error => {
			console.log(`ERROR: Load from Favorites on hold DB failed due to ${error}`);
		});
};

//========================================================================================//

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
	DBHelper.fetchNeighborhoods((error, neighborhoods) => {
		if (error) {
			// Got an error
			console.error(error);
		} else {
			self.neighborhoods = neighborhoods;
			fillNeighborhoodsHTML();
		}
	});
};

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
	const select = document.getElementById('neighborhoods-select');
	neighborhoods.forEach(neighborhood => {
		const option = document.createElement('option');
		option.innerHTML = neighborhood;
		option.value = neighborhood;
		select.append(option);
	});
};

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
	DBHelper.fetchCuisines((error, cuisines) => {
		if (error) {
			// Got an error!
			console.error(error);
		} else {
			self.cuisines = cuisines;
			fillCuisinesHTML();
		}
	});
};

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
	const select = document.getElementById('cuisines-select');

	cuisines.forEach(cuisine => {
		const option = document.createElement('option');
		option.innerHTML = cuisine;
		option.value = cuisine;
		select.append(option);
	});
};

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
	let loc = {
		lat: 40.722216,
		lng: -73.987501
	};
	self.map = new google.maps.Map(document.getElementById('map'), {
		zoom: 12,
		center: loc,
		scrollwheel: false
	});
	updateRestaurants();
};

/**
 * Open main map
 */
handleMap = () => {
	const map = document.getElementById('map');
	const mapButton = document.getElementById('map-button');
	if (map.classList.contains('open')) {
		mapButton.innerHTML = 'Show Map';
		map.classList.remove('open');
	} else {
		mapButton.innerHTML = 'Close Map';
		map.classList.add('open');
	}
};

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
	const cSelect = document.getElementById('cuisines-select');
	const nSelect = document.getElementById('neighborhoods-select');

	const cIndex = cSelect.selectedIndex;
	const nIndex = nSelect.selectedIndex;

	const cuisine = cSelect[cIndex].value;
	const neighborhood = nSelect[nIndex].value;

	DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
		if (error) {
			// Got an error!
			console.error(error);
		} else {
			resetRestaurants(restaurants);
			fillRestaurantsHTML();
		}
	});
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = restaurants => {
	// Remove all restaurants
	self.restaurants = [];
	const ul = document.getElementById('restaurants-list');
	ul.innerHTML = '';

	// Remove all map markers
	self.markers.forEach(m => m.setMap(null));
	self.markers = [];
	self.restaurants = restaurants;
};

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
	const ul = document.getElementById('restaurants-list');
	restaurants.forEach(restaurant => {
		ul.append(createRestaurantHTML(restaurant));
	});
	addMarkersToMap();
};

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = restaurant => {
	const li = document.createElement('li');
	li.classList.add('restaurant');
	li.tabIndex = '0';

	const image = document.createElement('img');
	image.classList.add('restaurant-img');
	image.dataset.src = DBHelper.imageUrlForRestaurant(restaurant);
	image.alt = restaurant.photograph_alt;
	observer.observe(image);
	li.append(image);

	const name = document.createElement('h2');
	name.innerHTML = restaurant.name;
	li.append(name);

	const neighborhood = document.createElement('p');
	neighborhood.innerHTML = restaurant.neighborhood;
	li.append(neighborhood);

	const address = document.createElement('p');
	address.innerHTML = restaurant.address;
	li.append(address);

	const buttons = document.createElement('div');
	buttons.className = 'footer-buttons';

	const more = document.createElement('button');
	more.className = 'view-details';
	more.innerHTML = 'View Details';
	more.setAttribute('aria-label', `View Details of ${restaurant.name}`);
	more.setAttribute('onclick', `location.href='${DBHelper.urlForRestaurant(restaurant)}'`);
	buttons.append(more);

	const starButton = document.createElement('button');
	starButton.setAttribute('aria-label', `Button to add/remove ${restaurant.name} from favorites`);
	starButton.className = 'star-favorite';
	if (restaurant.is_favorite == null || restaurant.is_favorite == undefined) {
		restaurant.is_favorite = false;
	}
	if (restaurant.is_favorite == 'true') {
		starButton.innerHTML = '<img class="star" src="dist/img/star_full.svg" alt="star full">';
		starButton.classList.remove('false');
	} else {
		starButton.innerHTML = '<img class="star" src="dist/img/star_empty.svg" alt="star empty">';
		starButton.classList.add('false');
	}
	starButton.addEventListener('click', event => {
		if (!starButton.classList.contains('false')) {
			starButton.innerHTML = '<img class="star" src="dist/img/star_empty.svg" alt="star empty">';
			starButton.classList.add('false');
			restaurant.is_favorite = 'false';
		} else {
			starButton.innerHTML = '<img class="star" src="dist/img/star_full.svg" alt="star full">';
			starButton.classList.remove('false');
			restaurant.is_favorite = 'true';
		}
		DBHelper.handleFavorite(restaurant, true);
	});

	buttons.append(starButton);
	li.append(buttons);

	return li;
};

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
	restaurants.forEach(restaurant => {
		// Add marker to the map
		const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
		google.maps.event.addListener(marker, 'click', () => {
			window.location.href = marker.url;
		});
		self.markers.push(marker);
	});
};

/**
 * Implement Intersection Observer considering intersections
 */
const observer = new IntersectionObserver(entries => {
	entries.forEach(entry => {
		if (!entry.isIntersecting) return;
		entry.target.src = entry.target.dataset.src;
		observer.unobserve(entry.target);
	});
});

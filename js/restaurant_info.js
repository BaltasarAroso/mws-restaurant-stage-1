let restaurant;
var map;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
	fetchRestaurantFromURL((error, restaurant) => {
		if (error) {
			// Got an error!
			console.error(error);
		} else {
			self.map = new google.maps.Map(document.getElementById('map'), {
				zoom: 16,
				center: restaurant.latlng,
				scrollwheel: false
			});
			fillBreadcrumb();
			DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
		}
	});
};

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = callback => {
	if (self.restaurant) {
		// restaurant already fetched!
		callback(null, self.restaurant);
		return;
	}
	const id = getParameterByName('id');
	if (!id) {
		// no id found in URL
		error = 'No restaurant id in URL';
		callback(error, null);
	} else {
		DBHelper.fetchRestaurantById(id, (error, restaurant) => {
			self.restaurant = restaurant;
			if (!restaurant) {
				console.error(error);
				return;
			}
			fillRestaurantHTML();
			callback(null, restaurant);
		});
	}
};

/**
 * Get current review from page URL.
 */
fetchReviewsFromURL = callback => {
	if (self.reviews) {
		// reviews already fetched!
		callback(null, self.reviews);
		return;
	}
	const id = getParameterByName('id');
	if (!id) {
		// no id found in URL
		error = 'No reviews id in URL';
		callback(error, null);
	} else {
		DBHelper.fetchReviewsById(id, (error, reviews) => {
			self.reviews = reviews;
			if (!reviews) {
				console.error(error);
				return;
			}
			fillReviewsHTML();
			// callback(null, reviews);
			return reviews;
		});
	}
};

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
	const name = document.getElementById('restaurant-name');
	name.innerHTML = restaurant.name;

	const address = document.getElementById('restaurant-address');
	address.innerHTML = restaurant.address;

	const image = document.getElementById('restaurant-img');
	image.className = 'restaurant-img';
	image.src = DBHelper.imageUrlForRestaurant(restaurant);
	image.alt = restaurant.photograph_alt;

	const cuisine = document.getElementById('restaurant-cuisine');
	cuisine.innerHTML = restaurant.cuisine_type;

	// fill operating hours
	if (restaurant.operating_hours) {
		fillRestaurantHoursHTML();
	}
	// fill reviews
	// fillReviewsHTML();
	fetchReviewsFromURL();
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
	const hours = document.getElementById('restaurant-hours');
	for (let key in operatingHours) {
		const row = document.createElement('tr');

		const day = document.createElement('td');
		day.innerHTML = key;
		row.appendChild(day);

		const time = document.createElement('td');
		time.innerHTML = operatingHours[key];
		row.appendChild(time);

		hours.appendChild(row);
	}
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.reviews) => {
	const container = document.getElementById('reviews-container');
	const title = document.createElement('h2');
	title.innerHTML = 'Reviews';
	title.tabIndex = '0';
	container.appendChild(title);

	if (!reviews) {
		const noReviews = document.createElement('p');
		noReviews.classList.add('no-reviews');
		noReviews.innerHTML = 'No reviews yet!';
		container.appendChild(noReviews);
		return;
	}
	const ul = document.getElementById('reviews-list');
	reviews.forEach(review => {
		ul.appendChild(createReviewHTML(review));
	});
	container.appendChild(ul);
};

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = review => {
	const li = document.createElement('li');
	const section = document.createElement('section');
	li.appendChild(section);

	const name = document.createElement('p');
	name.innerHTML = review.name;
	name.className = 'name';
	section.appendChild(name);
	name.tabIndex = '0';

	const date = document.createElement('p');
	date.innerHTML = review.date;
	date.className = 'date';
	section.appendChild(date);
	date.tabIndex = '0';

	const rating = document.createElement('h3');
	rating.innerHTML = `Rating: ${review.rating}`;
	if (review.rating < 2) {
		rating.style.backgroundColor = '#a72a2a';
	} else if (review.rating <= 3) {
		rating.style.backgroundColor = '#f79204';
	} else if (review.rating < 4) {
		rating.style.backgroundColor = '#e8e13b';
	} else if (review.rating < 5) {
		rating.style.backgroundColor = '#b1d648';
	} else {
		rating.style.backgroundColor = '#02950d';
	}
	li.appendChild(rating);
	rating.tabIndex = '0';

	const comments = document.createElement('p');
	comments.innerHTML = review.comments;
	li.appendChild(comments);
	comments.tabIndex = '0';

	return li;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant = self.restaurant) => {
	const breadcrumb = document.getElementById('breadcrumb');
	const li = document.createElement('li');
	li.innerHTML = restaurant.name;
	breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url = window.location.href) => {
	name = name.replace(/[\[\]]/g, '\\$&');
	const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
		results = regex.exec(url);
	if (!results) return null;
	if (!results[2]) return '';
	return decodeURIComponent(results[2].replace(/\+/g, ' '));
};

let restaurant;
var map;

/**
 * Fetch offline reviews as soon as the page is loaded in online mode.
 */
document.addEventListener('DOMContentLoaded', () => {
	postStoredReviews();
	putStoredFavorites();
});

//============================ Configure Favorite Restaurants ============================//
/**
 * POST Stored Reviews in offline mode to API and IDB
 */
putStoredFavorites = () => {
	DBHelper.readAllFromDB('favorite-on-hold')
		.then(data => {
			if (data.length == 0) {
				return;
			}
			DBHelper.checkConnectionPUT(data[0], false);
			return data;
		})
		.catch(error => {
			console.log(`ERROR: Load from Favorites on hold DB failed due to ${error}`);
		});
};

//================================ Configure POST Reviews ================================//
/**
 * POST Stored Reviews in offline mode to API and IDB
 */
postStoredReviews = () => {
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
};

/**
 * Submit the new review
 */
submitNewReview = () => {
	const form = document.querySelector('#review-form');
	form.addEventListener('submit', event => {
		event.preventDefault();
		const name = form.querySelector('#review-form-header-name');
		const rating = form.querySelector('#review-form-rating');
		const comments = form.querySelector('#review-form-comments');

		const newReview = {
			restaurant_id: getParameterByName('id'),
			name: name.value.replace(/[^A-Za-z0-9 ´`~^,.?!]/gi, ''),
			rating: rating.value,
			comments: comments.value.replace(/[^A-Za-z0-9 ´`~^ºª@&#+-,.?!]/gi, ''),
			createdAt: Date.now(),
			updatedAt: Date.now()
		};

		DBHelper.postNewReview(newReview).then(function() {
			name.value = '';
			rating.value = 1;
			comments.value = '';

			appendReviewToList(newReview);
			document.getElementById('review-end').innerHTML = 'Review successfully submitted!';
			if (navigator.connection.downlink == 0) {
				alert(
					'User in Offline Mode.\n' +
						'Submitted review will be added to API when online, now it is only added to a temporary IDB.'
				);
			}
		});
	});
};

submitNewReview();
//========================================================================================//

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
	dateNewReview();

	const container = document.getElementById('reviews-container');
	if (!reviews) {
		const noReviews = document.createElement('p');
		noReviews.innerHTML = 'No reviews yet!';
		container.appendChild(noReviews);
		return;
	}
	const ul = document.getElementById('reviews-list');
	reviews.forEach(review => {
		appendReviewToList(review);
	});
	container.appendChild(ul);
};

/**
 * Append Reviews to reviews-list
 */
appendReviewToList = review => {
	const ul = document.getElementById('reviews-list');
	ul.appendChild(createReviewHTML(review));
};

/**
 * Create date review
 */
createDateReview = date => {
	var dateTime = new Date(date);
	var month = '';
	switch (dateTime.getMonth() + 1) {
		case 1:
			month = 'January';
			break;
		case 2:
			month = 'February';
			break;
		case 3:
			month = 'March';
			break;
		case 4:
			month = 'April';
			break;
		case 5:
			month = 'May';
			break;
		case 6:
			month = 'June';
			break;
		case 7:
			month = 'July';
			break;
		case 8:
			month = 'August';
			break;
		case 9:
			month = 'September';
			break;
		case 10:
			month = 'October';
			break;
		case 11:
			month = 'November';
			break;
		case 12:
			month = 'December';
			break;
		default:
			console.log('ERROR: Date of the review not correct.');
			break;
	}
	return (
		dateTime.getDate().toString() +
		' ' +
		month +
		' ' +
		dateTime.getFullYear().toString() +
		', ' +
		dateTime
			.getHours()
			.toString()
			.padStart(2, '0') +
		':' +
		dateTime
			.getMinutes()
			.toString()
			.padStart(2, '0')
	);
};

/**
 * Add actual date to new review
 */
dateNewReview = () => {
	document.getElementById('review-form-header-date').innerHTML = createDateReview(Date(Date.now()));
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
	name.id = 'reviews-list-name';
	section.appendChild(name);
	name.tabIndex = '0';

	const date = document.createElement('p');
	date.innerHTML = createDateReview(review.updatedAt);
	date.id = 'reviews-list-date';
	section.appendChild(date);
	date.tabIndex = '0';

	const rating = document.createElement('h3');
	rating.innerHTML = `Rating: ${review.rating}`;
	rating.id = 'reviews-list-rating';
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
	comments.id = 'reviews-list-comments';
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

	const starLi = document.createElement('li');
	breadcrumb.appendChild(starLi);
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
		DBHelper.handleFavorite(restaurant, false);
	});
	starLi.appendChild(starButton);
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

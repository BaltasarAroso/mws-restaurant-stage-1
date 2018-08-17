/*eslint-env node*/

var gulp = require('gulp'),
	postcss = require('gulp-postcss'),
	autoprefixer = require('autoprefixer'),
	cssnano = require('cssnano'),
	sourcemaps = require('gulp-sourcemaps'),
	imagemin = require('imagemin'),
	imageminWebp = require('imagemin-webp'),
	// babel = require('gulp-babel'),
	// concat = require('gulp-concat'),
	// uglify = require('gulp-uglify'),
	// gzip = require('gulp-gzip'),
	// browserSync = require('browser-sync').create(),
	del = require('del');

var build = gulp.series(clean, scripts, gulp.parallel(html, css, imgs));

var paths = {
	html: {
		src: '*.html',
		dest: 'dist/'
	},
	css: {
		src: 'css/*',
		dest: 'dist/css'
	},
	imgs: {
		src: 'img/**/*',
		dest: 'dist/img'
	},
	scripts: {
		src: 'js/**/*.js',
		dest: 'dist/js'
	}
};

function html() {
	return gulp.src(paths.html.src).pipe(gulp.dest(paths.html.dest));
}

function css() {
	return gulp
		.src(paths.css.src)
		.pipe(sourcemaps.init())
		.pipe(
			postcss([
				autoprefixer({
					browsers: ['last 2 versions']
				}),
				cssnano()
			])
		)
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest(paths.css.dest));
}

function imgs() {
	return imagemin([paths.imgs.src, 'favicon.ico'], paths.imgs.dest, {
		use: [imageminWebp({ quality: 50 })]
	});
}

function scripts() {
	return (
		gulp
			.src(paths.scripts.src)
			// .pipe(
			// 	babel({
			// 		presets: ['env']
			// 	})
			// )
			// .pipe(concat('all.js')) //To implement this is necessary to change the scripts sources in .html
			// .pipe(uglify())
			.pipe(gulp.dest(paths.scripts.dest))
	);
}

// function compress() {
// 	return gulp
// 		.src('dist/js/all.js')
// 		.pipe(gzip())
// 		.pipe(gulp.dest(paths.scripts.dest));
// }

// function watch() {
// 	browserSync.init({
// 		server: {
// 			baseDir: './'
// 		}
// 	});
// 	gulp.watch(paths.css.src, reload);
// }

// function reload() {
// 	browserSync.reload();
// }

function clean() {
	return del(['dist']);
}

// exports.watch = watch;
exports.clean = clean;

gulp.task('default', build);

/*eslint-env node*/

var gulp = require('gulp'),
	sass = require('gulp-sass'),
	postcss = require('gulp-postcss'),
	autoprefixer = require('autoprefixer'),
	sourcemaps = require('gulp-sourcemaps'),
	del = require('del'),
	browserSync = require('browser-sync').create();

var build = gulp.series(clean, gulp.parallel(styles, css, html, js, watch));

var paths = {
	styles: {
		src: 'sass/*.scss',
		dest: 'css'
	},
	css: {
		src: 'css/*.css',
		dest: 'assets/css'
	},
	html: {
		src: '*.html',
		dest: 'assets/'
	},
	js: {
		src: 'js/*.js',
		dest: 'assets/js'
	}
};

function clean() {
	del(['assets']);
	return del(['css/*']);
}

function reload() {
	browserSync.reload();
}

function styles() {
	return gulp
		.src(paths.styles.src)
		.pipe(sourcemaps.init())
		.pipe(sass())
		.on('error', sass.logError)
		.pipe(
			postcss([
				autoprefixer({
					browsers: ['last 2 versions']
				})
			])
		)
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest(paths.styles.dest))
		.pipe(browserSync.stream());
}

function css() {
	return gulp.src(paths.css.src).pipe(gulp.dest(paths.css.dest));
}

function html() {
	return gulp.src(paths.html.src).pipe(gulp.dest(paths.html.dest));
}

function js() {
	return gulp.src(paths.js.src).pipe(gulp.dest(paths.js.dest));
}

function watch() {
	browserSync.init({
		server: {
			baseDir: './'
		}
	});
	gulp.watch(paths.styles.src, reload);
	gulp.watch(paths.css.src, reload);
	gulp.watch(paths.html.src, reload);
	gulp.watch(paths.js.src, reload);
}

exports.styles = styles;
exports.watch = watch;
exports.clean = clean;

gulp.task('default', build);

/*eslint-env node*/

var gulp = require('gulp'),
	sass = require('gulp-sass'),
	postcss = require('gulp-postcss'),
	autoprefixer = require('autoprefixer'),
	cssnano = require('cssnano'),
	sourcemaps = require('gulp-sourcemaps'),
	babel = require('gulp-babel'),
	concat = require('gulp-concat'),
	uglify = require('gulp-uglify'),
	gzip = require('gulp-gzip'),
	imagemin = require('gulp-imagemin'),
	del = require('del'),
	browserSync = require('browser-sync').create();

var build = gulp.series(
	clean,
	gulp.parallel(styles, css, html, imgs, scripts, scripts_dist, compress, watch)
);

var paths = {
	styles: {
		src: 'sass/*.scss',
		dest: 'css'
	},
	css: {
		src: 'css/*.css',
		dest: 'dist/css'
	},
	html: {
		src: '*.html',
		dest: 'dist/'
	},
	scripts: {
		src: 'js/**/*.js',
		dest: 'dist/js'
	},
	imgs: {
		src: 'img/*',
		dest: 'dist/img'
	}
};

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
				}),
				cssnano()
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

function imgs() {
	return gulp
		.src(paths.imgs.src)
		.pipe(imagemin())
		.pipe(gulp.dest(paths.imgs.dest));
}

function scripts() {
	return gulp
		.src(paths.scripts.src)
		.pipe(
			babel({
				presets: ['env']
			})
		)
		.pipe(concat('all.js')) //To implement this is necessary to change the scripts sources in .html
		.pipe(gulp.dest(paths.scripts.dest));
}

function scripts_dist() {
	return gulp
		.src(paths.scripts.src)
		.pipe(
			babel({
				presets: ['env']
			})
		)
		.pipe(concat('all.js')) //To implement this is necessary to change the scripts sources in .html
		.pipe(uglify())
		.pipe(gulp.dest(paths.scripts.dest));
}

function compress() {
	return gulp
		.src(paths.scripts.src)
		.pipe(gzip())
		.pipe(gulp.dest(paths.scripts.dest));
}

function watch() {
	browserSync.init({
		server: {
			baseDir: './dist'
		}
	});
	gulp.watch(paths.styles.src, reload);
	gulp.watch(paths.css.src, reload);
	gulp.watch(paths.html.src, reload);
	gulp.watch(paths.scripts.src, reload);
	gulp.watch(paths.imgs.src, reload);
}

function reload() {
	browserSync.reload();
}

function clean() {
	del(['dist']);
	return del(['css/*']);
}

exports.styles = styles;
exports.watch = watch;
exports.clean = clean;

gulp.task('default', build);

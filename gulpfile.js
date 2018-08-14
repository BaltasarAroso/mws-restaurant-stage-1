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
	imagemin = require('imagemin'),
	imageminWebp = require('imagemin-webp'),
	del = require('del'),
	browserSync = require('browser-sync').create();

var build = gulp.series(clean, scripts, gulp.parallel(html, imgs, css, watch));

var paths = {
	html: {
		src: '*.html',
		dest: 'dist/'
	},
	css: {
		src: 'css/*',
		dest: 'dist/css'
	},
	scripts: {
		src: 'js/**/*.js',
		dest: 'dist/js'
	},
	imgs: {
		src: 'img/**/*',
		dest: 'dist/img'
	}
};

function imgs() {
	imagemin([paths.imgs.src], paths.imgs.dest, {
		use: [imageminWebp({ quality: 50 })]
	});
}

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

function watch() {
	browserSync.init({
		server: {
			baseDir: './'
		}
	});
	gulp.watch(paths.css.src, reload);
}

function reload() {
	browserSync.reload();
}

function clean() {
	return del(['dist']);
}

exports.watch = watch;
exports.clean = clean;

gulp.task('default', build);

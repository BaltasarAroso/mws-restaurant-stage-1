var gulp = require('gulp');
var sass = require('gulp-sass');

gulp.task('default', function () {
  // place code for your default task here
  console.log('Hello Gulp! gulpfile.js test...');
  // done();
});

gulp.task('styles', function(done) {
  gulp.src('sass/**/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('./css'));
  done();
});
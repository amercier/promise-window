/*jshint browser:false, node:true */
'use strict';

var gulp = require('gulp'),
    rename = require('gulp-rename'),
    size = require('gulp-size'),
    uglify = require('gulp-uglify'),
    src = 'src/promise-window.js';

gulp.task('copy', function() {
  return gulp.src(src)
    .pipe(size({ showFiles: true }))
    .pipe(gulp.dest('dist'));
});

gulp.task('minify', function() {
  return gulp.src(src)
    .pipe(uglify({ preserveComments: 'some' }))
    .pipe(rename({ suffix: '.min' }))
    .pipe(size({ showFiles: true }))
    .pipe(size({ showFiles: true, gzip: true }))
    .pipe(gulp.dest('dist'));
});

gulp.task('build', ['copy', 'minify']);
gulp.task('default', ['build']);

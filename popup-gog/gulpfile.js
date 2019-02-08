"use strict";

// Load plugins
const autoprefixer = require("autoprefixer");
const browsersync = require("browser-sync").create();
const cssnano = require("cssnano");
const del = require("del");
const eslint = require("gulp-eslint");
const gulp = require("gulp");
const imagemin = require("gulp-imagemin");
const newer = require("gulp-newer");
const plumber = require("gulp-plumber");
const postcss = require("gulp-postcss");
const rename = require("gulp-rename");
const sass = require("gulp-sass");
const webpack = require("webpack");
const webpackconfig = require("./webpack.config.js");
const webpackstream = require("webpack-stream");

// BrowserSync
function browserSync(done) {
  browsersync.init({
    server: {
      baseDir: "./src/"
    },
    port: 3000
  });
  done();
}

// BrowserSync Reload
function browserSyncReload(done) {
  browsersync.reload();
  done();
}

// Clean assets
function clean() {
  return del(["./dist/assets/"]);
}

// Optimize Images
function images() {
  return gulp
    .src("./src/assets/img/**/*")
    .pipe(newer("./dist/assets/img"))
    .pipe(
      imagemin([
        imagemin.gifsicle({
          interlaced: true
        }),
        imagemin.jpegtran({
          progressive: true
        }),
        imagemin.optipng({
          optimizationLevel: 5
        }),
        imagemin.svgo({
          plugins: [{
            removeViewBox: false,
            collapseGroups: true
          }]
        })
      ])
    )
    .pipe(gulp.dest("./dist/assets/img"));
}

// all files
function allFile() {
  return gulp
    .src("./src/*.html")
    .pipe(gulp.dest("./dist/"))
    .pipe(browsersync.stream());
}

// CSS task
function css() {
  return gulp
    .src("./src/assets/sass/**/*.sass")
    .pipe(plumber())
    .pipe(sass({
      outputStyle: "expanded"
    }))
    .pipe(gulp.dest("./dist/assets/css/"))
    .pipe(rename({
      suffix: ".min"
    }))
    .pipe(postcss([autoprefixer(), cssnano()]))
    .pipe(gulp.dest("./dist/assets/css/"))
    .pipe(browsersync.stream());
}

// Lint scripts
// function scriptsLint() {
//   return gulp
//     .src(["./src/assets/js/**/*", "./gulpfile.js"])
//     .pipe(plumber())
//     .pipe(eslint())
//     .pipe(eslint.format())
//     .pipe(eslint.failAfterError());
// }

// Transpile, concatenate and minify scripts
function scripts() {
  return (
    gulp
    .src(["./src/assets/js/**/*"])
    .pipe(plumber())
    .pipe(webpackstream(webpackconfig, webpack))
    // folder only, filename is specified in webpack config
    .pipe(gulp.dest("./dist/assets/js/"))
    .pipe(browsersync.stream())
  );
}

// Watch files
function watchFiles() {
  gulp.watch("./src/assets/sass/**/*", gulp.series(css, browserSyncReload));
  gulp.watch("./src/*.html", gulp.series(allFile, browserSyncReload));
  gulp.watch("./src/assets/js/**/*", gulp.series(scripts, browserSyncReload));
  gulp.watch("./src/assets/img/**/*", images);
}

// define complex tasks
const js = gulp.series(scripts);
const build = gulp.series(clean, gulp.parallel(css, images, js, allFile));
const watch = gulp.parallel(watchFiles, browserSync);

// export tasks
exports.images = images;
exports.css = css;
exports.js = js;
exports.clean = clean;
exports.build = build;
exports.watch = watch;
exports.default = build;
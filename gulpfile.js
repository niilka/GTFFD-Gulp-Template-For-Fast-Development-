// Dependenses

const gulp = require('gulp'),
	gutil = require('gulp-util'),
	sass = require('gulp-sass'),
	browserSync = require('browser-sync'),
	concat = require('gulp-concat'),
	uglify = require('gulp-uglify'),
	cleanCSS = require('gulp-clean-css'),
	rename = require('gulp-rename'),
	del = require('del'),
	imagemin = require('gulp-imagemin'),
	cache = require('gulp-cache'),
	autoprefixer = require('gulp-autoprefixer'),
	ftp = require('vinyl-ftp'),
	notify = require("gulp-notify"),
	pug = require('gulp-pug'),
	spritesmith = require('gulp.spritesmith'),
	sourcemaps = require('gulp-sourcemaps'),
	svgstore = require('gulp-svgstore'),
	rsync = require('gulp-rsync');

// User tasks

gulp.task('minifyUserScripts', function () {
	return gulp.src([
			'app/js/common.js',
		])
		.pipe(concat('common.min.js'))
		.pipe(uglify())
		.pipe(gulp.dest('app/js'));
});

gulp.task('compileJS', ['minifyUserScripts'], function () {
	return gulp.src([
			//Other scripts
			'app/js/common.min.js',
		])
		.pipe(concat('scripts.min.js'))
		.pipe(gulp.dest('app/js'))
		.pipe(browserSync.reload({
			stream: true
		}));
});

gulp.task('webServer', function () {
	browserSync({
		server: {
			baseDir: 'app'
		},
		notify: false,
	});
});

gulp.task('compilePug', function () {
	return gulp.src('app/*.pug')
		.pipe(pug({
			pretty: true
		}))
		.pipe(gulp.dest('app'))
		.pipe(browserSync.reload({
			stream: true
		}));
});

gulp.task('compileSass', function () {
	return gulp.src('app/sass/**/*.scss')
		.pipe(sourcemaps.init())
		.pipe(sass({
			outputStyle: 'expand'
		}).on("error", notify.onError()))
		.pipe(rename({
			suffix: '.min',
			prefix: ''
		}))
		.pipe(autoprefixer(['last 15 versions']))
		.pipe(cleanCSS())
		.pipe(sourcemaps.write(''))
		.pipe(gulp.dest('app/css'))
		.pipe(browserSync.reload({
			stream: true
		}));
});

gulp.task('svgSprites', function () {
	return gulp
		.src('app/utilites/create_sprite/svg/*.svg')
		.pipe(svgstore())
		.pipe(rename({
			basename: 'sprite'
		}))
		.pipe(gulp.dest('app/img/icons/svg/sprite'))
});

gulp.task('pngSprites', function () {
	var spriteData = gulp.src('app/utilites/create-sprite/png/*.png').pipe(spritesmith({
		imgName: 'sprite.png',
		cssName: '_sprite.scss',
		algorithm: 'left-right',
		padding: 80
	}));
	spriteData.img.pipe(gulp.dest('app/img/icons/png/sprite'));
	spriteData.css.pipe(gulp.dest('app/sass/utilites'));
});

gulp.task('minifyImages', function () {
	return gulp.src('app/img/**/*')
		.pipe(cache(imagemin()))
		.pipe(gulp.dest('dist/img'));
});

gulp.task('removedist', function () {
	return del.sync('dist');
});
gulp.task('clearcache', function () {
	return cache.clearAll();
});

// Ready project

gulp.task('build', ['removedist', 'minifyImages', 'compilePug', 'compileSass', 'compileJS'], function () {

	var buildFiles = gulp.src([
		'app/*.html',
	]).pipe(gulp.dest('dist'));

	var buildCss = gulp.src([
		'app/css/index.min.css',
	]).pipe(gulp.dest('dist/css'));

	var buildJs = gulp.src([
		'app/js/scripts.min.js',
	]).pipe(gulp.dest('dist/js'));

	var buildFonts = gulp.src([
		'app/fonts/**/*',
	]).pipe(gulp.dest('dist/fonts'));

});

gulp.task('deploy', function () {

	var conn = ftp.create({
		host: 'hostname.com',
		user: 'username',
		password: 'userpassword',
		parallel: 10,
		log: gutil.log
	});

	var globs = [
		'dist/**',
		'dist/.htaccess',
	];
	return gulp.src(globs, {
			buffer: false
		})
		.pipe(conn.dest('/path/to/folder/on/server'));

});

gulp.task('watch', ['compilePug', 'compileSass', 'compileJS', 'webServer'], function () {
	gulp.watch('app/sass/**/*.scss', ['compileSass']);
	gulp.watch(['libs/**/*.js', 'app/scripts/scripts.js'], ['compileJS']);
	gulp.watch('app/*.pug', ['compilePug'], browserSync.reload);
});

gulp.task('default', ['watch']);
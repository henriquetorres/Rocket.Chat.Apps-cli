#!/usr/bin/env node

const path = require('path')
const fs = require('fs')
const ts = require('typescript')
const gulp = require('gulp')
const tsc = require('gulp-typescript')
const tslint = require('gulp-tslint');
const async = require('async');
const through = require('through2');
const jsonSchema = require('gulp-json-schema');
const appSchema = require('./app-schema.json');
const gulpfile = require('gulp-file')
const zip = require('gulp-zip');



const tsp = tsc.createProject('tsconfig.json');
const getFolders = (dir) => fs.readdirSync(dir).filter((file) => fs.statSync(path.join(dir, file)).isDirectory());
const appsTsCompileOptions = {
    target: 'es5',
    module: 'commonjs',
    moduleResolution: 'node',
    declaration: false,
    noImplicitAny: false,
    removeComments: true,
    strictNullChecks: true,
    noImplicitReturns: true,
    emitDecoratorMetadata: true,
    experimentalDecorators: true,
    lib: [ 'es2017' ]
};

module.exports = function (context, args, callback) {
  const folders = getFolders('./apps')
                  .filter((folder) => fs.existsSync(path.join('./apps', folder, 'app.json')) && fs.statSync(path.join('./apps', folder, 'app.json')).isFile())
                  .map((folder) => {
                      return {
                          folder,
                          dir: path.join('./apps', folder),
                          toZip: path.join('./apps', folder, '**'),
                          infoFile: path.join('./apps', folder, 'app.json'),
                          info: require('./' + path.join('./apps', folder, 'app.json'))
                      };
                  });

    async.series([
        function _testCompileTheTypeScript(next) {
            const promises = folders.map((item) => {
                return new Promise((resolve) => {
                    if (!fs.existsSync('.tmp')) {
                        fs.mkdirSync('./.tmp');
                    }
                    fs.writeFileSync(`.tmp/${ item.info.id }.json`, JSON.stringify({
                        compilerOptions: appsTsCompileOptions,
                        include: [ __dirname + '/' + item.dir ],
                        exclude: ['node_modules', 'bower_components', 'jspm_packages']
                    }), 'utf8');

                    context.log(`Attempting to compile ${item.info.name} v${item.info.version}`);
                    const project = tsc.createProject(`.tmp/${ item.info.id }.json`);

                    project.src().pipe(project().on('error', () => {
                        item.valid = false;
                    })).pipe(through.obj((file, enc, done) => done(null, file), () => {
                        if (typeof item.valid === 'boolean' && !item.valid) {
                            context.log(`${item.info.name} v${item.info.version} has FAILED to compile.`);
                        } else {
                          context.log(`${item.info.name} v${item.info.version} has been compiled succesfully.`);
                        }

                        resolve();
                    }));
                });
            });

            Promise.all(promises).then(() => next()).catch((e) => {
                console.error(e);
                throw e;
            });
        },
        function _readTheAppJsonFiles(next) {
            const promises = folders.map((item) => {
                if (typeof item.valid === 'boolean' && !item.valid) return Promise.resolve();

                return new Promise((resolve) => {
                    gulp.src(item.infoFile)
                        .pipe(jsonSchema({ schema: appSchema, emitError: false }))
                        .pipe(through.obj(function transform(file, enc, done) {
                            if (file && !file.isNull() && file.jsonSchemaResult) {
                                item.valid = file.jsonSchemaResult.valid;

                                if (!item.valid) {
                                    context.log(item.folder + path.sep + 'app.json has failed to validate');
                                }
                            }

                            done(null, file);
                        }, function flush() {
                            resolve();
                        }));
                });
            });

            Promise.all(promises).then(() => next());
        },
        function _onlyZipGoodApps(next) {
            const validItems = folders.filter((item) => item.valid);

            if (validItems.length === 0) {
                next(new Error('No valid Apps.'));
                return;
            }

            context.log('Errors are listed above');

            const zippers = validItems.filter((item) => fs.existsSync(path.join(item.dir, item.info.classFile))).map((item) => {
                return new Promise((resolve) => {
                    const zipName = item.info.nameSlug + '_' + item.info.version + '.zip';
                    return gulp.src(item.toZip)
                        .pipe(gulpfile('.packagedby', fs.readFileSync('package.json')))
                        .pipe(zip(zipName))
                        .pipe(gulp.dest('dist'))
                        .pipe(through.obj((file, enc, done) => done(null, file), () => {
                            context.log(item.info.name + ' v' + item.info.version + ' has been packaged at: dist/' + zipName);
                            resolve();
                        }));
                });
            });

            Promise.all(zippers).then(() => next());
        }
    ], callback);
}

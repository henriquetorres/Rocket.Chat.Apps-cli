const fs = require('fs')
const async = require('async')
const gulp = require('gulp')
const tap = require('gulp-tap')
const request = require('request')

module.exports = (context, auth, callback) => {
  gulp.src('./dist/*.zip')
  .pipe(tap((item) => {
    async.series([
      (next) => {
        context.log('authenticating');
        request.post({
          url: `${ auth.host }/api/login`,
          form: {
            'user': auth.username,
            'password': auth.password
          }
        }, (err, res, body) => {
          if(err) throw err;
          try {
            const { authToken, userId } = JSON.parse(body).data;
            auth = Object.assign(auth, {authToken, userId});
            context.log('User authenticated succesfully');
          } catch (e) {
            context.log('Could not login with provided credentials');
            callback();
          }
          next();
        });
      },
      (next) => {
        request.post({
          url: `${ auth.host }/api/apps`,
          formData: {
            'app': fs.createReadStream(item.path)
          },
          headers: {'X-User-Id': auth.userId, 'X-Auth-Token': auth.authToken}
        }, (err, res, body) => {
          if(err) context.log('Error uploading app to', auth.host, err);
          context.log(res);
          context.log('App uploaded successfully to ', auth.host);
          next();
        });
      }
    ]);
  }));
  callback();
}

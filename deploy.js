// const fs = require('fs');
// const path = require('path');
// const async = require('async');

module.exports = (auth, file) => {
  console.log('Deploy was called')
  console.log(auth)
  // async.series([
  //   (next) => {
  //     console.log('authenticating');
  //     return request.post({
  //       url: `http://${ auth.host }:${ auth.port }/api/login`,
  //       form: {
  //         'user': auth.username,
  //         'password': auth.password
  //       }
  //     }, (err, res, body) => {
  //       if(err) throw err;
  //       try {
  //         const { authToken, userId } = JSON.parse(body).data;
  //         auth = Object.assign(auth, {authToken, userId});
  //         console.log('auth updated with', auth);
  //       } catch (e) {
  //         console.log('Could not login with provided credentials');
  //         return;
  //       }
  //       next();
  //     });
  //   },
  //   (next) => {
  //     console.log('auth is: ', auth);
  //     const data = new formData();
  //     data.append('app', fs.createReadStream(item.path));
  //     data.submit({
  //         host: auth.host,
  //         port: auth.port,
  //         path: auth.path,
  //         headers: {'X-User-Id': auth.userId, 'X-Auth-Token': auth.authToken}
  //     }, (err) => {
  //       if(err) throw err;
  //       next();
  //     });
  //   }
  // ]);
}

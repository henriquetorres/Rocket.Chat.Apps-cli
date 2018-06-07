#!/usr/bin/env node

const create = require('./create.js');
const deploy = require('./deploy.js');
const build = require('./build.js');

const async = require('async');

const vorpal = require('vorpal')();

vorpal
  .command('create <AppName>')
  .alias('new')
  .description('Create a folder and basic files for your app')
  .action(function (args, cb) {
    if (args) {
      this.log(args);
      create(this, args, cb);
    } else {
      this.log('no args found');
      cb();
    }
  });

vorpal
  .command('build')
  .alias('package')
  .description('Build your apps')
  .action(function (args, cb) {
    build(this, args, cb);
  });

vorpal
  .command('deploy [AppName]')
  .alias('launch')
  .option('-h, --host <host>', 'Your Rocket.Chat address')
  .option('-u, --username <username>', 'Your Rocket.Chat username for authentication')
  .description('Deploy your app to a Rocket.Chat instance')
  .action(function (args, cb) {
    let auth = args.options;
    const steps = [];
    if(!args.options.host) {
      steps.push((next) =>
        this.prompt([{
          type: 'input',
          name: 'host',
          message: 'Rocket.Chat Address: '
        }], (response) => {
          auth = {...auth, host: response.host}
          next()
        })
      )
    }
    if(!args.options.username) {
      steps.push((next) =>
        this.prompt([{
          type: 'input',
          name: 'username',
          message: 'Username: '
        }], (response) => {
          auth = {...auth, username: response.username}
          next()
        })
      )
    }
    async.series([
      ...steps,
      (next) => this.prompt([{
        type: 'password',
        name: 'password',
        message: 'Password: '
      }], (response) => {
        auth = {...auth, password: response.password}
        next()
      })
    ], (err) => {
      if (err) this.log('There was a problem with user input values')
      deploy(this, auth, cb);
    })

  });


vorpal
  .delimiter('RocketChatApp~$')
  .show();

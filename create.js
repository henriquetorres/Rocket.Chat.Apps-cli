#!/usr/bin/env node

const pascalCase = require('pascalcase');
const fs = require('fs')
const generateId = require('uuid4');

const slugify = (text) => text.toString().toLowerCase()
    .replace(/^\s+|\s+$/g, '')
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w-]+/g, '')       // Remove all non-word chars
    .replace(/--+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of textte


module.exports = function (context, args, callback) {
  if(!args) {
    args['AppName'] = process.argv[1]; // @TODO improve
  }
  if(args.AppName.match(/[1-9]/) != null) {
    context.log(`App name can't contain numbers`);
    return;
  }

  const slugifiedName = slugify(args.AppName);
  if(fs.existsSync(`./apps/${ slugifiedName }`)) {
    context.log(`${ args.AppName} already exists in the apps folder`);
    return;
  }

  try {
    if(!fs.existsSync(`./apps`)) {
      fs.mkdirSync(`./apps`);
    }
    fs.mkdirSync(`./apps/${ slugifiedName }`);
  } catch (e) {
    context.log(`Couldn't create a folder for ${ args.AppName}`, e);
    return;
  }
  try {
    fs.writeFileSync(`./apps/${ slugifiedName }/app.json`,
`{
    "id": "${ generateId() }",
    "name": "${ args.AppName }",
    "nameSlug": "${ slugifiedName }",
    "version": "0.0.1",
    "requiredApiVersion": "^0.9.13",
    "description": "${ args.AppName } Rocket.Chat App",
    "author": {
        "name": "<replace me>",
        "support": "<replace me>"
    },
    "classFile": "index.ts",
    "iconFile": "icon.jpg"
}
`, 'utf8');

    fs.writeFileSync(`./apps/${ slugifiedName }/icon.jpg`, '', 'binary');

    fs.writeFileSync(`./apps/${ slugifiedName }/index.ts`,
`import {
    ILogger
} from '@rocket.chat/apps-ts-definition/accessors';
import { App } from '@rocket.chat/apps-ts-definition/App';
import { IAppInfo } from '@rocket.chat/apps-ts-definition/metadata';

export class ${ pascalCase(args.AppName) }App extends App {
    constructor(info: IAppInfo, logger: ILogger) {
        super(info, logger);
    }
}
`, 'utf8');

    } catch (e) {
        context.log(`Couldn't create a files for ${ args.AppName } app`, e);
    }
    callback();
}

#!/usr/bin/env node

module.exports = function (args = process.argv) {
  console.log(process);
  return console.log('Create was called', args);
}

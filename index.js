#!/usr/bin/env node
const program = require('commander');
const request = require('request');
const fs = require('fs');
const { grant, redirect_uri, client_id, client_secret } = require('./.config/auth');
const { version } = require('./package');

program
  .version(version)
  .option('-f, --file <file>', 'auth_file is required', main)
  .parse(process.argv);

if (!process.file) {
  console.log('Devi fornire in input un file');
  process.exit(1);
}

async function main(file) {
  console.log(`fileName: ${file}`);
}

function sendRequest() {
  request.post(`https://accounts.zoho.com/oauth/v2/token?code=${grant}&redirect_uri=${redirect_uri}&client_id=${client_id}&client_secret=${client_secret}&grant_type=authorization_code`,
    (error, resp, body) => {
      console.log(error, resp, body);
    });
}


#!/usr/bin/env node
const program = require('commander');
const request = require('request');
const fs = require('fs');
const { version } = require('./package');
const template = require('./config/template');

program
  .version(version)
  .usage('[options]')
  .option('--id <id>', 'client_id. Specify client-id obtained from the connected app.')
  .option('--secret <secret>', 'client_secret. Specify client-secret obtained from the connected app.')
  .option('--redirect <redirect>',
    `redirect_uri. Default value is http://localhost:8000/callback. Specify the Callback URL that you registered during the app registration.`)
  .option('--code <grant_token>',
    `grant_token. If not present, will be generated. 'http://localhost:[port]/callback' is required in your app Callback URL to get this work.`)
  .option('-p, --port <port>', 'the port for the local server http://localhost:[port]/callback. Default is 8000.')
  .option('-f, --file <file>', 'file containing options parameters.')
  .option('-s, --server <server>',
    `Zoho location for API authentication on 'https://accounts.zoho.[server]'. Default is eu.`)
  .option('-o, --output <output>', 'output file name.')
  .parse(process.argv);

const options = validateOptions(program);

function validateOptions(program) {
  const { file } = program;
  const importFromFile = file || false;
  let validate = importFromFile ? validateJSON(validateFile(file)) : program;

  const required = ['id', 'secret', 'redirect'];

  // check if any of the required fields id undefiend
  const missing = required.filter(item => typeof validate[item] === 'undefined');

  if (!missing.length) return program;
  else error(`You must specify valid ${missing.join(', ')}`);
}

if (!program.file) error('You must provide a valid input file');

// Setto le proprietà di default
const { output, server } = program;
program.server = server || supportedServers(server);
program.output = output || makeOutputFileName();

console.log(`Zoho Server: ${program.server}`);
console.log(`Output file name: ${program.output}`);

// Esecuzione
main(program.file);

function makeOutputFileName() {
  const now = new Date();
  const twoDigits = data => `0${data}`.slice(-2);
  const date = `${now.getFullYear()}-${twoDigits(now.getMonth() + 1)}-${twoDigits(now.getDate())}`;
  const time = `${twoDigits(now.getHours())}-${twoDigits(now.getMinutes())}-${twoDigits(now.getSeconds())}`;
  return `out-${date}T${time}.json`;
}

function supportedServers(server) {
  switch (server) {
    case 'eu':
    case 'com':
      return server;
    default:
      console.log(`Server '${server}' is not valid, using: 'eu'`);
      return 'eu';
  }
}

function main(file) {
  const validation = validateFile(file);
  const config = validateJSON(validation, file);
  sendRequest(config);
}

function validateJSON(json, file) {
  Object.keys(template).forEach(key => {
    if (!(key in json))
      return error(`Missing ${key} key in '${file}'`);
  });

  return json;
}

function validateFile(file) {
  try {
    const stats = fs.lstatSync(file);
    if (!stats.isFile()) error(`'${file}' doesn't seem to be a file.`);

    const fileContent = fs.readFileSync(file);

    try {
      return JSON.parse(fileContent);
    } catch (e2) {
      console.log(`Error parsing ${file}`);
      error(e2.message);
    }
  } catch (e) {
    console.log(`Error reading ${file}.`);
    error(e.message);
  }
}

function error(error) {
  console.log(error);
  process.exit(1);
}

function sendRequest(options) {
  const { grant, redirect_uri, client_id, client_secret } = options;
  request.post(`https://accounts.zoho.${program.server}/oauth/v2/token?code=${grant}&redirect_uri=${redirect_uri}&client_id=${client_id}&client_secret=${client_secret}&grant_type=authorization_code`,
    (err, resp, body) => {
      if (err) error(`Error in Zoho response: ${err.message}`);
      fs.writeFileSync(program.output, body);
      console.log(body);
      console.log(`Result sucessfully exported in '${program.output}'.`);
      process.exit(0);
    });
}

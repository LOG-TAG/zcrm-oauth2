#!/usr/bin/env node
'use strict';

const program = require('commander');
const url = require('url');
const request = require('request');
const fs = require('fs');
const { version } = require('./package');
const { makeServer } = require('./server');

program
  .usage('[options]')
  .option('--id <id>',
    '* client-id obtained from the connected app.')
  .option('--secret <secret>',
    '* client-secret obtained from the connected app.')
  .option('--redirect <redirect>',
    '* Callback URL that you registered. To generate <grant_token> is required "localhost".')
  .option('--code <grant_token>',
    'If not present, will be generated. It requires to redirect to "localhost" to make it work.')
  .option('--scope <scopes...>',
    'List of scopes separated by ",". Default value is "ZohoCRM.modules.ALL".',
    scope => scope.split(',').trim().join(','))
  .option('-p, --port <port>',
    'The local server port to generate <grant_toke>. Default value is "8000".')
  .option('-f, --file <file>',
    'File containing options parameters.')
  .option('-s, --server <server>',
    'Zoho API authentication server. Default value is "eu".')
  .option('-o, --output <output>',
    'Output file name.')
  .on('--help', () => console.log(`
    * required fields.
    `))
  .version(version)
  .parse(process.argv);

let { id, secret, redirect, code, scope, port, server, output } = validateOptions(program);
code = code || false;
scope = scope || 'ZohoCRM.modules.ALL';
port = port || 8000;
server = server || 'eu';
output = output || makeOutputFileName();

if (code)
  sendRequest(code);
else
  makeServer(
    { id, server, scope, port },
    sendRequest
  );

function validateOptions(program) {
  const { file } = program;
  const importFromFile = file || false;
  let validate = importFromFile ? validateFile(file) : program;

  const required = ['id', 'secret', 'redirect'];

  // check if any of the required fields id undefiend
  const missing = required.filter(item => typeof validate[item] === 'undefined');

  if (missing.length)
    error(`You must specify valid ${missing.join(', ')}`);

  // check if user wants to generate code but is using another redirect then "localhost"
  const { code, redirect } = validate;
  if (!code && redirect && url.parse(redirect).hostname !== 'localhost')
    error(`You must use a "localhost" redirect if you want to generate the code "grant_token".`);

  return {
    ...program,
    ...validate
  };
}

function makeOutputFileName() {
  const now = new Date();
  const twoDigits = data => `0${data}`.slice(-2);
  const date = `${now.getFullYear()}-${twoDigits(now.getMonth() + 1)}-${twoDigits(now.getDate())}`;
  const time = `${twoDigits(now.getHours())}-${twoDigits(now.getMinutes())}-${twoDigits(now.getSeconds())}`;
  return `out-${date}T${time}.json`;
}

function validateFile(file) {
  try {
    const stats = fs.lstatSync(file);

    if (!stats.isFile())
      error(`'${file}' doesn't seem to be a file.`);

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

function sendRequest(code) {
  request.post(`https://accounts.zoho.${server}/oauth/v2/token?code=${code}&redirect_uri=${redirect}&client_id=${id}&client_secret=${secret}&grant_type=authorization_code`,
    (err, resp, body) => {
      if (err)
        error(`Error in Zoho response: ${err.message}`);

      writeOutputFile(body);
    });
}

function writeOutputFile(content) {
  content = JSON.stringify(JSON.parse(content), null, 4); // formatting JSON
  fs.writeFileSync(output, content);
  console.log(content);
  console.log(`Result sucessfully exported in '${output}'.`);
  process.exit(0);
}

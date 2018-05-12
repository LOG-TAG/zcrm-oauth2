#!/usr/bin/env node
const program = require('commander');
const request = require('request');
const fs = require('fs');
const { version } = require('./package');
const { makeServer } = require('./server');

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

let { id, secret, redirect, code, port, server, output } = validateOptions(program);
code = code || false;
port = port || 8000;
server = server || supportedServers(server);
output = output || makeOutputFileName();

main(
  { id, secret, redirect, code },
  port,
  server,
  output
);

function main(oauth, port, server, output) {
  const { code } = oauth;

  if (code) sendRequest(oauth);
  else makeServer(code => sendRequest({ ...oauth, code }));
}

function validateOptions(program) {
  const { file } = program;
  const importFromFile = file || false;
  let validate = importFromFile ? validateFile(file) : program;

  const required = ['id', 'secret', 'redirect'];
  const requiredValues = {};

  // check if any of the required fields id undefiend
  const missing = required.filter(item => {
    const programOption = validate[item];
    requiredValues[item] = programOption;
    return typeof programOption === 'undefined';
  });

  if (missing.length)
    error(`You must specify valid ${missing.join(', ')}`);


  return {
    ...program,
    ...requiredValues
  };
}

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

function sendRequest(oauth) {
  const { code, redirect, id, secret } = oauth;
  request.post(`https://accounts.zoho.${program.server}/oauth/v2/token?code=${code}&redirect_uri=${redirect}&client_id=${id}&client_secret=${secret}&grant_type=authorization_code`,
    (err, resp, body) => {
      if (err) error(`Error in Zoho response: ${err.message}`);
      fs.writeFileSync(program.output, body);
      console.log(body);
      console.log(`Result sucessfully exported in '${program.output}'.`);
      process.exit(0);
    });
}

#!/usr/bin/env node
'use strict';

const program = require('commander');
const url = require('url');
const request = require('request');
const fs = require('fs');
const chalk = require('chalk');
const packageJSON = require('./package');
const makeServer = require('./server');

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
  .option('-l, --location <location>',
    'Zoho API authentication location. Default value is "eu".')
  .option('-o, --output <output>',
    'Output file name.')
  .on('--help', () => console.log(`
    * required fields.
    
    You can find more about the usage on the official repository:
      https://github.com/crmpartners/zcrm-oauth2
      
    If you have any problems, do not hesitate to file an issue:
      https://github.com/crmpartners/zcrm-oauth2/issues
     `))
  .version(packageJSON.version)
  .parse(process.argv);

const options = validateOptions(program),
  id = options.id,
  secret = options.secret,
  redirect = options.redirect,
  code = options.code || false,
  scope = options.scope || 'ZohoCRM.modules.ALL',
  port = options.port || 8000,
  location = options.location || 'eu',
  output = options.output || generateOutputFileName();

if (code)
  getTokens(code);
else
  makeServer(
    { id, location, scope, port },
    getTokens
  );

function validateOptions(program) {
  const importFromFile = program.file || false;
  let validation = importFromFile ? validateFile(importFromFile) : program;

  const requiredOptions = ['id', 'secret', 'redirect'];

  // check if any of the required fields is undefiend
  const missing = requiredOptions.filter(item => typeof validation[item] === 'undefined');

  if (missing.length)
    error(
      `You must specify valid ${missing.join(', ')}.`,
      `Run ${chalk.cyan(`${packageJSON.name} --help`)} to see all options.`
    );

  // check if user wants to generate code but is using another redirect then "localhost"
  if (!validation.code && validation.redirect && url.parse(validation.redirect).hostname !== 'localhost')
    error(`You must use a "localhost" redirect if you want to generate the code "grant_token".`);

  return Object.assign({}, program, validation);
}

function generateOutputFileName() {
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
      error(`${chalk.bold.white(file)} doesn't seem to be a file.`);

    const fileContent = fs.readFileSync(file);

    try {
      return JSON.parse(fileContent);
    } catch (e2) {
      console.log(
        `${chalk.bgRed('Error parsing')} ${chalk.bold.white(file)}`
      );

      error(e2.message);
    }
  } catch (e) {
    console.log(
      `${chalk.bgRed('Error reading')} ${chalk.bold.white(file)}.`
    );

    error(e.message);
  }
}

function error(error, suggestion) {
  console.log(chalk.bgRed(error));

  if (typeof suggestion !== 'undefined') {
    console.log();
    console.log(suggestion);
  }

  process.exit(1);
}

function getTokens(code) {
  request.post(`https://accounts.zoho.${location}/oauth/v2/token?code=${code}&redirect_uri=${redirect}&client_id=${id}&client_secret=${secret}&grant_type=authorization_code`,
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
  console.log();
  console.log(chalk.cyan(`Result sucessfully exported in ${chalk.bold.white(output)}.`));
  process.exit(0);
}

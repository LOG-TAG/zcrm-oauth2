#!/usr/bin/env node
const program = require('commander');
const request = require('request');
const fs = require('fs');
const { version } = require('./package');
const template = require('./config/template');

program
  .version(version)
  .usage('[options] <file>')
  .option('-f, --file <file>', 'file contenente parametri da autenticare')
  .option('-s, --server <server>', 'eu || com, default: eu')
  .option('-o, --output <output>', 'nome file output')
  .parse(process.argv);

if (!program.file) error('Devi fornire in input un file');

// Setto le proprietà di default
const { output, server } = program;
program.server = server || supportedServers(server);
program.output = output || generaNomeFile();

console.log(`Server Zoho: ${program.server}`);
console.log(`output file name: ${program.output}`);

// Esecuzione
main(program.file);

function generaNomeFile() {
  const now = new Date();
  const twoDigits = data => `0${data}`.slice(-2);
  const date = `${now.getFullYear()}-${twoDigits(now.getMonth() + 1)}-${twoDigits(now.getDate())}`;
  const time = `${twoDigits(now.getHours())}-${twoDigits(now.getMinutes())}-${twoDigits(now.getSeconds())}`;
  return `out-${date}T${time}`;
}

function supportedServers(server) {
  switch (server) {
    case 'eu':
    case 'com':
      return server;
    default:
      console.log(`Server '${server}' invalido, utilizzo: 'eu'`);
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
      return error(`key ${key} mancante all'interno di '${file}'`);
  });

  return json;
}

function validateFile(file) {
  try {
    const stats = fs.lstatSync(file);
    if (!stats.isFile()) error(`'${file}' non sembra essere un file.`);

    const fileContent = fs.readFileSync(file);

    try {
      return JSON.parse(fileContent);
    } catch (e2) {
      console.log(`Errore durante il parsing del file ${file}`);
      error(e2.message);
    }
  } catch (e) {
    console.log(`Errore durante la lettura di ${file}.`);
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
      if (err) error(`Errore nell'ottenere una risposta da Zoho: ${err.message}`);
      fs.writeFileSync('out.json', body);
      console.log(body);
      console.log(`Risultato esportato con successo in 'out.json'.`);
      process.exit(0);
    });
}


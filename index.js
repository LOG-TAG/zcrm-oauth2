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

if (!program.file) error('Devi fornire in input un file');

function main(file) {
  const validation = validateFile(file);
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

function sendRequest() {
  request.post(`https://accounts.zoho.com/oauth/v2/token?code=${grant}&redirect_uri=${redirect_uri}&client_id=${client_id}&client_secret=${client_secret}&grant_type=authorization_code`,
    (error, resp, body) => {
      console.log(error, resp, body);
    });
}


#!/usr/bin/env node
const program = require('commander');
const request = require('request');
const fs = require('fs');
const { grant, redirect_uri, client_id, client_secret } = require('./.config/auth');




async function main() {
  request.post(`https://accounts.zoho.com/oauth/v2/token?code=${grant}&redirect_uri=${redirect_uri}&client_id=${client_id}&client_secret=${client_secret}&grant_type=authorization_code`,
    (error, resp, body) => {
      console.log(error, resp, body);
    });
}

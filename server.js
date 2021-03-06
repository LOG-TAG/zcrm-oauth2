'use strict';

const url = require('url');
const app = require('express')();
const opn = require('opn');
const chalk = require('chalk');
let instance;

module.exports = function makeServer(options, callback) {
  const port = url.parse(options.redirect).port || 80;

  // open the browser
  opn(`https://accounts.zoho.${options.location}/oauth/v2/auth?scope=${options.scope}&client_id=${options.id}&response_type=code&access_type=offline&redirect_uri=${options.redirect}`);

  app.get('/', (req, res) => {
    const code = req.query.code;
    res.send('You can close the browser now.');

    if (instance) instance.close(() => {
      console.log('Server closed');
    });

    callback(code);
  });

  instance = app.listen(port, () => {
    console.log(chalk.green(`Server running on port ${chalk.bold.white(port)}...`));
    console.log();
  });
};

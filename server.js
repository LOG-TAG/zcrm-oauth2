'use strict';

const app = require('express')();
const opn = require('opn');
let instance;

function makeServer(options, onCodeReceived) {
  const { id, location, scope, port } = options;

  // open the browser
  opn(`https://accounts.zoho.${location}/oauth/v2/auth?scope=${scope}&client_id=${id}&response_type=code&access_type=offline&redirect_uri=http://localhost:${port}/`);

  app.get('/', (req, res) => {
    const code = req.query.code;
    res.send('You can close the browser now.');

    if (instance) instance.close(() => {
      console.log('Server closed');
    });

    onCodeReceived(code);
  });

  instance = app.listen(port, () => console.log(`Server running on port ${port}...`));
}

module.exports = { makeServer };

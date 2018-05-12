const app = require('express')();
let server;

function makeServer(port, onCodeReceived) {
  app.get('/callback', (req, res) => {
    console.log(req);
    onCodeReceived(req.query.code);
    res.send('You can close the browser now.');

    if (server) server.close(() => {
      console.log('Server closed');
    });
  });

  server = app.listen(port, () => console.log(`Server running on port ${port}...`));
}

module.exports = { makeServer };

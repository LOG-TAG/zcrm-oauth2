const app = require('express')();

const port = process.env.PORT || 8000;
let server;

function makeServer(onCodeReceived) {
  app.get('/callback', (req, res) => {
    console.log(req);
    onCodeReceived(req.query.code);
    res.send('You can close the browser now.');

    if (server) server.close(() => {
      console.log('server closed');
    });
  });

  server = app.listen(port, () => console.log(`Server running on port ${port}...`));
}

module.exports = { makeServer };

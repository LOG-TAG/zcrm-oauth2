const app = require('express')();
const execSync = require('child_process').execSync;
let instance;

function makeServer(port, options, onCodeReceived) {
  const { id, server } = options;

  // open the browser
  execSync(`start https://accounts.zoho.${server}/oauth/v2/auth?scope=ZohoCRM.modules.ALL&client_id=${id}&response_type=code&access_type=offline&redirect_uri=http://localhost:${port}/callback`);

  app.get('/callback', (req, res) => {
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

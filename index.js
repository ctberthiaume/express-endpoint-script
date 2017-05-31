const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const child = require('child_process');
const path = require('path');
const fs = require('fs');

const port = process.env.PORT ? process.env.PORT : 8080;
let script = process.env.SCRIPT;
const endpointPath = process.env.ENDPOINT_PATH;

if (! (script && endpointPath)) {
  console.error('SCRIPT and ENDPOINT_PATH must be defined in the environment');
  process.exit(1);
}
script = path.resolve(script);
if (!fs.existsSync(script)) {
  console.error(`SCRIPT "${script}" does not exist`);
  process.exit(1);
}

app.use(bodyParser.text());

app.post(endpointPath, (req, res) => {
  console.log(req.body);
  child.execFile(
    script,
    [
      req.body
    ],
    (err, stdout, stderr) => {
      console.log('stdout: ' + stdout);
      console.log('stderr: ' + stderr);
      if (err) {
        console.log(err);
      }
    }
  );
  res.end(`received ${req.body}\r\n`);

});

app.listen(port, function () {
  console.log(`Listening on port ${port} for endpoint path ${endpointPath}`);
  console.log(`Script defined as ${script}`);
});

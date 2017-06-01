const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const request = require('request');
const child = require('child_process');
const path = require('path');
const fs = require('fs');
const MessageValidator = require('sns-validator');
const validator = new MessageValidator();

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
  let body;
  try {
    body = JSON.parse(req.body);
  } catch (e) { }
  if (body) {
    validator.validate(body, (err, message) => {
      if (err) {
        console.log('SNS message body validation failed');
        console.log(err.message);
      } else {
        console.log('SNS message body validation succeeded');
        console.log(`TopicArn:  ${body.TopicArn}`);
        const messageType = req.get('x-amz-sns-message-type');
        console.log(`messageType: ${messageType}`);
        if (messageType === 'SubscriptionConfirmation') {
          // visit body.SubscribeUrl;
          console.log(`confirming with HTTP GET request to  ${body.SubscribeURL}`);
          request(body.SubscribeURL, (error, response, body) => {
            if (error ) {
              console.log(`error while confirming: ${error}`);
            } else {
              if (response) {
                console.log(`confirmed with response ${response.statusCode}`);
              } else {
                console.log(`no response from subscription server`);
              }
            }
          });
        } else if (body.Type === 'Notification') {
          console.log(`Message: ${body.Message}`);
          child.execFile(
            script,
            [
              body.Message
            ],
            (err, stdout, stderr) => {
              console.log('stdout: ' + stdout);
              console.log('stderr: ' + stderr);
              if (err) {
                console.log(err);
              }
            }
          );
        }
      }
    });
    console.log('');
  }
  res.end();
});

app.listen(port, function () {
  console.log(`Listening on port ${port} for endpoint path ${endpointPath}`);
  console.log(`Script defined as ${script}`);
});

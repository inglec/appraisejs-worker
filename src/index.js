const bodyParser = require('body-parser');
const dockerode = require('dockerode');
const express = require('express');
const {
  FORBIDDEN,
  INTERNAL_SERVER_ERROR,
  OK,
} = require('http-status-codes');
const path = require('path');
const util = require('util');
const vm2 = require('vm2');

const { downloadArchive } = require('./utils/github_api');

const TEMP_DIR = '/tmp/appraisejs';
const ARCHIVE_DIR = path.join(TEMP_DIR, 'archive')

const decryptBody = body => new Promise((resolve, reject) => {
  // TODO
  resolve({ todo: 'body' });
});

const initialiseDockerContainer = () => {

};

const runJob = (tokenType, token, owner, repository, commitId) => {
  downloadArchive(tokenType, token, owner, repository, commitId, ARCHIVE_DIR)
    .then(() => {
      console.log('successfully downloaded repository archive');
      initialiseDockerContainer();
    })
    .catch((err) => console.error(err));
};

const setupExpress = () => {
  const app = express();

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));

  // GET routes.
  app.get('/', (req, res) => {
    res.send('Hello world');
  });

  // POST routes.
  app.post('/authenticate', (req, res) => {
    decryptBody(req.body)
      .then(() => {
        res.status(OK);
        res.end();
      })
      .catch((err) => {
        console.error(err.response.data)

        res.status(FORBIDDEN);
        res.send(err);
        res.end();
      });
  });
  app.post('/assign', (req, res) => {
    // TODO: Authenticate requests + validate request body.

    res.status(OK);
    res.end();
  });

  app.listen(process.env.PORT, () => {
    console.log(`Server listening on port ${process.env.PORT}...`);
  });
};

const test = (app) => {
  const commitId = '7ae42abafaf985108886bb0e5fe006e7c8e5bbf2';
  const owner = 'inglec';
  const repository = 'fyp-webhook-server';
  const token = 'v1.8667d82aaaacfb77caa1e790c0f683c2a4717207';
  const tokenType = 'bearer';

  runJob(tokenType, token, owner, repository, commitId);
};

function main() {
  setupExpress();

  test();
}

main();

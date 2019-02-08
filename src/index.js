const bodyParser = require('body-parser');
const dockerode = require('dockerode');
const express = require('express');
const fs = require('fs');
const {
  FORBIDDEN,
  OK,
} = require('http-status-codes');
const path = require('path');
const util = require('util');
const vm2 = require('vm2');

const {
  getFileAtCommit,
  getTreeAtCommit,
} = require('./utils/github_api');

const mkdir = util.promisify(fs.mkdir);
const writeFile = util.promisify(fs.writeFile);

const decryptBody = body => new Promise((resolve, reject) => {
  // TODO
  resolve({ todo: 'body' });
});

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
      .catch((error) => {
        res.status(FORBIDDEN);
        res.send(error);
        res.end();
      });
  });
  app.post('/assign', (req, res) => {
    // TODO: Authenticate requests + validate request body.

    const promise1 = fetchCommit(req.body.commitId);

    res.status(OK);
    res.end();
  });

  app.listen(process.env.PORT, () => {
    console.log(`Server listening on port ${process.env.PORT}...`);
  });
};

const test = () => {
  const tokenType = 'bearer';
  const token = 'v1.3ecb5c0c17a7af245317fc119dd90f570a8166fc';
  const user = 'inglec';
  const repository = 'fyp-webhook-server';
  const commitId = '7ae42abafaf985108886bb0e5fe006e7c8e5bbf2';

  getTreeAtCommit(tokenType, token, user, repository, commitId)
    .then((response) => {
      const { tree } = response.data;

      // Fetch each file with a separate async promise.
      const promises = tree
        .filter(node => node.type === 'blob')
        .map(node => (
          getFileAtCommit(tokenType, token, user, repository, commitId, node.path)
            .then((response) => {
              const dirname = path.join(__dirname, 'storage', user, repository, commitId);
              return mkdir(dirname, { recursive: true })
                .then(() => writeFile(path.join(dirname, node.path), response.data))
            })
        ));

      Promise
        .all(promises)
        .then(results => console.log(results))
        .catch(console.error);
    })
    .catch(console.error)
};

function main() {
  setupExpress();

  test();
}

main();

const bodyParser = require('body-parser');
const dockerode = require('dockerode');
const express = require('express');
const fs = require('fs');
const fsExtra = require('fs-extra');
const {
  FORBIDDEN,
  OK,
} = require('http-status-codes');
const path = require('path');
const util = require('util');
const vm2 = require('vm2');

const GitHubClient = require('./utils/GitHubClient');

const ensureDir = util.promisify(fsExtra.ensureDir);
const writeFile = util.promisify(fs.writeFile);

const TEMP_DIR = '/tmp/appraisejs';

let github;

const downloadCommit = (user, repository, commitId) => {
  return github
    .fetchTreeAtCommit(user, repository, commitId)
    .then((response) => {
      const { tree } = response.data;

      const downloadFile = filepath => (
        // Fetch file from GitHub then store locally.
        github
          .fetchFileAtCommit(user, repository, commitId, filepath)
          .then((response) => {
            const parsed = path.parse(filepath);
            const dirname = path.join(TEMP_DIR, user, repository, commitId, parsed.dir);

            // Create directory if it does not exist.
            return ensureDir(dirname)
              .then(() => writeFile(path.join(dirname, parsed.base), response.data));
          })
      );

      // Fetch each file with a separate async promise.
      const promises = tree
        .filter(node => node.type === 'blob')
        .map(node => downloadFile(node.path));

      return Promise.all(promises);
    })
};

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
  github = new GitHubClient('bearer', 'v1.b01ff5ed42e1d90172df46e59f5de91a5710fb3c');

  const user = 'inglec';
  const repository = 'fyp-webhook-server';
  const commitId = '7ae42abafaf985108886bb0e5fe006e7c8e5bbf2';

  downloadCommit(user, repository, commitId)
    .then(() => console.log('success!'))
    .catch(err => console.error(err.response.data));
};

function main() {
  setupExpress();

  test();
}

main();

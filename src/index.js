const bodyParser = require('body-parser');
const dockerode = require('dockerode');
const express = require('express');
const fs = require('fs');
const fsExtra = require('fs-extra');
const {
  FORBIDDEN,
  INTERNAL_SERVER_ERROR,
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

const downloadCommit = (user, repository, commitId, rootDir = TEMP_DIR) => github
  .fetchTreeAtCommit(user, repository, commitId)
  .then((response) => {
    // Fetch and store each file individually with a separate promise.
    const promises = response.data.tree
      .filter(node => node.type === 'blob')
      .map(node => github
        .fetchFileAtCommit(user, repository, commitId, node.path)
        .then((response) => {
          // Append relative directory to local path.
          const parsed = path.parse(node.path);
          const dir = path.join(rootDir, user, repository, commitId, parsed.dir);

          return ensureDir(dir).then(() => writeFile(path.join(dir, parsed.base), response.data));
        })
      );

    return Promise.all(promises);
  });

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
      .catch((err) => {
        console.error(err.response.data)

        res.status(FORBIDDEN);
        res.send(err);
        res.end();
      });
  });
  app.post('/assign', (req, res) => {
    // TODO: Authenticate requests + validate request body.

    const {
      user,
      repository,
      commitId,
    } = req.body;

    downloadCommit(user, repository, commitId)
      .then((values) => {
        res.status(OK);
        res.end();

        console.log(`Successfully fetched ${values.length} files`);
      })
      .catch((err) => {
        res.status(INTERNAL_SERVER_ERROR);
        res.end();

        console.error(err.response.data);
      });
  });

  app.listen(process.env.PORT, () => {
    console.log(`Server listening on port ${process.env.PORT}...`);
  });
};

const test = () => {
  github = new GitHubClient('bearer', 'v1.18cebe423f803d7bab13123569592fc5e6f84de8');

  const user = 'inglec';
  const repository = 'fyp-webhook-server';
  const commitId = '7ae42abafaf985108886bb0e5fe006e7c8e5bbf2';

  downloadCommit(user, repository, commitId)
    .then(values => console.log(`Successfully fetched ${values.length} files`))
    .catch(err => console.error(err.response.data));
};

function main() {
  setupExpress();

  test();
}

main();

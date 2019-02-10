const bodyParser = require('body-parser');
const Dockerode = require('dockerode');
const express = require('express');
const {
  FORBIDDEN,
  INTERNAL_SERVER_ERROR,
  OK,
} = require('http-status-codes');
const _ = require('lodash');
const { default: createLogger } = require('logging');
const path = require('path');
const createPromiseLogger = require('promise-logging');
const rimraf = require('rimraf');
const util = require('util');
const vm2 = require('vm2');

const { downloadArchive } = require(path.join(process.env.NODE_PATH, 'src/utils/github_api'));

const DOCKER_ARCHIVES = 'archives';
const DOCKER_PATH = path.join(process.env.NODE_PATH, 'docker');

const serverLogger = createLogger('Server');

const setupDockerContainer = (projectDir, imageName = 'worker-image') => {
  const dockerode = new Dockerode();
  const dockerLogger = createPromiseLogger('Docker');

  const awaitImageBuild = stream => new Promise((resolve, reject) => {
    const onComplete = (err, log) => {
      if (err) {
        reject(err);
        return;
      }

      // Search progress log to see if image was successfully built.
      for (update of log) {
        const match = /Successfully built (\w+)\n/.exec(update.stream);
        if (match) {
          resolve(match[1]);
          return;
        }
      }

      reject(log);
    };

    const progressLogger = createLogger('BuildImage');

    const onProgress = ({ stream }) => {
      const progress = typeof stream === 'string' ? stream.trim() : null;
      if (progress) {
        progressLogger.info(progress);
      }
    };

    dockerode.modem.followProgress(stream, onComplete, onProgress);
  });

  return dockerode
    .buildImage(
      {
        context: DOCKER_PATH,
        src: ['Dockerfile', DOCKER_ARCHIVES]
      },
      {
        buildargs: { PROJECT_DIR: projectDir },
        t: imageName,
      },
    )
    .then(dockerLogger.info('Building image'))
    .then(stream => awaitImageBuild(stream))
    .then(containerId => dockerLogger.info('Running image ', containerId)(containerId))
    .then(containerId => dockerode.run(imageName, null, process.stdout));
};

const runJob = (tokenType, token, owner, repository, commitId) => {
  // downloadArchive(tokenType, token, owner, repository, commitId, DOCKER_ARCHIVES_PATH)
  //   .then(() => {
  //     console.log('Successfully downloaded repository archive');
  //    setupDockerContainer();
  //   })
  //   .catch(err => console.error(err.statusMessage));

  const projectDir = path.join(DOCKER_ARCHIVES, owner, repository, commitId);

  setupDockerContainer(projectDir)
    //.then(result => console.log(result))
    .catch(console.error);
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

  app.listen(process.env.PORT, () => serverLogger.info('Listening on port ', process.env.PORT));
};

const clearArchives = () => new Promise((resolve, reject) => (
  rimraf(DOCKER_ARCHIVES_PATH, err => err ? reject(err) : resolve()))
);

const test = (app) => {
  const commitId = 'master'; // '7ae42abafaf985108886bb0e5fe006e7c8e5bbf2';
  const owner = 'inglec';
  const repository = 'fyp-test'; // 'fyp-webhook-server';
  const token = 'v1.a1b25dbd0a457aeaeb053a56a560f898ccc706e5';
  const tokenType = 'bearer';

  runJob(tokenType, token, owner, repository, commitId);
};

function main() {
  setupExpress();

  // clearArchives().then(test);

  test();
}

main();

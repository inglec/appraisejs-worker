const bodyParser = require('body-parser');
const Dockerode = require('dockerode');
const express = require('express');
const { OK } = require('http-status-codes');
const { default: createLogger } = require('logging');
const { join } = require('path');
const createPromiseLogger = require('promise-logging');
const rimraf = require('rimraf');

const { downloadArchive } = require('./utils/github_api');

const DOCKER_ARCHIVES = 'archives';
const DOCKER_PATH = join(process.env.NODE_PATH, 'docker');
const DOCKER_ARCHIVES_PATH = join(DOCKER_PATH, DOCKER_ARCHIVES);

const setupDockerContainer = (projectDir, imageName = 'worker-image') => {
  const dockerode = new Dockerode();
  const dockerLogger = createPromiseLogger('Docker');

  const awaitImageBuild = stream => (
    new Promise((resolve, reject) => {
      const onComplete = (err, log) => {
        if (err) {
          reject(err);
        } else {
          // Search progress log to see if image was successfully built
          for (let i = 0; i < log.length; i += 1) {
            const match = /Successfully built (\w+)\n/.exec(log[i].stream);
            if (match) {
              resolve(match[1]);
              return;
            }
          }

          reject(log);
        }
      };

      const progressLogger = createLogger('BuildImage');

      const onProgress = (update) => {
        const progress = typeof update.stream === 'string' ? update.stream.trim() : null;
        if (progress) {
          progressLogger.info(progress);
        }
      };

      dockerode.modem.followProgress(stream, onComplete, onProgress);
    })
  );

  return dockerode
    .buildImage(
      {
        context: DOCKER_PATH,
        src: ['Dockerfile', DOCKER_ARCHIVES],
      },
      {
        buildargs: { PROJECT_DIR: projectDir },
        t: imageName,
      },
    )
    .then(dockerLogger.infoAwait('Building image'))
    .then(awaitImageBuild)
    .then(containerId => dockerLogger.infoAwait('Running image', containerId)(containerId))
    .then(containerId => dockerode.run(containerId, null, process.stdout));
};

const runJob = (tokenType, token, owner, repository, commitId) => {
  // downloadArchive(tokenType, token, owner, repository, commitId, DOCKER_ARCHIVES_PATH)
  //   .then(() => {
  //     console.log('Successfully downloaded repository archive');
  //     setupDockerContainer();
  //   })
  //   .catch(err => console.error(err.statusMessage));

  const projectDir = join(DOCKER_ARCHIVES, owner, repository, commitId);

  setupDockerContainer(projectDir);
};

const clearArchives = () => new Promise((resolve, reject) => {
  rimraf(DOCKER_ARCHIVES_PATH, err => (err ? reject(err) : resolve()));
});

const setupExpress = () => {
  const app = express();

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));

  // GET routes
  app.get('/', (req, res) => {
    res.status(OK).send('Hello world');
  });

  // POST routes
  // app.post('/authenticate', (req, res) => {
  //   // TODO
  // });
  app.post('/allocate', (req, res) => {
    // TODO: Authenticate requests + validate request body

    res.status(OK).end();
  });

  return app;
};

// Delete any previously-archived repositories
clearArchives();

const app = setupExpress();

module.exports = app;

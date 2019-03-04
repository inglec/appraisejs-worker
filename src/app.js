const bodyParser = require('body-parser');
const express = require('express');
const { BAD_REQUEST } = require('http-status-codes');
const { default: createLogger } = require('logging');
const { join } = require('path');

const { runJob } = require('./docker');

const { urls: { runner: RUNNER_URL } } = require('../config.json');

const logger = createLogger('appraisejs');

/**
 * @param {string} dockerContext - The directory of the dockerfile
 * @param {string} dockerArchives - The directory within the docker context to download archives
 * @returns {object}
 */
const setupExpress = (dockerContext) => {
  const app = express();
  const appLogger = createLogger('appraisejs:app');

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use((req, res, next) => {
    appLogger.debug(req.method, req.originalUrl, req.body);
    next();
  });

  app.get('/', (req, res) => res.send('test'));

  app.post('/allocate', (req, res) => {
    /**
     * TODO: Authenticate requests
     */

    const {
      accessToken,
      commitId,
      owner,
      repository,
    } = req.body;

    if (!accessToken) {
      res.status(BAD_REQUEST).send('no access token provided');
    } else if (!commitId) {
      res.status(BAD_REQUEST).send('no commit ID provided');
    } else if (!owner) {
      res.status(BAD_REQUEST).send('no owner provided');
    } else if (!repository) {
      res.status(BAD_REQUEST).send('no repository provided');
    } else {
      /**
       * TODO: Only run job if not already running one.
       */

      const promise = runJob(
        {
          owner,
          name: repository,
          commitId,
          token: accessToken,
        },
        {
          context: dockerContext,
          runnerUrl: RUNNER_URL,
        },
      );

      promise.catch(logger.error);
    }
  });

  return app;
};

function main() {
  if (!process.env.NODE_PATH) {
    throw Error('environment variable NODE_PATH not set');
  }

  const dockerContext = join(process.env.NODE_PATH, 'docker');
  const app = setupExpress(dockerContext);

  module.exports = app;
}

main();

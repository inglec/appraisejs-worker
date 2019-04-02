const bodyParser = require('body-parser');
const { writeFileSync } = require('fs');
const express = require('express');
const { BAD_REQUEST, INTERNAL_SERVER_ERROR, SERVICE_UNAVAILABLE } = require('http-status-codes');
const { default: createLogger } = require('logging');
const { join } = require('path');

const { runJob } = require('./docker');
const Worker = require('./Worker');

const {
  urls: {
    runner: RUNNER_URL,
    supervisor: SUPERVISOR_URL,
  },
} = require('../config.json');

const { NODE_PATH, PORT, WORKER_ID } = process.env;
if (!NODE_PATH) {
  throw Error('environment variable NODE_PATH not set');
}
if (!PORT) {
  throw Error('environment variable PORT not set');
}
if (!WORKER_ID) {
  throw Error('environment variable WORKER_ID not set');
}

const logger = createLogger('appraisejs');
let worker;

/**
 * @param {string} dockerContext Directory of the dockerfile
 * @param {number} port Port this application is run on
 * @returns {object}
 */
const setupExpress = (dockerContext, port) => {
  const app = express();
  const appLogger = createLogger('appraisejs:app');

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use((req, res, next) => {
    appLogger.debug(req.method, req.originalUrl, req.body);
    next();
  });

  // Test endpoint to verify connection
  app.get('/', (req, res) => res.send('test'));

  // Get worker ID
  app.get('/identity', (req, res) => {
    if (worker) {
      res.send({ workerId: worker.id });
    } else {
      res.status(INTERNAL_SERVER_ERROR).send('worker not yet set up');
    }
  });

  // Receive new job from supervisor
  app.post('/allocate', (req, res) => {
    /**
     * TODO: Authenticate requests
     */

    const time = new Date().getTime();
    logger.info(`RECEIVE NEW JOB AT <<<${time}>>>`);

    const {
      accessToken,
      commitId,
      owner,
      repository: name,
    } = req.body;

    if (!commitId) {
      res.status(BAD_REQUEST).send('no commit ID provided');
    } else if (!owner) {
      res.status(BAD_REQUEST).send('no owner provided');
    } else if (!name) {
      res.status(BAD_REQUEST).send('no repository name provided');
    } else if (!worker.isFree()) {
      res.status(SERVICE_UNAVAILABLE).send('already processing job');
    } else {
      res.end();

      worker.beginBenchmark(owner, name, commitId);

      const repository = {
        owner,
        name,
        commitId,
        token: accessToken,
      };
      const dockerConfig = {
        context: dockerContext,
        runnerUrl: RUNNER_URL,
        hostPort: port,
      };
      runJob(repository, dockerConfig).catch(logger.error);
    }
  });

  // Receive benchmark results from local runner process
  app.post('/results', (req, res) => {
    const time = new Date().getTime();
    logger.info(`RECEIVE RESULTS AT <<<${time}>>>`);

    const { body: results, ip } = req;

    // Only accept requests from this host
    if (ip === '::ffff:127.0.0.1') {
      if (results) {
        res.end();

        const body = worker.endBenchmark(results);

        const filename = `${new Date().getTime()}.json`;
        logger.info('WRITE RESULTS', filename);
        writeFileSync(filename, JSON.stringify(body));
      } else {
        res.status(BAD_REQUEST).send('missing body field');
      }
    } else {
      res.status(BAD_REQUEST).send('invalid IP');
    }
  });

  return app;
};

function main() {
  const dockerContext = join(NODE_PATH, 'docker');
  const app = setupExpress(dockerContext, PORT);

  worker = new Worker(WORKER_ID);

  module.exports = app;
}

main();

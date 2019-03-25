const { default: createLogger } = require('logging');

const app = require('./app');

const { PORT, WORKER_ID } = process.env;
if (!PORT) {
  throw Error('environment variable PORT not set');
}
if (!WORKER_ID) {
  throw Error('environment variable WORKER_ID not set');
}

app.listen(PORT, (error) => {
  if (error) {
    throw error;
  }

  const logger = createLogger('Server');
  logger.info('Worker', WORKER_ID, 'listening on port', PORT);
});

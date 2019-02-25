const { default: createLogger } = require('logging');

const app = require('./app');

const logger = createLogger('Server');
app.listen(process.env.PORT, () => logger.info('Listening on port', process.env.PORT));

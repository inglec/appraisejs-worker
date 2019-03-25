const { join } = require('path');

const { runJob } = require('../src/docker');
const { urls: { runner: RUNNER_URL } } = require('../config.json');

describe('runJob', () => {
  // Set 2 minute timeout
  const timeout = 1000 * 60 * 2;

  test('runs sample project', () => {
    const repository = {
      owner: 'inglec',
      name: 'fyp-test',
    };

    const dockerConfig = {
      context: join(__dirname, '../docker'),
      runnerUrl: RUNNER_URL,
    };

    return expect(runJob(repository, dockerConfig))
      .resolves
      .toEqual(expect.objectContaining({ output: { Error: null, StatusCode: 0 } }));
  }, timeout);
});

const Dockerode = require('dockerode');
const { default: createLogger } = require('logging');
const createPromiseLogger = require('promise-logging');
const rimraf = require('rimraf');

/**
 * @param {string} path The directory of the archives to be deleted
 * @returns {Promise}
 */
const clearArchives = path => (
  new Promise((resolve, reject) => {
    rimraf(path, err => (err ? reject(err) : resolve()));
  })
);

/**
 * @param {string} dockerContext Directory of the dockerfile
 * @param {string} runnerUrl GitHub URL for the runner process
 * @param {string} projectUrl GitHub URL for the project to be benchmarked
 * @param {string} projectCommit Commit at which the project is to be benchmarked
 * @returns {Promise}
 */
const runInDockerContainer = (
  dockerContext,
  runnerUrl,
  projectUrl,
  projectCommit = 'master',
  hostPort,
) => {
  const dockerode = new Dockerode();
  const dockerLogger = createPromiseLogger('appraisejs:docker');

  // Wait until the image build process has completed.
  const awaitImageBuild = (stream) => {
    const getBuildStatus = (log) => {
      const regex = /Successfully built (\w+)\n/;

      for (let i = 0; i < log.length; i += 1) {
        const match = regex.exec(log[i].stream);
        if (match) {
          return match[1];
        }
      }

      return null;
    };

    return new Promise((resolve, reject) => {
      const onComplete = (err, log) => {
        if (err) {
          reject(err);
        } else {
          // Search progress log to see if image was successfully built
          const containerId = getBuildStatus(log);
          if (containerId) {
            resolve(containerId);
          } else {
            reject(Error(`no build status logged:\n${log}`));
          }
        }
      };

      const progressLogger = createLogger('appraisejs:docker:build');

      const onProgress = (update) => {
        const progress = typeof update.stream === 'string' ? update.stream.trim() : null;
        if (progress) {
          progressLogger.debug(progress);
        }
      };

      dockerode.modem.followProgress(stream, onComplete, onProgress);
    });
  };

  dockerLogger.debug('Building image');
  return (
    dockerode
      .buildImage(
        {
          context: dockerContext,
          src: ['Dockerfile'],
        },
        {
          t: 'worker-image',
          buildargs: {
            DEBUG: process.env.DEBUG,
            PROJECT_COMMIT: projectCommit,
            PROJECT_URL: projectUrl,
            RUNNER_URL: runnerUrl,
            HOST_PORT: hostPort,
          },
          // nocache: true,
          // forcerm: true,
        },
      )
      .then(dockerLogger.debugAwait('Building image'))
      .then(awaitImageBuild)
      .then(containerId => dockerLogger.debugAwait('Running image', containerId)(containerId))
      .then(containerId => (
        dockerode.run(containerId, null, process.stdout, { hostConfig: { NetworkMode: 'host' } })
      ))
      .then(dockerLogger.debugAwait('Complete'))
  );
};

/**
 * @param {object} repository
 * @param {string} repository.owner Owner of the repository being benchmarked
 * @param {string} repository.name Name of the repository being benchmarked
 * @param {string} repository.commitId Commit at which the repository is being benchmarked
 * @param {string} repository.token OAuth token used to fetch the project
 * @param {object} dockerConfig
 * @param {string} dockerConfig.context Directory of the dockerfile
 * @param {string} dockerConfig.runnerUrl GitHub URL for the runner process
 * @param {number} dockerConfig.hostPort Port of the worker process
 * @returns {Promise}
 */
const runJob = (repository, dockerConfig) => {
  const {
    owner,
    name,
    commitId,
    token,
  } = repository;

  const { context, runnerUrl, hostPort } = dockerConfig;

  let projectUrl = 'https://';
  if (token) {
    projectUrl += `${token}@`;
  }
  projectUrl += `github.com/${owner}/${name}.git`;

  return runInDockerContainer(context, runnerUrl, projectUrl, commitId, hostPort);
};

module.exports = { clearArchives, runJob };

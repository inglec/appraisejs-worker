const { default: createLogger } = require('logging');
const uuidv4 = require('uuid/v4');

class Worker {
  constructor(id) {
    this.id = id;
    this.activeBenchmark = null;
    this.logger = createLogger('appraisejs:worker');
  }

  isFree() {
    return !this.activeBenchmark;
  }

  beginBenchmark(owner, repository, commitId) {
    if (!this.isFree()) {
      throw Error('benchmark already in progress');
    }

    this.activeBenchmark = {
      commitId,
      owner,
      repository,
      startTime: new Date().getTime(),
      testId: uuidv4(),
    };

    this.logger.debug('new benchmark', this.activeBenchmark);
  }

  endBenchmark(results) {
    const endTime = new Date().getTime();

    const payload = {
      ...this.activeBenchmark,
      ...results,
      workerId: this.id,
      endTime,
    };

    // Free worker
    this.activeBenchmark = null;
    this.logger.debug('end benchmark', payload);

    return payload;
  }
}

module.exports = Worker;

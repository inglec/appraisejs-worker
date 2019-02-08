const find = require('find');
const fs = require('fs');
const _ = require('lodash');
const path = require('path');

// List all .benchmark.js files in project tree.
const getBenchmarks = (rootDir) => {
  return find
    .fileSync(/\.benchmark.js$/, rootDir)
    .reduce((acc, path) => {
      acc[path] = require(path);
      return acc;
    }, {});
};

const getModifiedBenchmarks = (benchmarks, commits) => {
  // TODO.
  return benchmarks;
}

const runBenchmark = (id, name, benchmark, runs = 1, timeout = 1000, maxAttempts = 1) => {
  console.log('Running', id, name);
  benchmark();
  console.log('Complete');
};

const runBenchmarks = (benchmarks) => {
  _.forEach(benchmarks, (benchmark) => {
    _.forEach(benchmark, (benchmarkDef, id) => {
      runBenchmark(
        id,
        benchmarkDef.name,
        benchmarkDef.benchmark,
        benchmarkDef.runs,
        benchmarkDef.timeout,
        benchmarkDef.max_attempts,
      )
    });
  });
};

const benchmarkProject = (rootDir) => {
  const benchmarks = getBenchmarks(rootDir);
  const filtered = getModifiedBenchmarks(benchmarks, commits);
  const results = runBenchmarks(filtered);
};

benchmarkProject(path.join(__dirname, '..', '..', 'fyp-test'));

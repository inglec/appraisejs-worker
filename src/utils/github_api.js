const download = require('download');
const { rename } = require('fs');
const { join, sep: pathSeparator } = require('path');
const { promisify } = require('util');

const renameAsync = promisify(rename);

const downloadArchive = (tokenType, token, owner, repository, commitId, rootDir) => {
  const url = `https://api.github.com/repos/${owner}/${repository}/tarball/${commitId}`;
  const dir = join(rootDir, owner, repository);
  const promise = download(url, dir, {
    extract: true,
    headers: { Authorization: `${tokenType} ${token}` },
  });

  return promise.then((data) => {
    if (data.length === 0) {
      throw Error('no files fetched');
    }

    // Rename archive to its commit hash.
    const archiveName = data[0].path.split(pathSeparator)[0];
    const oldPath = join(dir, archiveName);
    const newPath = join(dir, commitId);

    return renameAsync(oldPath, newPath);
  });
};

module.exports = { downloadArchive };

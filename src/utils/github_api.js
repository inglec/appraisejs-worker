const download = require('download');
const fs = require('fs');
const path = require('path');
const util = require('util');

const rename = util.promisify(fs.rename);

const downloadArchive = (tokenType, token, owner, repository, commitId, rootDir) => {
  const url = `https://api.github.com/repos/${owner}/${repository}/tarball/${commitId}`;
  const dir = path.join(rootDir, owner, repository);
  const promise = download(url, dir, {
    extract: true,
    headers: { 'Authorization': `${tokenType} ${token}` },
  });

  return promise
    .then((data) => {
      // Rename archive to its commit hash.
      const archiveName = data[0].path.split(path.sep)[0];
      const oldPath = path.join(dir, archiveName);
      const newPath = path.join(dir, commitId);

      return rename(oldPath, newPath);
    });
}

module.exports = { downloadArchive };

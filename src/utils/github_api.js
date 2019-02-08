const download = require('download');
const path = require('path');

const downloadArchive = (tokenType, token, owner, repository, commitId, dir) => {
  const url = `https://api.github.com/repos/${owner}/${repository}/tarball/${commitId}`;
  return download(url, dir, {
    extract: true,
    headers: { 'Authorization': `${tokenType} ${token}` },
  });
}

module.exports = { downloadArchive };

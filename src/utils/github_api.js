const axios = require('axios');

const { appendUrlParams } = require('./requests');

const GITHUB_API_URL = 'https://api.github.com';
const GITHUB_CONTENTS_URL = 'https://raw.githubusercontent.com';

const getTreeAtCommit = (tokenType, token, owner, repository, sha) => axios.request({
  method: 'GET',
  baseURL: GITHUB_API_URL,
  url: appendUrlParams(`/repos/${owner}/${repository}/git/trees/${sha}`, { recursive: 1 }),
  headers: { 'Authorization': `${tokenType} ${token}` },
});

const getFileAtCommit = (tokenType, token, owner, repository, sha, path) => axios.request({
  method: 'GET',
  baseURL: GITHUB_CONTENTS_URL,
  url: `/${owner}/${repository}/${sha}/${path}`,
  headers: { 'Authorization': `${tokenType} ${token}` },
});

module.exports = {
  getFileAtCommit,
  getTreeAtCommit,
};

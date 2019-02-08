const axios = require('axios');

const { appendUrlParams } = require('./requests');

const GITHUB_API_URL = 'https://api.github.com';
const GITHUB_CONTENTS_URL = 'https://raw.githubusercontent.com';

const createAuthorizationHeader = (tokenType, token) => (
  { 'Authorization': `${tokenType} ${token}` }
);

// Prevent Axios from running JSON.parse on response.data.
const getRawResponse = response => response;

const fetchFileAtCommit = (tokenType, token, owner, repository, sha, path) => axios.request({
  method: 'GET',
  baseURL: GITHUB_CONTENTS_URL,
  url: `/${owner}/${repository}/${sha}/${path}`,
  headers: createAuthorizationHeader(tokenType, token),
  transformResponse: getRawResponse,
});

const fetchTreeAtCommit = (tokenType, token, owner, repository, sha) => axios.request({
  method: 'GET',
  baseURL: GITHUB_API_URL,
  url: appendUrlParams(`/repos/${owner}/${repository}/git/trees/${sha}`, { recursive: 1 }),
  headers: createAuthorizationHeader(tokenType, token),
});

class GitHubClient {
  constructor(tokenType, token) {
    this.authentication = {
      tokenType,
      token,
    };
  }

  fetchFileAtCommit(owner, repository, sha, path) {
    return fetchFileAtCommit(
      this.authentication.tokenType,
      this.authentication.token,
      owner,
      repository,
      sha,
      path,
    );
  }

  fetchTreeAtCommit(owner, repository, sha) {
    return fetchTreeAtCommit(
      this.authentication.tokenType,
      this.authentication.token,
      owner,
      repository,
      sha,
    );
  }
}

module.exports = GitHubClient;

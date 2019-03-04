/* eslint-disable promise/always-return */

const { OK } = require('http-status-codes');
const supertest = require('supertest');

const app = require('../src/app');

describe('/', () => {
  test('returns 200 response', () => (
    supertest(app)
      .get('/')
      .then((response) => {
        expect(response.statusCode).toBe(OK);
        expect(response.text).toBe('test');
      })
  ));
});

describe('/allocate', () => {
  test('returns 200 response', () => {
    // Check that environment variable has been set.
    expect(process.env.ACCESS_TOKEN).toMatch(/^v1\.[a-z|0-9]+$/);

    return (
      supertest(app)
        .post('/allocate')
        .send({
          accessToken: process.env.ACCESS_TOKEN,
          commitId: 'master',
          owner: 'inglec',
          repository: 'fyp-test',
        })
        .then(response => expect(response.statusCode).toBe(OK))
    );
  });
});

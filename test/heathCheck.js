let expect = require('chai').expect;
const supertest = require('supertest');

describe('GET /health', function () {
  it('health should be OK', function (done) {
    request = supertest.agent(this.server);
    request
      .get('/health')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((response) => {
        expect(response.body.health).to.equal('OK');
        done();
      })
      .catch((err) => done(err));
  });

  it('health should be OK - response type text/html', function (done) {
    request = supertest.agent(this.server);
    request
      .get('/health')
      .set('Accept', 'text/html')
      .expect('Content-Type', /text\/html/)
      .expect(200)
      .then((response) => {
        expect(response.text).to.match(/Health: OK/i);
        done();
      })
      .catch((err) => done(err));
  });
});

let expect = require('chai').expect;
const supertest = require('supertest');

const User = require('../models/user');
const Recipe = require('../models/recipe');

describe('User Authentication', function () {
  let user = {
      fullName: 'User User',
      email: 'user@user.com',
      password: 'user@12345',
      confirmPassword: 'user@12345',
    },
    anotherUser = {
      fullName: 'Joe Vat',
      email: 'joe@vat.com',
      password: 'joeVat@1234',
      confirmPassword: 'joeVat@1234',
    },
    jwt,
    userId;

  before(async function () {
    request = supertest.agent(this.server);
    await User.deleteMany({});
    await Recipe.deleteMany({});
    let savedUser = await User.create(user);
    userId = savedUser._id.valueOf();
  });

  after(async function () {
    await User.deleteMany({});
    await Recipe.deleteMany({});
  });

  describe('POST /api/auth/signup', function () {
    it('signup should be 200 OK and return jwt, userid with success message', async function () {
      let response = await request
        .post('/api/auth/signup')
        .send(anotherUser)
        .set('Accept', 'application/json');

      expect(response.headers['content-type']).to.match(/json/i);
      expect(response.status).to.equal(200);
      expect(response.body).to.haveOwnProperty(
        'status',
        'Successfully signed up'
      );
      expect(response.body).to.haveOwnProperty('jwt');
      expect(response.body)
        .to.haveOwnProperty('expiresAt')
        .to.be.above(Date.now());

      let userIdFromDb = await User.findOne({ email: anotherUser.email });

      expect(response.body).to.haveOwnProperty(
        'userId',
        userIdFromDb._id.valueOf()
      );
    });

    it('signup should fail for incorrect email format', function (done) {
      request
        .post('/api/auth/signup')
        .send({ ...anotherUser, email: 'someOtherUser@.com' })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(400)
        .then(function (res) {
          expect(res.body).to.haveOwnProperty('error');
          expect(res.body.error).to.match(/email/i);
          done();
        })
        .catch((e) => done(e));
    });
    it('signup should fail for already used email', function (done) {
      request
        .post('/api/auth/signup')
        .send({ user })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(400)
        .then(function (res) {
          expect(res.body).to.haveOwnProperty('error');
          expect(res.body.error).to.match(/email/i);
          done();
        })
        .catch((e) => done(e));
    });
    it('signup should fail for absence of fullName', function (done) {
      request
        .post('/api/auth/signup')
        .send({ ...anotherUser, fullName: '' })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        // .expect(400)
        .then(function (res) {
          expect(res.body).to.haveOwnProperty('error');
          expect(res.body.error).to.match(/firstName|lastName/i);
          done();
        })
        .catch((e) => done(e));
    });
    it('signup should fail if password and confirm password does not match', function (done) {
      request
        .post('/api/auth/signup')
        .send({ ...anotherUser, confirmPassword: 'ninja@345' })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(400)
        .then(function (res) {
          expect(res.body).to.haveOwnProperty('error');
          expect(res.body.error).to.match(/confirmPassword/i);
          done();
        })
        .catch((e) => done(e));
    });
  });

  describe('POST /api/auth/signin', function () {
    it('signin should be 200 OK, and return jwt, userid with success message', function (done) {
      request
        .post('/api/auth/signin')
        .send({ email: anotherUser.email, password: anotherUser.password })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .then((res) => {
          expect(res.body).to.haveOwnProperty(
            'status',
            'Successfully signed in'
          );
          expect(res.body).to.haveOwnProperty('jwt');
          jwt = res.body.jwt;
          expect(res.body)
            .to.haveOwnProperty('expiresAt')
            .to.be.above(Date.now());
          User.findOne(
            { email: anotherUser.email },
            function (err, userDetails) {
              if (err) {
                done(err);
              } else {
                expect(res.body).to.haveOwnProperty(
                  'userId',
                  userDetails._id.valueOf()
                );
                done();
              }
            }
          );
        })
        .catch((err) => done(err));
    });
    it('signin should fail for incorrect email format', function (done) {
      request
        .post('/api/auth/signin')
        .send({ email: 'ninja@.com', password: user.password })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(400)
        .then(function (res) {
          expect(res.body).to.haveOwnProperty('error');
          expect(res.body.error).to.match(/email/i);
          done();
        })
        .catch((e) => done(e));
    });
    it('signin should fail for password length < 8', function (done) {
      request
        .post('/api/auth/signin')
        .send({ email: user.email, password: '123' })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(400)
        .then(function (res) {
          expect(res.body).to.haveOwnProperty('error');
          expect(res.body.error).to.match(/password/i);
          done();
        })
        .catch((e) => done(e));
    });
    it('signin should fail for incorrect password', function (done) {
      request
        .post('/api/auth/signin')
        .send({ email: anotherUser.email, password: 'somePassword@1234' })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(404)
        .then(function (res) {
          expect(res.body).to.haveOwnProperty('error');
          expect(res.body.error).to.match(/password/i);
          done();
        })
        .catch((e) => done(e));
    });
  });

  describe.skip('GET /api/recipe/all', function () {
    it('fetch empty recipe', function (done) {
      request
        .get('/api/recipe/all')
        .set('Authorization', `Bearer ${jwt}`)
        .set('auth', userId)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(404)
        .then(function (res) {
          expect(res.body).to.haveOwnProperty('error');
          expect(res.body.error).to.match(/recipe/i);
          done();
        })
        .catch((e) => done(e));
    });
  });
});

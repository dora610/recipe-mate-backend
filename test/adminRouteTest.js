let expect = require('chai').expect;
const supertest = require('supertest');

const User = require('../models/user');

describe('Admin role tests - /api/admin/user', function () {
  let adminUser = {
      firstName: 'Kaalin',
      lastName: 'Bhaiya',
      email: 'admin@admin.com',
      password: 'admin@1234',
    },
    normalUser = {
      firstName: 'Neeraj',
      lastName: 'Ninja',
      email: 'ninja@ninja.com',
      password: 'ninja@1234',
      confirmPassword: 'ninja@1234',
    },
    anotherNormalUser = {
      firstName: 'Box',
      lastName: 'FOx',
      email: 'neo@ninja.com',
      password: 'neo@1234',
      confirmPassword: 'neo@1234',
    },
    jwt,
    adminUserId,
    normalUserId,
    anotherNormalUserId,
    request;

  before(async function () {
    request = supertest.agent(this.server);
    await User.deleteMany({});
    let [admin, user1, user2] = await Promise.all([
      User.create({ ...adminUser, role: 1 }),
      User.create(normalUser),
      User.create(anotherNormalUser),
    ]);
    adminUserId = admin._id.valueOf();
    normalUserId = user1._id.valueOf();
    anotherNormalUserId = user2._id.valueOf();
  });
  after(async function () {
    await User.deleteMany({});
  });

  describe('POST /api/auth/signin for admin', function () {
    it('signin should be 200 OK, and return jwt, userid with success message', function (done) {
      request
        .post('/api/auth/signin')
        .send({ email: adminUser.email, password: adminUser.password })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .then((res) => {
          expect(res.body).to.haveOwnProperty(
            'status',
            'Successfully signed in'
          );
          expect(res.body).to.haveOwnProperty('jwt');
          expect(res.body)
            .to.haveOwnProperty('userId', adminUserId)
            .that.is.a('string');
          expect(res.body)
            .to.haveOwnProperty('expiresAt')
            .to.be.above(Date.now());
          jwt = res.body.jwt;
          done();
        })
        .catch((err) => done(err));
    });
    it('signin should fail for incorrect email format', function (done) {
      request
        .post('/api/auth/signin')
        .send({ email: 'ninja@.com', password: adminUser.password })
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
    it('signin should fail for incorrect email of correct format', function (done) {
      request
        .post('/api/auth/signin')
        .send({ email: 'binod@binod.com', password: adminUser.password })
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(404)
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
        .send({ email: adminUser.email, password: '123' })
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
        .send({ email: adminUser.email, password: 'random@1234' })
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
  describe('GET /api/admin/user/:userId', function () {
    it('should be 200 OK and return userdetails', function (done) {
      request
        .get(`/api/admin/user/${normalUserId}`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${jwt}`)
        .set('auth', adminUserId)
        .expect('Content-Type', /json/)
        .expect(200)
        .then(function (res) {
          expect(res.body).to.haveOwnProperty('status', 'Success');
          expect(res.body).to.haveOwnProperty('user');
          expect(res.body.user).to.be.an('object');
          expect(res.body.user).to.haveOwnProperty('_id', normalUserId);
          expect(res.body.user).to.haveOwnProperty('email', 'ninja@ninja.com');
          expect(res.body.user).to.haveOwnProperty('role', 0);
          done();
        })
        .catch((e) => done(e));
    });
    it('should be 404 if invalid user id', function (done) {
      request
        .get('/api/admin/user/zzz' + normalUserId.slice(3, -3) + 'bbb')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${jwt}`)
        .set('auth', adminUserId)
        .expect('Content-Type', /json/)
        .then(function (res) {
          expect(res.body).to.haveOwnProperty('error');
          expect(res.body.error).to.match(/user/i);
          done();
        })
        .catch((e) => done(e));
    });
  });
  describe('PUT /api/admin/user/:userId', function () {
    it('should be 200 OK and return userdetails', function (done) {
      request
        .put(`/api/admin/user/${normalUserId}`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${jwt}`)
        .set('auth', adminUserId)
        .send({ firstName: 'Binod', lastName: 'Joe', email: 'binod@binod.com' })
        .expect('Content-Type', /json/)
        .expect(200)
        .then(function (res) {
          expect(res.body).to.haveOwnProperty('status', 'Successfully updated');
          expect(res.body).to.haveOwnProperty('user');
          expect(res.body.user).to.be.an('object');
          expect(res.body.user).to.haveOwnProperty('_id', normalUserId);
          expect(res.body.user).to.haveOwnProperty('email', 'binod@binod.com');
          expect(res.body.user).to.haveOwnProperty('firstName', 'Binod');
          expect(res.body.user).to.haveOwnProperty('lastName', 'Joe');
          expect(res.body.user).to.haveOwnProperty('role', 0);
          done();
        })
        .catch((e) => done(e));
    });
    it('for existing email throw error', function (done) {
      request
        .put(`/api/admin/user/${normalUserId}`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${jwt}`)
        .set('auth', adminUserId)
        .send({ firstName: 'Another', lastName: 'Joe', email: 'neo@ninja.com' })
        .expect('Content-Type', /json/)
        .expect(400)
        .then(function (res) {
          expect(res.body).to.haveOwnProperty('error');
          expect(res.body.error).to.match(/taken/i);
          done();
        })
        .catch((e) => done(e));
    });
  });
  describe('DELETE /api/admin/user/:userId', function () {
    it('should be 404 if invalid user id', function (done) {
      request
        .delete('/api/admin/user/zzz' + normalUserId.slice(3, -3) + 'bbb')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${jwt}`)
        .set('auth', adminUserId)
        .expect('Content-Type', /json/)
        .then(function (res) {
          expect(res.body).to.haveOwnProperty('error');
          expect(res.body.error).to.match(/user/i);
          done();
        })
        .catch((e) => done(e));
    });
    it('should be 200 OK and return delete count', function (done) {
      request
        .delete(`/api/admin/user/${normalUserId}`)
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${jwt}`)
        .set('auth', adminUserId)
        .expect('Content-Type', /json/)
        .expect(200)
        .then(function (res) {
          expect(res.body).to.haveOwnProperty(
            'status',
            `Successfully deleted 1 user`
          );
          done();
        })
        .catch((e) => done(e));
    });
  });
  describe('GET /api/admin/user/all', function () {
    it('should be 200 OK and return list of users', async function () {
      const userCount = await User.count({ role: 0 });
      const response = await request
        .get('/api/admin/user/all')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${jwt}`)
        .set('auth', adminUserId);
      expect(response.headers['content-type']).to.match(/json/i);
      expect(response.status).to.equal(200);
      expect(response.body)
        .to.haveOwnProperty('users')
        .that.is.a('array')
        .that.have.lengthOf(userCount);
      expect(response.body).to.haveOwnProperty('count', userCount);
      // expect(res.body.users).to.be.an('array');
    });
    it('should give error for reaching beyond max page limit', function (done) {
      request
        .get('/api/admin/user/all?page=99')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${jwt}`)
        .set('auth', adminUserId)
        .expect('Content-Type', /json/)
        .expect(400)
        .then((res) => {
          expect(res.body).to.haveOwnProperty(
            'error',
            'Reached max page limit'
          );
          done();
        })
        .catch((err) => done(err));
    });
    it('should return No user available after clearing all users', async function () {
      await User.deleteMany({ role: 0 });
      let response = await request
        .get('/api/admin/user/all')
        .set('Accept', 'application/json')
        .set('Authorization', `Bearer ${jwt}`)
        .set('auth', adminUserId);
      expect(response.headers['content-type']).to.match(/json/i);
      expect(response.status).to.equal(404);
      expect(response.body).to.haveOwnProperty('error', 'No user available');
    });
  });
});

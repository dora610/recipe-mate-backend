const app = require('../app');

exports.mochaHooks = {
  beforeAll(done) {
    this.server = app.listen(process.env.TEST_PORT, () => {
      console.log(
        `server running at- http://localhost:${process.env.TEST_PORT}`
      );
      done();
    });
  },
  afterAll: async function () {
    await this.server.close();
    console.log('server stopped!');
  },
};

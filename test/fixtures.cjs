const mongoose = require('mongoose');

exports.mochaGlobalSetup = function () {
  return mongoose
    .connect(process.env.DATABASE_TEST)
    .then(() => console.log('connected to mongoDb'))
    .catch((err) => console.error(err));
};

exports.mochaGlobalTeardown = async function () {
  mongoose.deleteModel(/.+/);
  await mongoose.disconnect();
  console.log('mongoDb disconnected');
};

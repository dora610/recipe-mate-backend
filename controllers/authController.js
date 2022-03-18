const User = require('../models/user');
const expressJwt = require('express-jwt');
const CustomError = require('../utils/customError');
const { sendMail } = require('../utils/mail');
const { catchErrorsForParams, catchErrors } = require('../utils/errorHandler');
const debug = require('debug')('recipe-mate:auth-controller');

exports.getUserById = catchErrorsForParams(async (req, res, next, id) => {
  const user = await User.findById(id);
  if (!user) {
    throw new CustomError('Invalid user', 404);
  }
  req.user = user;
  next();
});

exports.signIn = catchErrors(async (req, res) => {
  const { email, password } = req.body;

  const isCorrectUser = await User.findOne({ email });
  if (!isCorrectUser) {
    throw new CustomError('Email not found', 404);
  }
  const isCorrectPassword = isCorrectUser.validatePassword(password);
  if (!isCorrectPassword) {
    throw new CustomError('Incorrect password', 404);
  }
  const jwtToken = isCorrectUser.getJwtToken();

  res
    .status(200)
    .cookie('jwt', jwtToken, {
      maxAge: process.env.MAXAGESEC * 1000,
      httpOnly: true,
    })
    .json({
      status: 'Successfully signed in',
      userId: isCorrectUser._id,
      jwt: jwtToken,
      r: isCorrectUser.role,
      fullName: isCorrectUser.fullName,
      expiresAt: Date.now() + process.env.MAXAGESEC * 1000,
    });
});

exports.signUp = catchErrors(async (req, res) => {
  const user = await User.create(req.body);
  const jwtToken = user.getJwtToken();

  res
    .status(200)
    .cookie('jwt', jwtToken, {
      maxAge: process.env.MAXAGESEC * 1000,
      httpOnly: true,
    })
    .json({
      status: 'Successfully signed up',
      userId: user._id,
      jwt: jwtToken,
      r: user.role,
      fullName: user.fullName,
      expiresAt: Date.now() + process.env.MAXAGESEC * 1000,
    });
});

exports.signOut = catchErrors(async (req, res) => {
  res
    .status(200)
    .clearCookie('jwt')
    .json({ status: 'Successfully signed out' });
});

exports.isAuthenticated = expressJwt({
  secret: process.env.ACCESS_TOKEN_SECRET,
  algorithms: ['HS256'],
  requestProperty: 'auth',
});

exports.isAuthorised = catchErrors(async (req, res, next) => {
  let userId = req.get('auth');
  if (!userId) {
    throw new CustomError('Invalid request!!', 400);
  }
  let signedInUser = await User.findById(userId);
  if (!signedInUser) {
    throw new CustomError('Invalid user', 404);
  }
  let isAuth = req.auth && signedInUser._id.equals(req.auth.id);
  if (!isAuth) {
    throw new CustomError('Access Denied!!😈', 403);
  }
  req.user = signedInUser;
  next();
});

exports.isAdmin = (req, res, next) => {
  if (req.user && req.user.role > 0) {
    return next();
  }
  throw new CustomError('Admin access required!!🚫', 403);
};

exports.forgotPassword = catchErrors(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    throw new CustomError('Invalid email id', 404);
  }

  const resetToken = user.getForgotPasswordToken();
  const resetUrl = `${process.env.RESET_PSS_BASE_URL}/resetpassword/${resetToken}`;

  const sendMailPromise = sendMail(user.email, 'Forgot password', resetUrl);
  const persistUserPromise = user.save();

  const [sendMailInfo, userPersisted] = await Promise.all([
    sendMailPromise,
    persistUserPromise,
  ]);
  console.log(sendMailInfo);

  res.json({
    status: `Password reset link is sent to your registered email id`,
  });
});

exports.resetPassword = catchErrors(async (req, res) => {
  const resetToken = req.params.resetToken;

  const user = await User.findOne({
    email: req.body.email,
    resetPasswordExpires: { $gt: Date() },
  });

  if (!user) {
    throw new CustomError('Invalid request', 404);
  }

  const isValidResetToken = user.verifyForgotPasswordToken(resetToken);
  if (!isValidResetToken) {
    throw new CustomError('Expired link', 400);
  }

  (user.resetPasswodToken = undefined), (user.resetPasswordExpires = undefined);
  user.password = req.body.password;

  await user.save();

  res.json({ status: 'Password reset is done successfully' });
});

exports.updatePassword = catchErrors(async (req, res) => {
  const user = await User.findById(req.auth.id);
  if (!user) {
    throw new CustomError('Invalid user', 404);
  }

  const isValidOldPassword = user.validatePassword(req.body.oldPassword);
  if (!isValidOldPassword) {
    throw new CustomError('Incorrect password', 404);
  }

  user.password = req.body.newPassword;
  await user.save();

  res.json({ status: 'Password successfully changed' });
});

exports.getUserDetails = catchErrors(async (req, res) => {
  const user = await User.findById(req.user.id)
    .populate({ path: 'recipes', select: 'rating' })
    .select({ firstName: 1, middleName: 1, lastName: 1, email: 1 });

  if (!user) {
    throw new CustomError('user not found', 404);
  }

  let recipeList = user.recipes;
  let recipeCount = recipeList.length;
  let totalRating = recipeList.reduce(
    (prev, current) => prev + current.rating,
    0
  );
  let avgRating = Math.round((totalRating / recipeCount) * 100) / 100;
  res.json({
    firstName: user.firstName,
    middleName: user.middleName,
    lastName: user.lastName,
    email: user.email,
    avgRating,
    recipeCount,
  });
});

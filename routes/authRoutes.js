const {
  signIn,
  signUp,
  signOut,
  forgotPassword,
  resetPassword,
  isAuthenticated,
  isAuthorised,
  updatePassword,
  getUserDetails,
} = require('../controllers/authController');
const { catchErrors, catchErrorsForParams } = require('../utils/errorHandler');
const {
  reqValidator,
  validateConcurrent,
} = require('../middlewares/reqValidator');
const { getUserById } = require('../controllers/authController');
const {
  signInValidation,
  signUpValidation,
  updatePasswordvalidation,
  resetPasswordvalidation,
} = require('../validations/authValidators');

const router = require('express').Router();

router.post(
  '/signin',
  validateConcurrent(signInValidation),
  reqValidator,
  catchErrors(signIn)
);

router.post(
  '/signup',
  validateConcurrent(signUpValidation),
  reqValidator,
  catchErrors(signUp)
);

router.get('/signout', catchErrors(signOut));
router.get('/', isAuthenticated, isAuthorised, getUserDetails);

router.put('/forgotpassword', catchErrors(forgotPassword));

router.post(
  '/reset/:resetToken',
  validateConcurrent(resetPasswordvalidation),
  reqValidator,
  catchErrors(resetPassword)
);

router.post(
  '/updatepassword',
  isAuthenticated,
  isAuthorised,
  validateConcurrent(updatePasswordvalidation),
  reqValidator,
  catchErrors(updatePassword)
);

module.exports = router;

const { body, param } = require('express-validator');

exports.signInValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password')
    .notEmpty()
    .isString()
    .trim()
    .isLength({ min: 8 })
    .withMessage('Minimun length of password should be 8'),
];

exports.signUpValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password')
    .notEmpty()
    .isString()
    .trim()
    .isLength({ min: 8 })
    .withMessage('Minimun length of password should be 8'),
  body('confirmPassword')
    .notEmpty()
    .isString()
    .trim()
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Confirm password does not match');
      }
      return true;
    }),
];

exports.resetPasswordvalidation = [
  param('resetToken').notEmpty().isString().trim(),
  body('email').isEmail().normalizeEmail(),
  body('password')
    .notEmpty()
    .isString()
    .trim()
    .isLength({ min: 8 })
    .withMessage('Minimun length of password should be 8'),
  body('confirmPassword')
    .trim()
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Confirm password does not match');
      }
      return true;
    }),
];

exports.updatePasswordvalidation = [
  body('oldPassword').notEmpty().isString().trim(),
  body('newPassword')
    .notEmpty()
    .isString()
    .trim()
    .isLength({ min: 8 })
    .withMessage('Minimun length of password should be 8')
    .custom((value, { req }) => {
      if (value === req.body.oldPassword) {
        throw new Error('New password cannot be same as old password');
      }
      return true;
    }),
];

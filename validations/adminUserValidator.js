const { param, body } = require('express-validator');

exports.getSingleUserValidator = [
  param('resetToken').notEmpty().isString().trim(),
];

exports.updateUserValidator = [
  param('resetToken').notEmpty().isString().trim(),
  body('firstName').notEmpty().isString().trim().escape().isLength({ max: 15 }),
  body('middleName').isString().trim().escape().isLength({ max: 15 }),
  body('lastName').notEmpty().isString().trim().escape().isLength({ max: 15 }),
  body('email').isEmail().normalizeEmail(),
];

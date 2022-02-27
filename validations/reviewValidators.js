const { body, param } = require('express-validator');

exports.addReviewValitor = [
  body('comments')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 200 })
    .escape(),
];

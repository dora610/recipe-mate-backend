const { body, param } = require('express-validator');

exports.addReviewValitor = [
  body('rating')
    .isInt()
    .custom((value) => {
      if (![1, 2, 3, 4, 5].includes(value)) {
        throw new Error('Invalid rating');
      }
      return true;
    }),
  body('comments')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 200 })
    .escape(),
];

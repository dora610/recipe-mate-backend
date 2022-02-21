const { validationResult } = require('express-validator');
const CustomError = require('../utils/customError');

exports.reqValidator = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    errorList = errors
      .array()
      .map(({ param, msg }) => `${param} - ${msg}`)
      .join('; ');
    throw new CustomError(errorList, 400);
  }
  next();
};

exports.validateConcurrent = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map((validation) => validation.run(req)));
    next();
  };
};

const CustomError = require('../utils/customError');

const maxFileSizeBytes = 5 * 1024 * 1024;

const uploadFileValidator = (files) => {
  if (!files.photo) {
    throw new CustomError('No Photos found', 400);
  }

  if (files.photo.size > maxFileSizeBytes) {
    throw new CustomError('File size exceeded', 400);
  }

  if (!files.photo.mimetype.includes('image')) {
    throw new CustomError('Only jpg, jpeg, png file types are allowed', 400);
  }
};

module.exports = uploadFileValidator;

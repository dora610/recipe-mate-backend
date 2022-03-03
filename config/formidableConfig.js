const path = require('path');
const { v4: uuidv4 } = require('uuid');

const maxFileSizeBytes = 5 * 1024 * 1024;

const formidableConfig = {
  // uploadDir: path.join(__dirname, '../uploads/images'),
  allowEmptyFiles: false,
  maxFileSize: maxFileSizeBytes,
  minFileSize: 1,
  filename: uuidv4(),
  filter: function ({ name, originalFilename, mimetype }) {
    return mimetype && mimetype.includes('image');
  },
};

module.exports = formidableConfig;

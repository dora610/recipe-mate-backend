class CustomError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.code = statusCode;
  }
}

module.exports = CustomError;

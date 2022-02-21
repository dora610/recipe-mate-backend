const debug = require('debug')('recipe-mate:errorHandler');

exports.catchErrors = (fn) => (req, res, next) =>
  fn(req, res, next).catch((err) => next(err));

exports.catchErrorsForParams = (fn) => (req, res, next, id) =>
  fn(req, res, next, id).catch((err) => next(err));

exports.showError = (err, req, res, next) => {
  debug(err.code);
  debug(err.stack);

  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // check for mongoDb duplicate key error
  if (err.code && err.message.match(/duplicate key error/gi)) {
    err.code = 400;
    let customErrorMessage =
      'Already taken: ' + err.message.match(/\{.*\}/i)[0];
    err.message = customErrorMessage;
  }

  // jwt authorization error
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'invalid token' });
  }

  res.status(err.code && err.code >= 300 && err.code < 500 ? err.code : 500);

  let errorDetails = {
    error: err.message,
  };

  if (req.app.get('env') === 'development') {
    errorDetails['stack'] = err.stack;
  }

  res.format({
    'application/json': () => res.json(errorDetails),
    'text/html': () => res.render('error'),
    'text/plain': () => res.send(err.message),
    default: () => res.status(406).send('Not acceptable'),
  });
};

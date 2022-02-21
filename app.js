const createError = require('http-errors');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const debug = require('debug')('recipe-mate:app');
const cors = require('cors');
require('dotenv').config();

const app = express();

const corsConfig = {
  origin: process.env.RESET_PSS_BASE_URL ?? '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

// import routes
const { showError } = require('./utils/errorHandler');
const authRouter = require('./routes/authRoutes');
const recipeRouter = require('./routes/recipeRoutes');
const adminUserRouter = require('./routes/userRoutesAdmin');
const adminRecipeRouter = require('./routes/recipeRoutesAdmin');

// HTTP request logger middleware for node.js, we will take split/dual loggin approach
// log only 4xx and 5xx responses to console
const loggingStyle = app.get('env') === 'production' ? 'combined' : 'dev';
app.use(
  morgan(loggingStyle, {
    skip: function (req, res) {
      return res.statusCode < 400 && app.get('env') === 'production';
    },
  })
);

// log all requests to access.log
app.use(
  morgan('combined', {
    stream: fs.createWriteStream(path.join(__dirname, './morgan.log'), {
      flags: 'a',
    }),
    // skip: (req, res) => app.get('env') !== 'production',
  })
);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Middleware config
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
// app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors(corsConfig));

app.get('/', (req, res) => res.sendFile('index.html'));
// health check
app.get('/health', (req, res) => {
  debug(`ip: ${req.ip} || ${new Date()}`);
  res.format({
    'application/json': () => res.json({ health: 'OK' }),
    'text/html': () => res.render('health', { status: 'OK' }),
    'text/plain': () => res.send('Health: OK'),
    default: () => res.status(406).send('Not acceptable'),
  });
});

// connecting to routes
app.use('/api/auth', authRouter);
app.use('/api/recipe', recipeRouter);
app.use('/api/admin/user', adminUserRouter);
app.use('/api/admin/recipe', adminRecipeRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(showError);

process.on('uncaughtException', (err) => {
  console.error('There was an uncaught error', err);
  process.exit(1);
});

module.exports = app;

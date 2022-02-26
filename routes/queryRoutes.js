const { query } = require('express-validator');
const {
  isAuthenticated,
  isAuthorised,
} = require('../controllers/authController');
const { searchRecipe } = require('../controllers/recipeController');
const router = require('express').Router();

router.use(isAuthenticated);
router.use(isAuthorised);

router.get(
  '/recipe',
  query('name').exists().notEmpty().isString().trim().escape(),
  searchRecipe
);

module.exports = router;

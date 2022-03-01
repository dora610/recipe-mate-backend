const router = require('express').Router();
const { param } = require('express-validator');
const { reqValidator } = require('../middlewares/reqValidator');
const {
  isAuthenticated,
  isAuthorised,
} = require('../controllers/authController');
const {
  getRecipe,
  getRecipeById,
  createRecipe,
  getAllRecipes,
  updateRecipe,
  deleteRecipe,
  formidableFileUploader,
  isRecipeOwner,
  fetchSavedRecipes,
  toggleSavedRecipe,
  fetchRecipesForUser,
} = require('../controllers/recipeController');
const { getUserById } = require('../controllers/authController');
const debug = require('debug')('recipe-mate:recipe-router');

router.use(isAuthenticated);
router.use(isAuthorised);

router.param('recipeId', getRecipeById);
router.param('userId', getUserById);

router.get('/all', getAllRecipes);
router
  .route('/:recipeId')
  .get(param('recipeId').notEmpty().isString().trim(), reqValidator, getRecipe)
  .put(isRecipeOwner, formidableFileUploader, updateRecipe)
  .delete(isRecipeOwner, deleteRecipe);
router.post('/', formidableFileUploader, createRecipe);

router.get('/', fetchRecipesForUser);

router.get('/savedrecipes/all', fetchSavedRecipes);
router.put('/savedrecipes/:recipeId', toggleSavedRecipe);

/* router.get('/addrecipe', (req, res) => {
  res.render('postform', { title: 'Add recipe' });
}); */

module.exports = router;

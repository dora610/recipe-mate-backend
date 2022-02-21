const router = require('express').Router();
const {
  getAllRecipes,
  getRecipeById,
  getRecipe,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  formidableFileUploader,
} = require('../controllers/recipeController');
const {
  isAuthenticated,
  isAuthorised,
  isAdmin,
} = require('../controllers/authController');

router.use(isAuthenticated);
router.use(isAuthorised);
router.use(isAdmin);

router.get('/all', getAllRecipes);
router.param('recipeId', getRecipeById);

router
  .route('/:recipeId')
  .get(getRecipe)
  .put(formidableFileUploader, updateRecipe)
  .delete(deleteRecipe);
router.post('/', formidableFileUploader, createRecipe);

module.exports = router;

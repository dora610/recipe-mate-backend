const {
  isAuthenticated,
  isAuthorised,
} = require('../controllers/authController');
const { getRecipeById } = require('../controllers/recipeController');
const {
  getReviewById,
  getAllReviewsForRecipe,
  updateReview,
  deleteReview,
  getSingleReview,
  addReviewToRecipe,
} = require('../controllers/reviewController');
const {
  validateConcurrent,
  reqValidator,
} = require('../middlewares/reqValidator');
const { addReviewValitor } = require('../validations/reviewValidators');
const router = require('express').Router();

router.use(isAuthenticated);
router.use(isAuthorised);

router.param('reviewId', getReviewById);

// TODO: add express validator
router.get('/:reviewId', getSingleReview);
router.put(
  '/:reviewId',
  validateConcurrent(addReviewValitor),
  reqValidator,
  updateReview
);
router.delete('/:reviewId', deleteReview);
router.post(
  '/',
  validateConcurrent(addReviewValitor),
  reqValidator,
  addReviewToRecipe
);
router.get('/:recipeId', getAllReviewsForRecipe);

module.exports = router;

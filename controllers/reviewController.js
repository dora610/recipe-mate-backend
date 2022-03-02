const Recipe = require('../models/Recipe');
const Review = require('../models/Review');
const CustomError = require('../utils/customError');
const { catchErrors, catchErrorsForParams } = require('../utils/errorHandler');
const debug = require('debug')('recipe-mate:review-controller');

exports.getReviewById = catchErrorsForParams(async (req, res, next, id) => {
  const review = await Review.findById(id);
  if (!review) {
    throw new CustomError('No such review found', 404);
  }
  req.review = review;
  return next();
});

exports.getSingleReview = catchErrors(async (req, res) => res.json(req.review));

exports.getReviewsForRecipe = catchErrors(async (req, res) => {
  const recipeId = req.query.recipe;
  const limit = req.query.limit || 10;

  if (!recipeId) {
    throw new CustomError('Invalid request', 400);
  }
  const recipe = await Recipe.findById(recipeId);
  if (!recipe) {
    throw new CustomError('No such recipe found', 404);
  }

  const ratingsCountPromise = Review.getRatingCount(recipe._id);
  const reviewsPromise = Review.getMostRecentReviews(recipe._id, limit);

  const [ratingsCount, reviews] = await Promise.all([
    ratingsCountPromise,
    reviewsPromise,
  ]);

  res.json({ ratingsCount, reviews });
});

exports.addReviewToRecipe = catchErrors(async (req, res) => {
  const { rating, comments } = req.body;
  const recipeId = req.query.recipe;
  if (!recipeId) {
    throw new CustomError('Invaild query', 400);
  }

  const recipe = await Recipe.findById(recipeId);
  if (!recipe) {
    throw new CustomError('No such recipe exists', 400);
  }

  const savedReview = await Review.create({
    rating,
    comments,
    author: req.user._id,
    recipe: recipeId,
  });

  res.json({ status: 'success', savedReview });

  const avgRating = await Review.getAvgRating(recipe._id);
  recipe['rating'] = avgRating[0].avg;
  await recipe.save();
});

exports.updateReview = catchErrors(async (req, res) => {
  const modifiedReview = await Review.findByIdAndUpdate(
    req.review._id,
    req.body,
    {
      runValidators: true,
      new: true,
    }
  );
  res.json({ success: 1, message: 'Successfully updated' });
});

exports.deleteReview = catchErrors(async (req, res) => {
  const deleted = await Review.findByIdAndDelete(req.review._id);
  res.json({ success: 1, message: 'Successfully deleted' });
});

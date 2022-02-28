const Recipe = require('../models/recipe');
const Review = require('../models/review');
const CustomError = require('../utils/customError');
const { catchErrors, catchErrorsForParams } = require('../utils/errorHandler');

exports.getReviewById = catchErrorsForParams(async (req, res, next, id) => {
  const review = await Review.findById(id);
  if (!review) {
    throw new CustomError('No such review found', 404);
  }
  req.review = review;
  return next();
});

exports.getSingleReview = catchErrors(async (req, res) => res.json(req.review));

exports.getAllReviewsForRecipe = catchErrors(async (req, res) => {
  const recipeId = req.query.recipe;
  if (!recipeId) {
    throw new CustomError('Invalid request', 400);
  }
  const recipes = await Recipe.findById(recipeId)
    .populate({ path: 'reviews' })
    .select('reviews');
  res.json(recipes);
  /* const reviews = await Review.find({ recipe: req.recipe._id })
    .populate({ path: 'author', select: 'fullName firstName lastName' })
    .sort({ updatedAt: -1 });
  res.json(reviews); */
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

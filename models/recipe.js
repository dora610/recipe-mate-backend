const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      maxLength: 40,
      trim: true,
      required: true,
    },
    description: {
      type: String,
      maxLength: 250,
      trim: true,
    },
    ingredients: {
      type: [String],
      required: true,
    },
    type: {
      type: String,
      enum: ['veg', 'non-veg'],
      required: true,
    },
    preparationTime: {
      type: Number,
      required: true,
    },
    cookTime: {
      type: Number,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    course: {
      type: String,
      enum: ['main-course', 'starter', 'dessert', 'snacks', 'beverages'],
    },
    steps: {
      type: [String],
      required: true,
    },
    photo: {
      contentType: String,
      fileName: String,
      asset_id: String,
      public_id: String,
      secure_url: String,
      square: String,
      thumbnail: String,
    },
    savedby: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    rating: {
      type: 'Number',
      min: 0,
      max: 5,
      default: 0,
    },
  },
  { timestamps: true }
);

recipeSchema.set('toObject', { virtuals: true });
recipeSchema.set('toJSON', { virtuals: true });

function arrayElementsValidator(arr) {
  if (Array.isArray(arr) && arr.length === 0) {
    return false;
  }
  for (const item of arr) {
    if (item.length === 0) {
      return false;
    }
  }
  return true;
}

recipeSchema.path('ingredients').validate({
  validator: arrayElementsValidator,
  message: function (props) {
    return `${props.path} must have some value, but get empty value`;
  },
});

recipeSchema.path('steps').validate({
  validator: arrayElementsValidator,
  message: function (props) {
    return `${props.path} must have some value, but got noting`;
  },
});

recipeSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'recipe',
});

recipeSchema.statics.getRatingCount = function (id) {
  return this.aggregate([
    {
      $match: {
        _id: id,
      },
    },
    {
      $lookup: {
        from: 'reviews',
        localField: '_id',
        foreignField: 'recipe',
        as: 'reviews',
      },
    },
    {
      $unwind: {
        path: '$reviews',
      },
    },
    {
      $group: {
        _id: '$reviews.rating',
        count: {
          $count: {},
        },
      },
    },
  ]);
};

recipeSchema.statics.getRatingCountAll = function (limit = 5) {
  return this.aggregate([
    {
      $sort: {
        updatedAt: -1,
      },
    },
    {
      $limit: limit,
    },
    {
      $lookup: {
        from: 'reviews',
        localField: '_id',
        foreignField: 'recipe',
        as: 'reviews',
      },
    },
    {
      $unwind: {
        path: '$reviews',
      },
    },
    {
      $group: {
        _id: '$_id',
        rating: {
          $avg: '$reviews.rating',
        },
      },
    },
  ]);
};

recipeSchema.statics.getMostRecentReviews = function (id) {
  return this.aggregate([
    {
      $match: {
        _id: id,
      },
    },
    {
      $lookup: {
        from: 'reviews',
        localField: '_id',
        foreignField: 'recipe',
        as: 'review',
      },
    },
    {
      $unwind: {
        path: '$review',
      },
    },
    {
      $match: {
        'review.rating': {
          $exists: true,
        },
        'review.comments': {
          $exists: true,
        },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'review.author',
        foreignField: '_id',
        as: 'author',
      },
    },
    {
      $unwind: {
        path: '$author',
      },
    },
    {
      $project: {
        review: {
          _id: 1,
          rating: 1,
          comments: 1,
          createdAt: 1,
          updatedAt: 1,
        },
        author: {
          firstName: 1,
          lastName: 1,
        },
      },
    },
    {
      $sort: {
        'review.updatedAt': -1,
      },
    },
    {
      $limit: 5,
    },
  ]);
};

module.exports = mongoose.model('Recipe', recipeSchema);

const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    rating: {
      type: Number,
      enum: {
        values: [1, 2, 3, 4, 5],
        message: 'Unsupported rating - {VALUE}',
      },
    },
    comments: {
      type: String,
      trim: true,
      maxlength: 200,
      minlength: 1,
    },
    recipe: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recipe',
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

reviewSchema.set('toObject', { virtuals: true });
reviewSchema.set('toJSON', { virtuals: true });

const populateAuthor = function (next) {
  this.populate({ path: 'author', select: 'fullName firstName lastName' });
  next();
};

reviewSchema.pre('find', populateAuthor);
reviewSchema.pre('findOne', populateAuthor);

/* reviewSchema.post('save', function (doc, next) {
  doc.populate('author').then(function () {
    next();
  });
}); */

reviewSchema.pre('save', function (next) {
  if (this.rating || this.comments) {
    next();
  }
  throw new Error('Blank review error -no rating, no comments');
});

reviewSchema.statics.getRatingCount = function (id) {
  return this.aggregate([
    [
      {
        $match: {
          recipe: id,
        },
      },
      {
        $group: {
          _id: '$rating',
          count: {
            $count: {},
          },
          rating: {
            $first: '$rating',
          },
        },
      },
      {
        $project: {
          _id: 0,
        },
      },
    ],
  ]);
};

reviewSchema.statics.getMostRecentReviews = function (id, limit) {
  return this.aggregate([
    [
      {
        $match: {
          recipe: id,
          rating: {
            $exists: true,
          },
          comments: {
            $exists: true,
          },
        },
      },
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
          from: 'users',
          localField: 'author',
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
          rating: 1,
          comments: 1,
          author: {
            firstName: 1,
            lastName: 1,
          },
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ],
  ]);
};

reviewSchema.statics.getAvgRating = function (id) {
  return this.aggregate([
    [
      {
        $match: {
          recipe: id,
        },
      },
      {
        $group: {
          _id: '$recipe',
          avg: {
            $avg: '$rating',
          },
        },
      },
    ],
  ]);
};

module.exports = mongoose.model('Review', reviewSchema);

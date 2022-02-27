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

module.exports = mongoose.model('Review', reviewSchema);

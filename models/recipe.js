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
  },
  { timestamps: true }
);

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

module.exports = mongoose.model('Recipe', recipeSchema);

const CustomError = require('../utils/customError');

exports.validateRecipe = function ({
  name,
  ingredients,
  type,
  preparationTime,
  cookTime,
  course,
}) {
  if (
    !name ||
    !ingredients ||
    ingredients.length === 0 ||
    !type ||
    !['veg', 'non-veg'].includes(type) ||
    !preparationTime ||
    !cookTime ||
    !course ||
    !['main-course', 'starter', 'dessert', 'snacks', 'beverages'].includes(
      course
    )
  ) {
    throw new CustomError('Fields are missing, pls provide all fields', 400);
  }
};

exports.validateRecipeForUpdate = function ({ ingredients, type, course }) {
  if (ingredients) {
    if (ingredients.length === 0) {
      throw new CustomError('Ingredients cannot be empty', 400);
    }
  }
  if (type) {
    if (!['veg', 'non-veg'].includes(type)) {
      throw new CustomError(`Type value is invalid - received ${type}`, 400);
    }
  }
  if (course) {
    if (
      !['main-course', 'starter', 'dessert', 'snacks', 'beverages'].includes(
        course
      )
    ) {
      throw new CustomError(
        `Course value is invalid - received ${course}`,
        400
      );
    }
  }
};

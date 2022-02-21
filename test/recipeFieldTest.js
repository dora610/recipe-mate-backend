let expect = require('chai').expect;
const { validateRecipe } = require('../validations/recipeValidator');

describe('Recipe validator', function () {
  describe('Validation for recipe fields from req body', function () {
    let recipe = {};
    beforeEach(function () {
      recipe = {
        name: 'Brownies',
        ingredients: [
          'Flour',
          'Egg',
          'Chocolate syrup',
          'Cheese',
          'Choco chip',
        ],
        rating: 1,
        type: 'non-veg',
        preparationTime: 30,
        cookTime: 45,
        course: 'dessert',
      };
    });

    it('should be false when fields are present', function () {
      expect(validateRecipe(recipe)).to.be.false;
    });

    it('should be true when name is not present', function () {
      delete recipe.name;
      expect(validateRecipe(recipe)).to.be.true;
    });

    it('should be true when ingredient is empty', function () {
      recipe.ingredients = [];
      expect(validateRecipe(recipe)).to.be.true;
    });

    it('should be true when ingredients are not present', function () {
      delete recipe.ingredients;
      expect(validateRecipe(recipe)).to.be.true;
    });

    it('should be true when rating is not present/ invalid', function () {
      recipe.rating = 4.5;
      expect(validateRecipe(recipe)).to.be.true;
      delete recipe.rating;
      expect(validateRecipe(recipe)).to.be.true;
    });

    it('should be true type is not present/ invalid', function () {
      recipe.type = 'dank';
      expect(validateRecipe(recipe)).to.be.true;
      delete recipe.type;
      expect(validateRecipe(recipe)).to.be.true;
    });

    it('should be true preparationTime is not present/ invalid', function () {
      recipe.preparationTime = 0;
      expect(validateRecipe(recipe)).to.be.true;
      delete recipe.preparationTime;
      expect(validateRecipe(recipe)).to.be.true;
    });

    it('should be true cookTime is not present/ invalid', function () {
      recipe.cookTime = 0;
      expect(validateRecipe(recipe)).to.be.true;
      delete recipe.cookTime;
      expect(validateRecipe(recipe)).to.be.true;
    });

    it('should be true course is not present/ invalid', function () {
      recipe.course = 'drinks';
      expect(validateRecipe(recipe)).to.be.true;
      delete recipe.course;
      expect(validateRecipe(recipe)).to.be.true;
    });
  });
});

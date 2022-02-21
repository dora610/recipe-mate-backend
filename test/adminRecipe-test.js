const Recipe = require('../models/recipe');
const User = require('../models/user');
let expect = require('chai').expect;

let { recipe1, recipe2, recipe3 } = require('./test-config/recipes');
let { user1 } = require('./test-config/users');

describe('Fetch recipe', function () {
  let savedUser, savedRecipe1, savedRecipe2, savedRecipe3;

  before(async function () {
    savedUser = await User.create(user1);
    savedRecipe1 = await Recipe.create({
      ...recipe1,
      createdBy: savedUser._id,
    });
    savedRecipe2 = await Recipe.create({
      ...recipe2,
      createdBy: savedUser._id,
    });
    savedRecipe3 = await Recipe.create({
      ...recipe3,
      createdBy: savedUser._id,
    });
  });
  after(async function () {
    await Promise.all([User.deleteMany({}), Recipe.deleteMany({})]);
  });
  describe('Get list of recipes from db', function () {
    let limit, offset;

    before(function () {
      let page = 1;
      limit = 5;
      offset = (page - 1) * limit;
    });

    it('Recipe list will be returned in desc order with user fullname', async function () {
      let recipes = await Recipe.find({})
        .skip(offset)
        .limit(limit)
        .sort({ rating: -1, name: 1 })
        .populate('createdBy', 'fullName firstName lastName');

      let sortedRecipe = [recipe1, recipe2, recipe3].sort((a, b) => {
        if (a.rating < b.rating) {
          return 1;
        } else if (a.rating > b.rating) {
          return -1;
        } else if (a.name.toLowerCase() > b.name.toLowerCase()) {
          return 1;
        } else if (a.name.toLowerCase() < b.name.toLowerCase()) {
          return -1;
        } else {
          return 0;
        }
      });

      expect(recipes).to.be.an('array').that.have.lengthOf(3);
      expect(recipes[0].toObject()).to.deep.own.include(sortedRecipe[0]);
      expect(recipes[1].toObject()).to.deep.own.include(sortedRecipe[1]);
      expect(recipes[2].toObject()).to.deep.own.include(sortedRecipe[2]);
      expect(recipes[0].toObject())
        .to.have.own.property('createdBy')
        .that.deep.include({ fullName: savedUser.fullName });
    });
    it('Recipe list will be returned, limit changed', async function () {
      let recipes = await Recipe.find({})
        .skip(offset)
        .limit(2)
        .sort({ rating: -1, name: 1 })
        .populate('createdBy', 'firstName lastName fullName');

      let sortedRecipe = [recipe1, recipe2, recipe3].sort((a, b) => {
        if (a.rating < b.rating) {
          return 1;
        } else if (a.rating > b.rating) {
          return -1;
        } else if (a.name.toLowerCase() > b.name.toLowerCase()) {
          return 1;
        } else if (a.name.toLowerCase() < b.name.toLowerCase()) {
          return -1;
        } else {
          return 0;
        }
      });

      expect(recipes).to.be.an('array').that.have.lengthOf(2);
      expect(recipes[0].toObject()).to.deep.own.include(sortedRecipe[0]);
      expect(recipes[1].toObject()).to.deep.own.include(sortedRecipe[1]);
      expect(recipes[0].toObject())
        .to.have.own.property('createdBy')
        .that.deep.include({ fullName: savedUser.fullName });
    });
    it('Empty list for invalid page number(offset)', async function () {
      let page = 99;
      offset = (page - 1) * limit;

      let recipes = await Recipe.find({})
        .skip(offset)
        .limit(limit)
        .sort({ rating: -1, name: 1 })
        .populate('createdBy', 'firstName lastName fullName')
        .lean();

      expect(recipes).to.be.an('array').that.have.lengthOf(0);
    });
    it('Empty list for no value in db', async function () {
      await Recipe.deleteMany({});

      let recipes = await Recipe.find({})
        .skip(offset)
        .limit(limit)
        .sort({ rating: -1, name: 1 })
        .populate('createdBy', 'firstName lastName fullName')
        .lean();

      expect(recipes).to.be.an('array').that.have.lengthOf(0);
    });
  });
});

describe('Add recipe', function () {
  let savedUser, savedRecipe1, savedRecipe2, savedRecipe3;

  before(async function () {
    savedUser = await User.create(user1);
  });

  after(async function () {
    await Promise.all([User.deleteMany({}), Recipe.deleteMany({})]);
  });

  describe('add recipe to db', function () {
    it('Add recipe with ingredients', async function () {
      savedRecipe1 = await Recipe.create({
        ...recipe1,
        createdBy: savedUser._id,
      });
      expect(savedRecipe1.toObject()).to.have.own.property(
        'name',
        recipe1.name
      );
      expect(savedRecipe1.toObject())
        .to.deep.own.property('ingredients')
        .that.to.be.an('array')
        .that.have.lengthOf(recipe1.ingredients.length);
    });

    it('Add recipe with no ingredients', async function () {
      try {
        let newRecipe = await Recipe.create({
          ...recipe2,
          ingredients: [],
          createdBy: savedUser._id,
        });
      } catch (err) {
        expect(err.message).to.include(
          'ingredients must have some value, but get empty value'
        );
      }
    });

    it('update recipe with ingrdients', async function () {
      let updatedRecipe = await Recipe.findByIdAndUpdate(
        savedRecipe1._id,
        {
          ingredients: ['some ingr', 'some other ingr'],
        },
        {
          new: true,
          runValidators: true,
        }
      );

      expect(updatedRecipe.toObject())
        .to.haveOwnProperty('ingredients')
        .that.eql(['some ingr', 'some other ingr']);
      expect(updatedRecipe.toObject()).to.haveOwnProperty('name', recipe1.name);
    });

    it('update recipe with no ingrdients', function (done) {
      Recipe.findByIdAndUpdate(
        savedRecipe1._id,
        {
          ingredients: [],
        },
        {
          new: true,
          runValidators: true,
        },
        function (err, res) {
          expect(err.message).to.include(
            'ingredients must have some value, but get empty value'
          );
          done();
        }
      );
    });

    it('update recipe with array of single empty string as ingrdients', async function () {
      try {
        let updatedRecipe = await Recipe.findByIdAndUpdate(
          savedRecipe1._id,
          {
            ingredients: [''],
          },
          {
            new: true,
            runValidators: true,
          }
        );
      } catch (err) {
        expect(err.message).to.include(
          'ingredients must have some value, but get empty value'
        );
      }
    });

    it('update recipe with empty string as ingrdients', async function () {
      try {
        let updatedRecipe = await Recipe.findByIdAndUpdate(
          savedRecipe1._id,
          {
            ingredients: '',
          },
          {
            new: true,
            runValidators: true,
          }
        );
      } catch (err) {
        expect(err.message).to.include(
          'ingredients must have some value, but get empty value'
        );
      }
    });

    it('update recipe with undefined as ingrdients', async function () {
      try {
        let updatedRecipe = await Recipe.findByIdAndUpdate(
          savedRecipe1._id,
          {
            ingredients: '',
          },
          {
            new: true,
            runValidators: true,
          }
        );
      } catch (err) {
        expect(err.message).to.include(
          'ingredients must have some value, but get empty value'
        );
      }
    });

    it('update recipe with steps as empty array', async function () {
      try {
        await Recipe.findByIdAndUpdate(
          savedRecipe1._id,
          {
            steps: '',
          },
          {
            new: true,
            runValidators: true,
          }
        );
      } catch (err) {
        expect(err.message).to.include(
          'steps must have some value, but got noting'
        );
      }
    });

    it('update recipe with invalid type value', async function () {
      try {
        let updatedRecipe = await Recipe.findByIdAndUpdate(
          savedRecipe1._id,
          {
            type: 'veggies',
          },
          {
            new: true,
            runValidators: true,
          }
        );
      } catch (err) {
        expect(err.message).to.include('Validation failed');
      }
    });

    it('update recipe with some string as ingrdients', async function () {
      try {
        let updatedRecipe = await Recipe.findByIdAndUpdate(
          savedRecipe1._id,
          {
            ingredients: 'some ingredients',
          },
          {
            new: true,
            runValidators: true,
          }
        );
      } catch (err) {
        expect(err.message).to.include(
          'ingredients must have some value, but get empty value'
        );
      }
    });
  });
});

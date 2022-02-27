const Recipe = require('../models/recipe');
const User = require('../models/user');
const Review = require('../models/review');
let expect = require('chai').expect;

let { recipe1, recipe2, recipe3 } = require('./test-config/recipes');
let { user1 } = require('./test-config/users');
let {
  review1,
  review2,
  review3,
  review4,
  review5,
  review6,
} = require('./test-config/fake-review');

describe('Review tests', function () {
  let savedUser1, savedRecipe1, savedReview1, savedReview2, savedReview3;
  before(async function () {
    savedUser1 = await User(user1);
    savedRecipe1 = await Recipe({ ...recipe1, createdBy: savedUser1._id });
  });
  after('clearing db', async function () {
    await Promise.all([
      User.deleteMany({}),
      Recipe.deleteMany({}),
      Review.deleteMany({}),
    ]);
  });

  describe('Add review', function () {
    it('add review with valid elements', async function () {
      savedReview1 = await Review.create({
        ...review1,
        recipe: savedRecipe1._id,
        author: savedUser1._id,
      });
      expect(savedReview1)
        .to.have.property('rating', review1.rating)
        .that.to.be.a('number');
      expect(savedReview1)
        .to.have.property('comments', review1.comments)
        .that.to.be.a('string');
      expect(savedReview1).to.deep.property('recipe', savedRecipe1._id);
      expect(savedReview1).to.deep.property('author', savedUser1._id);
    });

    it('add review with no rating', async function () {
      savedReview2 = await Review.create({
        comments: review2.comments,
        recipe: savedRecipe1._id,
        author: savedUser1._id,
      });
      expect(savedReview2)
        .to.have.property('comments', review2.comments)
        .that.to.be.a('string');
      expect(savedReview2).to.deep.property('recipe', savedRecipe1._id);
      expect(savedReview2).to.deep.property('author', savedUser1._id);
    });

    it('add review with no comments', async function () {
      savedReview3 = await Review.create({
        ...review3,
        recipe: savedRecipe1._id,
        author: savedUser1._id,
      });
      expect(savedReview3)
        .to.have.property('rating', review3.rating)
        .that.to.be.a('number');
      expect(savedReview3).to.deep.property('recipe', savedRecipe1._id);
      expect(savedReview3).to.deep.property('author', savedUser1._id);
    });

    it('add review with no rating, no comments', async function () {
      try {
        await Review.create({
          recipe: savedRecipe1._id,
          author: savedUser1._id,
        });
      } catch (err) {
        expect(err.message).to.include(
          'Blank review error- no rating, no comments'
        );
      }
    });

    it('add review with blank comment', async function () {
      try {
        let reviewerr = await Review.create({
          comment: '',
          recipe: savedRecipe1._id,
          author: savedUser1._id,
        });
      } catch (err) {
        expect(err.message).to.include(
          'Blank review error- no rating, no comments'
        );
      }
    });

    it('add review with incorrect rating comment', async function () {
      try {
        let reviewerr = await Review.create({
          rating: 1,
          recipe: savedRecipe1._id,
          author: savedUser1._id,
        });
      } catch (err) {
        expect(err.message).to.include('Unsupported rating');
      }
    });
  });

  describe('Fetch review', function () {
    it('fetch review by id', async function () {
      const reviewFromDb = await Review.findById(savedReview1._id);

      expect(reviewFromDb)
        .to.have.property('rating', savedReview1.rating)
        .that.to.be.a('number');
      expect(reviewFromDb)
        .to.have.property('comments', savedReview1.comments)
        .that.to.be.a('string');
      expect(reviewFromDb).to.deep.property('recipe', savedRecipe1._id);
      expect(reviewFromDb).to.deep.property('author', savedUser1._id);
    });

    it('fetch review by userId', async function () {
      const userReviews = await Review.find({
        author: savedUser1._id,
      }).populate('recipe');

      expect(userReviews).to.be.an('array');
    });
  });
});

const Recipe = require('../models/Recipe');
const debug = require('debug')('recipe-mate:recipe-controller');

const cloudinary = require('cloudinary').v2;
const cloudinaryConfig = require('../config/cloudinaryConfig');
const formidable = require('formidable');

const { validateRecipe } = require('../validations/recipeValidator');
const uploadFileValidator = require('../validations/uploadFileValidator');
const { catchErrorsForParams, catchErrors } = require('../utils/errorHandler');
const CustomError = require('../utils/customError');

const formidableConfig = require('../config/formidableConfig');
const Review = require('../models/Review');
cloudinary.config(cloudinaryConfig);

const handleCloudinaryImageUpload = async (filepath) => {
  try {
    // upload file to cloudinary
    const cloudinaryResp = await cloudinary.uploader.upload(filepath, {
      folder: 'recipe-mate',
    });

    // transform image
    const cloudinaryRespTrans = await cloudinary.uploader.explicit(
      cloudinaryResp.public_id,
      {
        type: 'upload',
        eager: [
          { aspect_ratio: '1:1', gravity: 'auto', width: 800, crop: 'fill' },
          {
            aspect_ratio: '1:1',
            gravity: 'face:center',
            quality: 'auto:good',
            width: 200,
            crop: 'thumb',
          },
        ],
      }
    );

    return cloudinaryRespTrans;
  } catch (err) {
    console.error(err);
    throw new Error(err.error);
  }
};

const recipeCreator = (fields, user) => {
  // if admin is creating recipe he needs to
  // send the userId to whom recipe will be assigned
  if (user.role > 0 && fields.createdBy) {
    return fields.createdBy;
  } else if (user.role > 0) {
    throw new CustomError('Recipe creator details are missing', 400);
    // else the recipe will be assigned to the user itself
  } else {
    return user._id;
  }
};

const formArrayFormatter = (formEle) => {
  return formEle && formEle.length >= 0 ? JSON.parse(formEle) : undefined;
};

exports.isRecipeOwner = (req, res, next) => {
  if (req.recipe.createdBy._id.equals(req.user._id)) {
    return next();
  }
  throw new CustomError("Access declined!! You don't own that", 403);
};

exports.formidableFileUploader = (req, res, next) => {
  const form = formidable(formidableConfig);
  form.parse(req, (err, fields, files) => {
    if (err) {
      return next(err);
    }
    req.fields = fields;
    req.files = files;
    next();
  });
};

exports.getRecipeById = catchErrorsForParams(async (req, res, next, id) => {
  const recipe = await Recipe.findById(id).populate(
    'createdBy',
    'fullName email firstName lastName'
  );
  if (!recipe) {
    throw new CustomError('No such recipe found', 404);
  }
  req.recipe = recipe;
  next();
});

exports.getRecipe = catchErrors(async (req, res) => res.json(req.recipe));

// TODO: take input form user for a specific path to be sorted in ascending or descending
exports.getAllRecipes = catchErrors(async (req, res) => {
  const page = req.query.page || 1;
  const limit = req.query.limit || 5;
  const offset = (page - 1) * limit;

  let projection = [];
  if (req.user?.role !== 1) {
    projection = [
      'name',
      'preparationTime',
      'cookTime',
      'type',
      'course',
      'photo.square',
      'createdBy',
      'savedby',
      'updatedAt',
      'createdAt',
      'rating',
    ];
  }

  let recipeListPromise = Recipe.find({})
    .skip(offset)
    .limit(limit)
    .sort({ rating: -1, name: 1 })
    .populate('createdBy', 'fullName firstName lastName')
    .select(projection);

  const countPromise = Recipe.estimatedDocumentCount();

  const [recipes, count] = await Promise.all([recipeListPromise, countPromise]);

  if (!count) {
    throw new CustomError('No recipe data available', 404);
  }
  if (!recipes.length) {
    throw new CustomError('Max. page limit reached');
  }

  /* let ratingsObj = {};
  ratings.forEach(
    ({ _id, rating }) => (ratingsObj[_id] = Math.trunc(rating * 100) / 100)
  );

  recipeListWithReview = recipeList.map((recipe) => {
    let newRecipe = { rating: ratingsObj[recipe._id] };
    Object.assign(newRecipe, recipe.toObject());
    return newRecipe;
  }); */

  res.json({
    recipes,
    count,
  });
});

exports.createRecipe = catchErrors(async (req, res, next) => {
  const { fields, files } = req;
  if (!files) {
    throw new CustomError('File info unavailable', 500);
  }
  if (!fields) {
    throw new CustomError('Invalid form field error', 500);
  }

  const createdBy = recipeCreator(fields, req.user);
  let newRecipe = new Recipe({
    ...fields,
    ingredients: formArrayFormatter(fields?.ingredients),
    steps: formArrayFormatter(fields?.steps),
    createdBy,
  });
  let isInvalidRecipe = newRecipe.validateSync();
  if (isInvalidRecipe) {
    throw new CustomError(isInvalidRecipe, 400);
  }

  validateRecipe(newRecipe);
  uploadFileValidator(files);

  const { asset_id, public_id, secure_url, eager } =
    await handleCloudinaryImageUpload(files.photo.filepath);

  newRecipe.photo = {
    contentType: files.photo.mimetype,
    fileName: files.photo.newFilename,
    asset_id,
    public_id,
    secure_url,
    square: eager[0].secure_url,
    thumbnail: eager[1].secure_url,
  };

  try {
    await Recipe.create(newRecipe);
    res.status(201).json({ status: `Successfully created new recipe` });
  } catch (err) {
    cloudinary.uploader.destroy(public_id, (error, result) =>
      console.log(result, error)
    );
    throw new Error(err);
  }
});

exports.updateRecipe = catchErrors(async (req, res, next) => {
  const { fields, files } = req;
  let isImageUpdated = false;
  if (!files) {
    throw new CustomError('File info unavailable', 500);
  }
  if (!fields) {
    throw new CustomError('Invalid form field error', 500);
  }

  if (fields.ingredients) {
    fields.ingredients = formArrayFormatter(fields.ingredients);
  }
  if (fields.steps) {
    fields.steps = formArrayFormatter(fields.steps);
  }
  let modifiedRecipe = new Recipe({ ...req.recipe.toObject(), ...fields });

  let isValidModifiedRecipe = modifiedRecipe.validateSync();
  if (isValidModifiedRecipe) {
    throw new CustomError(isValidModifiedRecipe, 400);
  }

  if (files.photo) {
    isImageUpdated = true;

    uploadFileValidator(files);
    let { asset_id, public_id, secure_url, eager } =
      await handleCloudinaryImageUpload(files.photo.filepath);

    modifiedRecipe.photo = {
      contentType: files.photo.mimetype,
      fileName: files.photo.newFilename,
      asset_id,
      public_id,
      secure_url,
      square: eager[0].secure_url,
      thumbnail: eager[1].secure_url,
    };
  }

  Recipe.findByIdAndUpdate(req.recipe._id, modifiedRecipe, {
    new: true,
    runValidators: true,
  })
    .then(() => res.json({ status: `Successfully updated recipe` }))
    .catch((err) => {
      if (isImageUpdated) {
        cloudinary.uploader
          .destroy(newRecipe.photo.public_id)
          .then((deletedImage) =>
            console.log(
              `Succesfully deleted cloudinary img on recipe update error - ${deletedImage}`
            )
          )
          .catch((err) => console.error(err.message));
      }
      next(err);
    });
});

exports.deleteRecipe = catchErrors(async (req, res) => {
  let deletedRecipePromise = Recipe.findByIdAndDelete(req.recipe._id, {
    select: { name: 1 },
  });
  let cloudinaryDeletePromise = cloudinary.uploader.destroy(
    req.recipe.photo.public_id
  );
  let [deletedRecipe, result] = await Promise.all([
    deletedRecipePromise,
    cloudinaryDeletePromise,
  ]);

  res.json({
    status: `Successfully deleted recipe: ${deletedRecipe.name}`,
  });
});

exports.fetchSavedRecipes = catchErrors(async (req, res) => {
  const page = req.query.page || 1;
  const limit = req.query.limit || 5;
  let offset = (page - 1) * limit;

  const recipePromise = Recipe.find({ savedby: req.user._id })
    .limit(limit)
    .skip(offset)
    .populate({ path: 'createdBy', select: 'fullName firstName lastName' })
    .select([
      'name',
      'preparationTime',
      'cookTime',
      'type',
      'course',
      'photo.square',
      'createdBy',
      'savedby',
      'updatedAt',
      'createdAt',
      'rating',
    ]);

  const countPromise = Recipe.countDocuments({ savedby: req.user._id });

  const [recipes, count] = await Promise.all([recipePromise, countPromise]);

  if (!count) {
    throw new CustomError('No recipe data available', 404);
  }
  if (!recipes.length) {
    throw new CustomError('Max. page limit reached');
  }

  res.json({
    recipes,
    count,
  });
});

exports.fetchRecipesForUser = catchErrors(async (req, res) => {
  const userId = req.query.user;
  const page = req.query.page || 1;
  const limit = req.query.limit || 5;
  const offset = (page - 1) * limit;

  if (!userId) {
    throw new CustomError('Invalid request', 4000);
  }
  const recipeListPromise = Recipe.find({ createdBy: userId })
    .skip(offset)
    .limit(limit)
    .sort({ rating: -1, updatedAt: -1 })
    .populate('createdBy', 'fullName firstName lastName')
    .select([
      'name',
      'preparationTime',
      'cookTime',
      'type',
      'course',
      'photo.square',
      'photo.thumbnail',
      'createdBy',
      'savedby',
      'updatedAt',
      'createdAt',
      'rating',
    ]);

  const countPromise = Recipe.count({ createdBy: userId });

  const [recipes, count] = await Promise.all([recipeListPromise, countPromise]);

  if (!count) {
    throw new CustomError('No recipe data available', 404);
  }
  if (!recipes) {
    throw new CustomError('Max. page limit reached');
  }

  res.json({
    recipes,
    count,
  });
});

exports.toggleSavedRecipe = catchErrors(async (req, res) => {
  const isSavedRecipe = req.recipe.savedby.filter((id) =>
    id.equals(req.user._id)
  );
  if (isSavedRecipe.length) {
    req.recipe.savedby.pull(req.user._id);
  } else {
    req.recipe.savedby.push(req.user._id);
  }

  await req.recipe.save();

  res.json({ status: 'success' });
});

exports.searchRecipe = catchErrors(async (req, res) => {
  const searchTerm = req.query['name'];
  if (!searchTerm) {
    throw new CustomError('Invalid request', 400);
  }
  const searchTermRegExp = new RegExp(searchTerm, 'i');
  // TODO: enable text search, with name and desc
  const recipeList = await Recipe.find({ name: searchTermRegExp })
    .limit(6)
    .sort({ updatedAt: -1 })
    .select('name');

  res.json(recipeList);
});

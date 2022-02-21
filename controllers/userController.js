const User = require('../models/user');
const CustomError = require('../utils/customError');
const { v4: uuidv4 } = require('uuid');
const debug = require('debug')('recipe-mate:admin-userController');

exports.getUserByIdForAdmin = async (req, res, next, id) => {
  const user = await User.findOne({ _id: id, role: 0 }).select({
    password: 0,
    resetPasswodToken: 0,
    resetPasswordExpires: 0,
  });
  if (!user) {
    throw new CustomError('No user found', 404);
  }
  req.selectedUser = user;
  next();
};

exports.getSingleUser = (req, res) =>
  res.json({ status: 'Success', user: req.selectedUser });

exports.getAllUsers = async (req, res) => {
  const page = req.query.page || 1;
  const limit = 5;
  const offset = (page - 1) * limit;

  const usersPromise = User.find({ role: 0 }).skip(offset).limit(limit).select({
    password: 0,
    resetPasswodToken: 0,
    resetPasswordExpires: 0,
  });
  const totalCountPromise = User.estimatedDocumentCount();
  const adminCountPromise = User.count({ role: { $gt: 0 } });
  const [users, totalCount, adminCount] = await Promise.all([
    usersPromise,
    totalCountPromise,
    adminCountPromise,
  ]);

  if (totalCount - adminCount < 1) {
    throw new CustomError('No user available', 404);
  }
  if (!users.length) {
    // redirect to page 1
    throw new CustomError('Reached max page limit', 400);
  }
  res.json({ users, count: totalCount - adminCount });
};

exports.addUser = async (req, res) => {
  let ransStr = uuidv4();
  const user = new User({ ...req.body, password: ransStr });
  let isValidUser = user.validateSync();
  if (isValidUser) {
    throw new CustomError(isValidUser, 400);
  }
  await user.save();
  res.json({
    status: 'Successfully created user',
  });
};

exports.updateUser = async (req, res) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.selectedUser._id,
    req.body,
    {
      runValidators: true,
      new: true,
      multipleCastError: true,
      timestamps: true,
    }
  ).select({
    password: 0,
    resetPasswodToken: 0,
    resetPasswordExpires: 0,
  });
  res.json({ status: 'Successfully updated', user: updatedUser });
};

exports.deleteUser = async (req, res) => {
  const { deletedCount } = await User.deleteOne({ _id: req.selectedUser._id });
  res.json({ status: `Successfully deleted ${deletedCount} user` });
};

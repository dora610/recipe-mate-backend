const {
  getAllUsers,
  getSingleUser,
  deleteUser,
  updateUser,
  getUserByIdForAdmin,
  addUser,
} = require('../controllers/userController');
const {
  isAuthenticated,
  isAuthorised,
  isAdmin,
} = require('../controllers/authController');
const { validateConcurrent } = require('../middlewares/reqValidator');
const {
  updateUserValidator,
  getSingleUserValidator,
} = require('../validations/adminUserValidator');
const { catchErrors, catchErrorsForParams } = require('../utils/errorHandler');

const router = require('express').Router();

router.use(isAuthenticated);
router.use(isAuthorised);
router.use(isAdmin);

router.param('userId', catchErrorsForParams(getUserByIdForAdmin));

router.get('/all', catchErrors(getAllUsers));
router
  .route('/:userId')
  .get(validateConcurrent(getSingleUserValidator), getSingleUser)
  .put(validateConcurrent(updateUserValidator), catchErrors(updateUser))
  .delete(validateConcurrent(getSingleUserValidator), catchErrors(deleteUser));

router.post(
  '/',
  validateConcurrent(getSingleUserValidator),
  catchErrors(addUser)
);

module.exports = router;

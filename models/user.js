const mongoose = require('mongoose');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const beautifyUnique = require('mongoose-beautiful-unique-validation');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      trim: true,
      required: [true, 'First name is required'],
      maxlength: 15,
    },
    middleName: {
      type: String,
      trim: true,
      maxlength: 15,
    },
    lastName: {
      type: String,
      trim: true,
      required: [true, 'Last name is required'],
      maxlength: 15,
    },
    email: {
      type: String,
      trim: true,
      required: [true, 'Email is required'],
      maxlength: 30,
      unique: 'Email ({VALUE}) already exists',
    },
    password: {
      type: String,
      required: [true, 'Password is missing'],
      minlength: [8, 'Must be at least 8, got {VALUE}'],
    },
    role: {
      type: Number,
      default: 0, // 0- normal user, 1- admin
    },
    resetPasswodToken: {
      type: String,
    },
    resetPasswordExpires: {
      type: Date,
    },
  },
  { timestamps: true }
);

userSchema.set('toObject', { virtuals: true });
userSchema.set('toJSON', { virtuals: true });

userSchema.pre('save', function (next) {
  if (!this.isModified('password')) return next();

  this.password = this.securePassword(this.password);
  next();
});

userSchema
  .virtual('fullName')
  .set(function (fullname) {
    if (!fullname) return '';

    let nameCombo = fullname.split(' ');

    if (nameCombo.length < 2) return '';

    this.firstName = nameCombo[0];
    this.lastName = nameCombo.at(-1);
    if (nameCombo.length >= 3) {
      this.middleName = nameCombo.slice(1, -1).join(' ');
    }
  })
  .get(function () {
    return this.firstName + ' ' + this.lastName;
  });

userSchema.method({
  securePassword: function (plainTextPassword) {
    if (!plainTextPassword) return '';

    const secret = process.env.SECRET;
    return crypto
      .createHmac('sha256', secret)
      .update(plainTextPassword)
      .digest('hex');
  },

  validatePassword: function (password) {
    return this.securePassword(password) === this.password;
  },

  getJwtToken: function () {
    return jwt.sign(
      { id: this._id, email: this.email },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: parseInt(process.env.MAXAGESEC),
      }
    );
  },

  verifyJwt: function (token) {
    return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  },

  getForgotPasswordToken: function () {
    const token = crypto.randomBytes(24).toString('hex');
    this.resetPasswodToken = token;
    this.resetPasswordExpires = Date.now() + 1000 * 60 * 20;

    return crypto
      .createHmac('sha256', process.env.SECRET)
      .update(token)
      .digest('hex');
  },

  verifyForgotPasswordToken: function (resetToken) {
    if (!this.resetPasswodToken || !this.resetPasswordExpires) {
      return false;
    }
    const encryptedToken = crypto
      .createHmac('sha256', process.env.SECRET)
      .update(this.resetPasswodToken)
      .digest('hex');
    if (
      encryptedToken === resetToken &&
      new Date() <= this.resetPasswordExpires
    ) {
      return true;
    }
    return false;
  },
});

// TODO: unable to utilize the plugin
userSchema.plugin(beautifyUnique);

module.exports = mongoose.model('User', userSchema);

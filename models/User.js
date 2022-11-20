const crypto = require('crypto')
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const slugify = require('slugify')
const CustomSchema = require('./Custom')

const UserSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'Please add a first name'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Please add a last name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
    },
    username: {
      type: String,
    },
    role: {
      type: String,
      enum: ['student', 'school', 'admin'],
      default: 'school',
    },
    password: {
      type: String,
      minLength: 6,
      select: false,
    },
    bio: String,
    bankName: String,
    bankCode: String,
    accountName: String,
    accountNumber: String,
    picture: {
      type: String,
      default: 'no-user.jpg',
    },
    schoolPayment: new mongoose.Schema(
      {
        school: {
          type: mongoose.Schema.ObjectId,
          ref: 'School',
          required: true,
        },
        fullPayment: Boolean,
        subscriptionNo: {
          type: Number,
          default: 0,
        },
        term: {
          type: Number,
          default: 1,
          min: 1,
          max: 3,
        },
        fee: [
          new mongoose.Schema(
            {
              name: {
                type: String,
                unique: true,
              },
              value: {
                type: Number,
              },
            },
            { _id: false }
          ),
        ],
      },
      { _id: false }
    ),
    authorization: [
      new mongoose.Schema(
        {
          authorizationCode: {
            type: String,
            required: true,
          },
          cardType: String,
          last4: String,
          expireYear: String,
          expireMonth: String,
          bin: String,
          bank: String,
        },
        { _id: false }
      ),
    ],
    subscription: [
      new mongoose.Schema(
        {
          planCode: {
            type: String,
            required: true,
          },
          emailToken: String,
          subscriptionCode: String,
        },
        { _id: false }
      ),
    ],
    school: {
      type: mongoose.Schema.ObjectId,
      ref: 'School',
    },
    refreshToken: String,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    customValues: CustomSchema,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

// create slug from name
UserSchema.pre('save', function (next) {
  this.username = slugify(`${this.firstName} ${this.lastName}`, {
    lower: true,
  })
  next()
})

// encrypt password using bcryptjs
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next()
  }

  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
})

// custom error message
UserSchema.post('save', function (error, doc, next) {
  if (error.name === 'MongoError' && error.code === 11000) {
    next(new Error('This account already exists'))
  } else {
    next(error)
  }
})

// sign jwt and return
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign(
    { id: this._id, firstName: this.firstName, picture: this.picture },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE,
    }
  )
}

// match user entered password to hashed password in DB
UserSchema.methods.matchPassword = async function (enteredPassword) {
  if (this.password === 'null') {
    return 'social'
  }
  return await bcrypt.compare(enteredPassword, this.password)
}

// Generate and hash password token
UserSchema.methods.getResetPasswordToken = function () {
  // Generate Token
  const resetToken = crypto.randomBytes(20).toString('hex')

  // Hash Token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex')

  // Set expire
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000

  return resetToken
}

module.exports = mongoose.model('User', UserSchema)

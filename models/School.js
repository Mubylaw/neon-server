const mongoose = require('mongoose')
const slugify = require('slugify')

const SchoolSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: [true, 'Please add a school name'],
  },
  logo: {
    type: String,
    default: 'no-logo.jpg',
  },
  customFields: [String],
  tag: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  fee: [
    new mongoose.Schema(
      {
        name: {
          type: String,
          unique: true,
        },
        compulsory: {
          type: Boolean,
          default: true,
        },
        value: {
          type: Number,
        },
        session: new mongoose.Schema(
          {
            name: {
              type: String,
            },
            term: [
              new mongoose.Schema(
                {
                  no: {
                    type: Number,
                  },
                  startDate: { type: Date },
                  endDate: { type: Date },
                },
                { _id: false }
              ),
            ],
          },
          { _id: false }
        ),
      },
      { _id: false }
    ),
  ],
  feeDeadline: {
    type: Date,
  },
  installment: new mongoose.Schema(
    {
      active: {
        type: Boolean,
        default: false,
      },
      deadline: {
        type: Date,
      },
    },
    { _id: false }
  ),
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  slug: String,
})

// create slug from name
UserSchema.pre('save', function (next) {
  this.slug = slugify(`${this.name}`, {
    lower: true,
  })
  next()
})

SchoolSchema.virtual('students', {
  ref: 'User',
  localField: '_id',
  foreignField: 'school',
})

module.exports = mongoose.model('School', SchoolSchema)

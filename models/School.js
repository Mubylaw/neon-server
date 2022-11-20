const mongoose = require('mongoose')
const slugify = require('slugify')

const SchoolSchema = new mongoose.Schema(
  {
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
    header: {
      type: String,
    },
    bio: {
      type: String,
    },
    twitter: {
      type: String,
    },
    instagram: {
      type: String,
    },
    facebook: {
      type: String,
    },
    linkedIn: {
      type: String,
    },
    no: {
      type: String,
    },
    address: {
      type: String,
    },
    color: {
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
    installment: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    slug: String,
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

// create slug from name
SchoolSchema.pre('save', function (next) {
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

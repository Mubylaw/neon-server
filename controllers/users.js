const ErrorResponse = require('../utils/errorResponse')
const asyncHandler = require('../middleware/async')
const { uploadToS3 } = require('../utils/imageUploadService')
const { sendTokenResponse } = require('../helpers/authHelpers')
const User = require('../models/User')

// @desc    Get All Users
// @route   GET /api/v1/users
// @access  Private/Admin
exports.getUsers = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults)
})

// @desc    Get a single User
// @route   GET /api/v1/users/:id
// @access  Private/Admin
exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id)
  if (!user) {
    return next(
      new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
    )
  }

  if (req.params.id !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to view this user ${req.params.id} details`,
        401
      )
    )
  }

  if (req.user.role === 'admin') {
    res.status(200).json({
      success: true,
      data: user,
    })
  } else {
    sendTokenResponse(user, 200, res)
  }
})

// @desc    Create user
// @route   POST /api/v1/users
// @access  Private/Admin
exports.createUser = asyncHandler(async (req, res, next) => {
  const user = await User.create(req.body)

  res.status(201).json({
    success: true,
    data: user,
  })
})

// @desc    Update user
// @route   PUT /api/v1/users/:id
// @access  Private/Admin
exports.updateUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id)
  if (!user) {
    return next(
      new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
    )
  }

  if (req.files) {
    const file = req.files.avatar[0]
    // make sure that the image is a photo
    if (!file.mimetype.startsWith('image')) {
      return next(new ErrorResponse(`Please upload an image file`, 400))
    }

    if (file.size > process.env.MAX_FILE_UPLOAD) {
      return next(
        new ErrorResponse(
          `Please Upload an image file less than ${
            process.env.MAX_FILE_UPLOAD / 1000000
          }mb`,
          400
        )
      )
    }

    const avatar = await uploadToS3({
      file: req.files.avatar,
      folderName: 'avatar',
    })

    req.body.picture = avatar[0]
  }

  const newUser = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })

  if (req.user.role === 'admin') {
    res.status(200).json({
      success: true,
      data: newUser,
    })
  } else {
    sendTokenResponse(newUser, 200, res)
  }
})

// @desc    Delete user
// @route   DELETE /api/v1/users/:id
// @access  Private/Admin
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id)
  if (!user) {
    return next(
      new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
    )
  }

  await User.findByIdAndDelete(req.params.id)

  res.status(200).json({
    success: true,
    data: {},
  })
})

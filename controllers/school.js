const ErrorResponse = require('../utils/errorResponse')
const asyncHandler = require('../middleware/async')
const { uploadToS3 } = require('../utils/imageUploadService')
const School = require('../models/School')
const fs = require('fs')
const User = require('../models/User')
const CustomSchema = require('../models/Custom')

// @desc    Get All Schools
// @route   GET /api/v1/schools
// @access  Private/Admin
exports.getSchools = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults)
})

// @desc    Get a single School
// @route   GET /api/v1/schools/:id
// @access  Private
exports.getSchool = asyncHandler(async (req, res, next) => {
  const school = await School.findById(req.params.id).populate('students')

  if (!school) {
    return next(
      new ErrorResponse(`School not found with id of ${req.params.id}`, 404)
    )
  }

  if (req.user.id != school.createdBy && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to view this school ${req.params.id} details`,
        401
      )
    )
  }

  res.status(200).json({
    success: true,
    data: school,
  })
})

// @desc    Create school
// @route   POST /api/v1/schools
// @access  Private
exports.createSchool = asyncHandler(async (req, res, next) => {
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

    req.body.logo = avatar[0]
  }

  req.body.createdBy = req.user.id

  const school = await School.create(req.body)

  res.status(201).json({
    success: true,
    data: school,
  })
})

// @desc    Update school
// @route   PUT /api/v1/schools/:id
// @access  Private
exports.updateSchool = asyncHandler(async (req, res, next) => {
  const school = await School.findById(req.params.id).populate('students')
  if (!school) {
    return next(
      new ErrorResponse(`School not found with id of ${req.params.id}`, 404)
    )
  }

  if (req.user.id != school.createdBy && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to view this school ${req.params.id} details`,
        401
      )
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

    req.body.logo = avatar[0]
  }

  const newSchool = await School.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate('students')

  res.status(200).json({
    success: true,
    data: newSchool,
  })
})

// @desc    Delete school
// @route   DELETE /api/v1/schools/:id
// @access  Private/Admin
exports.deleteSchool = asyncHandler(async (req, res, next) => {
  const school = await School.findById(req.params.id)
  if (!school) {
    return next(
      new ErrorResponse(`School not found with id of ${req.params.id}`, 404)
    )
  }

  await School.findByIdAndDelete(req.params.id)

  res.status(200).json({
    success: true,
    data: {},
  })
})

// @desc    Upload a school's students
// @route   POST /api/v1/schools/:id/students
// @access  Private
exports.uploadStudents = asyncHandler(async (req, res, next) => {
  const school = await School.findById(req.params.id).populate('students')
  if (!school) {
    return next(
      new ErrorResponse(`School not found with id of ${req.params.id}`, 404)
    )
  }

  if (!req.files) {
    return next(new ErrorResponse(`Upload a csv file`, 404))
  }

  if (req.user.id != school.createdBy && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to view this school ${req.params.id} details`,
        401
      )
    )
  }

  const file = req.files.students[0]
  // make sure that it is a csv file
  if (!file.mimetype.includes('csv')) {
    return next(new ErrorResponse(`Please upload a csv file`, 400))
  }

  var result = [
    {
      firstname: 'Mubarak',
      lastname: 'Lawal',
      email: 'mubylaww@gmail.com',
      gender: 'male',
      class: 'ss1',
    },
    {
      firstname: 'Habibllah',
      lastname: 'Ayodele',
      email: 'hayodele4@gmail.com',
      gender: 'male',
      class: 'ss2',
    },
    {
      firstname: 'Isaac',
      lastname: 'Enobun',
      email: 'isaacenobun@com',
      gender: 'female',
      class: 'ss1',
    },
  ]

  var headers = ['firstname', 'lastname', 'email', 'gender', 'class']

  //   csv = fs.readFileSync(file.path)

  //   var lines = csv.toString().split('\n')

  //   var result = []

  //   var headers = lines[0].split(',')
  //   headers = headers.map((header) => {
  //     return header.toLowerCase()
  //   })

  //   if (!headers.includes('firstname')) {
  //     return next(new ErrorResponse(`Add a firstname column`, 400))
  //   } else if (!headers.includes('email')) {
  //     return next(new ErrorResponse(`Add a email column`, 400))
  //   } else if (!headers.includes('lastname')) {
  //     return next(new ErrorResponse(`Add a lastname column`, 400))
  //   }

  //   for (var i = 1; i < lines.length; i++) {
  //     var obj = {}
  //     var currentline = lines[i].split(',')

  //     for (var j = 0; j < headers.length; j++) {
  //       obj[headers[j]] = `${currentline[j]}`
  //     }

  //     result.push(obj)
  //   }

  var customHeader = headers.filter((header) => header !== 'email')
  customHeader = customHeader.filter((header) => header !== 'firstname')
  customHeader = customHeader.filter((header) => header !== 'lastname')
  customHeader = customHeader.filter(
    (header) => !school.customFields.includes(header)
  )

  var failed = []

  if (customHeader.length > 0) {
    var newSchool = await School.findByIdAndUpdate(
      req.params.id,
      {
        customFields: school.customFields
          ? [...school.customFields, ...customHeader]
          : customHeader,
      },
      {
        new: true,
        runValidators: true,
      }
    ).populate('students')
  }

  var objAdd = {}
  customHeader.forEach((hd) => {
    objAdd[hd] = 'string'
  })

  CustomSchema.add(objAdd)

  await Promise.all(
    result.map(async (student) => {
      var { firstname, ...studentDouble } = student
      var { lastname, ...studentDouble } = studentDouble
      var { email, ...studentDouble } = studentDouble
      const foundUser = await User.findOne({
        email: student.email.toLowerCase(),
      })
      if (foundUser) {
        await User.findByIdAndUpdate(
          foundUser._id,
          {
            customValues: studentDouble,
          },
          {
            new: true,
            runValidators: true,
          }
        )
      } else {
        try {
          await User.create({
            firstName: student.firstname,
            lastName: student.lastname,
            email: student.email.toLowerCase(),
            password: `${student.firstname.slice(
              0,
              3
            )} ${student.lastname.slice(0, 3)}`,
            customValues: studentDouble,
            role: 'student',
            school: req.params.id,
          })
        } catch (err) {
          failed.push(student)
          console.log(failed)
        }
      }
    })
  )

  res.status(200).json({
    success: true,
    data: result,
    failed: failed.length > 0 ? failed : 'All students added successfully',
    school: newSchool ? newSchool : 'No new school updates',
  })
})

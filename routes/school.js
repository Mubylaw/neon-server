const express = require('express')
const multer = require('multer')
const upload = multer({
  dest: 'temp/',
  limits: { fieldSize: 8 * 1024 * 1024 },
}).fields([
  {
    name: 'avatar',
    maxCount: 1,
  },
])
const uploadCsv = multer({
  dest: 'temp/',
  limits: { fieldSize: 8 * 1024 * 1024 },
}).fields([
  {
    name: 'students',
    maxCount: 1,
  },
])
const {
  getSchools,
  getSchool,
  getSchoolByTag,
  createSchool,
  updateSchool,
  deleteSchool,
  uploadStudents,
} = require('../controllers/school')

const School = require('../models/School')

const router = express.Router({ mergeParams: true })

// Protect middleware
const { protect, authorize } = require('../middleware/auth')
const advancedResults = require('../middleware/advancedResults')

router.get('/tag/:id', getSchoolByTag)

router.use(protect)

router.post('/', upload, createSchool)
router.get('/:id', getSchool)
router.put('/:id', upload, updateSchool)
router.post('/:id/students', uploadCsv, uploadStudents)

router.use(authorize('admin'))

router.get('/', advancedResults(School), getSchools)

router.route('/:id').delete(deleteSchool)

module.exports = router

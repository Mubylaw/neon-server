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
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
} = require('../controllers/users')

const User = require('../models/User')

const router = express.Router({ mergeParams: true })

// Protect middleware
const { protect, authorize } = require('../middleware/auth')
const advancedResults = require('../middleware/advancedResults')

router.use(protect)

router.put('/:id', upload, updateUser)
router.get('/:id', getUser)

router.use(authorize('admin'))

router.route('/').get(advancedResults(User), getUsers).post(createUser)

router.route('/:id').delete(deleteUser)

module.exports = router

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
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  updateDetails,
  updatePassword,
  logout,
  userPhotoUpload,
} = require('../controllers/auth')

const router = express.Router()

const { protect } = require('../middleware/auth')

router.post('/register', register)
router.post('/login', login)
router.get('/me', protect, getMe)
router.post('/forgotpassword', forgotPassword)
router.put('/resetpassword/:resettoken', resetPassword)
router.put('/updatedetails', protect, updateDetails)
router.put('/updatepassword', protect, updatePassword)
router.get('/logout', protect, logout)
router.put('/avatar', protect, upload, userPhotoUpload)

module.exports = router

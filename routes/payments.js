const express = require('express')
const {
  generateToken,
  initializeTransaction,
  paySubscription,
  webhook,
} = require('../controllers/payments')

// Protect middleware
const { protect, authorize } = require('../middleware/auth')

const router = express.Router()

router.get('/generatetoken', protect, generateToken)
router.post('/initializetransaction', protect, initializeTransaction)
router.post('/subscription', protect, paySubscription)
router.post('/webhook', webhook)

module.exports = router

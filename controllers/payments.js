const axios = require('axios')
const ErrorResponse = require('../utils/errorResponse')
const asyncHandler = require('../middleware/async')
const User = require('../models/User')
const Event = require('../models/Event')
const { v4: uuidv4 } = require('uuid')

// @desc    Generate Bearer token
// @route   GET /api/v1/payments/generateToken
// @access  Private/Admin
exports.generateToken = asyncHandler(async (req, res, next) => {
  var option = {
    key: `${process.env.SEERBIT_SECRET_KEY}.${process.env.SEERBIT_PUBLIC_KEY}`,
  }

  // Generate Token
  const generate_token = 'https://seerbitapi.com/api/v2/encrypt/keys'
  const transaction = await axios(generate_token, {
    method: 'POST',
    data: option,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  res.status(200).json({
    success: true,
    data: transaction.data,
  })
})

// @desc    Generate Hash
// @route   POST /api/v1/payments/initiatetransaction
// @access  Private
exports.initializeTransaction = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).populate('school')

  if (
    user.schoolPayment &&
    user.schoolPayment.fullPayment &&
    user.schoolPayment.term === req.body.term
  ) {
    return next(
      new ErrorResponse(`User with id of ${req.user.id} has already paid`, 400)
    )
  }

  var amount = 0
  req.body.fee.forEach((fe) => (amount += fe.value))
  const paymentReference = uuidv4()

  const options = JSON.stringify({
    publicKey: process.env.SEERBIT_PUBLIC_KEY,
    amount: `${amount}.00`,
    currency: 'NGN',
    country: 'NG',
    paymentReference,
    email: user.email,
    productId: user.school._id,
    productDescription: req.body.term,
    callbackUrl: 'http://localhost:5000',
  })

  // Initialize Transaction
  const generate_hash = 'https://seerbitapi.com/api/v2/encrypt/hashs'
  const hash = await axios(generate_hash, {
    method: 'POST',
    data: options,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!hash.data) {
    return next(new ErrorResponse(`Something went wrong, try again`, 404))
  }

  const transactionOptions = JSON.stringify({
    publicKey: process.env.SEERBIT_PUBLIC_KEY,
    amount: `${amount}.00`,
    currency: 'NGN',
    country: 'NG',
    paymentReference,
    email: user.email,
    productId: user.school._id,
    productDescription: user.school.name,
    callbackUrl: 'http://localhost:5000',
    hash: hash.data.data.hash.hash,
    hashType: 'sha256',
  })

  // Initialize Transaction
  const initalize_transaction_url = 'https://seerbitapi.com/api/v2/payments'
  const transaction = await axios(initalize_transaction_url, {
    method: 'POST',
    data: transactionOptions,
    headers: {
      Authorization: `Bearer ${process.env.SEERBIT_ENCRYPTED_KEY}`,
      'Content-Type': 'application/json',
    },
  })

  if (transaction.data) {
    await Event.create({
      transactionId: `${paymentReference}`,
      fee: req.body.fee,
      user: user.email,
      term: req.body.term,
      type: 'full',
    })
  }

  // Change this to res.redirect
  res.status(200).json({
    success: true,
    data: transaction.data,
  })
})

// @desc    Pay Subscription
// @route   POST /api/v1/payments/subscription
// @access  Private
exports.paySubscription = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).populate('school')

  if (
    user.schoolPayment &&
    user.schoolPayment.fullPayment &&
    user.schoolPayment.term === req.body.term
  ) {
    return next(
      new ErrorResponse(`User with id of ${req.user.id} has already paid`, 400)
    )
  }

  var amount = 0
  req.body.fee.forEach((fe) => (amount += fe.value))
  amount = amount / 3
  const paymentReference = uuidv4()

  const options = JSON.stringify({
    publicKey: process.env.SEERBIT_PUBLIC_KEY,
    paymentReference,
    planId: '',
    cardNumber: req.body.cardNo,
    expiryMonth: req.body.month,
    amount: Math.ceil(amount / 100) * 100,
    callbackUrl: 'http://localhost:5000',
    expiryYear: req.body.year,
    cvv: req.body.cvv,
    currency: 'NGN',
    productId: user.school._id,
    productDescription: user.school.name,
    country: 'NG',
    startDate: '2020-02-25 00:00:00',
    cardName: req.body.cardName,
    billingCycle: 'MONTHLY',
    type: '3DSECURE',
    email: user.email,
    customerId: user._id,
    mobileNumber: '',
    billingPeriod: '3',
    subscriptionAmount: true,
  })

  // Initialize Transaction
  const initalize_transaction_url =
    'https://seerbitapi.com/api/v2/recurring/subscribes'
  const transaction = await axios(initalize_transaction_url, {
    method: 'POST',
    data: options,
    headers: {
      Authorization: `Bearer ${process.env.SEERBIT_ENCRYPTED_KEY}`,
      'Content-Type': 'application/json',
    },
  })

  if (transaction.data) {
    await Event.create({
      transactionId: `${paymentReference}`,
      fee: req.body.fee,
      user: user.email,
      term: req.body.term,
      type: 'sub',
    })
  }

  // Change this to res.redirect
  res.status(200).json({
    success: true,
    data: transaction.data,
  })
})

// @desc    Verify subscription
// @route   POST /api/v1/payments/webhook
// @access  Private
exports.webhook = asyncHandler(async (req, res, next) => {
  //validate event
  res.sendStatus(200)

  var event = req.body
  console.log(event)
  var chargeEvent = await Event.find({
    transactionId: `${event.notificationItems[0].notificationRequestItem.eventId}`,
    type: 'charge',
  })
  if (chargeEvent.length === 0) {
    // find details about this transaction
    var transactionDetails = await Event.find({
      transactionId: `${event.notificationItems[0].notificationRequestItem.data.reference}`,
    })

    if (transactionDetails) {
      var user = await User.findOne({
        email: transactionDetails.user,
      })
      if (user) {
        var susNo
        if (
          event.notificationItems[0].notificationRequestItem.eventType ===
          'transaction'
        ) {
          let schoolPayment = {
            school: user.school,
            fullPayment: true,
            term: transactionDetails.term,
            fee: transactionDetails.fee,
          }

          await User.findByIdAndUpdate(
            user._id,
            {
              schoolPayment,
            },
            {
              new: true,
              runValidators: true,
            }
          )
        }

        if (
          event.notificationItems[0].notificationRequestItem.eventType ===
            'transaction.recurrent' ||
          event.notificationItems[0].notificationRequestItem.eventType ===
            'transaction.recurring.debit'
        ) {
          if (user.schoolPayment) {
            if (user.schoolPayment.subscriptionNo === 3) {
              susNo = 1
            } else {
              susNo = user.schoolPayment.subscriptionNo + 1
            }
          } else {
            susNo = 1
          }
          let schoolPayment = {
            school: user.school,
            fullPayment: susNo === 3 ? true : false,
            term: transactionDetails.term,
            fee: transactionDetails.fee,
          }

          await User.findByIdAndUpdate(
            user._id,
            {
              schoolPayment,
            },
            {
              new: true,
              runValidators: true,
            }
          )
        }
      }
      await Event.create({
        transactionId: `${event.notificationItems[0].notificationRequestItem.eventId}`,
        type: 'charge',
      })
    }
  }
})

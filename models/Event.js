const mongoose = require('mongoose')

const EventSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    unique: true,
  },
  type: String,
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
  user: String,
  term: Number,
})

module.exports = mongoose.model('Event', EventSchema)

const mongoose = require('mongoose')

const CustomSchema = new mongoose.Schema({}, { _id: false })

module.exports = CustomSchema

const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

const planSchema = mongoose.Schema({
  planName: {
    type: String,
    minlength: [1, 'plan name must be at least 1 character long'],
    maxlength: [55, 'plan name must be at most 55 characters long'],
    required: true,
  },
  planMemo: {
    type: String,
    minlength: [1, 'plan memo must be at least 1 character long'],
    maxlength: [2500, 'plan memo must be at most 2500 characters long'],
    required: true,
  },
  user:  {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
})

planSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
    delete returnedObject.passwordHash
  }
})

planSchema.plugin(uniqueValidator)

const Plan = mongoose.model('Plan', planSchema)

module.exports = Plan
const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

const userSchema = mongoose.Schema({
  username: {
    type: String,
    minlength: [3, 'username must be at least 3 characters long'],
    maxlength: [30, 'username must be at most 30 characters long'],
    required: true,
    match: [/^[a-zA-Z0-9_-]{3,30}$/, 'username must not contain white spaces or special characters other than _ or -'],
    unique: true,
  },
  passwordHash: String,
  tooltips: {
    type: Boolean,
    default: true,
  },
  plans: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan'
    }
  ],
  workouts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workout'
    }
  ],
})

userSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
    delete returnedObject.passwordHash
  }
})

userSchema.plugin(uniqueValidator)

const User = mongoose.model('User', userSchema)

module.exports = User
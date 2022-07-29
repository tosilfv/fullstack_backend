const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

const workoutSchema = mongoose.Schema({
  categoryTitle: {
    type: String,
    maxlength: [55, 'category and title must be at most 55 characters long'],
  },
  target: {
    type: Number,
    maxlength: [40, 'target must be at most 40 characters long'],
  },
  result: {
    type: [mongoose.Schema.Types.Mixed],
    maxlength: [40, 'result must be at most 40 characters long'],
  },
  notes: {
    type: String,
    maxlength: [5000, 'notes must be at most 5000 characters long'],
  },
  user:  {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
})

workoutSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
    delete returnedObject.passwordHash
  }
})

workoutSchema.plugin(uniqueValidator)

const Workout = mongoose.model('Workout', workoutSchema)

module.exports = Workout
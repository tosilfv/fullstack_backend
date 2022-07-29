const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

const passwordSchema = mongoose.Schema({
  password: {
    type: String,
    minlength: [8, 'password must be at least 8 characters long'],
    maxlength: [50, 'password must be at most 50 characters long'],
    required: true,
    match: [/^(?=.*\d)(?=.*[\W_]+)(?=.*[a-z])(?=.*[A-Z])(?!.*\s)(?!.*[åäöœæøÅÄÖŒÆØ]).{8,50}$/,
      'password must have at least one lowercase letter, one uppercase letter, one number, one special character, no white spaces and no scands'],
  },
})

passwordSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
    delete returnedObject.password
  }
})

passwordSchema.plugin(uniqueValidator)

const Password = mongoose.model('Password', passwordSchema)

module.exports = Password
const bcrypt = require('bcryptjs')
const registerRouter = require('express').Router()
const Password = require('../models/password')
const User = require('../models/user')

registerRouter.post('/', async (request, response) => {
  const body = request.body

  const password = new Password({
    password: body.password,
  })

  const saltRounds = parseInt(process.env.SALT_ROUNDS)
  const passwordHash = await bcrypt.hash(password.password, saltRounds)

  const user = new User({
    username: body.username,
    passwordHash,
  })

  const savedUser = await user.save()

  // save password to enable password validation in password.js
  await password.save()

  // delete password from database
  await password.delete()

  response.status(201).json(savedUser)
})

module.exports = registerRouter
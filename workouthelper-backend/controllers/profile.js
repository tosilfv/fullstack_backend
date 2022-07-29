const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const profileRouter = require('express').Router()
const Password = require('../models/password')
const User = require('../models/user')

profileRouter.put('/newPassword', async (request, response) => {
  const oldPassword = request.body.oldPassword
  const newPassword = request.body.newPassword

  if (!oldPassword || !newPassword) {
    return response.status(400).json({ error: 'old password or new password is missing' })
  }

  const decodedToken = jwt.verify(request.token, process.env.SECRET)

  if (!request.token || !decodedToken.id) {
    return response.status(401).json({ error: 'token is missing or invalid' })
  }

  const password = new Password({
    password: newPassword,
  })

  const saltRounds = parseInt(process.env.SALT_ROUNDS)
  const passwordHash = await bcrypt.hash(password.password, saltRounds)

  const user = await User
    .findById(decodedToken.id)

  const passwordCorrect = user === null
    ? false
    : await bcrypt.compare(oldPassword, user.passwordHash)

  if (!(user && passwordCorrect)) {
    return response.status(401).json({
      error: 'invalid old password'
    })
  }

  const updatedUser = await User
    .findByIdAndUpdate(decodedToken.id, { passwordHash: passwordHash }, { new: true })

  response.status(200).json(updatedUser)
})

profileRouter.put('/toggleTooltips', async (request, response) => {
  const decodedToken = jwt.verify(request.token, process.env.SECRET)

  if (!request.token || !decodedToken.id) {
    return response.status(401).json({ error: 'token is missing or invalid' })
  }

  const updatedUser = await User
    .findByIdAndUpdate(decodedToken.id, { tooltips: request.body.tooltips }, { new: true })

  response.status(200).json(updatedUser)
})

profileRouter.post('/tooltips', async (request, response) => {
  const decodedToken = jwt.verify(request.token, process.env.SECRET)

  if (!request.token || !decodedToken.id) {
    return response.status(401).json({ error: 'token is missing or invalid' })
  }

  const user = await User
    .findById(decodedToken.id)
    .populate('tooltips', { username: 1, tooltips: 1 })

  response.json(user.tooltips)
})

module.exports = profileRouter
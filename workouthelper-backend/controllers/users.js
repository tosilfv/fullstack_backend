const usersRouter = require('express').Router()
const User = require('../models/user')

usersRouter.get('/', async (request, response) => {
  const users = await User
    .find({}).populate('username', { username: 1, })
  response.json(users.map(u => u.toJSON()))
})

module.exports = usersRouter
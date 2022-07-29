const welcomeRouter = require('express').Router()

welcomeRouter.get('/*', async (request, response) => {
  response.status(200).redirect('/')
})

module.exports = welcomeRouter
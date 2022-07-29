const config = require('./utils/config')
const express = require('express')
require('express-async-errors')
const cors = require('cors')
const logger = require('./utils/logger')
const middleware = require('./utils/middleware')
const deleteRouter = require('./controllers/delete')
const loginRouter = require('./controllers/login')
const plannerRouter = require('./controllers/planner')
const profileRouter = require('./controllers/profile')
const workoutRouter = require('./controllers/workouts')
const registerRouter = require('./controllers/register')
const usersRouter = require('./controllers/users')
const welcomeRouter = require('./controllers/welcome')
const mongoose = require('mongoose')
const app = express()

logger.info(`connecting to ${config.MONGODB_URI}`)

mongoose.connect(config.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true, })
  .then(() => {
    if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'development') {
      console.log('connected to MongoDB')
    }
  })
  .catch((error) => {
    console.log(`error connecting to MongoDB: ${error.message}`)
  })

app.use(express.static('build'))
app.use(cors())
app.use(express.json())
app.use(middleware.requestLogger)
app.use(middleware.tokenExtractor)

app.use('/api/delete', deleteRouter)
app.use('/api/users', usersRouter)
app.use('/dashboard/planner', plannerRouter)
app.use('/dashboard/profile', profileRouter)
app.use('/dashboard/workouts', workoutRouter)
app.use('/welcome/login', loginRouter)
app.use('/welcome/register', registerRouter)
app.use('/*', welcomeRouter)

app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)

module.exports = app
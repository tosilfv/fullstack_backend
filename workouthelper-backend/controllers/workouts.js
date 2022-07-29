const jwt = require('jsonwebtoken')
const workoutRouter = require('express').Router()
const User = require('../models/user')
const Workout = require('../models/workout')

workoutRouter.post('/newWorkout', async (request, response) => {
  const workout = new Workout(request.body)

  if (!workout.categoryTitle || !workout.target) {
    return response.status(400).json({ error: 'category title or target is missing' })
  }

  if (workout.categoryTitle.trim().length === 0) {
    return response.status(400).json({ error: 'category title must have text content' })
  }

  const decodedToken = jwt.verify(request.token, process.env.SECRET)

  if (!request.token || !decodedToken.id) {
    return response.status(401).json({ error: 'token is missing or invalid' })
  }

  const workouts = await User
    .findById(decodedToken.id)
    .populate('workouts', { categoryTitle: 1, target: 1 })

  let categoryTitleIsInUse = false

  workouts.workouts.map(w => {
    w.categoryTitle === workout.categoryTitle ? categoryTitleIsInUse = true : null
  })

  if (categoryTitleIsInUse) {
    return response.status(400).json({ error: 'category title is already in use' })
  }

  const user = await User.findById(decodedToken.id)

  workout.user = user
  const savedWorkout = await workout.save()

  user.workouts = user.workouts.concat(savedWorkout._id)
  await user.save()

  response.status(201).json(savedWorkout)
})

workoutRouter.put('/updateWorkout', async (request, response) => {
  const decodedToken = jwt.verify(request.token, process.env.SECRET)

  if (!request.token || !decodedToken.id) {
    return response.status(401).json({ error: 'token is missing or invalid' })
  }

  const workout = request.body

  if (!workout.result) {
    return response.status(400).json({ error: 'result is missing' })
  }

  if (!parseFloat(workout.result.result)) {
    return response.status(400).json({ error: 'result is not a number' })
  }

  const workouts = await User
    .findById(decodedToken.id)
    .populate('workouts', { categoryTitle: 1, target: 1, result: 1, notes: 1, user: 1 })

  let foundWorkout = null

  workouts.workouts.map(w => {
    w.categoryTitle === workout.categoryTitle ? foundWorkout = w : null
  })

  if (workout.target.length > 0) {
    if (!parseFloat(workout.target)) {
      return response.status(400).json({ error: 'target is not a number' })
    } else {
      foundWorkout.target = parseFloat(workout.target)
    }
  }

  foundWorkout.result.push({
    date: workout.result.date,
    result: parseFloat(workout.result.result)
  })

  if (workout.notes.length > 0) {
    foundWorkout.notes = foundWorkout.notes.concat(`\n${workout.notes}`)
  }

  const updatedWorkout = await Workout
    .findByIdAndUpdate(
      foundWorkout.id,
      {
        target: foundWorkout.target,
        result: foundWorkout.result,
        notes: foundWorkout.notes,
      },
      { new: true })
    .populate('user')

  response.status(200).json(updatedWorkout)
})

workoutRouter.post('/workouts', async (request, response) => {
  const decodedToken = jwt.verify(request.token, process.env.SECRET)

  if (!request.token || !decodedToken.id) {
    return response.status(401).json({ error: 'token is missing or invalid' })
  }

  const workouts = await User
    .findById(decodedToken.id)
    .populate('workouts', { categoryTitle: 1, target: 1, result: 1, notes: 1 })

  response.json(workouts.workouts)
})

module.exports = workoutRouter
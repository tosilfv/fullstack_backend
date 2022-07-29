const jwt = require('jsonwebtoken')
const deleteRouter = require('express').Router()
const Plan = require('../models/plan')
const User = require('../models/user')
const Workout = require('../models/workout')

deleteRouter.delete('/plan/:plan', async (request, response) => {
  const decodedToken = jwt.verify(request.token, process.env.SECRET)

  if (!request.token || !decodedToken.id) {
    return response.status(401).json({ error: 'token is missing or invalid' })
  }

  const plans = await User
    .findById(decodedToken.id)
    .populate('plans', { planName: 1, planMemo: 1 })

  let plan = null
  plans.plans.filter(p => p.planName === request.params.plan ? plan = p : null)

  const deletePlan = plan

  if (!deletePlan) {
    return response.status(404).json({
      error: 'plan is not found'
    })
  }

  // delete plan from database
  await deletePlan.delete()

  // filter out the deleted plan from user plans
  plans.plans = plans.plans.filter(p => p._id !== plan._id)

  // save user plans without the deleted plan
  await plans.save()

  response.status(204).end()
})

deleteRouter.delete('/workout/:workout', async (request, response) => {
  const decodedToken = jwt.verify(request.token, process.env.SECRET)

  if (!request.token || !decodedToken.id) {
    return response.status(401).json({ error: 'token is missing or invalid' })
  }

  const workouts = await User
    .findById(decodedToken.id)
    .populate('workouts', { categoryTitle: 1, target: 1 })

  let workout = null
  workouts.workouts.filter(w => w.categoryTitle === request.params.workout ? workout = w : null)

  const deleteWorkout = workout

  if (!deleteWorkout) {
    return response.status(404).json({
      error: 'workout is not found'
    })
  }

  // delete workout from database
  await deleteWorkout.delete()

  // filter out the deleted workout from user workouts
  workouts.workouts = workouts.workouts.filter(w => w._id !== workout._id)

  // save user workouts without the deleted workout
  await workouts.save()

  response.status(204).end()
})

deleteRouter.delete('/:username', async (request, response) => {
  const decodedToken = jwt.verify(request.token, process.env.SECRET)

  if (!request.token || !decodedToken.id) {
    return response.status(401).json({ error: 'token is missing or invalid' })
  }

  const users = await User
    .find({})

  let user = null
  users.filter(u => u.username === request.params.username ? user = u : null)

  const deleteUser = user

  if (!deleteUser) {
    return response.status(404).json({
      error: 'user is not found'
    })
  }

  // delete user workouts from database
  await Workout.deleteMany({ user: { $eq: deleteUser._id } })

  // delete user plans from database
  await Plan.deleteMany({ user: { $eq: deleteUser._id } })

  // delete user from database
  await deleteUser.delete()

  response.status(204).end()
})

module.exports = deleteRouter
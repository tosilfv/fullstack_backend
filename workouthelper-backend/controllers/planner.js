const jwt = require('jsonwebtoken')
const plannerRouter = require('express').Router()
const Plan = require('../models/plan')
const User = require('../models/user')

plannerRouter.post('/newPlan', async (request, response) => {
  const plan = new Plan(request.body)

  if (!plan.planName || !plan.planMemo) {
    return response.status(400).json({ error: 'plan name or plan memo is missing' })
  }

  if (plan.planName.trim().length === 0) {
    return response.status(400).json({ error: 'plan name must have text content' })
  }

  const decodedToken = jwt.verify(request.token, process.env.SECRET)

  if (!request.token || !decodedToken.id) {
    return response.status(401).json({ error: 'token is missing or invalid' })
  }

  const plans = await User
    .findById(decodedToken.id)
    .populate('plans', { planName: 1, planMemo: 1 })

  let planNameIsInUse = false

  plans.plans.map(p => {
    p.planName === plan.planName ? planNameIsInUse = true : null
  })

  if (planNameIsInUse) {
    return response.status(400).json({ error: 'plan name is already in use' })
  }

  const user = await User.findById(decodedToken.id)

  plan.user = user
  const savedPlan = await plan.save()

  user.plans = user.plans.concat(savedPlan._id)
  await user.save()

  response.status(201).json(savedPlan)
})

plannerRouter.post('/plans', async (request, response) => {
  const decodedToken = jwt.verify(request.token, process.env.SECRET)

  if (!request.token || !decodedToken.id) {
    return response.status(401).json({ error: 'token is missing or invalid' })
  }

  const plans = await User
    .findById(decodedToken.id)
    .populate('plans', { planName: 1, planMemo: 1 })

  response.json(plans.plans)
})

module.exports = plannerRouter
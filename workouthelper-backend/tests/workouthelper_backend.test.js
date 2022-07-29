const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)
const bcrypt = require('bcryptjs')
const helper_backend = require('./test_helper_backend')
const Password = require('../models/password')
const Plan = require('../models/plan')
const User = require('../models/user')
const Workout = require('../models/workout')

describe('backend dummy test', () => {
  test('dummy_one returns 1', () => {
    expect(helper_backend.dummy_one()).toBe(1)
  })
})

describe('backend maintenance tests', () => {
  beforeEach(async () => {
    await User.deleteMany({})
  })

  test('register page is found and is of right type', async () => {
    await api
      .get('/welcome/register')
      .expect(302)
      .expect('Content-Type', 'text/plain; charset=utf-8')
  })

  test('user creation succeeds with fresh username and minimal input', async () => {
    const usersAtStart = await helper_backend.usersInDb()

    const user = {
      username: helper_backend.createUsername(3),
      password: helper_backend.createPassword(8),
    }

    await api
      .post('/welcome/register')
      .send(user)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper_backend.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)

    const usernames = usersAtEnd.map(u => u.username)
    expect(usernames).toContain(user.username)
  })

  test('user creation succeeds with fresh username and maximal input', async () => {
    const usersAtStart = await helper_backend.usersInDb()

    const user = {
      username: helper_backend.createUsername(30),
      password: helper_backend.createPassword(50),
    }

    await api
      .post('/welcome/register')
      .send(user)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper_backend.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)

    const usernames = usersAtEnd.map(u => u.username)
    expect(usernames).toContain(user.username)
  })

  test('when logged in and authenticated, user delete succeeds with fresh username', async () => {
    const usersAtStart = await helper_backend.usersInDb()

    const user = {
      username: helper_backend.createUsername(15),
      password: helper_backend.createPassword(20),
    }

    await api
      .post('/welcome/register')
      .send(user)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    let usersAtEnd = await helper_backend.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)

    let usernames = usersAtEnd.map(u => u.username)
    expect(usernames).toContain(user.username)

    const loginUser = {
      username: user.username,
      password: user.password,
    }

    const userResult = await api
      .post('/welcome/login')
      .send(loginUser)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    expect(userResult.body.token)
      .toBeDefined()

    const authorization = `bearer ${userResult.body.token}`

    await api
      .delete(`/api/delete/${loginUser.username}`)
      .set('Authorization', authorization)
      .send(loginUser.username)
      .expect(204)

    usersAtEnd = await helper_backend.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)

    usernames = usersAtEnd.map(u => u.username)
    expect(usernames).not.toContain(user.username)
  })
})

describe('backend register form tests', () => {
  describe('when there is initially one user at db', () => {
    beforeEach(async () => {
      await User.deleteMany({})

      const password = new Password({
        password: helper_backend.createPassword(8),
      })

      const passwordHash = await bcrypt.hash(password.password, parseInt(process.env.SALT_ROUNDS))

      const user = new User({
        username: process.env.USER_NAME,
        passwordHash,
      })

      await user.save()
    })

    describe('username tests', () => {
      test('creation fails if too short', async () => {
        const user = {
          username: helper_backend.createUsername(2),
          password: helper_backend.createPassword(50),
        }

        const result = await api
          .post('/welcome/register')
          .send(user)
          .expect(400)
          .expect('Content-Type', /application\/json/)

        expect(result.body.error).toContain('username must be at least 3 characters long')
      })

      test('creation fails if too long', async () => {
        const user = {
          username: helper_backend.createUsername(31),
          password: helper_backend.createPassword(50),
        }

        const result = await api
          .post('/welcome/register')
          .send(user)
          .expect(400)
          .expect('Content-Type', /application\/json/)

        expect(result.body.error).toContain('username must be at most 30 characters long')
      })

      test('creation fails if empty', async () => {
        const user = {
          username: helper_backend.createUsername(0),
          password: helper_backend.createPassword(50),
        }

        const result = await api
          .post('/welcome/register')
          .send(user)
          .expect(400)
          .expect('Content-Type', /application\/json/)

        expect(result.body.error).toContain('`username` is required')
      })

      test('creation fails if space character at start', async () => {
        const user = {
          username: helper_backend.createSpaceCharacter() + helper_backend.createUsername(29),
          password: helper_backend.createPassword(8),
        }

        const result = await api
          .post('/welcome/register')
          .send(user)
          .expect(400)
          .expect('Content-Type', /application\/json/)

        expect(result.body.error).toContain('username must not contain white spaces or special characters other than _ or -')
      })

      test('creation fails if space character inside', async () => {
        const user = {
          username: helper_backend.createUsername(1) + helper_backend.createSpaceCharacter() + helper_backend.createUsername(1),
          password: helper_backend.createPassword(8),
        }

        const result = await api
          .post('/welcome/register')
          .send(user)
          .expect(400)
          .expect('Content-Type', /application\/json/)

        expect(result.body.error).toContain('username must not contain white spaces or special characters other than _ or -')
      })

      test('creation fails if space character at end', async () => {
        const user = {
          username: helper_backend.createUsername(2) + helper_backend.createSpaceCharacter(),
          password: helper_backend.createPassword(8),
        }

        const result = await api
          .post('/welcome/register')
          .send(user)
          .expect(400)
          .expect('Content-Type', /application\/json/)

        expect(result.body.error).toContain('username must not contain white spaces or special characters other than _ or -')
      })

      test('creation fails if illegal character at start', async () => {
        const user = {
          username: helper_backend.createIllegalCharacter() + helper_backend.createUsername(2),
          password: helper_backend.createPassword(8),
        }

        const result = await api
          .post('/welcome/register')
          .send(user)
          .expect(400)
          .expect('Content-Type', /application\/json/)

        expect(result.body.error).toContain('username must not contain white spaces or special characters other than _ or -')
      })

      test('creation fails if illegal character inside', async () => {
        const user = {
          username: helper_backend.createUsername(1) + helper_backend.createIllegalCharacter() + helper_backend.createUsername(1),
          password: helper_backend.createPassword(8),
        }

        const result = await api
          .post('/welcome/register')
          .send(user)
          .expect(400)
          .expect('Content-Type', /application\/json/)

        expect(result.body.error).toContain('username must not contain white spaces or special characters other than _ or -')
      })

      test('creation fails if illegal character at end', async () => {
        const user = {
          username: helper_backend.createUsername(29) + helper_backend.createIllegalCharacter(),
          password: helper_backend.createPassword(8),
        }

        const result = await api
          .post('/welcome/register')
          .send(user)
          .expect(400)
          .expect('Content-Type', /application\/json/)

        expect(result.body.error).toContain('username must not contain white spaces or special characters other than _ or -')
      })

      test('creation fails if scand character at start', async () => {
        const user = {
          username: helper_backend.createScandCharacter() + helper_backend.createUsername(5),
          password: helper_backend.createPassword(8),
        }

        const result = await api
          .post('/welcome/register')
          .send(user)
          .expect(400)
          .expect('Content-Type', /application\/json/)

        expect(result.body.error).toContain('username must not contain white spaces or special characters other than _ or -')
      })

      test('creation fails if scand character inside', async () => {
        const user = {
          username: helper_backend.createUsername(14) + helper_backend.createScandCharacter() + helper_backend.createUsername(15),
          password: helper_backend.createPassword(8),
        }

        const result = await api
          .post('/welcome/register')
          .send(user)
          .expect(400)
          .expect('Content-Type', /application\/json/)

        expect(result.body.error).toContain('username must not contain white spaces or special characters other than _ or -')
      })

      test('creation fails if scand character at end', async () => {
        const user = {
          username: helper_backend.createUsername(15) + helper_backend.createScandCharacter(),
          password: helper_backend.createPassword(8),
        }

        const result = await api
          .post('/welcome/register')
          .send(user)
          .expect(400)
          .expect('Content-Type', /application\/json/)

        expect(result.body.error).toContain('username must not contain white spaces or special characters other than _ or -')
      })

      test('creation fails if already taken', async () => {
        const usersAtStart = await helper_backend.usersInDb()

        const user = {
          username: process.env.USER_NAME,
          password: helper_backend.createPassword(25),
        }

        const result = await api
          .post('/welcome/register')
          .send(user)
          .expect(400)
          .expect('Content-Type', /application\/json/)

        expect(result.body.error).toContain('`username` to be unique')

        const usersAtEnd = await helper_backend.usersInDb()
        expect(usersAtEnd).toHaveLength(usersAtStart.length)
      })
    })

    describe('password tests', () => {
      test('creation fails if too short', async () => {
        const user = {
          username: helper_backend.createUsername(3),
          password: helper_backend.createPassword(7),
        }

        const result = await api
          .post('/welcome/register')
          .send(user)
          .expect(400)
          .expect('Content-Type', /application\/json/)

        expect(result.body.error).toContain('password must be at least 8 characters long')
      })

      test('creation fails if too long', async () => {
        const user = {
          username: helper_backend.createUsername(30),
          password: helper_backend.createPassword(51),
        }

        const result = await api
          .post('/welcome/register')
          .send(user)
          .expect(400)
          .expect('Content-Type', /application\/json/)

        expect(result.body.error).toContain('password must be at most 50 characters long')
      })

      test('creation fails if empty', async () => {
        const user = {
          username: helper_backend.createUsername(30),
          password: helper_backend.createPassword(0),
        }

        const result = await api
          .post('/welcome/register')
          .send(user)
          .expect(400)
          .expect('Content-Type', /application\/json/)

        expect(result.body.error).toContain('`password` is required')
      })

      test('creation fails if space character at start', async () => {
        const user = {
          username: helper_backend.createUsername(30),
          password: helper_backend.createSpaceCharacter() + helper_backend.createPassword(7),
        }

        const result = await api
          .post('/welcome/register')
          .send(user)
          .expect(400)
          .expect('Content-Type', /application\/json/)

        expect(result.body.error)
          .toContain('password must have at least one lowercase letter, one uppercase letter, one number, one special character, no white spaces and no scands')
      })

      test('creation fails if space character inside', async () => {
        const user = {
          username: helper_backend.createUsername(3),
          password: helper_backend.createPassword(3) + helper_backend.createSpaceCharacter() + helper_backend.createPassword(4),
        }

        const result = await api
          .post('/welcome/register')
          .send(user)
          .expect(400)
          .expect('Content-Type', /application\/json/)

        expect(result.body.error)
          .toContain('password must have at least one lowercase letter, one uppercase letter, one number, one special character, no white spaces and no scands')
      })

      test('creation fails if space character at end', async () => {
        const user = {
          username: helper_backend.createUsername(30),
          password: helper_backend.createPassword(7) + helper_backend.createSpaceCharacter(),
        }

        const result = await api
          .post('/welcome/register')
          .send(user)
          .expect(400)
          .expect('Content-Type', /application\/json/)

        expect(result.body.error)
          .toContain('password must have at least one lowercase letter, one uppercase letter, one number, one special character, no white spaces and no scands')
      })

      test('creation fails if scand character at start', async () => {
        const user = {
          username: helper_backend.createUsername(15),
          password: helper_backend.createScandCharacter() + helper_backend.createPassword(49),
        }

        const result = await api
          .post('/welcome/register')
          .send(user)
          .expect(400)
          .expect('Content-Type', /application\/json/)

        expect(result.body.error)
          .toContain('password must have at least one lowercase letter, one uppercase letter, one number, one special character, no white spaces and no scands')
      })

      test('creation fails if scand character inside', async () => {
        const user = {
          username: helper_backend.createUsername(3),
          password: helper_backend.createPassword(3) + helper_backend.createScandCharacter() + helper_backend.createPassword(4),
        }

        const result = await api
          .post('/welcome/register')
          .send(user)
          .expect(400)
          .expect('Content-Type', /application\/json/)

        expect(result.body.error)
          .toContain('password must have at least one lowercase letter, one uppercase letter, one number, one special character, no white spaces and no scands')
      })

      test('creation fails if scand character at end', async () => {
        const user = {
          username: helper_backend.createUsername(30),
          password: helper_backend.createPassword(49) + helper_backend.createScandCharacter(),
        }

        const result = await api
          .post('/welcome/register')
          .send(user)
          .expect(400)
          .expect('Content-Type', /application\/json/)

        expect(result.body.error)
          .toContain('password must have at least one lowercase letter, one uppercase letter, one number, one special character, no white spaces and no scands')
      })

      test('creation fails if no lowercase character', async () => {
        const user = {
          username: helper_backend.createUsername(30),
          password: helper_backend.createUppercaseCharacter() + helper_backend.createNumericCharacter() + helper_backend.createUnderscoreMinusCharacter()
           + helper_backend.createUppercaseCharacter() + helper_backend.createNumericCharacter() + helper_backend.createUnderscoreMinusCharacter()
           + helper_backend.createUppercaseCharacter() + helper_backend.createNumericCharacter(),
        }

        const result = await api
          .post('/welcome/register')
          .send(user)
          .expect(400)
          .expect('Content-Type', /application\/json/)

        expect(result.body.error)
          .toContain('password must have at least one lowercase letter, one uppercase letter, one number, one special character, no white spaces and no scands')
      })

      test('creation fails if no uppercase character', async () => {
        const user = {
          username: helper_backend.createUsername(30),
          password: helper_backend.createLowercaseCharacter() + helper_backend.createNumericCharacter() + helper_backend.createSpecialCharacter()
           + helper_backend.createLowercaseCharacter() + helper_backend.createNumericCharacter() + helper_backend.createSpecialCharacter()
           + helper_backend.createLowercaseCharacter() + helper_backend.createNumericCharacter(),
        }

        const result = await api
          .post('/welcome/register')
          .send(user)
          .expect(400)
          .expect('Content-Type', /application\/json/)

        expect(result.body.error)
          .toContain('password must have at least one lowercase letter, one uppercase letter, one number, one special character, no white spaces and no scands')
      })

      test('creation fails if no numeric character', async () => {
        const user = {
          username: helper_backend.createUsername(30),
          password: helper_backend.createLowercaseCharacter() + helper_backend.createUppercaseCharacter() + helper_backend.createUnderscoreMinusCharacter()
           + helper_backend.createLowercaseCharacter() + helper_backend.createUppercaseCharacter() + helper_backend.createSpecialCharacter()
           + helper_backend.createLowercaseCharacter() + helper_backend.createUppercaseCharacter(),
        }

        const result = await api
          .post('/welcome/register')
          .send(user)
          .expect(400)
          .expect('Content-Type', /application\/json/)

        expect(result.body.error)
          .toContain('password must have at least one lowercase letter, one uppercase letter, one number, one special character, no white spaces and no scands')
      })

      test('creation fails if no special character', async () => {
        const user = {
          username: helper_backend.createUsername(30),
          password: helper_backend.createLowercaseCharacter() + helper_backend.createUppercaseCharacter() + helper_backend.createNumericCharacter()
           + helper_backend.createLowercaseCharacter() + helper_backend.createUppercaseCharacter() + helper_backend.createNumericCharacter()
           + helper_backend.createLowercaseCharacter() + helper_backend.createUppercaseCharacter(),
        }

        const result = await api
          .post('/welcome/register')
          .send(user)
          .expect(400)
          .expect('Content-Type', /application\/json/)

        expect(result.body.error)
          .toContain('password must have at least one lowercase letter, one uppercase letter, one number, one special character, no white spaces and no scands')
      })
    })
  })
})

describe('backend login form tests', () => {
  describe('when there is initially one user at db', () => {
    beforeEach(async () => {
      await User.deleteMany({})

      const password = new Password({
        password: process.env.PASS_WORD,
      })

      const passwordHash = await bcrypt.hash(password.password, parseInt(process.env.SALT_ROUNDS))

      const user = new User({
        username: process.env.USER_NAME,
        passwordHash,
      })

      await user.save()
    })

    describe('user tests', () => {
      test('login succeeds if valid credentials', async () => {
        const user = {
          username: process.env.USER_NAME,
          password: process.env.PASS_WORD,
        }

        await api
          .post('/welcome/login')
          .send(user)
          .expect(200)
          .expect('Content-Type', /application\/json/)
      })

      test('login returns token if valid credentials', async () => {
        const user = {
          username: process.env.USER_NAME,
          password: process.env.PASS_WORD,
        }

        const result = await api
          .post('/welcome/login')
          .send(user)
          .expect(200)
          .expect('Content-Type', /application\/json/)

        expect(result.body.token)
          .toBeDefined()
      })

      test('login fails if no valid username', async () => {
        const user = {
          username: `${process.env.USER_NAME}1`,
          password: process.env.PASS_WORD,
        }

        const result = await api
          .post('/welcome/login')
          .send(user)
          .expect(401)
          .expect('Content-Type', /application\/json/)

        expect(result.body.error)
          .toContain('invalid username or password')
      })

      test('login fails if no valid password', async () => {
        const user = {
          username: `${process.env.USER_NAME}`,
          password: `${process.env.PASS_WORD}!`,
        }

        const result = await api
          .post('/welcome/login')
          .send(user)
          .expect(401)
          .expect('Content-Type', /application\/json/)

        expect(result.body.error)
          .toContain('invalid username or password')
      })
    })
  })
})

describe('backend planner test', () => {
  describe('when there is initially one user at db', () => {
    beforeEach(async () => {
      await Plan.deleteMany({})
      await User.deleteMany({})

      const password = new Password({
        password: process.env.PASS_WORD,
      })

      const passwordHash = await bcrypt.hash(password.password, parseInt(process.env.SALT_ROUNDS))

      const user = new User({
        username: process.env.USER_NAME,
        passwordHash,
      })

      await user.save()
    })

    describe('plan test', () => {
      test('when authorized user is logged in, a plan can be created and deleted', async () => {
        const initialPlans = await helper_backend.plansInDb()

        const loginUser = {
          username: process.env.USER_NAME,
          password: process.env.PASS_WORD,
        }

        const userResult = await api
          .post('/welcome/login')
          .send(loginUser)
          .expect(200)
          .expect('Content-Type', /application\/json/)

        expect(userResult.body.token)
          .toBeDefined()

        const plan = {
          planName: 'Workout Schedule',
          planMemo: 'MONDAYS and WEDNESDAYS: Upper body',
        }

        const authorization = `bearer ${userResult.body.token}`

        await api
          .post('/dashboard/planner/newPlan')
          .set('Authorization', authorization)
          .send(plan)
          .expect(201)
          .expect('Content-Type', /application\/json/)

        let plansAtEnd = await helper_backend.plansInDb()
        expect(plansAtEnd).toHaveLength(initialPlans.length + 1)

        let contents = plansAtEnd.map(p => p.planName)
        expect(contents).toContain(
          'Workout Schedule'
        )

        await api
          .delete(`/api/delete/plan/${plan.planName}`)
          .set('Authorization', authorization)
          .send(plan.planName)
          .expect(204)

        plansAtEnd = await helper_backend.plansInDb()
        expect(plansAtEnd).toHaveLength(initialPlans.length)

        contents = plansAtEnd.map(p => p.planName)
        expect(contents).not.toContain(
          'Workout Schedule'
        )

        await User.deleteMany({})
      })
    })
  })
})

describe('backend profile tests', () => {
  describe('when there is initially one user at db', () => {
    beforeEach(async () => {
      await Plan.deleteMany({})
      await User.deleteMany({})

      const password = new Password({
        password: process.env.PASS_WORD,
      })

      const passwordHash = await bcrypt.hash(password.password, parseInt(process.env.SALT_ROUNDS))

      const user = new User({
        username: process.env.USER_NAME,
        passwordHash,
      })

      await user.save()
    })

    describe('password change', () => {
      test('when authorized user is logged in, user password can be changed', async () => {
        const loginUser = {
          username: process.env.USER_NAME,
          password: process.env.PASS_WORD,
        }

        const userResult = await api
          .post('/welcome/login')
          .send(loginUser)
          .expect(200)
          .expect('Content-Type', /application\/json/)

        expect(userResult.body.token)
          .toBeDefined()

        const changePassword = {
          oldPassword: process.env.PASS_WORD,
          newPassword: `${process.env.PASS_WORD}X`,
        }

        const authorization = `bearer ${userResult.body.token}`

        await api
          .put('/dashboard/profile/newPassword')
          .set('Authorization', authorization)
          .send(changePassword)
          .expect(200)

        await User.deleteMany({})
      })
    })

    describe('tooltips visibility change', () => {
      test('when authorized user is logged in, tooltips visibility can be changed', async () => {
        const loginUser = {
          username: process.env.USER_NAME,
          password: process.env.PASS_WORD,
        }

        const userResult = await api
          .post('/welcome/login')
          .send(loginUser)
          .expect(200)
          .expect('Content-Type', /application\/json/)

        expect(userResult.body.token)
          .toBeDefined()

        const tooltips = {
          tooltips: false,
        }

        const authorization = `bearer ${userResult.body.token}`

        await api
          .put('/dashboard/profile/toggleTooltips')
          .set('Authorization', authorization)
          .send(tooltips)
          .expect(200)

        await User.deleteMany({})
      })
    })
  })
})

describe('backend workout test', () => {
  describe('when there is initially one user at db', () => {
    beforeEach(async () => {
      await Plan.deleteMany({})
      await User.deleteMany({})
      await Workout.deleteMany({})

      const password = new Password({
        password: process.env.PASS_WORD,
      })

      const passwordHash = await bcrypt.hash(password.password, parseInt(process.env.SALT_ROUNDS))

      const user = new User({
        username: process.env.USER_NAME,
        passwordHash,
      })

      await user.save()
    })

    describe('workout test', () => {
      test('when authorized user is logged in, a workout can be created, updated and deleted', async () => {
        const initialWorkouts = await helper_backend.workoutsInDb()

        const loginUser = {
          username: process.env.USER_NAME,
          password: process.env.PASS_WORD,
        }

        const userResult = await api
          .post('/welcome/login')
          .send(loginUser)
          .expect(200)
          .expect('Content-Type', /application\/json/)

        expect(userResult.body.token)
          .toBeDefined()

        const d = new Date()
        const date = d.getDate()  + '.' + (d.getMonth() + 1) + '.' + d.getFullYear()
          + ' ' + d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds()

        const workout = {
          categoryTitle: 'Exercise - Bench press 132 lb 1 min',
          target: '10',
          result: {
            date: date,
            result: 0
          },
          notes: ' ',
        }

        const authorization = `bearer ${userResult.body.token}`

        await api
          .post('/dashboard/workouts/newWorkout')
          .set('Authorization', authorization)
          .send(workout)
          .expect(201)
          .expect('Content-Type', /application\/json/)

        let workoutsAtEnd = await helper_backend.workoutsInDb()
        expect(workoutsAtEnd).toHaveLength(initialWorkouts.length + 1)

        let contents = workoutsAtEnd.map(w => w.categoryTitle)
        expect(contents).toContain(
          'Exercise - Bench press 132 lb 1 min'
        )

        const updatedWorkout = {
          categoryTitle: 'Exercise - Bench press 132 lb 1 min',
          target: '11',
          result: {
            date: date,
            result: 2
          },
          notes: 'Hello',
        }

        await api
          .put('/dashboard/workouts/updateWorkout')
          .set('Authorization', authorization)
          .send(updatedWorkout)
          .expect(200)
          .expect('Content-Type', /application\/json/)

        await api
          .delete(`/api/delete/workout/${updatedWorkout.categoryTitle}`)
          .set('Authorization', authorization)
          .send(updatedWorkout.categoryTitle)
          .expect(204)

        workoutsAtEnd = await helper_backend.workoutsInDb()
        expect(workoutsAtEnd).toHaveLength(initialWorkouts.length)

        contents = workoutsAtEnd.map(w => w.categoryTitle)
        expect(contents).not.toContain(
          'Exercise - Bench press 132 lb 1 min'
        )

        await User.deleteMany({})
      })
    })
  })
})

afterAll(() => {
  mongoose.connection.close()
})
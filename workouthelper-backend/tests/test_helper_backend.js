const Plan = require('../models/plan')
const User = require('../models/user')
const Workout = require('../models/workout')

const dummy_one = () => {
  return 1
}

const plansInDb = async () => {
  const plans = await Plan.find({})
  return plans.map(p => p.toJSON())
}

const usersInDb = async () => {
  const users = await User.find({})
  return users.map(u => u.toJSON())
}

const workoutsInDb = async () => {
  const workouts = await Workout.find({})
  return workouts.map(p => p.toJSON())
}

const lowercaseAlpha = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n',
  'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z']

const uppercaseAlpha = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N',
  'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']

const numeric = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']

const underscoreMinus = ['_', '-']

const space = [' ']

const special = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '\\', '[', ']', '{', '}',
  '+', '=', '~', '`', '|', ':', ';', '"', '\'', '<', '>', ',', '.', '/', '?']

const scand = ['å', 'ä', 'ö', 'œ', 'æ', 'ø', 'Å', 'Ä', 'Ö', 'Œ', 'Æ', 'Ø']

// return a random number between numbers begin and end
const createRandomNumber = (begin, end) => {
  return Math.floor((Math.random() * end) + begin)
}

// return a character from function lowercaseAlpha, uppercaseAlpha, numeric,
// underscoreMinus or special
const createCharacter = (number) => {
  switch (number) {
  case 1:
    return lowercaseAlpha[Math.floor((Math.random() * (lowercaseAlpha.length - 1)))]
  case 2:
    return uppercaseAlpha[Math.floor((Math.random() * (uppercaseAlpha.length - 1)))]
  case 3:
    return numeric[Math.floor((Math.random() * (numeric.length - 1)))]
  case 4:
    return underscoreMinus[Math.floor((Math.random() * (underscoreMinus.length - 1)))]
  case 5:
    return special[Math.floor((Math.random() * (special.length - 1)))]
  default:
    break
  }
}

// check if username is already in use
const checkUsername = async (username) => {
  const usersInDb = await User.find({})
  let usernameInUse = false

  usersInDb.filter(u => u.username === username ? usernameInUse = true : false)

  return usernameInUse
}

const generateUsername = (length) => {
  const usernameLength = length
  let username = ''

  for (let i = 0; i < usernameLength; i++) {
    username = username.concat(createCharacter(createRandomNumber(1, 4)))
  }

  return username
}

const createUsername = (length) => {
  let username = ''

  // generate a username first before testing if it is already in use
  username = generateUsername(length)

  // while username is already in use, generate a new username
  while (checkUsername(username) === true) {
    username = generateUsername(length)
  }

  return username
}

// check if password consists of at least one lowercaseAlpha, one uppercaseAlpha,
// one numeric and one underscoreMinus or one special character
const checkCharacters = (password) => {
  const checkCharacter = (character) => {
    return password.includes(character)
  }

  if (lowercaseAlpha.filter(checkCharacter).length === 0) {
    return false
  }
  if (uppercaseAlpha.filter(checkCharacter).length === 0) {
    return false
  }
  if (numeric.filter(checkCharacter).length === 0) {
    return false
  }
  if (underscoreMinus.filter(checkCharacter).length === 0
    && special.filter(checkCharacter).length === 0) {
    return false
  }

  return true
}

const generatePassword = (length) => {
  const passwordLength = length
  let password = ''

  for (let j = 0; j < passwordLength; j++) {
    password = password.concat(createCharacter(createRandomNumber(1, 5)))
  }

  return password
}

const createPassword = (length) => {
  let password = ''

  // while password does not consist of required characters, generate a new password
  // or return the generated password if it has less than 8 characters to avoid an eternal loop
  while (checkCharacters(password) === false) {
    password = generatePassword(length)

    if (password.length < 8) {
      return password
    }
  }

  return password
}

const createLowercaseCharacter = () => {
  return lowercaseAlpha[Math.floor((Math.random() * (lowercaseAlpha.length - 1)))]
}

const createUppercaseCharacter = () => {
  return uppercaseAlpha[Math.floor((Math.random() * (uppercaseAlpha.length - 1)))]
}

const createNumericCharacter = () => {
  return numeric[Math.floor((Math.random() * (numeric.length - 1)))]
}

const createUnderscoreMinusCharacter = () => {
  return underscoreMinus[Math.floor((Math.random() * (underscoreMinus.length - 1)))]
}

const createSpaceCharacter = () => {
  return space[0]
}

const createIllegalCharacter = () => {
  return special[Math.floor((Math.random() * (special.length - 1)))]
}

const createSpecialCharacter = () => {
  return createIllegalCharacter()
}

const createScandCharacter = () => {
  return scand[Math.floor((Math.random() * (scand.length - 1)))]
}

module.exports = {
  dummy_one,
  plansInDb,
  usersInDb,
  workoutsInDb,
  createUsername,
  createPassword,
  createLowercaseCharacter,
  createUppercaseCharacter,
  createNumericCharacter,
  createUnderscoreMinusCharacter,
  createSpaceCharacter,
  createIllegalCharacter,
  createSpecialCharacter,
  createScandCharacter,
}
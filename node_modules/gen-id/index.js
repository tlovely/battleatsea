var formats =
    { n: '0123456789'
    , a: 'abcdefghijklmnopqrstuvwxyz'
    , A: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
    , x: '0123456789abcdefghijklmnopqrstuvwxyz'
    , X: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
    }
  , shuffled = {}
  , crc = require('crc')

function shuffle(sourceArray) {
  var targetArray = []
    , characterIndex

  sourceArray = sourceArray.split('')

  while (sourceArray.length > 0) {
    characterIndex = Math.floor(Math.random() * sourceArray.length);
    targetArray.push(sourceArray.splice(characterIndex, 1)[0]);
  }

  return targetArray.join('');
}

function validateFormat(format) {
  format.split('').forEach(function (character, index) {
    if (character === ' ' || character === 'c') {
    } else if (formats[character]) {
    } else {
      throw new Error('Invalid format, character ' + character + ' is not defined')
    }
  })
}

function generate() {
  if (!this.format) {
    throw new Error('Format must be set before generation')
  }

  var str = []
    , checksumPositions = []

  this.format.split('').forEach(function (character, index) {
    if (character === ' ') {
      str.push(character)
    } else if (character === 'c') {
      checksumPositions.unshift(index)
      str.push(character)
    } else {
      if (formats[character]) {
        if (!shuffled[character]) {
          shuffled[character] = shuffle(formats[character])
        }

        var shuffledFormat = shuffled[character]

        str.push(shuffledFormat[Math.floor(Math.random() * formats[character].length)])
      }
    }
  })

  var checksumArray = str
  checksumPositions.forEach(function (index, count) {
    checksumArray.splice(index, 1)
  })

  // Added >>> 0 to ensure number is positive
  var crc32 = (crc.crc32(checksumArray.join(''))) >>> 0

  checksumPositions.reverse().forEach(function (index, count) {
    str[index] = String(crc32)[count]
  })
  return str.join('')
}

function setFormat(format) {
  validateFormat(format)
  this.format = format
}

var generator =
    { generate: generate
    , setFormat: setFormat
    }

module.exports = function (format) {
  if (format) {
    generator.setFormat(format)
  }

  return generator
}
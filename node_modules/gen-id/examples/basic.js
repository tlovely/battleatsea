var genId = require('../index')()

genId.setFormat('nnnnnnnc')

var orderId = genId.generate()

console.log(orderId)
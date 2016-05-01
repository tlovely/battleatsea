var genId = require('../index')()
  , should = require('should')

describe('testing gen-id', function (done) {

  beforeEach(function (){
  })

  it('should error if no format is set', function (done) {
    (function () {
      genId.generate()
    }).should.throw()

    done()
  })

  it('should error if invalid format is set', function (done) {
    (function () {
      genId.setFormat('not correct')
    }).should.throw()

    done()
  })

  it('should not error if valid format is set', function (done) {
    genId.setFormat('nnnnnnc')
    done()
  })

  it('should only provide numbers for numeric format', function (done) {
    formatTester(/^\d+$/, 'nnnnnnn', done)
  })

  it('should only provide lowercase letters for alphabet format', function (done) {
    formatTester(/^[a-z]+$/, 'aaaaaa', done)
  })

  it('should only provide mixed letters for alphabet format', function (done) {
    formatTester(/^[a-zA-Z]+$/, 'AAAAAA', done)
  })

  function formatTester(pattern, format, callback) {
    var id
      , i=10000

    genId.setFormat(format)

    while(i--) {
      id = genId.generate()
      pattern.test(id).should.be.true
    }

    callback()
  }

})
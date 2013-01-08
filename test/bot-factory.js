var Brain = require('../lib/brain')
  , test = new Brain()

test.addAction('Wake Up', function () {
  woke++
}, 5)
test.addAction('Snooze', function () {
}, 2)

var i = 0,
  len = 10000,
  woke = 0

for (; i < len; i++) {
  test.decide()()
}

console.log('PCT:', woke / len)

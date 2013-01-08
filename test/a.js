var util = require('util')
  , Bot = require('../lib').Bot

function MyBot(options) {
  Bot.call(this, options)
}
Bot.extend(MyBot)

MyBot.prototype.startup = startup
function startup(callback) {
  var self = this

  console.log('+', this.id, 'Started.')

  setTimeout(function () {
    self.stop()
  }, 500)

  Bot.prototype.startup.call(this, callback)
}

MyBot.prototype.tick = tick
function tick(callback) {
  console.log(this.id, 'Ticked.')
  callback()
}

MyBot.prototype.shutdown = shutdown
function shutdown(callback) {
  console.log('-', this.id, 'Stopped.')

  Bot.prototype.shutdown.call(this, callback)
}

module.exports = MyBot

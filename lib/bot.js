var util = require('util')
  , EventEmitter = require('events').EventEmitter
  , $$ = require('stepdown')
  , weighted = require('weighted')

function Bot(options) {
  if (!(this instanceof Bot)) {
    return new Bot(options)
  }

  options = options || {}

  // For tracking this Bot within a Factory
  this.id = options.id
  this.rate = this.rate || options.rate || 10
  this.running = false

  EventEmitter.call(this)

  // Alias for Factory
  this.kill = this.destroy
}
Bot.createBot = Bot

function _extend(childFn, parentFn) {
  util.inherits(childFn, parentFn)

  childFn.extend = function extend(grandchildFn) {
    return _extend(grandchildFn, childFn)
  }

  return childFn
}
_extend(Bot, EventEmitter)

Bot.prototype.start = start
function start(callback) {
  var self = this

  if (self.running) {
    return
  }

  self.running = true

  $$.run([
    function startup($) {
      self.startup($.first())
    },
    function live($) {
      self.live($.first())
    },
    function shutdown($) {
      self.shutdown($.first())
    }
  ], callback)
}

Bot.prototype.live = live
function live(callback) {
  var self = this

  function tick() {
    self.tick(loop)
  }
  tick()

  function loop(err, data) {
    if (err) {
      callback(err, null)
      return
    }

    if (!self.running) {
      callback(null, null)
      return
    }

    if (self.rate > 0) {
      setTimeout(tick, (1 / self.rate) * 1000)
    } else {
      process.nextTick(tick)
    }
  }
}

Bot.prototype.startup = function startup(callback) { callback() }
Bot.prototype.tick = function tick(callback) { callback() }
Bot.prototype.shutdown = function shutdown(callback) { callback() }

Bot.prototype.stop = stop
function stop() {
  if (!this.running) {
    return
  }

  this.running = false
}

Bot.prototype.destroy = destroy
function destroy() {
  this.stop()
  // TODO
}

module.exports = Bot

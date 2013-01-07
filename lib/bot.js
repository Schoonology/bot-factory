var util = require('util')
  , EventEmitter = require('events').EventEmitter
  , Actor = require('../../prostate').Actor
  , _ = require('lodash')
  , $$ = require('stepdown')
  , weighted = require('weighted')

function Bot() {
  if (!(this instanceof Bot)) {
    return new Bot()
  }

  Actor.call(this)
  EventEmitter.call(this)

  this.actions = {}
  this._weights = {}
  this._totalWeight = 0
}
util.inherits(Bot, Actor)
Bot.createBot = Bot
_.extend(Bot.prototype, EventEmitter.prototype)

Bot.prototype.states = {
  Idle: {
    begin: function (prevState) {
      this.emit('stopped')
    }
  },
  Start: {
    begin: function (prevState) {
      this.goToState('Stop')
    }
  },
  Stop: {
    begin: function (prevState) {
      this.goToState('Idle')
    }
  }
}

Bot.extend = extend
function extend(fn, states) {
  util.inherits(fn, Bot)

  fn.prototype.states = _.extend({}, Bot.prototype.states, fn.prototype.states, states)
}

Bot.prototype.start = start
function start() {
  this.goToState('Start')
  this.emit('started')
}

Bot.prototype.stop = stop
function stop() {
  this.goToState('Stop')
}

Bot.prototype.select = select
function select() {
  var key = weighted.select(this._weights, {
    total: this._totalWeight
  })

  return this.actions[key]
}

Bot.prototype.addAction = addAction
function addAction(name, fn, weight) {
  var self = this

  if (typeof fn !== 'function') {
    if (self instanceof Bot && typeof self[fn] === 'function') {
      weight = fn || weight
      fn = function () {
        self[fn].apply(self, arguments)
      }
    } else {
      throw new Error('Invalid action:' + fn)
    }
  }

  self.setWeight(name, weight)
  self.actions[name] = fn
}

Bot.prototype.setWeight = setWeight
function setWeight(name, weight) {
  if (typeof weight !== 'number') {
    weight = 1
  }

  this._weights[name] = weight
  this._totalWeight += weight
}

module.exports = Bot

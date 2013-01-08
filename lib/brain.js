var weighted = require('weighted')

function Brain(obj) {
  if (!(this instanceof Brain)) {
    return new Brain(obj)
  }

  if (!obj) {
    obj = {}
  }

  this.actions = this.actions || obj.actions || {}
  this._weights = this._weights || obj._weights || {}
  this._totalWeight = 0
}
Brain.createBrain = Brain

Brain.prototype.select = select
Brain.prototype.decide = select
function select() {
  var key = weighted.select(this._weights, {
    total: this._totalWeight
  })

  return this.actions[key]
}

Brain.prototype.addAction = addAction
Brain.prototype.addOption = addAction
function addAction(name, fn, weight) {
  var self = this

  if (typeof fn !== 'function') {
    if (self instanceof Brain && typeof self[fn] === 'function') {
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

Brain.prototype.setWeight = setWeight
function setWeight(name, weight) {
  if (typeof weight !== 'number') {
    weight = 1
  }

  this._weights[name] = weight
  this._totalWeight += weight
}

module.exports = Brain

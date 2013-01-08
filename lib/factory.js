var spawn = require('child_process').spawn
  , Bot = require('./bot')

function Factory(options) {
  // TODO: this.module === false -> BAD
  this.module = this.module || options.module || null
  this.script = this.script || options.script || null
  this.argv = this.argv || options.argv || []

  this.maximum = this.maximum || options.maximum || 1
  this.freq = this.freq || options.freq || 1
  this.once = this.once || options.once || false

  this._bots = {}
  this._loopID = null
  this._desired = 0
  // this._initProperties()

  this._tryCompile()
}

Factory.prototype._initProperties = _initProperties
function _initProperties() {
  var desired = 0

  Object.defineProperty(this, '_desired', {
    get: function () {
      return desired
    },
    set: function (value) {
      desired = Math.max(value, 0)

      if (desired) {
      }
    }
  })
}

Factory.prototype._tryCompile = _tryCompile
function _tryCompile(script) {
  if (this.module === false || this.argv.length) {
    return
  }

  try {
    this.module = require(script || this.script)
  } catch (e) {
    this.module = null
  }
}

Factory.prototype.start = start
function start() {
  this._desired = this.maximum
  this._tick()
}

Factory.prototype.restart = restart
function restart() {
  this.stop()
  this.start()
}

Factory.prototype.stop = stop
function stop() {
  var self = this

  Object.keys(self._bots).forEach(function (key) {
    if (!self._bots[key]) {
      return
    }

    self._bots[key].kill()
  })
}

Factory.prototype._generateCb = _generateCb
function _generateCb(child, key) {
  var self = this

  if (key) {
    self._bots[key] = child
  }

  return function (err, data) {
    if (key) {
      self._bots[key] = null
    }

    if (err) {
      if (typeof err === 'number') {
        console.error('Bad exit code:' + err + ' (is the script\'s executable flag turned on?)')
        process.exit(err)
      }

      console.error('Error:', err.stack || err.message || err)
      process.exit(1)
    }

    if (!self.once) {
      self._desired++

      if (self._desired === 1) {
        self._loop()
      }
    }
  }
}

Factory.prototype._spawn = _spawn
function _spawn() {
  var child = spawn(this.script, this.argv, {
    cwd: process.cwd(),
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe']
  })

  child.stdout.pipe(process.stdout)
  child.stderr.pipe(process.stderr)

  this._bots[child.pid] = child

  child.on('exit', this._generateCb(child, child.pid))
}

Factory.prototype.getUniqueID = getUniqueID
function getUniqueID() {
  var id = Math.random().toString().slice(2, 10)

  while (this._bots[id]) {
    id = Math.random().toString().slice(2, 10)
  }

  return id
}

Factory.prototype._load = _load
function _load() {
  var child = null
    , start = this.module.start
    , cb = null

  if (typeof this.module === 'function') {
    child = new this.module({
      id: this.getUniqueID()
    })

    // Two good indicators this is a Bot (or at least Bot-like enough to pass).
    if (child && child.id && child.start) {
      start = function (callback) {
        child.start(callback)
      }
      cb = this._generateCb(child, child.id)
    }
  }

  if (typeof start !== 'function') {
    return
  }

  if (!cb) {
    cb = this._generateCb()
  }

  if (start.length > 0) {
    start(cb)
  } else {
    try {
      cb(null, start())
    } catch (e) {
      cb(e, null)
    }
  }
}

Factory.prototype._tick = _tick
function _tick() {
  if (this._desired === 0) {
    return
  }

  if (this.module) {
    this._load()
  } else {
    this._spawn()
  }

  this._desired--
  this._loop()
}

Factory.prototype._loop = _loop
function _loop() {
  var self = this

  if (self._loopID) {
    return
  }

  function tick() {
    self._loopID = null
    self._tick()
  }

  if (self.freq > 0) {
    self._loopID = setTimeout(tick, (1 / self.freq) * 1000)
  } else {
    self._loopID = {}
    process.nextTick(tick)
  }
}

module.exports = Factory

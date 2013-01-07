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

  this._desired = this.maximum
  this._bots = {}

  this._tryCompile()
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
  this._tick()
}

Factory.prototype.restart = restart
function restart() {
  this.stop()
  this._desired = this.maximum
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

Factory.prototype._load = _load
function _load() {
  var child = null,
      cb = null

  if (typeof this.module === 'function') {
    child = new this.module()
  }

  if (child instanceof Bot) {
    cb = this._generateCb()

    child.on('stopped', cb)
    // child.on('error', cb)

    child.start()
    return
  }

  if (typeof this.module.start !== 'function') {
    return
  }

  cb = this._generateCb()

  if (this.module.start.length > 0) {
    this.module.start(cb)
  } else {
    try {
      cb(null, this.module.start())
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

  function tick() {
    self._tick()
  }

  if (this.freq > 0) {
    setTimeout(tick, (1 / this.freq) * 1000)
  } else {
    process.nextTick(tick)
  }
}

module.exports = Factory

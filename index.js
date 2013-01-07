if (require.main === module) {
  require('./bin/bot-factory')
} else {
  module.exports = require('./lib/bot-factory')
}

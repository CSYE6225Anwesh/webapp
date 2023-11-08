const StatsD = require('node-statsd');
const client = new StatsD();

module.exports = client;
const db = require('../db/db');
const bodyParser = require("body-parser");
const fs = require('fs');
const logger = require('../logger/logger');
const client = require('../logger/statsd');


const healthCheck = async (req, res) => {
  // Log the incoming request
  logger.info(`Health check requested. Method: ${req.method}, Query: ${JSON.stringify(req.query)}, Body: ${JSON.stringify(req.body)}`);

  if (req.method !== "GET") {
      logger.warn(`Health check: Method not allowed. Received: ${req.method}`);
      res.status(405).send("Method Not Allowed");
  } else if (Object.keys(req.query).length > 0) {
      logger.warn(`Health check: Query parameters were unexpected. Query: ${JSON.stringify(req.query)}`);
      res.status(400).send();
  } else if (req.body && Object.keys(req.body).length > 0) {
      logger.warn(`Health check: Body should be empty but received: ${JSON.stringify(req.body)}`);
      res.status(400).send();
  } else {
      try {
          await db.sequelize.authenticate();
          logger.info("Health check: Connected to MySQL database successfully.");
          // Increment the counter for successful health checks
          client.increment('healthcheck.success', 1);
          res.status(200).header('Cache-Control', 'no-cache').send();
      } catch (error) {
          logger.error(`Health check: Error connecting to MySQL database - ${error}`);
          console.error("Error connecting to MySQL database:", error);
          res.status(503).send("Service Unavailable");
      }
  }
};
  
  
  
module.exports = {
    healthCheck
};


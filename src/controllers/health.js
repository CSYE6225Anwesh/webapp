const db = require('../db/db');
const bodyParser = require("body-parser");
const fs = require('fs');


const healthCheck = async (req, res) => {
    const payload = req.body;
  
    if (req.method !== "GET") {
      res.status(405).send("Method Not Allowed");
    } else if (Object.keys(req.query).length > 0) {
      res.status(400).send();
    } else if (req.body && Object.keys(req.body).length > 0) {
        res.status(400).send();
    } else {
      try {
        await db.sequelize.authenticate();
        console.log("Connected to MySQL database!");
        res.status(200).header('Cache-Control', 'no-cache').send();
      } catch (error) {
        console.error("Error connecting to MySQL database:", error);
        res.status(503).send("Service Unavailable");
      }
    }
};
  
  
  
module.exports = {
    healthCheck
};


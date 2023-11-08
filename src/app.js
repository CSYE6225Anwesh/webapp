
const express = require("express");
const logger = require('./logger/logger');
const { sequelize, createDatabase } = require('./db/db');
const User = require('./model/user')(sequelize);  
const bodyParser = require("body-parser");
const fs = require('fs');
const csvParser = require('csv-parser');
const bcrypt = require('bcrypt');

const path = require("path");
const filePath = "/opt/users.csv";

const assignmentRoutes = require('./routes/assignmentRoutes')();
const healthController = require('./controllers/health');


const app = express();
const port = 8080;

app.use(bodyParser.json());


// Function to load user information from CSV and update the database
const loadUsersFromCSV = async () => {
  const users = [];

  // Read the CSV file and process the data
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)

      .pipe(csvParser())
      .on('data', (row) => {
        users.push(row);
      })
      .on('end', async () => {
        for (const user of users) {
          // Check if the user already exists
          const existingUser = await User.findOne({ where: { email: user.email } });

          if (!existingUser) {
            // User does not exist, create a new user
            const hashedPassword = await bcrypt.hash(user.password, 10);
            await User.create({
              first_name: user.first_name,
              last_name: user.last_name,
              email: user.email,
              password: hashedPassword
            });
          }
        }
        console.log('User data from CSV loaded successfully.');

        logger.info('User data from CSV loaded successfully.');
        
        resolve();
      })
      .on('error', (error) => {
        console.error('Error reading CSV:', error);
        reject(error);
      });
  });
};




app.use('/v1', assignmentRoutes);

app.all("/healthz", healthController.healthCheck);


(async () => {
  try {
    // Create the database if it doesn't exist
    await createDatabase();
    // Sync all defined models to the database
    await sequelize.sync({ alter: true });
    // Load users from CSV
    await loadUsersFromCSV();

    // Start the server
    app.listen(port, () => {
      console.log('Server running on port', port);
    });
  } catch (error) {
    console.error('Error:', error);
  }
})();


// module.exports = {
//   app
// };

module.exports = app;



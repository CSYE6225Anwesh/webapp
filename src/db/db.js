// const { Sequelize } = require('sequelize');
// const mysql = require('mysql2/promise');
// const config = require("./dbConfiguration");
// const UserModel = require('../model/user');
// const AssignmentModel = require('../model/assignment');

// // Create a Sequelize instance
// const sequelize = new Sequelize(config.database, config.username, config.password, {
//   host: config.host,
//   dialect: config.dialect,
//   dialectOptions: {
//     ssl: {
//       require: true,
//       rejectUnauthorized: false
//     }
//   }
// });

// const User = UserModel(sequelize);
// const Assignment = AssignmentModel(sequelize);

// User.hasMany(Assignment, { foreignKey: 'user_id' });
// Assignment.belongsTo(User, { foreignKey: 'user_id', onDelete: 'CASCADE' });

// const syncDatabase = async () => {
//   await sequelize.sync({ alter: true });
//   console.log('Models synchronized successfully.');
// };

// const createDatabase = async () => {
//   const { host, username, password, database } = config;
//   const connection = await mysql.createConnection({
//     host: host,
//     user: username,
//     password: password
//   });
//   await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
// };

// module.exports = {
//   sequelize,
//   createDatabase,
//   syncDatabase,
//   User,
//   Assignment
// };

const { Sequelize } = require("sequelize");
const mysql = require("mysql2/promise");
const config = require("./dbConfiguration");
const UserModel = require("../model/user");
const AssignmentModel = require("../model/assignment");
const AssignmentSubmissionModel = require("../model/assignmentsubmission");
 
// Create a Sequelize instance
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    //dialect: config.dialect,
    dialect: 'mysql', 
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  }
);
 
const User = UserModel(sequelize);
const Assignment = AssignmentModel(sequelize);
 
User.hasMany(Assignment, { foreignKey: "user_id" });
Assignment.belongsTo(User, { foreignKey: "user_id", onDelete: "CASCADE" });
 
// Pass User model to AssignmentSubmission model for association
const AssignmentSubmissionModelWithAssociations = AssignmentSubmissionModel(
  sequelize,
  User
);
 
// Associate AssignmentSubmission model
AssignmentSubmissionModelWithAssociations.belongsTo(Assignment, {
  foreignKey: "assignment_id",
  onDelete: "CASCADE",
});
AssignmentSubmissionModelWithAssociations.belongsTo(User, {
  foreignKey: "user_id",
  onDelete: "CASCADE",
});
 
const syncDatabase = async () => {
  await sequelize.sync({ alter: true });
  console.log("Models synchronized successfully.");
};
 
const createDatabase = async () => {
  const { host, username, password, database } = config;
  const connection = await mysql.createConnection({
    host: host,
    user: username,
    password: password,
    //database: database,
  });
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
};
 
module.exports = {
  sequelize,
  createDatabase,
  syncDatabase,
  User,
  Assignment,
  AssignmentSubmission: AssignmentSubmissionModelWithAssociations,
};
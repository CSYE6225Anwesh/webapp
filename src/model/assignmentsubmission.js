const { DataTypes } = require("sequelize");
 
function model(sequelize) {
  const options = {
    timestamps: false, // Disable automatic timestamps
  };
 
  const attributes = {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true,
    },
    assignment_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    submission_url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    submission_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    submission_updated: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
  };

  
 
  const AssignmentSubmission = sequelize.define(
    "AssignmentSubmission",
    attributes,
    options
  );
 
  AssignmentSubmission.associate = (models) => {
    AssignmentSubmission.belongsTo(models.Assignment, {
      foreignKey: "assignment_id",
      onDelete: "CASCADE",
    });
    AssignmentSubmission.belongsTo(models.User, { 
        foreignKey: "user_id",
        onDelete: "CASCADE",
    });
  };
 
  return AssignmentSubmission;
}
 
module.exports = model;
const { DataTypes } = require('sequelize');

function model(sequelize) {
  const options = {
    timestamps: false // Disable automatic timestamps
  };

  const attributes = {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    points: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 100
      }
    },
    num_of_attempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 100
      }
    },
    deadline: {
      type: DataTypes.DATE,
      allowNull: false
    },
    assignment_created: {
      type: DataTypes.DATE,
      defaultValue: new Date(),
      allowNull: false,
      readOnly: true
    },
    assignment_updated: {
      type: DataTypes.DATE,
      defaultValue: new Date(),
      allowNull: false,
      readOnly: true
    }
  };

  const Assignment = sequelize.define('Assignment', attributes, options);

  Assignment.associate = (models) => {
    Assignment.belongsTo(models.User, { foreignKey: 'user_id', onDelete: 'CASCADE' });
  };

  return Assignment;
}

module.exports = model;

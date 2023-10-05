const { DataTypes } = require('sequelize');

function model(sequelize) {
  const options = {
    timestamps: false, // Disable automatic timestamps
    scopes: {
      withHash: { attributes: {} }
    }
  };

  const attributes = {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true
    },
    first_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      writeOnly: true
    },
    account_created: {
      type: DataTypes.DATE,
      defaultValue: new Date(),
      allowNull: false,
      readOnly: true
    },
    account_updated: {
      type: DataTypes.DATE,
      defaultValue: new Date(),
      allowNull: false,
      readOnly: true
    }
  };

  const User = sequelize.define('User', attributes, options);

  User.associate = (models) => {
    User.hasMany(models.Assignment, { foreignKey: 'user_id' });
  };

  return User;
}

module.exports = model;

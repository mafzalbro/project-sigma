// db.js
const { Sequelize, DataTypes } = require("sequelize");
const path = require("path");

// Create a SQLite database with a file-based storage
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: path.join(__dirname, "database.sqlite"),
});

const User = sequelize.define("User", {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

// Sync the database
sequelize.sync().then(() => console.log("Database & tables created!"));

module.exports = { sequelize, User };

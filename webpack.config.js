const path = require("path");
const nodeExternals = require("webpack-node-externals");
module.exports = {
  entry: "./src/app.js",
  output: {
    filename: "main.js",
    path: path.resolve(__dirname, "dist"),
    clean: true,
  },
  mode: "development",
  target: "node",
  externals: [nodeExternals()],
};
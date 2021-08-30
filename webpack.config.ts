import path from "path";
import webpack from "webpack";
import gas from "gas-webpack-plugin";
import copy from "copy-webpack-plugin";

const config: webpack.Configuration = {
  mode: "production",
  entry: "./src/index.ts",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "code.js",
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  plugins: [new gas(), new copy({ patterns: ["./src/appsscript.json"] })],
};

export default config;

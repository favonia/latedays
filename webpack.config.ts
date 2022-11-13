import path from "path";
import webpack from "webpack";
import gas from "gas-webpack-plugin";
import copy from "copy-webpack-plugin";

const config: webpack.Configuration = {
  mode: "production",
  entry: path.resolve(__dirname, "src", "index.ts"),
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
      {
        enforce: 'pre',
        test: /\.html$/,
        loader: 'raw-loader',
      },
      {
        enforce: 'pre',
        test: /\.graphql$/,
        loader: 'raw-loader',
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
    alias: {
      handlebars: 'handlebars/dist/handlebars.min.js'
   }
  },
  plugins: [
    new gas(),
    new copy({ patterns: [path.resolve(__dirname, "src", "appsscript.json")] }),
  ],
};

export default config;

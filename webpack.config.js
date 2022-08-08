const path = require('path')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  target: 'electron-renderer',
  mode: 'development',
  externals: [
    {
      'electron-store': 'require("electron-store")',
    },
  ],
  entry: {
    app: ['./app/index.js'],
  },
  output: {
    filename: 'app.bundle.js',
    path: path.resolve(__dirname, './public'),
    publicPath: '/',
  },
  resolve: {
    alias: {
      ws: './node_modules/ws/index.js',
    },
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
      },
      {
        test: /\.svg$/,
        use: ['@svgr/webpack'],
      },
      {
        test: /\.(png|jpg|jpeg|gif)$/,
        loader: 'file-loader?limit=8192&name=assets/[name].[ext]?[hash]',
      },
      {
        test: /\.(scss|css)$/,
        use: ['style-loader', 'css-loader', 'sass-loader'],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './app/index.ejs',
    }),
    new CopyWebpackPlugin({
      patterns: [{ from: './app/favicon.ico' }],
    }),
  ],
  devtool: 'eval',
  stats: 'errors-only',
}

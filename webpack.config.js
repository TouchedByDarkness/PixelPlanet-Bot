const path = require('path');

module.exports = {
	// entry: './src/index.js',
	// mode: 'development',
	// mode: 'production',
	module: {
		rules: [
			{
				test: /\.ts$/,
				use: 'ts-loader',
				exclude: /node_modules/,
			},
			{
				test: /(\.txt$)|(\.css$)/,
				use: 'raw-loader',
				exclude: /node_modules/
			}
		],
	},
	resolve: {
		extensions: ['.ts', '.js', '.txt', '.css'],
	},
	// output: {
	// 	filename: 'bundle.js',
	// 	path: __dirname
	// 	// path: path.resolve(__dirname, 'dist')
	// }
}
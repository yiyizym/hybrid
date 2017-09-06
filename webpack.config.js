const path = require('path');
module.exports = {
    entry: './test/main.js',
    module: {
        rules: [
            {
                test: /\.js$/,
                use: [
                    { loader: 'babel-loader' }
                ],
                include: path.resolve(__dirname, 'test')
            }
        ]
    },
    output: {
        path: path.resolve(__dirname, 'test'),
        filename: 'bundle.js'
    }
  }
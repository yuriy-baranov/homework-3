var BrowserSyncPlugin = require('browser-sync-webpack-plugin');

module.exports = {
    entry: ['./js/main.js', 'whatwg-fetch'],
    output: {
        path: __dirname,
        filename: 'bundle.js'
    },
    plugins: [
        new BrowserSyncPlugin({
        host: 'localhost',
        port: 3000,
        server: { baseDir: ['.'] }
        })
    ],
    module: {
        postLoaders: [ { test: /\js?$/, loader: "uglify" } ],
        loaders: [ { test: /\js?$/, loader: 'babel', query: { presets: ['es2015'] } } ]
    }
};
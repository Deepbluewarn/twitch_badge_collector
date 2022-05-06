const path = require("path");

module.exports = {
    mode: "production",
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader",
                exclude: /node_modules/,
            }
        ],
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"],
    },

    entry: {
        extension_background: './src/extension_background.ts',
        inject_background: './src/inject_background.ts',
        video_script: '/src/video_script.ts',
        filterBridge: './src/filterBridge.ts',
        mock_fetch: './src/mock_fetch.ts',
        popup: './src/popup.ts'
    },

    output: {
        filename: "[name].js",
        path: path.resolve(__dirname, 'dist/js')
    },
}
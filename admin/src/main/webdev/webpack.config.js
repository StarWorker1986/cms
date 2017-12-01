const path = require("path");
const glob = require("glob");
const srcPath = path.resolve(__dirname, "src/main");
const buildPath = path.resolve(__dirname, "build");
const pattern = /([\w\/]+)\/([\w]+)(.js|.css|.html)$/;
var exports = [];

var matches = glob("**/*(*.js|*.css|*.html)", { cwd: srcPath, sync: true });

for (let i in matches) {
    let file = matches[i], items = file.match(pattern);
    exports.push({
        entry: path.resolve(srcPath, items[0]),
        output: {
            path: path.resolve(buildPath, items[1]),
            filename: items[2] + items[3]
        }
    });
}

module.exports = exports;
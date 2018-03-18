const webpackHome = "E:/NpmModules/node_modules/webpack";

const webpack = require(webpackHome);
const path = require("path");
const fs = require("fs");
const rm = require("rimraf");
const glob = require("glob");
const json5 = require("json5");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin")
const nodeModulesPath = path.resolve(__dirname, "node_modules");
const srcPath = path.resolve(__dirname, "src/main");
const buildPath = path.resolve(__dirname, "build");
const pattern = /^((?:[\w]+\/)+)*([\w]+)(\.less|\.jsx?)$/;
const less = path.resolve(srcPath, "less");
const admin = path.resolve(srcPath, "org/starworker/cms/admin");
const i18n = json5.parse(fs.readFileSync(admin + "/template.json", "utf8"));
const vendors = json5.parse(fs.readFileSync(admin + "/vendors.json", "utf8"));

var exports = [], group = {}, vendor, vendorFiles = [],
    cssMatches = glob("*.less", { cwd: less, sync: true }),
    jsMatches = glob("**/*(*.js|*.jsx)", { cwd: srcPath, sync: true });

for (let i in cssMatches) {
    let file = cssMatches[i], items = file.match(pattern), outName = items[2];

    exports.push({
        entry: path.resolve(less, file),
        output: {
            path: [buildPath, "css"].join(path.sep),
            filename: outName + ".js"
        },
        module: {
            loaders: [{
                test: /\.less$/,
                exclude: /node_modules/,
                loader: "style-loader!css-loader!less-loader",
            }]
        }
    });
}

for (let i in jsMatches) {
    let file = jsMatches[i], items = file.match(pattern), filePath = items[1];
   
    group[filePath] = group[filePath] || [];
    group[filePath].push(path.resolve(srcPath, items[0]));
}

for (let key in vendors) {
    vendor = vendors[key];
    vendor.files.map(function (file) {
        if (/(\.js|\.css)$/.test(file)) {
            vendorFiles.push([key, vendor.version, file].join('/'));
        }
    });
}
for (let key in group) {
    let length = key.length, i = key.lastIndexOf('/', length - 2),
        outPath = key.substring(0, i), outName = key.substring(i + 1, length - 1);

    exports.push({
        entry: group[key],
        output: {
            path: [buildPath, outPath].join(path.sep),
            filename: outName + ".min.js"
        },
        module: {
            loaders: [{
                test: /\.jsx?$/,
                exclude: /node_modules/,
                loader: "babel-loader",
            }]
        },
        plugins: [
             new HtmlWebpackPlugin({
                 i18n: i18n[outName],
                 vendorRoot: [buildPath, "vendors"].join(path.sep),
                 vendors: vendorFiles,
                 filename: outName + ".html",
                 template: admin + "/template.ejs"
             })
        ]
    });
}

for (let key in vendors) {
    vendor = vendors[key];
    vendor.files.map(function (filename) {
        exports.push({
            entry: [nodeModulesPath, key, (vendor.src || ""), filename].join(path.sep),
            output: {
                path: [buildPath, "vendors", key, vendor.version].join(path.sep),
                filename: filename
            },
            module: {
                noParse: function (content) {
                    return true
                }
            }
        });
    });
}

rm(buildPath, function (err) {
    if(err) throw err;
});

module.exports = exports;
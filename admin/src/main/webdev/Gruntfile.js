module.exports = function (grunt) {
    "use strict";

    const fs = require("fs");
    const path = require("path");
    const glob = require("glob");
    const json5 = require("json5");
    const srcPath = "src/main";
    const buildPath = "build";
    const nodePath = "node_modules";
    const lessPath = "src/main/less";
    const ejsPath = "src/main/ejs";
    const iconPath = "src/main/icons";
    const pattern = /^((?:[\w]+\/)+)*([\w]+)(\.min\.js)$/;
    const assetsPattern = /(\.css|\.js)$/;
    const region = "zh-CN";
    const vendors = json5.parse(fs.readFileSync(srcPath + "/vendors.json", "utf8"));
    const i18n = json5.parse(fs.readFileSync(srcPath + "/i18n/" + region + ".json", "utf8"));

    var assets = [], concat = {}, copy = {}, vendor, dest, src,
        cssMatchs = glob("**/*.min.css", { cwd: lessPath, sync: true }),
        jsMatches = glob("**/*.min.js", { cwd: srcPath, sync: true });

    for (let i in cssMatchs) {
        cssMatchs[i] = [lessPath, cssMatchs[i]].join('/');
    }
    concat["css"] = {
        src: cssMatchs,
        dest: [buildPath, "css", "cms.min.css"].join('/')
    }

    for (let i in jsMatches) {
        let file = jsMatches[i], items = file.match(pattern), filePath = items[1];
        let length = filePath.length, j = filePath.lastIndexOf('/', length - 2),
            outPath = filePath.substring(0, j), outName = filePath.substring(j + 1, length - 1);

        concat[outName] = concat[outName] || { src: [] };
        concat[outName]["src"].push([srcPath, items[0]].join('/'));
        concat[outName]["dest"] = [buildPath, outPath, outName + ".min.js"].join('/');
    }

    for (let key in vendors) {
        vendor = vendors[key];
        vendor.files.map(function (file) {
            if (file.match(assetsPattern)) {
                assets.push(["../../vendors", key, vendor.version, file].join('/'));
            }

            dest = [buildPath, "vendors", key, vendor.version, file].join('/');
            file = !!vendor.cwd ? [vendor.cwd, file].join('/') : file;
            src = [nodePath, key, file].join('/');
            copy[dest] = src;
        });
    }

    copy["icons"] = {
        expand: true,
        cwd: iconPath,
        src: "*.png",
        dest: "build/icons"
    }

    // Force use of Unix newlines
    grunt.util.linefeed = '\n';

    // Project configuration.
    grunt.initConfig({

        // Metadata.
        pkg: grunt.file.readJSON("package.json"),
        banner: ["/**!\n",
                 " * <%= pkg.name %> v<%= pkg.version %>\n",
                 " * <%= pkg.description %>\n",
                 " */\n"].join(''),

        clean: {
            build: "build"
        },

        concat: concat,

        copy: copy,

        ejs: {
            options: {
                i18n: i18n,
                assets: assets
            },
            file: {
                expand: true,
                cwd: ejsPath,
                src: "*.ejs",
                dest: "build/html/" + region,
                ext: ".html"
            }
        },

        less: {
            options: {
                strictMath: true
            },
            file: {
                expand: true,
                cwd: lessPath,
                src: "*.less",
                dest: "<%= less.file.cwd %>",
                ext: ".css"
            }
        },

        cssmin: {
            options: {
                keepSpecialComments: '*',
                advanced: false
            },
            file: {
                expand: true,
                cwd: lessPath,
                src: "*.css",
                dest: "build/css",
                ext: ".min.css"
            }
        },

        babel: {
            options: {
                sourceMap: true,
                presets: ["env", "es2015", "react"]
            },
            file: {
                expand: true,
                cwd: srcPath,
                src: "**/*.jsx",
                dest: "<%= babel.file.cwd %>",
                ext: ".js"
            }
        },

        uglify: {
            options: {
                compress: {
                    warnings: false
                },
                mangle: true,
                preserveComments: "some"
            },
            file: {
                expand: true,
                cwd: srcPath,
                src: "**/*.js",
                dest: "<%= uglify.file.cwd %>",
                ext: ".min.js"
            }
        }
    });

    require("load-grunt-tasks")(grunt, { scope: "devDependencies" });
    grunt.registerTask("default", ["clean", "less", "cssmin", "copy", "ejs"]);
    //grunt.registerTask("test", ["qunit"]);
}

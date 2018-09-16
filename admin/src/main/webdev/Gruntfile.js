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

    var jsAssets = [], cssAssets = [], concat = {},
        copy = {}, uglify = {}, vendor = null, dest = null, src = null;

    var putAssets = (name, version, file, props) => {
        src = ["../../vendors", name, version, file].join('/');
        if (file.lastIndexOf(".js") > -1) {
            file = Object.assign({}, { src: src }, props || {});
            jsAssets.push(file);
        }
        else {
            file = Object.assign({}, { href: src }, props || {});
            cssAssets.push(file);
        }
    }

    for (let name in vendors) {
        vendor = vendors[name];

        vendor.files.map((file) => {
            if(typeof file.src == "string") {
                if (file.src.match(assetsPattern)) {
                    putAssets(name, vendor.version, file.src, file.props);
                }

                dest = [buildPath, "vendors", name, vendor.version, file.src].join('/');
                file = !!vendor.cwd ? [vendor.cwd, file.src].join('/') : file.src;
                src = [nodePath, name, file].join('/');
                copy[dest] = src;
            }
            else if (Array.isArray(file.src)) {
                if (file.dest.match(assetsPattern)) {
                    putAssets(name, vendor.version, file.dest, file.props);
                }

                dest = [buildPath, "vendors", name, vendor.version, file.dest].join('/');
                file.src = file.src.map((src) => {
                    src = !!vendor.cwd ? [vendor.cwd, src].join('/') : src;
                    return [nodePath, name, src].join('/');
                });
                uglify[dest] = file.src;
            }
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
            build: buildPath
        },

        babel: {
            file: {
                expand: true,
                cwd: srcPath,
                src: "**/*.jsx",
                dest: "<%= babel.file.cwd %>",
                ext: ".js"
            }
        },

        copy: copy,

        ejs: {
            options: {
                i18n: i18n,
                jsAssets: jsAssets,
                cssAssets: cssAssets,
                dataMain: "../../js/org/starworker/cms/admin/App.min"
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

        concat: uglify
    });

    require("load-grunt-tasks")(grunt, { scope: "devDependencies" });
    grunt.registerTask("default", ["clean", "concat", "less", "cssmin", "copy", "ejs"]);
    //grunt.registerTask("default", ["babel"]);
}
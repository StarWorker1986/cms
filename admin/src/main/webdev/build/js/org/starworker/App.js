(function (global, factory) {
    if (typeof define === "function" && define.amd) {
        define([], factory);
    } else if (typeof exports !== "undefined") {
        factory();
    } else {
        var mod = {
            exports: {}
        };
        factory();
        global.App = mod.exports;
    }
})(this, function () {
    "use strict";

    requirejs.config({
        baseUrl: "../../js/org/starworker",
        paths: {
            "util/Env": "util/Env",
            "util/ObjectUtil": "util/ObjectUtil",
            "util/Stream": "util/Stream",
            "util/Delay": "util/Delay",
            "util/EventUtil": "util/EventUtil",

            "layout/components/LayoutRow": "layout/components/LayoutRow.min",
            "layout/components/Layout": "layout/components/Layout.min",
            "layout/Dashboard": "layout/Dashboard.min",

            "editor/dom/TreeWalker": "editor/dom/TreeWalker.min"
        }
    });
});

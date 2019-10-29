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
        baseUrl: "../../js/org/starworker/cms",
        paths: {
            "admin/common/utils/EnvUtil": "admin/common/utils/EnvUtil.min",
            "admin/common/utils/ObjectUtil": "admin/common/utils/ObjectUtil.min",
            "admin/common/components/navbar/TopNavbar": "admin/common/components/navbar/TopNavbar.min",
            "admin/common/components/scroller/Scroller": "admin/common/components/scroller/Scroller.min",
            "admin/common/components/dropdown/NavbarDropdown": "admin/common/components/dropdown/NavbarDropdown.min",
            "admin/dashboard/Dashboard": "admin/dashboard/Dashboard.min",

            "layout/components/LayoutRow": "layout/components/LayoutRow.min",
            "layout/components/Layout": "layout/components/Layout.min",
            "layout/Dashboard": "layout/Dashboard.min"
        }
    });
});

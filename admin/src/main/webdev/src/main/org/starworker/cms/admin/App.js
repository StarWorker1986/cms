define(function () {
    "use strict";
    
    requirejs.config({
        baseUrl: "../../js/org/starworker/cms",
        paths: {
            "admin/common/utils/EnvUtils": "admin/common/utils/EnvUtils.min",
            "admin/common/utils/ObjectUtils": "admin/common/utils/ObjectUtils.min",
            "admin/common/navbar/TopNavbar": "admin/common/navbar/TopNavbar.min",
            "admin/elements/scroller/Scroller": "admin/elements/scroller/Scroller.min",
            "admin/elements/dropdown/NavbarDropdown": "admin/elements/dropdown/NavbarDropdown.min",
            "admin/dashboard/Dashboard": "admin/dashboard/Dashboard.min"
        }
    });
});
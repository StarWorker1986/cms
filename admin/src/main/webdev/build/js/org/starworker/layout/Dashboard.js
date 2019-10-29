(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(["layout/components/Layout"], factory);
  } else if (typeof exports !== "undefined") {
    factory(require("layout/components/Layout"));
  } else {
    var mod = {
      exports: {}
    };
    factory(global.Layout);
    global.Dashboard = mod.exports;
  }
})(this, function (_Layout) {
  "use strict";

  var _Layout2 = _interopRequireDefault(_Layout);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  ReactDOM.render(React.createElement(_Layout2.default, null), document.getElementById("main"));
});

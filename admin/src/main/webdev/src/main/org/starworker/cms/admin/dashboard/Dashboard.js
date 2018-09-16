(function (global, factory) {
	if (typeof define === "function" && define.amd) {
		define(["admin/elements/scroller/Scroller"], factory);
	} else if (typeof exports !== "undefined") {
		factory(require("admin/elements/scroller/Scroller"));
	} else {
		var mod = {
			exports: {}
		};
		factory(global.Scroller);
		global.Dashboard = mod.exports;
	}
})(this, function (_Scroller) {
	"use strict";

	var _Scroller2 = _interopRequireDefault(_Scroller);

	function _interopRequireDefault(obj) {
		return obj && obj.__esModule ? obj : {
			default: obj
		};
	}

	$(".dropdown-content").each(function () {
		var scroller = new _Scroller2.default(this, { reset: false, mouseWheelLock: true });
		scroller.render();
	});
});

import Scroller from "admin/elements/scroller/Scroller";

$(".dropdown-content").each(function () {
	let scroller = new Scroller(this, { reset: false, mouseWheelLock: true });
	scroller.render();
});
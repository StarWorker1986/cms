var layouthistory; 
function saveLayout() {
    var data = layouthistory;
    if (!data) {
        data = {};
        data.count = 0;
        data.list = [];
    }
    if (data.list.length > data.count) {
        for (i = data.count; i < data.list.length; i++)
            data.list[i] = null;
    }
    data.list[data.count] = window.demoHtml;
    data.count++;
    layouthistory = data;
}

function undoLayout() {
    var data = layouthistory;
    if (data) {
        if (data.count < 2) return false;
        window.demoHtml = data.list[data.count - 2];
        data.count--;
        $(".ui-sortable").html(window.demoHtml);
        return true;
    }
    return false;
}

function redoLayout() {
	var data = layouthistory;
	if (data) {
		if (data.list[data.count]) {
			window.demoHtml = data.list[data.count];
			data.count++;
			$(".ui-sortable").html(window.demoHtml);
			return true;
		}
	}
	return false;
}

function removeElm() {
    $(".layout-panel").delegate(".remove", "click", function (e) {
        e.preventDefault();
        $(this).parent().remove();
        if (!$(".layout-panel .view").length > 0) {
            clearPanel()
        }
    })
}

function clearPanel() {
	$(".layout-panel").empty();
	layouthistory = null;
}

var currentDocument = null;
var timerSave = 1000;
var stopsave = 0;
var startdrag = 0;
var demoHtml = $(".layout-panel").html();
var currenteditor = null;

$(window).resize(function() {
	$("body").css("min-height", $(window).height() - 90);
	$(".layout-panel").css("min-height", $(window).height() - 160)
});

function initColumn() {
    $(".ui-sortable .layout-column").sortable({
        connectWith: ".ui-sortable",
        handle: ".drag",
        start: function (e, t) {
            if (!startdrag) stopsave++;
            startdrag = 1;
        },
        stop: function (e, t) {
            if (stopsave > 0) stopsave--;
            startdrag = 0;
            $(t.item[0]).removeAttr("style");
        }
    });
}

function initPanel(){
    $(".layout-panel").sortable({
        connectWith: ".ui-sortable",
        handle: ".drag",
        start: function (e, t) {
            if (!startdrag) stopsave++;
            startdrag = 1;
        },
        stop: function (e, t) {
            if (stopsave > 0) stopsave--;
            startdrag = 0;
            $(t.item[0]).removeAttr("style");
        }
    });
}
$(document).ready(function () {
    initPanel();
    initColumn();
    $("[data-toggle='tooltip']").tooltip({ container: "body" });
    $("body").css("min-height", $(window).height() - 90);
    $(".layout-panel").css("min-height", $(window).height() - 160);
    $(".layout-row").draggable({
        connectToSortable: ".ui-sortable",
        helper: function (elm) {
            return $(elm.currentTarget).find(".view").clone();
        },
        handle: ".drag",
        start: function (e, t) {
            if (!startdrag) stopsave++;
            startdrag = 1;
        },
        drag: function (e, t) {
            t.helper.width(400);
        },
        stop: function (e, t) {
            initColumn();
            if (stopsave > 0) stopsave--;
            startdrag = 0;
            t.helper.removeAttr("style");
        }
    });
    $("#edit").click(function () {
        $("body").removeClass("devpreview sourcepreview");
        $("body").addClass("edit");
        removeMenuClasses();
        $(this).addClass("active");
        return false
    });
    $("#clear").click(function (e) {
        e.preventDefault();
        clearPanel()
    });
    $("#devpreview").click(function () {
        $("body").removeClass("edit sourcepreview");
        $("body").addClass("devpreview");
        removeMenuClasses();
        $(this).addClass("active");
        return false
    });
    $("#sourcepreview").click(function () {
        $("body").removeClass("edit");
        $("body").addClass("devpreview sourcepreview");
        removeMenuClasses();
        $(this).addClass("active");
        return false
    });
    $("#fluidPage").click(function (e) {
        e.preventDefault();
        changeStructure("container", "container-fluid");
        $("#fixedPage").removeClass("active");
        $(this).addClass("active");
        downloadLayoutSrc()
    });
    $("#fixedPage").click(function (e) {
        e.preventDefault();
        changeStructure("container-fluid", "container");
        $("#fluidPage").removeClass("active");
        $(this).addClass("active");
        downloadLayoutSrc()
    });
    $(".nav-header").click(function () {
        $(".sidebar-nav .boxes, .sidebar-nav .rows").hide();
        $(this).next().slideDown()
    });
    removeElm();
})
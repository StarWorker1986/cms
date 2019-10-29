var layoutHistory = [''], layoutCursor = 0, layoutContent = '', dragging = false;

function saveLayout() {
    var currentContent = $(".layout-panel").html();
    if (currentContent != layoutContent) {
        var maxCursor = layoutHistory.length - 1;

        if (layoutCursor < maxCursor) {
            for (var i = layoutCursor; i < maxCursor; i++) {
                layoutHistory.pop();
            }
        }

        layoutHistory.push(currentContent);
        layoutContent = currentContent;
        layoutCursor++;
    }
}

function undoLayout() {
    if (layoutCursor > 0) {
        layoutCursor--;
        layoutContent = layoutHistory[layoutCursor];
        $(".layout-panel").html(layoutContent);
    }
}

function redoLayout() {
    if (layoutCursor < layoutHistory.length - 1) {
        layoutCursor++;
        layoutContent = layoutHistory[layoutCursor];
        $(".layout-panel").html(layoutContent);
        initColumn();
    }
}

function clearPanel() {
	$(".layout-panel").empty();
	layoutHistory = [''];
	layoutCursor = 0;
	layoutContent = '';
	dragging = false;
}

function handleMouseUp() {
    $("#layoutUndoBtn").attr("disabled", true);
    $("#layoutRedoBtn").attr("disabled", true);
    setTimeout(function () {
        saveLayout();
        dragging = false;
        $("#layoutUndoBtn").removeAttr("disabled");
        $("#layoutRedoBtn").removeAttr("disabled");
    }, 10);
}

$(window).resize(function() {
	$("body").css("min-height", $(window).height() - 90);
	$(".layout-panel").css("min-height", $(window).height() - 160)
});

function initColumn() {
    $(".ui-sortable .layout-column").sortable({
        connectWith: ".ui-sortable",
        handle: ".drag",
        start: function (e, t) {
            dragging = true;
        },
        sort: function (e, t) {
            var width = t.helper.parent().width(), left = parseInt(t.helper.css("left"));
            t.helper.css("left", width + left - 300 + "px");
            t.helper.width(300);
        },
        stop: function (e, t) {
            $(t.item[0]).removeAttr("style");
        }
    });
}

function initPanel() {
    $(".layout-panel")
    .sortable({
        connectWith: ".ui-sortable",
        handle: ".drag",
        start: function (e, t) {
            dragging = true;
        },
        sort: function (e, t) {
            var width = t.helper.parent().width(), left = parseInt(t.helper.css("left"));
            t.helper.css("left", width + left - 300 + "px");
            t.helper.width(300);
            var views = t.helper.find(".view");
            for (var i = 0; i < views.length; i++) {
                $(views[i]).css("display", "none");
            }
        },
        stop: function (e, t) {
            $(t.item[0]).removeAttr("style");
            var views = $(t.item[0]).find(".view");
            for (var i = 0; i < views.length; i++) {
                $(views[i]).removeAttr("style");
            }
        }
    })
    .delegate(".remove", "click", function (e) {
        e.preventDefault();
        $(this).parent().remove();
        if (!$(".layout-panel .view").length) {
            clearPanel();
        }
        handleMouseUp();
    })
    .mouseup(function () {
        if (!dragging) return false;
        handleMouseUp();
    })
}
$(document).ready(function () {
    initPanel();
    initColumn();
    $("[data-toggle='tooltip']").tooltip({ container: "body", trigger: "hover" });
    $("body").css("min-height", $(window).height() - 90);
    $(".layout-panel").css("min-height", $(window).height() - 160);
    $(".layout-row").draggable({
        connectToSortable: ".ui-sortable",
        helper: function (elm) {
            return $(elm.currentTarget).find(".view").clone();
        },
        handle: ".drag",
        start: function (e, t) {
            dragging = true;
        },
        drag: function (e, t) {
            t.helper.width(300);
        },
        stop: function (e, t) {
            initColumn();
        }
    });
    $("#layoutClearBtn").click(function (e) {
        clearPanel();
    });
    $("#layoutPreviewBtn").click(function () {
        $("body").removeClass("layout-edit").addClass("layout-preview");
    });
    $("#backToLayoutEditBtn").click(function () {
        $("body").removeClass("layout-preview").addClass("layout-edit");
    });
    $("#layoutUndoBtn").click(function () {
        undoLayout();
    });
    $("#layoutRedoBtn").click(function () {
        redoLayout();
    });
})
import LayoutRow from "layout/components/LayoutRow";

export default class Layout extends React.Component {
    constructor(props) {
        super(props);
        this._layoutHistory = [''];
        this._layoutCursor = 0;
        this._layoutContent = '';
        this._dragging = false;
    }

    render() {
        this.__init();
        return (
            <div class="container-fluid layout-edit">
            <div class="btn-group btn-back-edit" role="group">
                <button type="button" id="backToLayoutEditBtn" class="btn btn-default btn-sm"><i class="fa fa-arrow-left"></i>返回</button>
                <button type="button" class="btn btn-default btn-sm active"><i class="fa fa-eye"></i>预览</button>
            </div>
            <div class="layout-top-navbar">
                <div class="btn-toolbar" role="toolbar">
                    <div class="btn-group" role="group">
                        <button type="button" class="btn btn-default active" data-toggle="tooltip" data-placement="bottom" title="编辑"><i class="fa fa-edit"></i></button>
                        <button type="button" id="layoutPreviewBtn" class="btn btn-default" data-toggle="tooltip" data-placement="bottom" title="预览"><i class="fa fa-eye"></i></button>
                        <button type="button" id="layoutClearBtn" class="btn btn-default" data-toggle="tooltip" data-placement="bottom" title="清除"><i class="fa fa-eraser"></i></button>
                        <button type="button" id="layoutUndoBtn" class="btn btn-default" data-toggle="tooltip" data-placement="bottom" title="撤销"><i class="fa fa-undo"></i></button>
                        <button type="button" id="layoutRedoBtn" class="btn btn-default" data-toggle="tooltip" data-placement="bottom" title="重做"><i class="fa fa-repeat"></i></button>
                    </div>
                </div>
            </div>
            <div class="layout-side-navbar">
                <a href="#" class="layout-brand"><i class="fa fa-th-large"></i>可视化文本编辑器</a>
                <LayoutRow spans={ [12] } />
                <LayoutRow spans={ [6, 6] } />
                <LayoutRow spans={ [4, 8] } />
                <LayoutRow spans={ [8, 4] } />
                <LayoutRow spans={ [4, 4, 4 ] } />
                <LayoutRow spans={ [3, 3, 3, 3 ] } />
            </div>
            <div class="layout-panel ui-sortable"></div>
        </div>
        );
    }

    __init() {
        let self = this;
        $(document).ready(() => {
            $("[data-toggle='tooltip']").tooltip({ container: "body" });
            $("body").css("min-height", $(window).height() - 90);
            $(".layout-panel").css("min-height", $(window).height() - 160);

            self.__initPanel();
            self.__initRow();
            self.__initColumn();
            self.__registerEvent();
        });
    }

    __initPanel() {
        let self = this;
        $(".layout-panel")
        .sortable({
            connectWith: ".ui-sortable",
            handle: ".drag",
            start: function(e, t) {
                self._dragging = true;
            },
            stop: function(e, t) {
                $(t.item[0]).removeAttr("style");
            }
        })
        .delegate(".remove", "click", (e) => {
            e.preventDefault();
            $(this).parent().remove();
            if (!$(".layout-panel .view").length) {
                this.__clearPanel();
            }
            this.__handleMouseUp();
        })
        .mouseup(() => {
            if (!self._dragging) return false;
            this.__handleMouseUp();
        })
    }

    __initRow() {
        let self = this;
        $(".layout-row").draggable({
            connectToSortable: ".ui-sortable",
            helper: function (elm) {
                return $(elm.currentTarget).find(".view").clone();
            },
            handle: ".drag",
            start: function (e, t) {
                self._dragging = true;
            },
            drag: function (e, t) {
                t.helper.width(400);
            },
            stop: function (e, t) {
                this.__initColumn();
            }
        });
    }

    __initColumn() {
        let self = this;
        $(".ui-sortable .layout-column").sortable({
            connectWith: ".ui-sortable",
            handle: ".drag",
            start: function (e, t) {
                self._dragging = true;
            },
            stop: function (e, t) {
                $(t.item[0]).removeAttr("style");
            }
        });
    }

    __registerEvent() {
        $(window).resize(() => {
            $("body").css("min-height", $(window).height() - 90);
            $(".layout-panel").css("min-height", $(window).height() - 160)
        });

        $("#layoutClearBtn").click((e) => {
            this.__clearPanel();
        });
        $("#layoutPreviewBtn").click(() => {
            $("body").removeClass("layout-edit").addClass("layout-preview");
        });
        $("#backToLayoutEditBtn").click(() => {
            $("body").removeClass("layout-preview").addClass("layout-edit");
        });
        $("#layoutUndoBtn").click(() => {
            this.__undoLayout();
        });
        $("#layoutRedoBtn").click(() => {
            this.__redoLayout();
        });
    }

    __saveLayout() {
        let currentContent = $(".layout-panel").html();
        if (currentContent != this._layoutContent) {
            let maxCursor = this._layoutHistory.length - 1;

            if (this._layoutCursor < maxCursor) {
                for (let i = this._layoutCursor; i < maxCursor; i++) {
                    this._layoutHistory.pop();
                }
            }

            this._layoutHistory.push(currentContent);
            this._layoutContent = currentContent;
            this._layoutCursor++;
        }
    }

    __undoLayout() {
        if (this._layoutCursor > 0) {
            this._layoutCursor--;
            this._layoutContent = this._layoutHistory[this._layoutCursor];
            $(".layout-panel").html(this._layoutContent);
        }
    }

    __redoLayout() {
        if (this._layoutCursor < this._layoutHistory.length - 1) {
            this._layoutCursor++;
            this._layoutContent = this._layoutHistory[this._layoutCursor];
            $(".layout-panel").html(this._layoutContent);
            this.__initColumn();
        }
    }

    __clearPanel() {
        $(".layout-panel").empty();
        this._layoutHistory = [''];
        this._layoutCursor = 0;
        this._layoutContent = '';
        this._this._dragging = false;
    }

    __handleMouseUp() {
        let self = this;
        $("#layoutUndoBtn").attr("disabled", true);
        $("#layoutRedoBtn").attr("disabled", true);
        setTimeout(function () {
            self.__saveLayout();
            self._this._dragging = false;
            $("#layoutUndoBtn").removeAttr("disabled");
            $("#layoutRedoBtn").removeAttr("disabled");
        }, 10);
    }
}
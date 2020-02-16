import Delay from "./util/Delay";
import Predicate from "./util/Predicate";
import Predicate from "./util/Tools";
import DOMUtils from "./dom/DOMUtils";
import MousePosition from "./dom/MousePosition";
import NodeType from "./dom/NodeType";

export default class DragDropOverrides {
    static init(editor) {
        this.__bindFakeDragEvents(editor);
        this.__blockIeDrop(editor);
    }

    static __bindFakeDragEvents(editor) {
        let state = {}, pageDom, dragStartHandler, dragHandler, dropHandler, dragEndHandler, rootDocument;

        pageDom = DOMUtils.DOM;
        rootDocument = document;
        dragStartHandler = this.__start(state, editor);
        dragHandler = this.__move(state, editor);
        dropHandler = this.__drop(state, editor);
        dragEndHandler = this.__stop(state, editor);
        editor.on("mousedown", dragStartHandler);
        editor.on("mousemove", dragHandler);
        editor.on("mouseup", dropHandler);
        pageDom.bind(rootDocument, "mousemove", dragHandler);
        pageDom.bind(rootDocument, "mouseup", dragEndHandler);
        editor.on("remove", () => {
            pageDom.unbind(rootDocument, "mousemove", dragHandler);
            pageDom.unbind(rootDocument, "mouseup", dragEndHandler);
        });
    }

    static __start(state, editor) {
        return (e) => {
            if (e.button === 0) {
                let ceElm = Tools.find(editor.dom.getParents(e.target), Predicate.or(NodeType.isContentEditableFalse, NodeType.isContentEditableTrue)).getOr(null),
                    isDraggable = NodeType.isContentEditableFalse(ceElm) && ceElm !== editor.getBody();

                if (isDraggable) {
                    let elmPos = editor.dom.getPos(ceElm),
                        bodyElm = editor.getBody(),
                        docElm = editor.getDoc().documentElement;

                    state.element = ceElm;
                    state.screenX = e.screenX;
                    state.screenY = e.screenY;
                    state.maxX = (editor.inline ? bodyElm.scrollWidth : docElm.offsetWidth) - 2;
                    state.maxY = (editor.inline ? bodyElm.scrollHeight : docElm.offsetHeight) - 2;
                    state.relX = e.pageX - elmPos.x;
                    state.relY = e.pageY - elmPos.y;
                    state.width = ceElm.offsetWidth;
                    state.height = ceElm.offsetHeight;
                    state.ghost = this.__createGhost(ceElm, state.width, state.height);
                }
            }
        };
    }

    static __createGhost(elm, width, height) {
        let clonedElm = elm.cloneNode(true);

        $(clondeElm).css({ width: width, height: height, margin: "0px", boxSizing: "border-box" });
        $(clonedElm).attr("data-editor-selected", null);

        let $ghost = $('<div></div>');
        $ghost.attr({
            "class": "editor-drag-container",
            "data-editor-bogus": "all",
            "unselectable": "on",
            "contenteditable": "false"
        }).css({
            position: "absolute",
            opacity: 0.5,
            overflow: "hidden",
            border: 0,
            padding: 0,
            margin: 0,
            width: width,
            height: height
        }).append(clonedElm);

        return $ghost[0];
    }

    static __move(state, editor) {
        // Reduces laggy drag behavior on Gecko
        let throttledPlaceCaretAt = Delay.throttle((clientX, clientY) => {
            editor.selectionOverrides.hideFakeCaret();
            editor.selection.placeCaretAt(clientX, clientY);
        }, 0);

        return (e) => {
            let movement = Math.max(Math.abs(e.screenX - state.screenX), Math.abs(e.screenY - state.screenY));

            if (state.element && !state.dragging && movement > 10) {
                let args = editor.fire("dragstart", { target: state.element });

                if (args.isDefaultPrevented()) {
                    return;
                }
                state.dragging = true;
                editor.focus();
            }

            if (state.dragging) {
                let targetPos = this.__applyRelPos(state, MousePosition.calc(editor, e));
                this.__appendGhostToBody(state.ghost, editor.getBody());
                this.__moveGhost(state.ghost, targetPos, state.width, state.height, state.maxX, state.maxY);
                throttledPlaceCaretAt.start(e.clientX, e.clientY);
            }
        };
    }

    static __applyRelPos(state, position) {
        return {
            pageX: position.pageX - state.relX,
            pageY: position.pageY + 5
        };
    }

    static __appendGhostToBody(ghostElm, bodyElm) {
        if (ghostElm.parentNode !== bodyElm) {
            bodyElm.appendChild(ghostElm);
        }
    }

    static __moveGhost(ghostElm, position, width, height, maxX, maxY) {
        let overflowX = 0, overflowY = 0;

        ghostElm.style.left = position.pageX + "px";
        ghostElm.style.top = position.pageY + "px";

        if (position.pageX + width > maxX) {
            overflowX = (position.pageX + width) - maxX;
        }

        if (position.pageY + height > maxY) {
            overflowY = (position.pageY + height) - maxY;
        }

        ghostElm.style.width = (width - overflowX) + "px";
        ghostElm.style.height = (height - overflowY) + "px";
    }

    static __drop(state, editor) {
        return (e) => {
            if (state.dragging) {
                if (this.__isValidDropTarget(editor, this.__getRawTarget(editor.selection), state.element)) {
                    let targetClone = this.__cloneElement(state.element);
                    let args = editor.fire("drop", {
                        targetClone: targetClone,
                        clientX: e.clientX,
                        clientY: e.clientY
                    });

                    if (!args.isDefaultPrevented()) {
                        targetClone = args.targetClone;
                        editor.undoManager.transact(() => {
                            $(state.element).remove();
                            editor.insertContent(editor.dom.getOuterHTML(targetClone));
                            editor.selectionOverrides.hideFakeCaret();
                        });
                    }
                }
            }
            this.__removeDragState(state);
        };
    }

    static __isValidDropTarget(editor, targetElement, dragElement) {
        if (targetElement === dragElement || editor.dom.isChildOf(targetElement, dragElement)) {
            return false;
        }
        if (NodeType.isContentEditableFalse(targetElement)) {
            return false;
        }
        return true;
    }

    static __getRawTarget(selection) {
        let rng = selection.getSel().getRangeAt(0), startContainer = rng.startContainer;
        return startContainer.nodeType === 3 ? startContainer.parentNode : startContainer;
    }

    static __cloneElement(elm) {
        let cloneElm = elm.cloneNode(true);
        cloneElm.removeAttribute("data-editor-selected");
        return cloneElm;
    }

    static __removeDragState(state) {
        state.dragging = false;
        state.element = null;
        $(state.ghost).remove();
    }

    static __stop(state, editor) {
        return () => {
            if (state.dragging) {
                editor.fire("dragend");
            }
            this.__removeDragState(state);
        };
    }

    static __blockIeDrop(editor) {
        editor.on("drop", (e) => {
            // FF doesn"t pass out clientX/clientY for drop since this is for IE we just use null instead
            let realTarget = typeof e.clientX !== "undefined" ? editor.getDoc().elementFromPoint(e.clientX, e.clientY) : null;
            if (NodeType.isContentEditableFalse(realTarget) || NodeType.isContentEditableFalse(editor.dom.getContentEditableParent(realTarget))) {
                e.preventDefault();
            }
        });
    }
}
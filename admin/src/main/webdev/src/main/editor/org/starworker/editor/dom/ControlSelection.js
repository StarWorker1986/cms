import DOMUtils from "./DOMUtils";
import NodeType from "./NodeType";
import RangePoint from "./RangePoint";
import Env from "../util/Env";
import Delay from "../util/Delay";
import Tools from "../util/Tools";
import Events from "../Events";

export default class ControlSelection {
    constructor(selection, editor) {
        this._selection = selection;
        this._editor = editor;
        this._selectedElm = null;
        this._startX = null;
        this._startY = null;
        this._selectedElmX = null;
        this._selectedElmY = null;
        this._startW = null;
        this._startH = null;
        this._ratio = null;
        this._resizeStarted = null;
        this._selectedElmGhost = null;
        this._resizeHelper = null;
        this._selectedHandle = null;
        this._width = null;
        this._height = null;
        this._editableDoc = editor.getDoc()
        this._rootDocument = document;
        this._rootElement = editor.getBody();
        this._startScrollWidth = null;
        this._startScrollHeight = null;
        this._resizeHandles = {
            // Name: x multiplier, y multiplier, delta size x, delta size y
            /*n: [0.5, 0, 0, -1],
            e: [1, 0.5, 1, 0],
            s: [0.5, 1, 0, 1],
            w: [0, 0.5, -1, 0],*/
            nw: [0, 0, -1, -1],
            ne: [1, 0, 1, -1],
            se: [1, 1, 1, 1],
            sw: [0, 1, -1, 1]
        }

        editor.on("init", () => {
            this.__disableGeckoResize();

            if (Env.ie && Env.ie >= 11) {
                editor.on("mousedown click", (e) => {
                    let target = e.target, nodeName = target.nodeName;

                    if (!this._resizeStarted && /^(TABLE|IMG|HR)$/.test(nodeName)
                                             && !this.__isWithinContentEditableFalse(target)) {
                        if (e.button !== 2) {
                            editor.selection.select(target, nodeName === "TABLE");
                        }

                        // Only fire once since nodeChange is expensive
                        if (e.type === "mousedown") {
                            editor.nodeChanged();
                        }
                    }
                });

                editor.dom.bind(this._rootElement, "mscontrolselect", (e) => {
                    if (this.__isWithinContentEditableFalse(e.target)) {
                        e.preventDefault();
                        Delay.setEditorTimeout(editor, () => {
                            editor.selection.select(e.target);
                        });
                        return;
                    }
                    
                    if (/^(TABLE|IMG|HR)$/.test(e.target.nodeName)) {
                        e.preventDefault();
                        if (e.target.tagName === "IMG") {
                            Delay.setEditorTimeout(editor, () => {
                                editor.selection.select(e.target);
                            });
                        }
                    }
                });
            }

            editor.on("nodechange ResizeEditor ResizeWindow drop FullscreenStateChanged", this.__throttledUpdateResizeRect);
            editor.on("keyup compositionend", (e) => {
                if (this._selectedElm && this._selectedElm.nodeName === "TABLE") {
                    this.__throttledUpdateResizeRect(e);
                }
            });
            editor.on("hide blur", this.hideResizeRect);
            editor.on("contextmenu", this.__contextMenuSelectImage);
        });
        editor.on("remove", this.__unbindResizeHandleEvents());
    }

    destroy() {
        this._selectedElm = this._selectedElmGhost = null;
    }

    isResizable(elm) {
        let editor = this._editor, selector = editor.settings.objectResizing;

        if (selector === false || Env.iOS) {
            return false;
        }
        if (typeof selector !== "string") {
            selector = "table,img,figure.image,div";
        }
        if (elm.getAttribute("data-editor-resize") === "false") {
            return false;
        }
        if (elm === editor.getBody()) {
            return false;
        }

        return DOMUtils.is(DOMUtils.fromDom(elm), selector);
    }

    hideResizeRect() {
        let resizeHandles = this._resizeHandles, dom = this._editor.dom, name, handleElm;

        this.__unbindResizeHandleEvents();
        if (this._selectedElm) {
            this._selectedElm.removeAttribute("data-editor-selected");
        }

        for (name in resizeHandles) {
            handleElm = dom.get("editorResizeHandle" + name);
            if (handleElm) {
                dom.unbind(handleElm);
                dom.remove(handleElm);
            }
        }
    }

    showResizeRect(targetElm) {
        let editor = this._editor, dom = editor.dom, resizeHandles = this._resizeHandles,
            position, targetWidth, targetHeight, e, rect;

        this.hideResizeRect();
        this.__unbindResizeHandleEvents();

        // Get position and size of target
        position = dom.getPos(targetElm, this._rootElement);
        this._selectedElmX = position.x;
        this._selectedElmY = position.y;
        rect = targetElm.getBoundingClientRect(); // Fix for Gecko offsetHeight for table with caption
        targetWidth = rect.width || (rect.right - rect.left);
        targetHeight = rect.height || (rect.bottom - rect.top);

        // Reset this._width/this._height if user selects a new image/table
        if (this._selectedElm !== targetElm) {
            this._selectedElm = targetElm;
            this._width = this._height = 0;
        }

        // Makes it possible to disable resizing
        e = editor.fire("ObjectSelected", { target: targetElm });
        if (this.isResizable(targetElm) && !e.isDefaultPrevented()) {
            ArrUtils.each(resizeHandles, (handle, name) => {
                let handleElm = dom.get("editorResizeHandle" + name);

                if (handleElm) {
                    dom.remove(handleElm);
                }

                handleElm = dom.add(this._rootElement, "div", {
                    "id": "editorResizeHandle" + name,
                    "data-editor-bogus": "all",
                    "class": "editor-resizehandle",
                    "unselectable": true,
                    "style": "cursor:" + name + "-resize; margin:0; padding:0"
                });

                if (Env.ie === 11) {
                    handleElm.contentEditable = false;
                }

                dom.bind(handleElm, "mousedown", (e) => {
                    e.stopImmediatePropagation();
                    e.preventDefault();

                    // Start drag
                    this._startX = e.screenX;
                    this._startY = e.screenY;
                    this._startW = this.__getResizeTarget(this._selectedElm).clientWidth;
                    this._startH = this.__getResizeTarget(this._selectedElm).clientHeight;
                    this._ratio = this._startH / this._startW;
                    this._selectedHandle = handle;
                    
                    handle.startPos = {
                        x: targetWidth * handle[0] + this._selectedElmX,
                        y: targetHeight * handle[1] + this._selectedElmY
                    };

                    this._startScrollWidth = this._rootElement.scrollWidth;
                    this._startScrollHeight = this._rootElement.scrollHeight;
                    this._selectedElmGhost = this._selectedElm.cloneNode(true);

                    dom.addClass(this._selectedElmGhost, "editor-clonedresizable");
                    dom.setAttrib(this._selectedElmGhost, "data-editor-bogus", "all");

                    this._selectedElmGhost.contentEditable = false;
                    this._selectedElmGhost.unSelectabe = true;

                    dom.setStyles(this._selectedElmGhost, {
                        left: this._selectedElmX,
                        top: this._selectedElmY,
                        margin: 0
                    });

                    this._selectedElmGhost.removeAttribute("data-editor-selected");
                    this._rootElement.appendChild(this._selectedElmGhost);

                    dom.bind(this._editableDoc, "mousemove", this.__resizeGhostElement);
                    dom.bind(this._editableDoc, "mouseup", this.__endGhostResize);

                    if (this._rootDocument !== this._editableDoc) {
                        dom.bind(this._rootDocument, "mousemove", this.__resizeGhostElement);
                        dom.bind(this._rootDocument, "mouseup", this.__endGhostResize);
                    }

                    this._resizeHelper = dom.add(this._rootElement, "div", {
                        "class": "editor-resize-helper",
                        "data-editor-bogus": "all"
                    }, this._startW + " &times; " + this._startH);
                });

                handle.elm = handleElm;
                dom.setStyles(handleElm, {
                    left: (targetWidth * handle[0] + this._selectedElmX) - (handleElm.offsetWidth / 2),
                    top: (targetHeight * handle[1] + this._selectedElmY) - (handleElm.offsetHeight / 2)
                });
            });
        }
        else {
            this.hideResizeRect();
        }
        this._selectedElm.setAttribute("data-editor-selected", "1");
    }

    updateResizeRect(e) {
        let editor = this._editor, selection = this._selection, dom = editor.dom, startElm, controlElm;

        if (this._resizeStarted || editor.removed) {
            return;
        }

        // Remove data-editor-selected from all elements since they might have been copied using Ctrl+c/v
        ArrUtils.each(dom.select("img[data-editor-selected],hr[data-editor-selected]"), (img) => {
            img.removeAttribute("data-editor-selected");
        });

        controlElm = (e.type === "mousedown" ? e.target : selection.getNode());
        controlElm = DOMUtils.$(controlElm).closest("table,img,figure.image,hr")[0];

        if (this.__isChildOrEqual(controlElm, this._rootElement)) {
            this.__disableGeckoResize();
            startElm = selection.getStart(true);
            if (this.__isChildOrEqual(startElm, controlElm) && this.__isChildOrEqual(selection.getEnd(true), controlElm)) {
                this.showResizeRect(controlElm);
                return;
            }
        }
        this.hideResizeRect();
    }

    __contextMenuSelectImage(evt) {
        let editor = this._editor, target = evt.target;
        if (this.__isEventOnImageOutsideRange(evt, editor.selection.getRng()) && !evt.isDefaultPrevented()) {
            evt.preventDefault();
            editor.selection.select(target);
        }
    }

    __disableGeckoResize() {
        try {
            this._editor.getDoc().execCommand("enableObjectResizing", false, false);
        }
        catch (ex) {
            // Ignore
        }
    }

    __endGhostResize() {
        let editor = this._editor, dom = editor.dom;

        this._resizeStarted = false;
        this.__setSizeProp("width", this._width);
        this.__setSizeProp("height", this._height);

        dom.unbind(this._editableDoc, "mousemove", this.__resizeGhostElement);
        dom.unbind(this._editableDoc, "mouseup", this.__endGhostResize);

        if (this._rootDocument !== this._editableDoc) {
            dom.unbind(this._rootDocument, "mousemove", this.__resizeGhostElement);
            dom.unbind(this._rootDocument, "mouseup", this.__endGhostResize);
        }

        dom.remove(this._selectedElmGhost);
        dom.remove(this._resizeHelper);

        this.showResizeRect(this._selectedElm);
        Events.fireObjectResized(editor, this._selectedElm, this._width, this._height);
        dom.setAttrib(this._selectedElm, "style", dom.getAttrib(this._selectedElm, "style"));
        editor.nodeChanged();
    }

    __getContentEditableRoot(root, node) {
        while (node && node !== root) {
            if (NodeType.isContentEditableTrue(node) || NodeType.isContentEditableFalse(node)) {
                return node;
            }
            node = node.parentNode;
        }
        return null;
    }

    __getResizeTarget(elm) {
        return this._editor.dom.is(elm, "figure.image") ? elm.querySelector("img") : elm;
    }

    __isEventOnImageOutsideRange(evt, range) {
        return this.__isImage(evt.target) && !RangePoint.isXYWithinRange(evt.clientX, evt.clientY, range);
    }

    __isChildOrEqual(node, parent) {
        if (node) {
            do {
                if (node === parent) {
                    return true;
                }
            } while ((node = node.parentNode));
        }
    }

    __isImage(elm) {
        return elm && (elm.nodeName === "IMG" || this._editor.dom.is(elm, "figure.image"));
    }

    __isWithinContentEditableFalse(elm) {
        return NodeType.isContentEditableFalse(this.__getContentEditableRoot(this._editor.getBody(), elm));
    }

    __resizeGhostElement(e) {
        let editor = this._editor, dom = editor.dom, deltaX, deltaY, proportional,
        resizeHelperX, resizeHelperY, abs = Math.abs, round = Math.round;

        // Calc new this._width/this._height
        deltaX = e.screenX - this._startX;
        deltaY = e.screenY - this._startY;

        // Calc new size
        this._width = deltaX * this._selectedHandle[2] + this._startW;
        this._height = deltaY * this._selectedHandle[3] + this._startH;

        // Never scale down lower than 5 pixels
        this._width = this._width < 5 ? 5 : this._width;
        this._height = this._height < 5 ? 5 : this._height;

        if (this.__isImage(this._selectedElm) && editor.settings.resizeImgProportional !== false) {
            proportional = !Tools.modifierPressed(e);
        }
        else {
            proportional = Tools.modifierPressed(e) || (this.__isImage(this._selectedElm) && this._selectedHandle[2] * this._selectedHandle[3] !== 0);
        }

        // Constrain proportions
        if (proportional) {
            if (abs(deltaX) > abs(deltaY)) {
                this._height = round(this._width * this._ratio);
                this._width = round(this._height / this._ratio);
            }
            else {
                this._width = round(this._height / this._ratio);
                this._height = round(this._width * this._ratio);
            }
        }

        // Update ghost size
        dom.setStyles(this.__getResizeTarget(this._selectedElmGhost), {
            width: this._width,
            height: this._height
        });

        // Update resize helper position
        resizeHelperX = this._selectedHandle.startPos.x + deltaX;
        resizeHelperY = this._selectedHandle.startPos.y + deltaY;
        resizeHelperX = resizeHelperX > 0 ? resizeHelperX : 0;
        resizeHelperY = resizeHelperY > 0 ? resizeHelperY : 0;
        
        dom.setStyles(this._resizeHelper, {
            left: resizeHelperX,
            top: resizeHelperY,
            display: "block"
        });

        this._resizeHelper.innerHTML = this._width + " &times; " + this._height;
        
        // Update ghost X position if needed
        if (this._selectedHandle[2] < 0 && this._selectedElmGhost.clientWidth <= this._width) {
            dom.setStyle(this._selectedElmGhost, "left", this._selectedElmX + (this._startW - this._width));
        }

        // Update ghost Y position if needed
        if (this._selectedHandle[3] < 0 && this._selectedElmGhost.clientHeight <= this._height) {
            dom.setStyle(this._selectedElmGhost, "top", this._selectedElmY + (this._startH - this._height));
        }

        // Calculate how must overflow we got
        deltaX = this._rootElement.scrollWidth - this._startScrollWidth;
        deltaY = this._rootElement.scrollHeight - this._startScrollHeight;

        // Re-position the resize helper based on the overflow
        if (deltaX + deltaY !== 0) {
            dom.setStyles(this._resizeHelper, {
                left: resizeHelperX - deltaX,
                top: resizeHelperY - deltaY
            });
        }

        if (!this._resizeStarted) {
            Events.fireObjectResizeStart(editor, this._selectedElm, this._startW, this._startH);
            this._resizeStarted = true;
        }
    }

    __setSizeProp(name, value) {
        let editor = this._editor;
        if (value) {
            // Resize by using style or attribute
            if (this._selectedElm.style[name] || !editor.schema.isValid(this._selectedElm.nodeName.toLowerCase(), name)) {
                dom.setStyle(this.__getResizeTarget(this._selectedElm), name, value);
            }
            else {
                dom.setAttrib(this.__getResizeTarget(this._selectedElm), name, value);
            }
        }
    }

    __throttledUpdateResizeRect() {
        Delay.throttle((e) => {
            if (!this._editor.composing) {
                this.updateResizeRect(e);
            }
        })
    }

    __unbindResizeHandleEvents() {
        let dom = this._editor.dom, resizeHandles = this._resizeHandles;
        for (let name in resizeHandles) {
            let handle = resizeHandles[name];
            if (handle.elm) {
                dom.unbind(handle.elm);
                delete handle.elm;
            }
        }
    }
}
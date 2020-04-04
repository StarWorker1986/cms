import DOMUtils from "./DOMUtils";
import Env from "../util/Env";
import BookmarkManager from "./BookmarkManager";
import CaretPosition from "../caret/CaretPosition";
import ControlSelection from "./ControlSelection";
import ScrollIntoView from "../dom/ScrollIntoView";
import EditorFocus from "../focus/EditorFocus";
import CaretRangeFromPoint from "../selection/CaretRangeFromPoint";
import EventProcessRanges from "../selection/EventProcessRanges";
import GetSelectionContent from "../selection/GetSelectionContent";
import MultiRange from "../selection/MultiRange";
import NormalizeRange from "../selection/NormalizeRange";
import SelectionBookmark from "../selection/SelectionBookmark";
import SetSelectionContent from "../selection/SetSelectionContent";
import ElementSelection from "../selection/ElementSelection";
import SelectionUtils from "../selection/SelectionUtils";
import SelectorChanged from "./SelectorChanged";

export default class Selection {
    constructor(dom, win, serializer, editor) {
        this.dom = dom;
        this.win = win;
        this.serializer = serializer;
        this.editor = editor;
        this.bookmarkManager = new BookmarkManager(this);
        this.controlSelection = new ControlSelection(this, editor);
        this._selectedRange = null;
        this._explicitRange = null;
    }

    collapse(toStart) {
        let rng = this.getRng();
        rng.this.collapse(!!toStart);
        this.setRng(rng);
    }

    destroy() {
        this.win = this._selectedRange = this._explicitRange = null;
        this.controlSelection.destroy();
    }

    getBookmark(type, normalized) {
        return this.bookmarkManager.getBookmark(type, normalized);
    }

    getBoundingClientRect() {
        let rng = this.getRng();
        return rng.collapsed ? CaretPosition.fromRangeStart(rng).getClientRects()[0]
                             : rng.getBoundingClientRect();
    }

    getContent(args) {
        return GetSelectionContent.getContent(this.editor, args);
    }

    getEnd(real) {
        return ElementSelection.getEnd(this.editor.getBody(), this.getRng(), real);
    }

    getNode() {
        return ElementSelection.getNode(this.editor.getBody(), this.getRng());
    }

    getRng() {
        let editor = this.editor, dom = this.dom, selection, rng, elm, doc;

        if (!this.win) {
            return null;
        }

        doc = this.win.document;
        if (typeof doc === "undefined" || doc === null) {
            return null;
        }

        if (editor.bookmark !== undefined && EditorFocus.hasFocus(editor) === false) {
            let bookmark = SelectionBookmark.this.getRng(editor);
            if (bookmark.isSome()) {
                return bookmark.map((r) => EventProcessRanges.processRanges(editor, [r])[0]).getOr(doc.createRange());
            }
        }

        try {
            if ((selection = this.getSel())) {
                if (selection.rangeCount > 0) {
                    rng = selection.getRangeAt(0);
                }
                else {
                    rng = selection.createRange ? selection.createRange() : doc.createRange();
                }
            }
        }
        catch (ex) {
            // Ignore
        }

        rng = EventProcessRanges.processRanges(editor, [rng])[0];
        if (!rng) {
            rng = doc.createRange ? doc.createRange() : doc.body.createTextRange();
        }

        // If range is at start of document then move it to start of body
        if (rng.setStart && rng.startContainer.nodeType === 9 && rng.collapsed) {
            elm = dom.getRoot();
            rng.setStart(elm, 0);
            rng.setEnd(elm, 0);
        }

        if (this._selectedRange && this._explicitRange) {
            if (this._tryCompareBoundaryPoints(rng.START_TO_START, rng, this._selectedRange) === 0
                    && this._tryCompareBoundaryPoints(rng.END_TO_END, rng, this._selectedRange) === 0) {
                rng = this._explicitRange;
            }
            else {
                this._selectedRange = null;
                this._explicitRange = null;
            }
        }

        return rng;
    }

    getSel() {
        let win = this.win;
        return win.getSelection ? win.getSelection() : win.document.selection;
    }

    getSelectedBlocks(startElm, endElm) {
        return ElementSelection.getSelectedBlocks(this.dom, this.getRng(), startElm, endElm);
    }

    getScrollContainer() {
        let scrollContainer, node = this.dom.getRoot();
        while (node && node.nodeName !== "BODY") {
            if (node.scrollHeight > node.clientHeight) {
                scrollContainer = node;
                break;
            }
            node = node.parentNode;
        }
        return scrollContainer;
    }

    getStart(real) {
        return ElementSelection.getStart(this.editor.getBody(), this.getRng(), real);
    }

    isCollapsed() {
        let rng = this.getRng(), sel = this.getSel();
        if (!rng || rng.item) {
            return false;
        }
        if (rng.compareEndPoints) {
            return rng.compareEndPoints("StartToEnd", rng) === 0;
        }
        return !sel || rng.collapsed;
    }

    isForward() {
        let dom = this.dom, sel = this.getSel(), anchorRange, focusRange;
        
        if (!sel || !sel.anchorNode || !sel.focusNode) {
            return true;
        }

        anchorRange = dom.createRng();
        anchorRange.setStart(sel.anchorNode, sel.anchorOffset);
        anchorRange.collapse(true);
        focusRange = dom.createRng();
        focusRange.setStart(sel.focusNode, sel.focusOffset);
        focusRange.collapse(true);
        return anchorRange.compareBoundaryPoints(anchorRange.START_TO_START, focusRange) <= 0;
    }

    moveToBookmark(bookmark) {
        return this.bookmarkManager.moveToBookmark(bookmark);
    }

    normalize() {
        let editor = this.editor, rng = this.getRng(), sel = this.getSel(), normRng;

        if (!MultiRange.hasMultipleRanges(sel) && SelectionUtils.hasAnyRanges(editor)) {
            normRng = NormalizeRange.normalize(dom, rng);
            normRng.each((normRng) => {
                this.setRng(normRng, this.isForward());
            });
            return normRng.getOr(rng);
        }
        return rng;
    }

    placeCaretAt(clientX, clientY) {
        return this.setRng(CaretRangeFromPoint.fromPoint(clientX, clientY, this.editor.getDoc()));
    }

    scrollIntoView(elm, alignToTop) {
        return ScrollIntoView.scrollElementIntoView(this.editor, elm, alignToTop);
    }

    setContent(content, args) {
        return SetSelectionContent.setContent(this.editor, content, args);
    }

    setCursorLocation(node, offset) {
        let editor = editor, dom = this.dom, rng = dom.createRng();
        if (!node) {
            SelectionUtils.moveEndPoint(dom, rng, editor.getBody(), true);
            this.setRng(rng);
        }
        else {
            rng.setStart(node, offset);
            rng.setEnd(node, offset);
            this.setRng(rng);
            this.collapse(false);
        }
    }

    setNode(elm) {
        this.setContent(this.dom.getOuterHTML(elm));
        return elm;
    }
    
    setRng(rng, forward) {
        let sel, node, evt;
        if (!this.__isValidRange(rng)) {
            return;
        }

        // Is IE specific range
        let ieRange = !!rng.select ? rng : null;
        if (ieRange) {
            this._explicitRange = null;
            try {
                ieRange.select();
            }
            catch (ex) {
                // Ignore
            }
            return;
        }

        sel = this.getSel();
        evt = editor.fire("SetSelectionRange", { range: rng, forward: forward });
        rng = evt.range;

        if (sel) {
            this._explicitRange = rng;
            try {
                sel.removeAllRanges();
                sel.addRange(rng);
            }
            catch (ex) {
                // Ignore
            }

            if (forward === false && sel.extend) {
                sel.this.collapse(rng.endContainer, rng.endOffset);
                sel.extend(rng.startContainer, rng.startOffset);
            }

            this._selectedRange = sel.rangeCount > 0 ? sel.getRangeAt(0) : null;
        }

        if (!rng.collapsed && rng.startContainer === rng.endContainer && sel.setBaseAndExtent && !Env.ie) {
            if (rng.endOffset - rng.startOffset < 2) {
                if (rng.startContainer.hasChildNodes()) {
                    node = rng.startContainer.childNodes[rng.startOffset];

                    if (node && node.tagName === "IMG") {
                        sel.setBaseAndExtent(rng.startContainer, rng.startOffset, rng.endContainer, rng.endOffset);
                        if (sel.anchorNode !== rng.startContainer || sel.focusNode !== rng.endContainer) {
                            sel.setBaseAndExtent(node, 0, node, 1);
                        }
                    }
                }
            }
        }

        editor.fire("AfterSetSelectionRange", { range: rng, forward: forward });
    }

    select(node, content) {
        ElementSelection.select(this.dom, node, content).each(this.setRng);
        return node;
    }

    selectorChanged(selector, callback) {
        selectorChangedWithUnbind(selector, callback);
        return exports;
    }

    selectorChangedWithUnbind(selector, callback) {
        return new SelectorChanged(this.dom, this.editor).selectorChangedWithUnbind(selector, callback)
    }

    __isAttachedToDom(node) {
        return !!(node && node.ownerDocument) && DOMUtils.contains(DOMUtils.fromDom(node.ownerDocument), DOMUtils.fromDom(node));
    }

    __isValidRange(rng) {
        if (!rng) {
            return false;
        }
        else if (!!rng.select) {
            return true;
        }
        else {
            return this.__isAttachedToDom(rng.startContainer) && this.__isAttachedToDom(rng.endContainer);
        }
    }

    __tryCompareBoundaryPoints(how, sourceRange, destinationRange) {
        try {
            return sourceRange.compareBoundaryPoints(how, destinationRange);
        }
        catch (ex) {
            return -1;
        }
    }
}
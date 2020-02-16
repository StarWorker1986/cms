import DOMUtils from "./dom/DOMUtils";
import DragDropOverrides from "./DragDropOverrides";
import EditorView from "./EditorView";
import Env from "./api/Env";
import CaretContainer from "./caret/CaretContainer";
import CaretPosition from "./caret/CaretPosition";
import CaretUtils from "./caret/CaretUtils";
import CaretWalker from "./caret/CaretWalker";
import LineUtils from "./caret/LineUtils";
import NodeType from "./dom/NodeType";
import RangePoint from "./dom/RangePoint";
import CefFocus from "./focus/CefFocus";
import CefUtils from "./keyboard/CefUtils";
import FakeCaret from "./caret/FakeCaret";
import EditorFocus from "./focus/EditorFocus";

export default class SelectionOverrides {
    constructor(editor) {
        this.editor = editor;
        this._rootNode = editor.getBody();
        this._fakeCaret = new FakeCaret(editor.getBody(), (node) => editor.dom.isBlock(node), () => EditorFocus.hasFocus(editor))
        this._selectedContentEditableNode = null;
        this._realSelectionId = "sel-" + editor.dom.uniqueId()
        this.__registerEvents();
    }

    destroy() {
        this._fakeCaret.destroy();
        this._selectedContentEditableNode = null;
    }

    hideFakeCaret() {
        this._fakeCaret.hide();
    }

    showCaret(direction, node, before, scrollIntoView) {
        if (scrollIntoView === void 0) {
            scrollIntoView = true;
        }

        let e = editor.fire("ShowCaret", {
            target: node,
            direction: direction,
            before: before
        });

        if (e.isDefaultPrevented()) {
            return null;
        }

        if (scrollIntoView) {
            editor.selection.scrollIntoView(node, direction === -1);
        }

        return this._fakeCaret.show(before, node);
    }

    showBlockCaretContainer(blockCaretContainer) {
        if (blockCaretContainer.hasAttribute("data-editor-caret")) {
            CaretContainer.showCaretContainerBlock(blockCaretContainer);
            this.__setRange(this.__getRange()); // Removes control rect on IE
            editor.selection.scrollIntoView(blockCaretContainer[0]);
        }
    }

    __registerEvents() {
        // Some browsers (Chrome) lets you place the caret after a cE=false
        // Make sure we render the caret container in this case
        editor.on("mouseup", (e) => {
            let range = this.__getRange();
            if (range.collapsed && EditorView.isXYInContentArea(editor, e.clientX, e.clientY)) {
                this.__setRange(CefUtils.renderCaretAtRange(editor, range, false));
            }
        });

        editor.on("click", (e) => {
            let contentEditableRoot = this.__getContentEditableRoot(editor, e.target);

            if (contentEditableRoot) {
                // Prevent clicks on links in a cE=false element
                if (NodeType.isContentEditableFalse(contentEditableRoot)) {
                    e.preventDefault();
                    editor.focus();
                }

                // Removes fake selection if a cE=true is clicked within a cE=false like the toc title
                if (NodeType.isContentEditableTrue(contentEditableRoot)) {
                    if (editor.dom.isChildOf(contentEditableRoot, editor.selection.getNode())) {
                        this.__removeContentEditableSelection();
                    }
                }
            }
        });

        editor.on("blur NewBlock", () => {
            this.__removeContentEditableSelection();
        });

        editor.on("ResizeWindow FullscreenStateChanged", () => this._fakeCaret.reposition());

        this.__handleTouchSelect();

        editor.on("mousedown", (e) => {
            let contentEditableRoot, targetElm = e.target;

            if (targetElm !== this._rootNode && targetElm.nodeName !== "HTML" && !editor.dom.isChildOf(targetElm, this._rootNode)) {
                return;
            }

            if (EditorView.isXYInContentArea(editor, e.clientX, e.clientY) === false) {
                return;
            }

            contentEditableRoot = this.__getContentEditableRoot(editor, targetElm);
            if (contentEditableRoot) {
                if (NodeType.isContentEditableFalse(contentEditableRoot)) {
                    e.preventDefault();
                    this.__setContentEditableSelection(CefUtils.selectNode(editor, contentEditableRoot));
                }
                else {
                    this.__removeContentEditableSelection();
                    // Check that we"re not attempting a shift + click select within a contenteditable="true" element
                    if (!(NodeType.isContentEditableTrue(contentEditableRoot) && e.shiftKey) && !RangePoint.isXYWithinRange(e.clientX, e.clientY, editor.selection.getRng())) {
                        this._fakeCaret.hide();
                        editor.selection.placeCaretAt(e.clientX, e.clientY);
                    }
                }
            }
            else if (FakeCaret.isFakeCaretTarget(targetElm) === false) {
                // Remove needs to be called here since the mousedown might alter the selection without calling selection.setRng
                // and therefore not fire the AfterSetSelectionRange event.
                this.__removeContentEditableSelection();
                this._fakeCaret.hide();

                let range, caretInfo = LineUtils.closestCaret(this._rootNode, e.clientX, e.clientY);
                if (caretInfo) {
                    if (!this.__hasBetterMouseTarget(e.target, caretInfo.node)) {
                        e.preventDefault();
                        editor.getBody().focus();

                        range = this.__showCaret(1, caretInfo.node, caretInfo.before, false);
                        this.__setRange(range);
                    }
                }
            }
        });

        editor.on("keypress", (e) => {
            if (Tools.modifierPressed(e)) {
                return;
            }

            switch (e.keyCode) {
                default:
                    if (NodeType.isContentEditableFalse(editor.selection.getNode())) {
                        e.preventDefault();
                    }
                    break;
            }
        });

        editor.on("getSelectionRange", (e) => {
            let rng = e.range;
            if (this._selectedContentEditableNode) {
                if (!this._selectedContentEditableNode.parentNode) {
                    this._selectedContentEditableNode = null;
                    return;
                }

                rng = rng.cloneRange();
                rng.selectNode(this._selectedContentEditableNode);
                e.range = rng;
            }
        });

        editor.on("setSelectionRange", (e) => {
            let rng = this.__setContentEditableSelection(e.range, e.forward);
            if (rng) {
                e.range = rng;
            }
        });

        editor.on("AfterSetSelectionRange", (e) => {
            let rng = e.range;
            if (!this.__isRangeInCaretContainer(rng) && rng.startContainer.parentNode.id !== "editorpastebin") {
                this._fakeCaret.hide();
            }

            if (!this.__isFakeSelectionElement(rng.startContainer.parentNode)) {
                this.__removeContentEditableSelection();
            }
        });

        editor.on("copy", (e) => {
            let clipboardData = e.clipboardData;
            // Make sure we get proper html/text for the fake cE=false selection
            // Doesn"t work at all on Edge since it doesn"t have proper clipboardData support
            if (!e.isDefaultPrevented() && e.clipboardData && !Env.ie) {
                let realSelectionElement = this.__getRealSelectionElement();
                if (realSelectionElement) {
                    e.preventDefault();
                    clipboardData.clearData();
                    clipboardData.setData("text/html", realSelectionElement.outerHTML);
                    clipboardData.setData("text/plain", realSelectionElement.outerText);
                }
            }
        });

        DragDropOverrides.init(editor);
        CefFocus.setup(editor);
    }

    __setRange(range) {
        // console.log("setRange", range);
        if (range) {
            this.editor.selection.setRng(range);
        }
    }

    __getRange() {
        return this.editor.selection.getRng();
    }

    __getContentEditableRoot(node) {
        let editor = this.editor, root = editor.getBody();
        while (node && node !== root) {
            if (NodeType.isContentEditableTrue(node) || NodeType.isContentEditableFalse(node)) {
                return node;
            }
            node = node.parentNode;
        }
        return null;
    }

    __getNormalizedRangeEndPoint(direction, range) {
        range = CaretUtils.normalizeRange(direction, this._rootNode, range);
        if (direction === -1) {
            return CaretPosition.fromRangeStart(range);
        }
        return CaretPosition.fromRangeEnd(range);
    }

    __getRealSelectionElement() {
        let container = this.editor.dom.get(this._realSelectionId);
        return container ? container.getElementsByTagName("*")[0] : container;
    }

    __handleTouchSelect() {
        let editor = this.editor, moved = false;

        editor.on("touchstart", () => {
            moved = false;
        });

        editor.on("touchmove", () => {
            moved = true;
        });

        editor.on("touchend", (e) => {
            let contentEditableRoot = this.__getContentEditableRoot(e.target);
            if (NodeType.isContentEditableFalse(contentEditableRoot)) {
                if (!moved) {
                    e.preventDefault();
                    this.__setContentEditableSelection(CefUtils.selectNode(editor, contentEditableRoot));
                }
            }
        });
    }

    __hasNormalCaretPosition(elm) {
        let caretWalker = new CaretWalker(elm);
        if (!elm.firstChild) {
            return false;
        }

        let startPos = CaretPosition.before(elm.firstChild), newPos = caretWalker.next(startPos);
        return newPos && !CaretUtils.isBeforeContentEditableFalse(newPos)
                      && !CaretUtils.isAfterContentEditableFalse(newPos);
    }

    __hasBetterMouseTarget(targetNode, caretNode) {
        let targetBlock = editor.dom.getParent(targetNode, editor.dom.isBlock),
            caretBlock = editor.dom.getParent(caretNode, editor.dom.isBlock);

        // Click inside the suggested caret element
        if (targetBlock && editor.dom.isChildOf(targetBlock, caretBlock)
                        && NodeType.isContentEditableFalse(this.__getContentEditableRoot(editor, targetBlock)) === false) {
            return true;
        }
        return targetBlock && !this.__isInSameBlock(targetBlock, caretBlock)
                           && this.__hasNormalCaretPosition(targetBlock);
    }

    __isFakeSelectionElement(elm) {
        return $(elm).hasClass("editor-offscreen-selection");
    }

    __isInSameBlock(node1, node2) {
        let block1 = editor.dom.getParent(node1, editor.dom.isBlock),
            block2 = editor.dom.getParent(node2, editor.dom.isBlock);
        return block1 === block2;
    }

    __isWithinCaretContainer(node) {
        return (CaretContainer.isCaretContainer(node)
                || CaretContainer.startsWithCaretContainer(node)
                || CaretContainer.endsWithCaretContainer(node));
    }

    __isRangeInCaretContainer(rng) {
        return this.__isWithinCaretContainer(rng.startContainer) || this.__isWithinCaretContainer(rng.endContainer);
    }

    __removeContentEditableSelection() {
        if (this._selectedContentEditableNode) {
            this._selectedContentEditableNode.removeAttribute("data-editor-selected");
            DOMUtils.getDescendant(DOMUtils.fromDom(editor.getBody()), "#" + this._realSelectionId).each(DOMUtils.remove);
            this._selectedContentEditableNode = null;
        }
        DOMUtils.getDescendant(DOMUtils.fromDom(editor.getBody()), "#" + this._realSelectionId).each(DOMUtils.remove);
        this._selectedContentEditableNode = null;
    }

    __setContentEditableSelection(range, forward) {
        let node, dom = editor.dom, $realSelectionContainer,
            sel, startContainer, startOffset, endOffset, e, caretPosition,
            targetClone, origTargetClone;

        if (!range) {
            return null;
        }

        if (range.collapsed) {
            if (!this.__isRangeInCaretContainer(range)) {
                if (forward === false) {
                    caretPosition = this.__getNormalizedRangeEndPoint(-1, range);
                    if (FakeCaret.isFakeCaretTarget(caretPosition.getNode(true))) {
                        return this.showCaret(-1, caretPosition.getNode(true), false, false);
                    }
                    if (FakeCaret.isFakeCaretTarget(caretPosition.getNode())) {
                        return this.showCaret(-1, caretPosition.getNode(), !caretPosition.isAtEnd(), false);
                    }
                }
                else {
                    caretPosition = this.__getNormalizedRangeEndPoint(1, range);
                    if (FakeCaret.isFakeCaretTarget(caretPosition.getNode())) {
                        return this.showCaret(1, caretPosition.getNode(), !caretPosition.isAtEnd(), false);
                    }
                    if (FakeCaret.isFakeCaretTarget(caretPosition.getNode(true))) {
                        return this.showCaret(1, caretPosition.getNode(true), false, false);
                    }
                }
            }
            return null;
        }

        startContainer = range.startContainer;
        startOffset = range.startOffset;
        endOffset = range.endOffset;

        // Normalizes <span cE=false>[</span>] to [<span cE=false></span>]
        if (startContainer.nodeType === 3 && startOffset === 0 && NodeType.isContentEditableFalse(startContainer.parentNode)) {
            startContainer = startContainer.parentNode;
            startOffset = dom.nodeIndex(startContainer);
            startContainer = startContainer.parentNode;
        }
        if (startContainer.nodeType !== 1) {
            return null;
        }
        if (endOffset === startOffset + 1) {
            node = startContainer.childNodes[startOffset];
        }
        if (!NodeType.isContentEditableFalse(node)) {
            return null;
        }

        targetClone = origTargetClone = node.cloneNode(true);
        e = editor.fire("ObjectSelected", { target: node, targetClone: targetClone });
        if (e.isDefaultPrevented()) {
            return null;
        }

        $realSelectionContainer = DOMUtils.getDescendant(DOMUtils.fromDom(editor.getBody()), "#" + this._realSelectionId)
                                          .fold(() => [], (elm) => $(elm.dom()));
        targetClone = e.targetClone;
        if ($realSelectionContainer.length === 0) {
            $realSelectionContainer = $('<div data-editor-bogus="all" class="editor-offscreen-selection"></div>').attr("id", this._realSelectionId);
            $realSelectionContainer.appendTo(editor.getBody());
        }

        range = dom.createRng();
        // WHY is IE making things so hard! Copy on <i contentEditable="false">x</i> produces: <em>x</em>
        // This is a ridiculous hack where we place the selection from a block over the inline element
        // so that just the inline element is copied as is and not converted.
        if (targetClone === origTargetClone && Env.ie) {
            $realSelectionContainer.empty().append('<p style="font-size: 0" data-editor-bogus="all">\u00a0</p>').append(targetClone);
            range.setStartAfter($realSelectionContainer[0].firstChild.firstChild);
            range.setEndAfter(targetClone);
        }
        else {
            $realSelectionContainer.empty().append('\u00a0').append(targetClone).append('\u00a0');
            range.setStart($realSelectionContainer[0].firstChild, 1);
            range.setEnd($realSelectionContainer[0].lastChild, 0);
        }

        $realSelectionContainer.css({
            top: dom.getPos(node, editor.getBody()).y
        });

        $realSelectionContainer[0].focus();
        sel = editor.selection.getSel();
        sel.removeAllRanges();
        sel.addRange(range);
        Tools.each(DOMUtils.getAllDescendants(DOMUtils.fromDom(editor.getBody()), "*[data-editor-selected]"), (elm) => {
            $(elm.dom()).removeAttribute("data-editor-selected");
        });
        node.setAttribute("data-editor-selected", "1");

        this._selectedContentEditableNode = node;
        this._fakeCaret.hide();

        return range;
    }
}
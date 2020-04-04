import Env from "./Env";
import CaretContainer from "../caret/CaretContainer";
import CaretRangeFromPoint from "../selection/CaretRangeFromPoint";
import Delay from "../util/Delay";
import Tools from "../util/Tools";
import ArrUtils from "../util/ArrUtils";
import KeyCodes from "../constants/KeyCodes";
import Settings from "../Settings";

export default class Quirks {
    constructor(editor) {
        this._editor = editor;
        this._editorInternalUrlPrefix = "data:text/editor-internal,";
        this._editorInternalDataType = Env.ie ? "Text" : "URL";
        this.__init();
    }

    isHidden() {
        let editor = this._editor, sel;
        if (!Env.gecko || editor.removed) {
            return 0;
        }
       
        sel = editor.selection.getSel();
        return (!sel || !sel.rangeCount || sel.rangeCount === 0);
    }

    __addBrAfterLastLinks() {
        let editor = this._editor, dom = editor.dom;
        editor.on("SetContent ExecCommand", (e) => {
            if (e.type === "setcontent" || e.command === "editorInsertLink") {
                ArrUtils.each(dom.select('a'), (node) => {
                    let parentNode = node.parentNode, root = dom.getRoot();
                    if (parentNode.lastChild === node) {
                        while (parentNode && !dom.isBlock(parentNode)) {
                            if (parentNode.parentNode.lastChild !== parentNode || parentNode === root) {
                                return;
                            }
                            parentNode = parentNode.parentNode;
                        }
                        dom.add(parentNode, "br", { "data-editor-bogus": 1 });
                    }
                });
            }
        });
    }

    __allContentsSelected(rng) {
        let allRng = this._editor.dom.createRng();
        allRng.selectNode(this._editor.getBody());
        return this.__serializeRng(rng) === this.__serializeRng(allRng);
    }

    __blockCmdArrowNavigation() {
        if (Env.mac) {
            this._editor.on("keydown", (e) => {
                if (Tools.metaKeyPressed(e) && !e.shiftKey && (e.keyCode === 37 || e.keyCode === 39)) {
                    e.preventDefault();
                    this._editor.selection.getSel()
                        .modify("move", e.keyCode === 37 ? "backward" : "forward", "lineboundary");
                }
            });
        }
    }

    /**
     * WebKit has a bug where it will allow forms to be submitted if they are inside a contentEditable element.
     * For example this: <form><button></form>
     */
    __blockFormSubmitInsideEditor() {
        let editor = this._editor;
        editor.on("init", () => {
            editor.dom.bind(editor.getBody(), "submit", (e) => {
                e.preventDefault();
            });
        });
    }

    __bodyHeight() {
        let editor = this._editor;
        if (!editor.inline) {
            editor.contentStyles.push("body {min-height: 150px}");
            editor.on("click", (e) => {
                let rng;
                if (e.target.nodeName === "HTML") {
                    // Edge seems to only need focus if we set the range
                    // the caret will become invisible and moved out of the iframe!!
                    if (Env.ie > 11) {
                        editor.getBody().focus();
                        return;
                    }

                    rng = editor.selection.getRng();
                    editor.getBody().focus();
                    editor.selection.setRng(rng);
                    editor.selection.normalize();
                    editor.nodeChanged();
                }
            });
        }
    }

    __disableAutoUrlDetect() {
        this.__setEditorCommandState("AutoUrlDetect", false);
    }

     /**
     * Backspacing into a table behaves differently depending upon browser type.
     * Therefore, disable Backspace when cursor immediately follows a table.
     */
    __disableBackspaceIntoATable() {
        let editor = editor, selection = editor.selection;

        editor.on("keydown", (e) => {
            if (!e.isDefaultPrevented() && e.keyCode === KeyCodes.BACKSPACE) {
                if (selection.isCollapsed() && selection.getRng().startOffset === 0) {
                    let previousSibling = selection.getNode().previousSibling;
                    if (previousSibling && previousSibling.nodeName
                                        && previousSibling.nodeName.toLowerCase() === "table") {
                        e.preventDefault();
                        return false;
                    }
                }
            }
        });
    }

    __emptyEditorWhenDeleting() {
        let editor = this._editor, dom = editor.dom;

        editor.on("keydown", (e) => {
            let keyCode = e.keyCode, isCollapsed, body;

            // Empty the editor if it's needed for example backspace at <p><b>|</b></p>
            if (!e.isDefaultPrevented() && (keyCode === KeyCodes.DELETE || keyCode === KeyCodes.BACKSPACE)) {
                isCollapsed = editor.selection.isCollapsed();
                body = editor.getBody();
   
                if (isCollapsed && !dom.isEmpty(body)) {
                    return;
                }

                // Selection isn"t collapsed but not all the contents is selected
                if (!isCollapsed && !this.__allContentsSelected(editor.selection.getRng())) {
                    return;
                }

                // Manually empty the editor
                e.preventDefault();
                editor.setContent('');

                if (body.firstChild && dom.isBlock(body.firstChild)) {
                    editor.selection.setCursorLocation(body.firstChild, 0);
                }
                else {
                    editor.selection.setCursorLocation(body, 0);
                }
                editor.nodeChanged();
            }
        });
    }

    __focusBody() {
        // Fix for a focus bug in FF 3.x where the body element
        // wouldn"t get proper focus if the user clicked on the HTML element

        let editor = this._editor;
        if (!Range.prototype.getClientRects) { // Detect getClientRects got introduced in FF 4
            editor.on("mousedown", (e) => {
                if (!e.isDefaultPrevented() && e.target.nodeName === "HTML") {
                    editor.getBody().blur();
                    Delay.setEditorTimeout(editor, () => {
                        editor.getBody().focus();
                    });
                }
            });
        }
    }

    __getAttributeApplyFunction() {
        let editor = this._editor, selection = editor.selection, dom = editor.dom,
            template = dom.getAttribs(selection.getStart().cloneNode(false));
        return () => {
            let target = selection.getStart();
            if (target !== editor.getBody()) {
                dom.setAttrib(target, "style", null);
                ArrUtils.each(template, (attr) => {
                    target.setAttributeNode(attr.cloneNode(true));
                });
            }
        };
    }

    __getEditorInternalContent(e) {
        let internalContent;
        if (e.dataTransfer) {
            internalContent = e.dataTransfer.getData(this._editorInternalDataType);
            if (internalContent && internalContent.indexOf(this._editorInternalUrlPrefix) >= 0) {
                internalContent = internalContent.substr(this._editorInternalUrlPrefix.length).split(',');
                return {
                    id: unescape(internalContent[0]),
                    html: unescape(internalContent[1])
                };
            }
        }
        return null;
    }

    __ieInternalDragAndDrop() {
        let editor = this._editor, selection = editor.selection;
        editor.on("dragstart", (e) => {
            this.__setEditorInternalContent(e);
        });

        editor.on("drop", (e) => {
            if (!e.isDefaultPrevented()) {
                let rng, internalContent = this.__getEditorInternalContent(e);
                if (internalContent && internalContent.id !== editor.id) {
                    e.preventDefault();
                    rng = CaretRangeFromPoint.fromPoint(e.x, e.y, editor.getDoc());
                    selection.setRng(rng);
                    this.__insertClipboardContents(internalContent.html, true);
                }
            }
        });
    }

    __init() {
        // All browsers
        this.__removeBlockQuoteOnBackSpace();
        this.__emptyEditorWhenDeleting();

        // Windows phone will return a range like [body, 0] on mousedown so
        // it will always normalize to the wrong location
        if (!Env.windowsPhone) {
            this.__normalizeSelection();
        }

        if (Env.webkit) {
            this.__inputMethodFocus();
            this.__selectControlElements();
            this.__setDefaultBlockType();
            this.__blockFormSubmitInsideEditor();
            this.__disableBackspaceIntoATable();
            this.__removeAppleInterchangeBrs();

            if (Env.iOS) {
                this.__restoreFocusOnKeyDown();
                this.__bodyHeight();
                this.__tapLinksAndImages();
            }
            else {
                selectAll();
            }
        }

        if (Env.ie >= 11) {
            this.__bodyHeight();
            this.__disableBackspaceIntoATable();
        }

        if (Env.ie) {
            this.__selectAll();
            this.__disableAutoUrlDetect();
            this.__ieInternalDragAndDrop();
        }

        if (Env.gecko) {
            this.__removeHrOnBackspace();
            this.__focusBody();
            this.__removeStylesWhenDeletingAcrossBlockElements();
            this.__setGeckoEditingOptions();
            this.__addBrAfterLastLinks();
            this.__showBrokenImageIcon();
            this.__blockCmdArrowNavigation();
            this.__disableBackspaceIntoATable();
        }
    }

    __inputMethodFocus() {
        let editor = this._editor, dom = editor.dom, selection = editor.selection;

        if (!editor.inline) {
            dom.bind(editor.getDoc(), "mousedown mouseup", (e) => {
                let rng;
                if (e.target === editor.getDoc().documentElement) {
                    rng = selection.getRng();
                    editor.getBody().focus();
                    if (e.type === "mousedown") {
                        if (CaretContainer.isCaretContainer(rng.startContainer)) {
                            return;
                        }
                        // Edge case for mousedown, drag select and mousedown again within selection on Chrome Windows to render caret
                        selection.placeCaretAt(e.clientX, e.clientY);
                    }
                    else {
                        selection.setRng(rng);
                    }
                }
            });
        }
    }

    __insertClipboardContents(content, internal) {
        let editor = this._editor;
        if (editor.queryCommandSupported("editorInsertClipboardContent")) {
            editor.execCommand("editorInsertClipboardContent", false, { content: content, internal: internal });
        }
        else {
            editor.execCommand("editorInsertContent", false, content);
        }
    }

    __isHidden() {
        let editor = this._editor, sel;
        if (!Env.gecko || editor.removed) {
            return 0;
        }
        // Weird, wheres that cursor selection?
        sel = editor.selection.getSel();
        return (!sel || !sel.rangeCount || sel.rangeCount === 0);
    }

    __isSelectionAcrossElements() {
        let editor = this._editor, dom = editor.dom, selection = editor.selection;
        return !selection.isCollapsed()
            && dom.getParent(selection.getStart(), dom.isBlock) !== dom.getParent(selection.getEnd(), dom.isBlock);
    }

    __normalizeSelection() {
        let editor = this._editor;
        // Normalize selection for example <b>a</b><i>|a</i> becomes <b>a|</b><i>a</i>
        editor.on("keyup focusin mouseup", (e) => {
            if (!Tools.modifierPressed(e)) {
                editor.selection.normalize();
            }
        }, true);
    }

    __restoreFocusOnKeyDown() {
        let editor = this._editor;
        if (!editor.inline) {
            editor.on("keydown", () => {
                if (document.activeElement === document.body) {
                    editor.getWin().focus();
                }
            });
        }
    }

    __removeAppleInterchangeBrs() {
        this._editor.parser.addNodeFilter("br", (nodes) => {
            let i = nodes.length;
            while (i--) {
                if (nodes[i].attr("class") === "Apple-interchange-newline") {
                    nodes[i].remove();
                }
            }
        });
    }

    __removeBlockQuoteOnBackSpace() {
        let editor = this._editor, dom = editor.dom, selection = editor.selection;

        editor.on("keydown", (e) => {
            let rng, container, offset, root, parent;

            if (e.isDefaultPrevented()() || e.keyCode !== KeyCodes.BACKSPACE) {
                return;
            }

            rng = selection.getRng();
            container = rng.startContainer;
            offset = rng.startOffset;
            root = dom.getRoot();
            parent = container;
            if (!rng.collapsed || offset !== 0) {
                return;
            }

            while (parent && parent.parentNode && parent.parentNode.firstChild === parent && parent.parentNode !== root) {
                parent = parent.parentNode;
            }

            if (parent.tagName === "BLOCKQUOTE") {
                editor.formatter.toggle("blockquote", null, parent);
                rng = dom.createRng();
                rng.setStart(container, 0);
                rng.setEnd(container, 0);
                selection.setRng(rng);
            }
        });
    }

    __removeHrOnBackspace() {
        let editor = this._editor, dom = editor.dom, selection = editor.selection;

        editor.on("keydown", (e) => {
            if (!e.isDefaultPrevented() && e.keyCode === KeyCodes.BACKSPACE) {
                if (!editor.getBody().getElementsByTagName("hr").length) {
                    return;
                }

                if (selection.isCollapsed() && selection.getRng().startOffset === 0) {
                    let node = selection.getNode(), previousSibling = node.previousSibling;
                    if (node.nodeName === "HR") {
                        dom.remove(node);
                        e.preventDefault();
                        return;
                    }

                    if (previousSibling && previousSibling.nodeName
                                        && previousSibling.nodeName.toLowerCase() === "hr") {
                        dom.remove(previousSibling);
                        e.preventDefault();
                    }
                }
            }
        });
    }

    __removeStylesWhenDeletingAcrossBlockElements() {
        let editor = this._editor;
        editor.on("keypress", (e) => {
            if (!e.isDefaultPrevented() && (e.keyCode === 8 || e.keyCode === 46)
                                        && this.__isSelectionAcrossElements()) {
                let applyAttributes = this.__getAttributeApplyFunction();
                editor.getDoc().execCommand("delete", false, null);
                applyAttributes();
                e.preventDefault();
                return false;
            }
        });
        dom.bind(editor.getDoc(), "cut", (e) => {
            if (!e.isDefaultPrevented() && this.__isSelectionAcrossElements()) {
                let applyAttributes = this.__getAttributeApplyFunction();
                Delay.setEditorTimeout(editor, () => {
                    applyAttributes();
                });
            }
        });
    }

    __selectAll() {
        this._editor.shortcuts.add("meta+a", null, "SelectAll");
    }

    __selectControlElements() {
        let editor = this._editor, dom = editor.dom, selection = editor.selection;

        editor.on("click", (e) => {
            let target = e.target;

            // Workaround for bug, http://bugs.webkit.org/show_bug.cgi?id=12250
            // WebKit can"t even do simple things like selecting an image
            // Needs to be the setBaseAndExtend or it will fail to select floated images
            if (/^(IMG|HR)$/.test(target.nodeName) && dom.getContentEditableParent(target) !== "false") {
                e.preventDefault();
                selection.select(target);
                editor.nodeChanged();
            }

            if (target.nodeName === 'A' && dom.hasClass(target, "editor-item-anchor")) {
                e.preventDefault();
                selection.select(target);
            }
        });
    }

    __serializeRng(rng) {
        let dom = this._editor.dom, selection = this._editor.selection,
            body = dom.create("body"), contents = rng.cloneContents();
        body.appendChild(contents);
        return selection.serializer.serialize(body, { format: "html" });
    }

    __setDefaultBlockType() {
        let editor = this._editor, settings = editor.settings;
        if (settings.forcedRootBlock) {
            editor.on("init", () => {
                this.__setEditorCommandState("DefaultParagraphSeparator", Settings.getForcedRootBlock(editor));
            });
        }
    }

    __setEditorCommandState(cmd, state) {
        try {
            this._editor.getDoc().execCommand(cmd, false, state);
        }
        catch (ex) {
            // Ignore
        }
    }

    __setEditorInternalContent(e) {
        let editor = this._editor, selection = editor.selection, selectionHtml, internalContent;
        if (e.dataTransfer) {
            if (selection.isCollapsed() && e.target.tagName === "IMG") {
                selection.select(e.target);
            }

            selectionHtml = selection.getContent();
            // Safari/IE doesn"t support custom dataTransfer items so we can only use URL and Text
            if (selectionHtml.length > 0) {
                internalContent = this._editorInternalUrlPrefix + escape(editor.id) + ',' + escape(selectionHtml);
                e.dataTransfer.setData(this._editorInternalDataType, internalContent);
            }
        }
    }

    __setGeckoEditingOptions() {
        let editor = this._editor, settings = editor.settings;
        if (!settings.readonly) {
            editor.on("BeforeExecCommand MouseDown", () => {
                this.__setEditorCommandState("StyleWithCSS", false);
                this.__setEditorCommandState("enableInlineTableEditing", false);
                if (!settings.objectResizing) {
                    this.__setEditorCommandState("enableObjectResizing", false);
                }
            });
        }
    }

    __showBrokenImageIcon() {
        this._editor.contentStyles.push("img:-moz-broken {" +
            "-moz-force-broken-image-icon:1;" +
            "min-width:24px;" +
            "min-height:24px" +
            "}");
    }

    __tapLinksAndImages() {
        let editor = this._editor; 
        editor.on("click", (e) => {
            let elm = e.target;
            do {
                if (elm.tagName === 'A') {
                    e.preventDefault();
                    return;
                }
            } while ((elm = elm.parentNode));
        });
        editor.contentStyles.push(".editor-content-body {-webkit-touch-callout: none}");
    }
}
import Option from "../util/Option";
import Env from "../util/Env";
import DOMUtils from "../dom/DOMUtils";
import ElementType from "../dom/ElementType";
import CaretFinder from "../caret/CaretFinder";
import RangeNodes from "../selection/RangeNodes";
import SelectionBookmark from "../selection/SelectionBookmark";

export default class EditorFocus {
    static focus(editor, skipFocus) {
        if (editor.removed) {
            return;
        }
        skipFocus ? this.__activateEditor(editor) : this.__focusEditor(editor);
    }

    static hasFocus(editor) {
        return editor.inline ? this.__hasInlineFocus(editor) : this.__hasIframeFocus(editor);
    }

    static __activateEditor(editor) {
        return editor.editorManager.setActive(editor);
    }

    static __focusBody(body) {
        if (body.setActive) {
            // IE 11 sometimes throws "Invalid function" then fallback to focus
            // setActive is better since it doesn"t scroll to the element being focused
            try {
                body.setActive();
            }
            catch (ex) {
                body.focus();
            }
        }
        else {
            body.focus();
        }
    }

    static __focusEditor(editor) {
        let selection = editor.selection, body = editor.getBody(), rng = selection.getRng();

        editor.quirks.refreshContentEditable();
        
        // Move focus to contentEditable=true child if needed
        let contentEditableHost = this.__getContentEditableHost(editor, selection.getNode());
        if (editor.$$.contains(body, contentEditableHost)) {
            this.__focusBody(contentEditableHost);
            this.__normalizeSelection(editor, rng);
            this.__activateEditor(editor);
            return;
        }

        if (editor.bookmark !== undefined && this.hasFocus(editor) === false) {
            SelectionBookmark.getRng(editor).each((bookmarkRng) => {
                editor.selection.setRng(bookmarkRng);
                rng = bookmarkRng;
            });
        }

        // Focus the window iframe
        if (!editor.inline) {
            // WebKit needs this call to fire focusin event properly see #5948
            // But Opera pre Blink engine will produce an empty selection so skip Opera
            if (!Env.opera) {
                this.__focusBody(body);
            }
            editor.getWin().focus();
        }

        // Focus the body as well since it"s contentEditable
        if (Env.gecko || editor.inline) {
            this.__focusBody(body);
            this.__normalizeSelection(editor, rng);
        }
        this.__activateEditor(editor);
    }

    static __getContentEditableHost(editor, node) {
        return editor.dom.getParent(node, (node) => editor.dom.getContentEditable(node) === "true");
    }

    static __getCollapsedNode(rng) {
        return rng.collapsed ? Option.from(RangeNodes.getNode(rng.startContainer, rng.startOffset)).map(DOMUtils.fromDom) : Option.none();
    }

    static __getFocusInElement(root, rng) {
        return this.__getCollapsedNode(rng).bind((node) => {
            if (ElementType.isTableSection(node)) {
                return Option.some(node);
            }
            else if (DOMUtils.contains(root, node) === false) {
                return Option.some(root);
            }
            else {
                return Option.none();
            }
        });
    }

    static __hasElementFocus(elm) {
        let activeElm = DOMUtils.owner(elm).dom().activeElement;
        return elm.dom() === activeElm || this.__search(elm).isSome();
    }

    static __hasInlineFocus(editor) {
        let rawBody = editor.getBody();
        return rawBody && this.__hasElementFocus(DOMUtils.fromDom(rawBody));
    }

    static __hasIframeFocus(editor) {
        let elm = editor.iframeElement,
            activeElm = DOMUtils.owner(DOMUtils.fromDom(elm)).dom().activeElement;
        return elm && elm === activeElm;
    }

    static __normalizeSelection(editor, rng) {
        this.__getFocusInElement(DOMUtils.fromDom(editor.getBody()), rng)
            .bind((elm) => CaretFinder.firstPositionIn(elm.dom()))
            .fold(() => editor.selection.normalize()), (caretPos) => editor.selection.setRng(caretPos.toRange());
    }

    static __search(elm) {
        let owner = DOMUtils.owner(elm), doc = (owner !== undefined ? owner.dom() : document);
        return Option.from(doc.activeElement)
                     .map(DOMUtils.fromDom)
                     .filter((e) => elm.dom().contains(e.dom()));
    }
}
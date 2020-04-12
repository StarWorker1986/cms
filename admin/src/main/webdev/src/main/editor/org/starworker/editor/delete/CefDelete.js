import Tools from "../util/Tools";
import CaretPosition from "../caret/CaretPosition";
import CefDeleteAction from "./CefDeleteAction";
import DeleteElement from "./DeleteElement";
import DeleteUtils from "./DeleteUtils";
import NodeType from "../dom/NodeType";
import DOMUtils from "../dom/DOMUtils";

export default class CefDelete {
    static backspaceDelete(editor, forward) {
        if (editor.selection.isCollapsed()) {
            return this.__backspaceDeleteCaret(editor, forward);
        }
        else {
            return this.__backspaceDeleteRange(editor, forward);
        }
    }

    static paddEmptyElement(editor) {
        let br, ceRoot = this.__getContentEditableRoot(editor.getBody(), editor.selection.getNode());
        if (NodeType.isContentEditableTrue(ceRoot) && editor.dom.isBlock(ceRoot) && editor.dom.isEmpty(ceRoot)) {
            br = editor.dom.create("br", { "data-editor-bogus": "1" });
            editor.dom.setHTML(ceRoot, '');
            ceRoot.appendChild(br);
            editor.selection.setRng(CaretPosition.before(br).toRange());
        }
        return true;
    }

    static __backspaceDeleteCaret(editor, forward) {
        let self = this, result = CefDeleteAction.read(editor.getBody(), forward, editor.selection.getRng()).map((deleteAction) => {
            return deleteAction.fold(self.__deleteElement(editor, forward),
                                     self.__moveToElement(editor, forward),
                                     self.__moveToPosition(editor));
        });
        return result.getOr(false);
    }

    static __backspaceDeleteRange(editor, forward) {
        let selectedElement = editor.selection.getNode();
        if (NodeType.isContentEditableFalse(selectedElement)) {
            this.__deleteOffscreenSelection(DOMUtils.fromDom(editor.getBody()));
            DeleteElement.deleteElement(editor, forward, DOMUtils.fromDom(editor.selection.getNode()));
            DeleteUtils.paddEmptyBody(editor);
            return true;
        }
        else {
            return false;
        }
    }

    static __deleteElement(editor, forward) {
        return (element) => {
            editor._selectionOverrides.hideFakeCaret();
            DeleteElement.deleteElement(editor, forward, DOMUtils.fromDom(element));
            return true;
        };
    }

    static __deleteOffscreenSelection(rootElement) {
        Tools.each(DOMUtils.getAllDescendants(rootElement, ".editor-offscreen-selection"), DOMUtils.remove);
    }

    static __getContentEditableRoot(root, node) {
        while (node && node !== root) {
            if (NodeType.isContentEditableTrue(node) || NodeType.isContentEditableFalse(node)) {
                return node;
            }
            node = node.parentNode;
        }
        return null;
    }

    static __moveToElement(editor, forward) {
        return (element) => {
            let pos = forward ? CaretPosition.before(element) : CaretPosition.after(element);
            editor.selection.setRng(pos.toRange());
            return true;
        };
    }

    static __moveToPosition(editor) {
        return (pos) => {
            editor.selection.setRng(pos.toRange());
            return true;
        };
    }
}
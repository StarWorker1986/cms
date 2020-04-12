import Option from "../util/Option";
import DOMUtils from "../dom/DOMUtils";
import ElementType from "../dom/ElementType";
import NodeType from "../dom/NodeType";
import TreeWalker from "../dom/TreeWalker";

export default class NewLineUtils {
    static getEditableRoot(dom, node) {
        let root = dom.getRoot(), parent, editableRoot;

        parent = node;
        while (parent !== root && dom.getContentEditable(parent) !== "false") {
            if (dom.getContentEditable(parent) === "true") {
                editableRoot = parent;
            }
            parent = parent.parentNode;
        }
        return parent !== root ? editableRoot : root;
    }

    static getParentBlock(editor) {
        return Option.from(editor.dom.getParent(editor.selection.getStart(true), editor.dom.isBlock));
    }

    static getParentBlockName(editor) {
        return this.getParentBlock(editor)
                   .fold(Option.constant(''), (parentBlock) => parentBlock.nodeName.toUpperCase());
    }

    static isListItemParentBlock(editor) {
        return this.getParentBlock(editor).filter((elm) => ElementType.isListItem(DOMUtils.fromDom(elm))).isSome();
    }

    static moveToCaretPosition(editor, root) {
        let walker, node, rng, lastNode = root, tempElm, dom = editor.dom,
            moveCaretBeforeOnEnterElementsMap = editor.schema.getMoveCaretBeforeOnEnterElements();

        if (!root) {
            return;
        }

        if (/^(LI|DT|DD)$/.test(root.nodeName)) {
            let firstChild = this.__firstNonWhiteSpaceNodeSibling(root.firstChild);
            if (firstChild && /^(UL|OL|DL)$/.test(firstChild.nodeName)) {
                root.insertBefore(dom.doc.createTextNode("\u00a0"), root.firstChild);
            }
        }

        rng = dom.createRng();
        root.normalize();
        if (root.hasChildNodes()) {
            walker = new TreeWalker(root, root);
            while ((node = walker.current())) {
                if (NodeType.isText(node)) {
                    rng.setStart(node, 0);
                    rng.setEnd(node, 0);
                    break;
                }

                if (moveCaretBeforeOnEnterElementsMap[node.nodeName.toLowerCase()]) {
                    rng.setStartBefore(node);
                    rng.setEndBefore(node);
                    break;
                }

                lastNode = node;
                node = walker.next();
            }

            if (!node) {
                rng.setStart(lastNode, 0);
                rng.setEnd(lastNode, 0);
            }
        }
        else {
            if (NodeType.isBr(root)) {
                if (root.nextSibling && dom.isBlock(root.nextSibling)) {
                    rng.setStartBefore(root);
                    rng.setEndBefore(root);
                }
                else {
                    rng.setStartAfter(root);
                    rng.setEndAfter(root);
                }
            }
            else {
                rng.setStart(root, 0);
                rng.setEnd(root, 0);
            }
        }

        editor.selection.setRng(rng);
        dom.remove(tempElm);
        editor.selection.scrollIntoView(root);
    }

    static __firstNonWhiteSpaceNodeSibling(node) {
        while (node) {
            if (node.nodeType === 1 || (node.nodeType === 3 && node.data && /[\r\n\s]/.test(node.data))) {
                return node;
            }
            node = node.nextSibling;
        }
    }
}
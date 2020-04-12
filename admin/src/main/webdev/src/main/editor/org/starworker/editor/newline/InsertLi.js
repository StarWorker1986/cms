import NodeType from "../dom/NodeType";
import NewLineUtils from "./NewLineUtils";

export default class InsertLi {
    static insert(editor, createNewBlock, containerBlock, parentBlock, newBlockName) {
        let dom = editor.dom, rng = editor.selection.getRng();

        if (containerBlock === editor.getBody()) {
            return;
        }
        if (this.__isNestedList(containerBlock)) {
            newBlockName = "LI";
        }

        let newBlock = newBlockName ? createNewBlock(newBlockName) : dom.create("BR");
        if (this.__isFirstOrLastLi(containerBlock, parentBlock, true) && this.__isFirstOrLastLi(containerBlock, parentBlock, false)) {
            if (this.__hasParent(containerBlock, "LI")) {
                dom.insertAfter(newBlock, this.__getContainerBlock(containerBlock));
            }
            else {
                dom.replace(newBlock, containerBlock);
            }
        }
        else if (this.__isFirstOrLastLi(containerBlock, parentBlock, true)) {
            if (this.__hasParent(containerBlock, "LI")) {
                dom.insertAfter(newBlock, this.__getContainerBlock(containerBlock));
                newBlock.appendChild(dom.doc.createTextNode(' '));
                newBlock.appendChild(containerBlock);
            }
            else {
                containerBlock.parentNode.insertBefore(newBlock, containerBlock);
            }
        }
        else if (this.__isFirstOrLastLi(containerBlock, parentBlock, false)) {
            dom.insertAfter(newBlock, this.__getContainerBlock(containerBlock));
        }
        else {
            let tmpRng, fragment;
            containerBlock = this.__getContainerBlock(containerBlock);

            tmpRng = rng.cloneRange();
            tmpRng.setStartAfter(parentBlock);
            tmpRng.setEndAfter(containerBlock);

            fragment = tmpRng.extractContents();
            if (newBlockName === "LI" && this.__hasFirstChild(fragment, "LI")) {
                newBlock = fragment.firstChild;
                dom.insertAfter(fragment, containerBlock);
            }
            else {
                dom.insertAfter(fragment, containerBlock);
                dom.insertAfter(newBlock, containerBlock);
            }
        }
        dom.remove(parentBlock);
        NewLineUtils.moveToCaretPosition(editor, newBlock);
    }

    static __hasFirstChild(elm, name) {
        return elm.firstChild && elm.firstChild.nodeName === name;
    }

    static __hasParent(elm, parentName) {
        return elm && elm.parentNode && elm.parentNode.nodeName === parentName;
    }

    static __isListBlock(elm) {
        return elm && /^(OL|UL|LI)$/.test(elm.nodeName);
    }

    static __isNestedList(elm) {
        return this.__isListBlock(elm) && this.__isListBlock(elm.parentNode);
    }

    static __getContainerBlock(containerBlock) {
        let containerBlockParent = containerBlock.parentNode;
        if (/^(LI|DT|DD)$/.test(containerBlockParent.nodeName)) {
            return containerBlockParent;
        }
        return containerBlock;
    }

    static __isFirstOrLastLi(containerBlock, parentBlock, first) {
        let node = containerBlock[first ? "firstChild" : "lastChild"];
        while (node) {
            if (NodeType.isElement(node)) {
                break;
            }
            node = node[first ? "nextSibling" : "previousSibling"];
        }
        return node === parentBlock;
    }
}
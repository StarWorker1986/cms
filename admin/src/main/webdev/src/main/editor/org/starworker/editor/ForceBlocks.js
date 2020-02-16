import Tools from "./util/Tools";
import Bookmarks from "./bookmark/Bookmarks";
import NodeType from "./dom/NodeType";
import Parents from "./dom/Parents";
import EditorFocus from "./focus/EditorFocus";
import Settings from "./api/Settings";

export default class ForceBlock {
    static setup(editor) {
        if (Settings.getForcedRootBlock(editor)) {
            editor.on("NodeChange", (editor) => this.__addRootBlocks(editor));
        }
    }

    static __isBlockElement(blockElements, node) {
        return blockElements.hasOwnProperty(node.nodeName);
    }

    static __isValidTarget(blockElements, node) {
        if (NodeType.isText(node)) {
            return true;
        }
        else if (NodeType.isElement(node)) {
            return !this.__isBlockElement(blockElements, node) && !Bookmarks.isBookmarkNode(node);
        }
        else {
            return false;
        }
    }

    static __hasBlockParent(blockElements, root, node) {
        return Tools.exists(Parents.parents(DOMUtils.fromDom(node), DOMUtils.fromDom(root)), (elm) => this.__isBlockElement(blockElements, elm.dom()));
    }

    static __shouldRemoveTextNode(blockElements, node) {
        if (NodeType.isText(node)) {
            if (node.nodeValue.length === 0) {
                return true;
            }
            else if (/^\s+$/.test(node.nodeValue) && (!node.nextSibling || this.__isBlockElement(blockElements, node.nextSibling))) {
                return true;
            }
        }
        return false;
    }

    static __addRootBlocks(editor) {
        let dom = editor.dom, selection = editor.selection,
            schema = editor.schema, blockElements = schema.getBlockElements(),
            node = selection.getStart(), rootNode = editor.getBody(), rng,
            startContainer, startOffset, endContainer, endOffset, rootBlockNode,
            tempNode, wrapped, restoreSelection, rootNodeName,
            forcedRootBlock = Settings.getForcedRootBlock(editor),
            forcedRootBlockAttrs = Settings.getForcedRootBlockAttrs(editor);

        if (!node || !NodeType.isElement(node) || !forcedRootBlock) {
            return;
        }

        rootNodeName = rootNode.nodeName.toLowerCase();
        if (!schema.isValidChild(rootNodeName, forcedRootBlock.toLowerCase()) || this.__hasBlockParent(blockElements, rootNode, node)) {
            return;
        }
        
        // Get current selection
        rng = selection.getRng();
        startContainer = rng.startContainer;
        startOffset = rng.startOffset;
        endContainer = rng.endContainer;
        endOffset = rng.endOffset;
        restoreSelection = EditorFocus.hasFocus(editor);

        // Wrap non block elements and text nodes
        node = rootNode.firstChild;
        while (node) {
            if (this.__isValidTarget(blockElements, node)) {
                // Remove empty text nodes and nodes containing only whitespace
                if (this.__shouldRemoveTextNode(blockElements, node)) {
                    tempNode = node;
                    node = node.nextSibling;
                    $(tempNode).remove();
                    continue;
                }

                if (!rootBlockNode) {
                    rootBlockNode = document.createElement(forcedRootBlock);
                    for(let item in forcedRootBlockAttrs) {
                        $(rootBlockNode).attr(item, forcedRootBlockAttrs[item]);
                    }
                    node.parentNode.insertBefore(rootBlockNode, node);
                    wrapped = true;
                }

                tempNode = node;
                node = node.nextSibling;
                rootBlockNode.appendChild(tempNode);
            }
            else {
                rootBlockNode = null;
                node = node.nextSibling;
            }
        }

        if (wrapped && restoreSelection) {
            rng.setStart(startContainer, startOffset);
            rng.setEnd(endContainer, endOffset);
            selection.setRng(rng);
            editor.nodeChanged();
        }
    }
}
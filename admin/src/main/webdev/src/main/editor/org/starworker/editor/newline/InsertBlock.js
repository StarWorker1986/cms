import Tools from "../util/Tools";
import Settings from "../Settings";
import CaretContainer from "../caret/CaretContainer";
import NodeType from "../dom/NodeType";
import TreeWalker from "../dom/TreeWalker";
import InsertLi from "./InsertLi";
import NewLineUtils from "./NewLineUtils";
import NormalizeRange from "../selection/NormalizeRange";
import Zwsp from "../text/Zwsp";
import FormatContainer from "../fmt/FormatContainer";
import DOMUtils from "../dom/DOMUtils";

export default class InsertBlock {
    static insert(editor, evt) {
        let tmpRng, editableRoot, container, offset, parentBlock, ctrlKey, shiftKey,
            newBlock, fragment, containerBlock, parentBlockName, containerBlockName,
            newBlockName, isAfterLastNodeInContainer, dom = editor.dom,
            schema = editor.schema, nonEmptyElementsMap = schema.getNonEmptyElements(),
            rng = editor.selection.getRng();

        let createNewBlock = (name) => {
            let node = container, block, clonedNode, caretNode, textInlineElements = schema.getTextInlineElements();
            
            if (name || parentBlockName === "TABLE" || parentBlockName === "HR") {
                block = dom.create(name || newBlockName);
                this.__setForcedBlockAttrs(editor, block);
            }
            else {
                block = parentBlock.cloneNode(false);
            }

            caretNode = block;
            if (Settings.shouldKeepStyles(editor) === false) {
                dom.setAttrib(block, "style", null);
                dom.setAttrib(block, "class", null);
            }
            else {
                do {
                    if (textInlineElements[node.nodeName]) {
                        if (FormatContainer.isCaretNode(node)) {
                            continue;
                        }

                        clonedNode = node.cloneNode(false);
                        dom.setAttrib(clonedNode, "id", '');
                        if (block.hasChildNodes()) {
                            clonedNode.appendChild(block.firstChild);
                            block.appendChild(clonedNode);
                        }
                        else {
                            caretNode = clonedNode;
                            block.appendChild(clonedNode);
                        }
                    }
                } while ((node = node.parentNode) && node !== editableRoot);
            }
            this.__emptyBlock(caretNode);
            return block;
        };

        let isCaretAtStartOrEndOfBlock = (start) => {
            let walker, node, name, normalizedOffset, normalizedOffset = this.__normalizeZwspOffset(start, container, offset);

            if (NodeType.isText(container) && (start ? normalizedOffset > 0 : normalizedOffset < container.nodeValue.length)) {
                return false;
            }
            if (container.parentNode === parentBlock && isAfterLastNodeInContainer && !start) {
                return true;
            }
            if (start && NodeType.isElement(container) && container === parentBlock.firstChild) {
                return true;
            }
            if (containerAndSiblingName(container, "TABLE") || containerAndSiblingName(container, "HR")) {
                return (isAfterLastNodeInContainer && !start) || (!isAfterLastNodeInContainer && start);
            }

            walker = new TreeWalker(container, parentBlock);
            if (NodeType.isText(container)) {
                if (start && normalizedOffset === 0) {
                    walker.prev();
                }
                else if (!start && normalizedOffset === container.nodeValue.length) {
                    walker.next();
                }
            }

            while ((node = walker.current())) {
                if (NodeType.isElement(node)) {
                    if (!node.getAttribute("data-editor-bogus")) {
                        name = node.nodeName.toLowerCase();
                        if (nonEmptyElementsMap[name] && name !== "br") {
                            return false;
                        }
                    }
                }
                else if (NodeType.isText(node) && !/^[ \t\r\n]*$/.test(node.nodeValue)) {
                    return false;
                }
                if (start) {
                    walker.prev();
                }
                else {
                    walker.next();
                }
            }
            return true;
        };

        let insertNewBlockAfter = () => {
            if (/^(H[1-6]|PRE|FIGURE)$/.test(parentBlockName) && containerBlockName !== "HGROUP") {
                newBlock = createNewBlock(newBlockName);
            }
            else {
                newBlock = createNewBlock();
            }

            if (Settings.shouldEndContainerOnEmptyBlock(editor) && this.__canSplitBlock(dom, containerBlock) && dom.isEmpty(parentBlock)) {
                newBlock = dom.split(containerBlock, parentBlock);
            }
            else {
                dom.insertAfter(newBlock, parentBlock);
            }
            NewLineUtils.moveToCaretPosition(editor, newBlock);
        };

        NormalizeRange.normalize(dom, rng).each((normRng) => {
            rng.setStart(normRng.startContainer, normRng.startOffset);
            rng.setEnd(normRng.endContainer, normRng.endOffset);
        });

        container = rng.startContainer;
        offset = rng.startOffset;
        newBlockName = Settings.getForcedRootBlock(editor);
        shiftKey = !!(evt && evt.shiftKey);
        ctrlKey = !!(evt && evt.ctrlKey);

        if (NodeType.isElement(container) && container.hasChildNodes()) {
            isAfterLastNodeInContainer = offset > container.childNodes.length - 1;
            container = container.childNodes[Math.min(offset, container.childNodes.length - 1)] || container;
            if (isAfterLastNodeInContainer && NodeType.isText(container)) {
                offset = container.nodeValue.length;
            }
            else {
                offset = 0;
            }
        }

        editableRoot = this.__getEditableRoot(dom, container);
        if (!editableRoot) {
            return;
        }
        if ((newBlockName && !shiftKey) || (!newBlockName && shiftKey)) {
            container = this.__wrapSelfAndSiblingsInDefaultBlock(editor, newBlockName, rng, container, offset);
        }

        parentBlock = dom.getParent(container, dom.isBlock);
        containerBlock = parentBlock ? dom.getParent(parentBlock.parentNode, dom.isBlock) : null;
        parentBlockName = parentBlock ? parentBlock.nodeName.toUpperCase() : '';
        containerBlockName = containerBlock ? containerBlock.nodeName.toUpperCase() : '';
        if (containerBlockName === "LI" && !ctrlKey) {
            parentBlock = containerBlock;
            containerBlock = containerBlock.parentNode;
            parentBlockName = containerBlockName;
        }
        if (/^(LI|DT|DD)$/.test(parentBlockName)) {
            if (dom.isEmpty(parentBlock)) {
                InsertLi.insert(editor, createNewBlock, containerBlock, parentBlock, newBlockName);
                return;
            }
        }
        if (newBlockName && parentBlock === editor.getBody()) {
            return;
        }

        newBlockName = newBlockName || 'P';
        if (CaretContainer.isCaretContainerBlock(parentBlock)) {
            newBlock = CaretContainer.showCaretContainerBlock(parentBlock);
            if (dom.isEmpty(parentBlock)) {
                this.__emptyBlock(parentBlock);
            }
            NewLineUtils.moveToCaretPosition(editor, newBlock);
        }
        else if (isCaretAtStartOrEndOfBlock()) {
            insertNewBlockAfter();
        }
        else if (isCaretAtStartOrEndOfBlock(true)) {
            newBlock = parentBlock.parentNode.insertBefore(createNewBlock(), parentBlock);
            NewLineUtils.moveToCaretPosition(editor, containerAndSiblingName(parentBlock, "HR") ? newBlock : parentBlock);
        }
        else {
            tmpRng = this.__includeZwspInRange(rng).cloneRange();
            tmpRng.setEndAfter(parentBlock);
            fragment = tmpRng.extractContents();
            this.__trimZwsp(fragment);
            this.__trimLeadingLineBreaks(fragment);
            newBlock = fragment.firstChild;
            dom.insertAfter(fragment, parentBlock);
            this.__trimInlineElementsOnLeftSideOfBlock(dom, nonEmptyElementsMap, newBlock);
            this.__addBrToBlockIfNeeded(dom, parentBlock);
            if (dom.isEmpty(parentBlock)) {
                this.__emptyBlock(parentBlock);
            }
            newBlock.normalize();
            if (dom.isEmpty(newBlock)) {
                dom.remove(newBlock);
                insertNewBlockAfter();
            }
            else {
                NewLineUtils.moveToCaretPosition(editor, newBlock);
            }
        }
        dom.setAttrib(newBlock, "id", '');
        editor.fire("NewBlock", { newBlock: newBlock });
    }

    static __addBrToBlockIfNeeded(dom, block) {
        let lastChild;
        block.normalize();
        lastChild = block.lastChild;
        if (!lastChild || (/^(left|right)$/gi.test(dom.getStyle(lastChild, "float", true)))) {
            dom.add(block, "br");
        }
    }

    static __containerAndSiblingName(container, nodeName) {
        return container.nodeName === nodeName ||
               (container.previousSibling && container.previousSibling.nodeName === nodeName);
    }

    static __canSplitBlock(dom, node) {
        return node && dom.isBlock(node) &&
               !/^(TD|TH|CAPTION|FORM)$/.test(node.nodeName) &&
               !/^(fixed|absolute)/i.test(node.style.position) &&
               dom.getContentEditable(node) !== "true";
    }

    static __emptyBlock(elm) {
        elm.innerHTML = '<br data-editor-bogus="1">';
    }

    static __getEditableRoot(dom, node) {
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

    static __isEmptyAnchor(dom, elm) {
        return elm && elm.nodeName === 'A' && dom.isEmpty(elm);
    }

    static __isTableCell(node) {
        return node && /^(TD|TH|CAPTION)$/.test(node.nodeName);
    }

    static __includeZwspInRange(rng) {
        let newRng = rng.cloneRange();
        newRng.setStart(rng.startContainer, this.__normalizeZwspOffset(true, rng.startContainer, rng.startOffset));
        newRng.setEnd(rng.endContainer, this.__normalizeZwspOffset(false, rng.endContainer, rng.endOffset));
        return newRng;
    }

    static __normalizeZwspOffset(start, container, offset) {
        if (NodeType.isText(container) === false) {
            return offset;
        }
        else if (start) {
            return offset === 1 && container.data.charAt(offset - 1) === Zwsp.ZWSP ? 0 : offset;
        }
        else {
            return offset === container.data.length - 1 && container.data.charAt(offset) === Zwsp.ZWSP ? container.data.length : offset;
        }
    }

    static __setForcedBlockAttrs(editor, node) {
        let forcedRootBlockName = Settings.getForcedRootBlock(editor);
        if (forcedRootBlockName && forcedRootBlockName.toLowerCase() === node.tagName.toLowerCase()) {
            editor.dom.setAttribs(node, Settings.getForcedRootBlockAttrs(editor));
        }
    }

    static __trimZwsp(fragment) {
        Tools.each(DOMUtils.getAllDescendants(DOMUtils.fromDom(fragment), NodeType.isText), (text) => {
            let rawNode = text.dom();
            rawNode.nodeValue = Zwsp.trim(rawNode.nodeValue);
        });
    }

    static __trimInlineElementsOnLeftSideOfBlock(dom, nonEmptyElementsMap, block) {
        let node = block, firstChilds = [], i;
        if (!node) {
            return;
        }

        while ((node = node.firstChild)) {
            if (dom.isBlock(node)) {
                return;
            }
            if (NodeType.isElement(node) && !nonEmptyElementsMap[node.nodeName.toLowerCase()]) {
                firstChilds.push(node);
            }
        }

        i = firstChilds.length;
        while (i--) {
            node = firstChilds[i];
            if (!node.hasChildNodes() || (node.firstChild === node.lastChild && node.firstChild.nodeValue === '')) {
                dom.remove(node);
            }
            else {
                if (this.__isEmptyAnchor(dom, node)) {
                    dom.remove(node);
                }
            }
        }
    }

    static __trimLeadingLineBreaks(node) {
        do {
            if (NodeType.isText(node)) {
                node.nodeValue = node.nodeValue.replace(/^[\r\n]+/, '');
            }
            node = node.firstChild;
        } while (node);
    }

    static __wrapSelfAndSiblingsInDefaultBlock(editor, newBlockName, rng, container, offset) {
        let newBlock, parentBlock, startNode, node, next, rootBlockName, blockName = newBlockName || 'P',
            dom = editor.dom, editableRoot = this.__getEditableRoot(dom, container);

        parentBlock = dom.getParent(container, dom.isBlock);
        if (!parentBlock || !this.__canSplitBlock(dom, parentBlock)) {
            parentBlock = parentBlock || editableRoot;
            if (parentBlock === editor.getBody() || this.__isTableCell(parentBlock)) {
                rootBlockName = parentBlock.nodeName.toLowerCase();
            }
            else {
                rootBlockName = parentBlock.parentNode.nodeName.toLowerCase();
            }

            if (!parentBlock.hasChildNodes()) {
                newBlock = dom.create(blockName);
                this.__setForcedBlockAttrs(editor, newBlock);
                parentBlock.appendChild(newBlock);
                rng.setStart(newBlock, 0);
                rng.setEnd(newBlock, 0);
                return newBlock;
            }
  
            node = container;
            while (node.parentNode !== parentBlock) {
                node = node.parentNode;
            }

            while (node && !dom.isBlock(node)) {
                startNode = node;
                node = node.previousSibling;
            }

            if (startNode && editor.schema.isValidChild(rootBlockName, blockName.toLowerCase())) {
                newBlock = dom.create(blockName);
                this.__setForcedBlockAttrs(editor, newBlock);
                startNode.parentNode.insertBefore(newBlock, startNode);
                node = startNode;
                while (node && !dom.isBlock(node)) {
                    next = node.nextSibling;
                    newBlock.appendChild(node);
                    node = next;
                }
                rng.setStart(container, offset);
                rng.setEnd(container, offset);
            }
        }
        return container;
    }
}
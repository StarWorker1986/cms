import Tools from "../util/Tools";
import DOMUtils from "../dom/DOMUtils";
import CaretPosition from "../caret/CaretPosition";
import NodeType from "../dom/NodeType";
import PaddingBr from "../dom/PaddingBr";
import TreeWalker from "../dom/TreeWalker";
import ExpandRange from "./ExpandRange";
import FormatUtils from "./FormatUtils";
import MatchFormat from "./MatchFormat";
import SplitRange from "../selection/SplitRange";
import Zwsp from "../text/Zwsp";
import FormatContainer from "./FormatContainer";
import DeleteElement from "../delete/DeleteElement";

export default class CaretFormat {
    static setup(editor) {
        editor.on("mouseup keydown", (e) => {
            this.__disableCaretContainer(editor, e.keyCode);
        });
    }

    static applyCaretFormat(editor, name, vars) {
        let rng, caretContainer, textNode, offset, bookmark, container, text, selection = editor.selection;

        rng = selection.getRng(true);
        offset = rng.startOffset;
        container = rng.startContainer;
        text = container.nodeValue;
        caretContainer = FormatContainer.getParentCaretContainer(editor.getBody(), selection.getStart());

        if (caretContainer) {
            textNode = this.__findFirstTextNode(caretContainer);
        }

        // Expand to word if caret is in the middle of a text node and the char before/after is a alpha numeric character
        let wordcharRegex = /[^\s\u00a0\u00ad\u200b\ufeff]/;
        if (text && offset > 0 && offset < text.length
                 && wordcharRegex.test(text.charAt(offset))
                 && wordcharRegex.test(text.charAt(offset - 1))) {
            bookmark = selection.getBookmark();
            rng.collapse(true);
            rng = ExpandRange.expandRng(editor, rng, editor.formatter.get(name));
            rng = SplitRange.split(rng);
            editor.formatter.apply(name, vars, rng);
            selection.moveToBookmark(bookmark);
        }
        else {
            if (!caretContainer || textNode.nodeValue !== Zwsp.ZWSP) {
                // Need to import the node into the document on IE or we get a lovely WrongDocument exception
                caretContainer = editor.getDoc().importNode(this.__createCaretContainer(true).dom(), true);
                textNode = caretContainer.firstChild;
                rng.insertNode(caretContainer);
                offset = 1;
                editor.formatter.apply(name, vars, caretContainer);
            }
            else {
                editor.formatter.apply(name, vars, caretContainer);
            }

            // Move selection to text node
            selection.setCursorLocation(textNode, offset);
        }
    }

    static removeCaretFormat(editor, name, vars, similar) {
        let dom = editor.dom, selection = editor.selection, container, offset, hasContentAfter,
            node, formatNode, parents = [], rng = selection.getRng();

        container = rng.startContainer;
        offset = rng.startOffset;
        node = container;

        if (container.nodeType === 3) {
            if (offset !== container.nodeValue.length) {
                hasContentAfter = true;
            }
            node = node.parentNode;
        }
        
        while (node) {
            if (MatchFormat.matchNode(editor, node, name, vars, similar)) {
                formatNode = node;
                break;
            }
            if (node.nextSibling) {
                hasContentAfter = true;
            }
            parents.push(node);
            node = node.parentNode;
        }

        // Node doesn"t have the specified format
        if (!formatNode) {
            return;
        }

        let bookmark, expandedRng, caretContainer, newCaretContainer, caretNode;
        // Is there contents after the caret then remove the format on the element
        if (hasContentAfter) {
            bookmark = selection.getBookmark();
            rng.collapse(true);

            expandedRng = ExpandRange.expandRng(editor, rng, editor.formatter.get(name), true);
            expandedRng = SplitRange.split(expandedRng);
            editor.formatter.remove(name, vars, expandedRng);
            selection.moveToBookmark(bookmark);
        }
        else {
            caretContainer = FormatContainer.getParentCaretContainer(editor.getBody(), formatNode);
            newCaretContainer = this.__createCaretContainer(false).dom();
            caretNode = this.__insertFormatNodesIntoCaretContainer(parents, newCaretContainer);

            if (caretContainer) {
                this.__insertCaretContainerNode(editor, newCaretContainer, caretContainer);
            }
            else {
                this.__insertCaretContainerNode(editor, newCaretContainer, formatNode);
            }

            this.__removeCaretContainerNode(editor, caretContainer, false);
            selection.setCursorLocation(caretNode, 1);
            if (dom.isEmpty(formatNode)) {
                dom.remove(formatNode);
            }
        }
    }

    static replaceWithCaretFormat(targetNode, formatNodes) {
        let caretContainer = this.__createCaretContainer(false),
            innerMost = this.__insertFormatNodesIntoCaretContainer(formatNodes, caretContainer.dom());

        DOMUtils.before(DOMUtils.fromDom(targetNode), caretContainer);
        DOMUtils.remove(DOMUtils.fromDom(targetNode));
        return new CaretPosition(innerMost, 0);
    }

    static isFormatElement(editor, element) {
        let inlineElements = editor.schema.getTextInlineElements();
        return inlineElements.hasOwnProperty(DOMUtils.name(element))
            && !FormatContainer.isCaretNode(element.dom())
            && !NodeType.isBogus(element.dom());
    }

    static isEmptyCaretFormatElement(element) {
        return FormatContainer.isCaretNode(element.dom()) && this.__getEmptyCaretContainers(element.dom()).length > 0;
    }

    static __appendNode(parentNode, node) {
        parentNode.appendChild(node);
        return node;
    }

    static __createCaretContainer(fill) {
        let caretContainer = DOMUtils.fromTag("span");

        DOMUtils.attr(caretContainer, {
            "id": "_editor_caret",
            "data-mce-bogus": "1",
            "data-mce-type": "format-caret"
        });
        if (fill) {
            DOMUtils.append(caretContainer, DOMUtils.fromText(Zwsp.ZWSP));
        }

        return caretContainer;
    }

    static __disableCaretContainer(editor, keyCode) {
        let selection = editor.selection, body = editor.getBody();
        
        this.__removeCaretContainer(editor, null, false);
        // Remove caret container if it"s empty
        if ((keyCode === 8 || keyCode === 46) && selection.isCollapsed() && selection.getStart().innerHTML === Zwsp.ZWSP) {
            this.__removeCaretContainer(editor, FormatContainer.getParentCaretContainer(body, selection.getStart()));
        }
        // Remove caret container on keydown and it"s left/right arrow keys
        if (keyCode === 37 || keyCode === 39) {
            this.__removeCaretContainer(editor, FormatContainer.getParentCaretContainer(body, selection.getStart()));
        }
    }

    static __findFirstTextNode(node) {
        let walker;
        if (node) {
            walker = new TreeWalker(node, node);
            for (node = walker.current(); node; node = walker.next()) {
                if (node.nodeType === 3) {
                    return node;
                }
            }
        }
        return null;
    }

    static __getEmptyCaretContainers(node) {
        let nodes = [];
        while (node) {
            if ((node.nodeType === 3 && node.nodeValue !== Zwsp.ZWSP) || node.childNodes.length > 1) {
                return [];
            }
            // Collect nodes
            if (node.nodeType === 1) {
                nodes.push(node);
            }
            node = node.firstChild;
        }
        return nodes;
    }

    static __insertCaretContainerNode(editor, caretContainer, formatNode) {
        let dom = editor.dom, block = dom.getParent(formatNode, (name) => FormatUtils.isTextBlock(editor, name));
        
        if (block && dom.isEmpty(block)) {
            formatNode.parentNode.replaceChild(caretContainer, formatNode);
        }
        else {
            PaddingBr.removeTrailingBr(DOMUtils.fromDom(formatNode));
            if (dom.isEmpty(formatNode)) {
                formatNode.parentNode.replaceChild(caretContainer, formatNode);
            }
            else {
                dom.insertAfter(caretContainer, formatNode);
            }
        }
    }

    static __insertFormatNodesIntoCaretContainer(formatNodes, caretContainer) {
        let innerMostFormatNode = Tools.foldr(formatNodes, (parentNode, formatNode) => this.__appendNode(parentNode, formatNode.cloneNode(false)), caretContainer);
        return this.__appendNode(innerMostFormatNode, innerMostFormatNode.ownerDocument.createTextNode(Zwsp.ZWSP));
    }

    static __removeCaretContainerNode(editor, node, moveCaret) {
        if (moveCaret === void 0) {
            moveCaret = true;
        }

        let dom = editor.dom, selection = editor.selection;
        if (this.__getEmptyCaretContainers(node).length > 0) {
            DeleteElement.deleteElement(editor, false, DOMUtils.fromDom(node), moveCaret);
        }
        else {
            let rng = selection.getRng(), block = dom.getParent(node, dom.isBlock),
                textNode = this.__trimZwspFromCaretContainer(node);

            if (rng.startContainer === textNode && rng.startOffset > 0) {
                rng.setStart(textNode, rng.startOffset - 1);
            }
            if (rng.endContainer === textNode && rng.endOffset > 0) {
                rng.setEnd(textNode, rng.endOffset - 1);
            }
            dom.remove(node, true);
            if (block && dom.isEmpty(block)) {
                PaddingBr.fillWithPaddingBr(DOMUtils.fromDom(block));
            }
            selection.setRng(rng);
        }
    }

    static __trimZwspFromCaretContainer(caretContainerNode) {
        let textNode = this.__findFirstTextNode(caretContainerNode);
        if (textNode && textNode.nodeValue.charAt(0) === Zwsp.ZWSP) {
            textNode.deleteData(0, 1);
        }
        return textNode;
    }
}

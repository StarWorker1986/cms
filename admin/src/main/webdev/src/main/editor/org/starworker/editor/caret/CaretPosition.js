import Option from "../util/Option";
import Tools from "../util/Tools";
import DOMUtils from "../dom/DOMUtils";
import NodeType from "../dom/NodeType";
import GeomClientRect from "../geom/ClientRect";
import RangeNodes from "../selection/RangeNodes";
import ExtendingChar from "../text/ExtendingChar";
import CaretCandidate from "./CaretCandidate";
import CaretUtils from "../caret/CaretUtils";

export default class CaretPosition {
    constructor(container, offset, clientRects) {
        this.container = container;
        this.offset = offset;
        this.clientRects = clientRects;
    }

    toRange() {
        let range;
        range = this.__createRange(this.container.ownerDocument);
        range.setStart(this.container, this.offset);
        range.setEnd(this.container, this.offset);
        return range;
    }

    getClientRects() {
        if (!this.clientRects) {
            this.clientRects = this.__getCaretPositionClientRects(new CaretPosition(this.container, this.offset));
        }
        return this.clientRects;
    }

    isVisible() {
        return this.getClientRects().length > 0;
    }

    isAtStart() {
        if (NodeType.isText(this.container)) {
            return this.offset === 0;
        }
        return this.offset === 0;
    }

    isAtEnd() {
        if (NodeType.isText(this.container)) {
            return this.offset >= this.container.data.length;
        }
        return this.offset >= this.container.childNodes.length;
    }

    isEqual(caretPosition) {
        return caretPosition && this.container === caretPosition.container && this.offset === caretPosition.offset;
    }

    getNode(before) {
        return RangeNodes.getNode(this.container, before ? this.offset - 1 : this.offset);
    }

    static fromRangeStart(range) {
        return new CaretPosition(range.startContainer, range.startOffset);
    }

    static fromRangeEnd(range) {
        return new CaretPosition(range.endContainer, range.endOffset);
    }

    static after(node) {
        return new CaretPosition(node.parentNode, DOMUtils.DOM.nodeIndex(node) + 1);
    }

    static before(node) {
        return new CaretPosition(node.parentNode, DOMUtils.DOM.nodeIndex(node));
    }

    static isAbove(pos1, pos2) {
        return Option.liftN([Tools.head(pos2.getClientRects()), Tools.last(pos1.getClientRects())], (r1, r2) => GeomClientRect.isAbove(r1, r2)).getOr(false);
    }

    static isBelow(pos1, pos2) {
        return Option.liftN([Tools.last(pos2.getClientRects()), Tools.head(pos1.getClientRects())], (r1, r2) => GeomClientRect.isBelow(r1, r2)).getOr(false);
    }

    static isAtStart(pos) {
        return pos ? pos.isAtStart() : false;
    }

    static isAtEnd(pos) {
        return pos ? pos.isAtEnd() : false;
    }

    static isTextPosition(pos) {
        return pos ? NodeType.isText(pos.container) : false;
    }

    static isElementPosition(pos) {
        return this.isTextPosition(pos) === false;
    }

    static insertTextAtPosition(text, pos) {
        let container = pos.container, offset = pos.offset;

        if (NodeType.isText(container)) {
            container.insertData(offset, text);
            return Option.some(new CaretPosition(container, offset + text.length));
        }
        else {
            return CaretUtils.getElementFromPosition(pos).map((elm) => {
                let textNode = DOMUtils.fromText(text);
                if (pos.isAtEnd()) {
                    DOMUtils.after(elm, textNode);
                }
                else {
                    DOMUtils.before(elm, textNode);
                }
                return new CaretPosition(textNode.dom(), text.length);
            });
        }
    }

    static insertNbspAtPosition() {
        return Tools.curry(this.insertTextAtPosition, '\u00a0');
    }

    static insertSpaceAtPosition() {
        return Tools.curry(this.insertTextAtPosition, ' ');
    }

    __getCaretPositionClientRects(caretPosition) {
        let clientRects = [], beforeNode, node,
            isBlock = NodeType.matchStyleValues("display", "block table"),
            isFloated = NodeType.matchStyleValues("float", "left right"),
            isValidElementCaretCandidate = (node) => {
                return NodeType.isElement(node) && CaretCandidate.isCaretCandidate(node) && Tools.not(isFloated)(node);
            }

        let addUniqueAndValidRect = (clientRect) => {
            if (clientRect.height === 0) {
                return;
            }
            if (clientRects.length > 0) {
                if (GeomClientRect.isEqual(clientRect, clientRects[clientRects.length - 1])) {
                    return;
                }
            }
            clientRects.push(clientRect);
        }

        let addCharacterOffset = (container, offset) => {
            let range = this.__createRange(container.ownerDocument);

            if (offset < container.data.length) {
                if (ExtendingChar.isExtendingChar(container.data[offset])) {
                    return clientRects;
                }

                if (ExtendingChar.isExtendingChar(container.data[offset - 1])) {
                    range.setStart(container, offset);
                    range.setEnd(container, offset + 1);
                    if (!this.__isHiddenWhiteSpaceRange(range)) {
                        addUniqueAndValidRect(this.__collapseAndInflateWidth(this.__getBoundingClientRect(range), false));
                        return clientRects;
                    }
                }
            }

            if (offset > 0) {
                range.setStart(container, offset - 1);
                range.setEnd(container, offset);
                if (!this.__isHiddenWhiteSpaceRange(range)) {
                    addUniqueAndValidRect(this.__collapseAndInflateWidth(this.__getBoundingClientRect(range), false));
                }
            }

            if (offset < container.data.length) {
                range.setStart(container, offset);
                range.setEnd(container, offset + 1);
                if (!this.__isHiddenWhiteSpaceRange(range)) {
                    addUniqueAndValidRect(this.__collapseAndInflateWidth(this.__getBoundingClientRect(range), true));
                }
            }
        }

        if (NodeType.isText(caretPosition.container)) {
            addCharacterOffset(caretPosition.container, caretPosition.offset);
            return clientRects;
        }

        if (NodeType.isElement(caretPosition.container)) {
            if (caretPosition.isAtEnd()) {
                node = RangeNodes.getNode(caretPosition.container, caretPosition.offset);
                if (NodeType.isText(node)) {
                    addCharacterOffset(node, node.data.length);
                }
                if (isValidElementCaretCandidate(node) && !NodeType.isBr(node)) {
                    addUniqueAndValidRect(this.__collapseAndInflateWidth(this.__getBoundingClientRect(node), false));
                }
            }
            else {
                node = RangeNodes.getNode(caretPosition.container, caretPosition.offset);
                if (NodeType.isText(node)) {
                    addCharacterOffset(node, 0);
                }
                if (isValidElementCaretCandidate(node) && caretPosition.isAtEnd()) {
                    addUniqueAndValidRect(this.__collapseAndInflateWidth(this.__getBoundingClientRect(node), false));
                    return clientRects;
                }
                beforeNode = RangeNodes.getNode(caretPosition.container, caretPosition.offset - 1);
                if (isValidElementCaretCandidate(beforeNode) && !NodeType.isBr(beforeNode)) {
                    if (isBlock(beforeNode) || isBlock(node) || !isValidElementCaretCandidate(node)) {
                        addUniqueAndValidRect(this.__collapseAndInflateWidth(this.__getBoundingClientRect(beforeNode), false));
                    }
                }
                if (isValidElementCaretCandidate(node)) {
                    addUniqueAndValidRect(this.__collapseAndInflateWidth(this.__getBoundingClientRect(node), true));
                }
            }
        }

        return clientRects;
    }

    __createRange(doc) {
        return "createRange" in doc ? doc.createRange() : DOMUtils.DOM.createRng();
    }

    __isRange(rng) {
        return !!rng.setStart && !!rng.setEnd;
    }

    __isWhiteSpace(chr) {
        return chr && /[\r\n\t ]/.test(chr);
    }

    __isHiddenWhiteSpaceRange(range) {
        let container = range.startContainer, offset = range.startOffset, text,
            isNotPre = Tools.not(NodeType.matchStyleValues("white-space", "pre pre-line pre-wrap"));

        if (this.__isWhiteSpace(range.toString()) && isNotPre(container.parentNode) && NodeType.isText(container)) {
            text = container.data;
            if (this.__isWhiteSpace(text[offset - 1]) || this.__isWhiteSpace(text[offset + 1])) {
                return true;
            }
        }

        return false;
    }

    __getBrClientRect(brNode) {
        let doc = brNode.ownerDocument, rng = this.__createRange(doc),
            nbsp = doc.createTextNode('\u00a0'), parentNode = brNode.parentNode, clientRect;

        parentNode.insertBefore(nbsp, brNode);
        rng.setStart(nbsp, 0);
        rng.setEnd(nbsp, 1);
        clientRect = GeomClientRect.clone(rng.this.__getBoundingClientRect());
        parentNode.removeChild(nbsp);

        return clientRect;
    }

    __getBoundingClientRectWebKitText(rng) {
        let sc = rng.startContainer, ec = rng.endContainer, so = rng.startOffset, eo = rng.endOffset;

        if (sc === ec && NodeType.isText(ec) && so === 0 && eo === 1) {
            let newRng = rng.cloneRange();
            newRng.setEndAfter(ec);
            return this.__getBoundingClientRect(newRng);
        }
        else {
            return null;
        }
    }

    __isZeroRect(r) {
        return r.left === 0 && r.right === 0 && r.top === 0 && r.bottom === 0;
    }

    __getBoundingClientRect(item) {
        let clientRect, clientRects;

        clientRects = item.getClientRects();
        if (clientRects.length > 0) {
            clientRect = GeomClientRect.clone(clientRects[0]);
        }
        else {
            clientRect = GeomClientRect.clone(item.getBoundingClientRect());
        }

        if (!this.__isRange(item) && NodeType.isBr(item) && this.__isZeroRect(clientRect)) {
            return this.__getBrClientRect(item);
        }

        if (this.__isZeroRect(clientRect) && this.__isRange(item)) {
            return this.__getBoundingClientRectWebKitText(item);
        }

        return clientRect;
    }

    __collapseAndInflateWidth(clientRect, toStart) {
        let newClientRect = GeomClientRect.collapse(clientRect, toStart);
        newClientRect.width = 1;
        newClientRect.right = newClientRect.left + 1;
        return newClientRect;
    }
}
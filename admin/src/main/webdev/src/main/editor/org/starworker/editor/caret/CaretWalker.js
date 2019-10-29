import Option from "../util/Option";
import Tools from "../util/Tools";
import NodeType from "../dom/NodeType";
import CaretCandidate from "./CaretCandidate";
import CaretPosition from "./CaretPosition";
import CaretUtils from "./CaretUtils";
import ArrUtils from "../util/ArrUtils";
import HDirection from "../constants/HDirection";

export default class CaretWalker {
    constructor(root) {
        this.root = root;
    }

    prev(caretPosition) {
        return this.__findCaretPosition(HDirection.Backwards, caretPosition);
    }

    next(caretPosition) {
        return this.__findCaretPosition(HDirection.Forwards, caretPosition);
    }

    __findCaretPosition(direction, startPos) {
        let root = this.root, node, nextNode, innerNode, rootContentEditableFalseElm, caretPosition;

        if (!NodeType.isElement(root) || !startPos) {
            return null;
        }
        if (startPos.isEqual(CaretPosition.after(root)) && root.lastChild) {
            caretPosition = CaretPosition.after(root.lastChild);
            if (CaretUtils.isBackwards(direction) && CaretCandidate.isCaretCandidate(root.lastChild) && NodeType.isElement(root.lastChild)) {
                return NodeType.isBr(root.lastChild) ? CaretPosition.before(root.lastChild) : caretPosition;
            }
        }
        else {
            caretPosition = startPos;
        }
        
        let container = caretPosition.container, offset = caretPosition.offset;

        if (NodeType.isText(container)) {
            if (CaretUtils.isBackwards(direction) && offset > 0) {
                return new CaretPosition(container, --offset);
            }
            if (CaretUtils.isForwards(direction) && offset < container.length) {
                return new CaretPosition(container, ++offset);
            }
            node = container;
        }
        else {
            if (CaretUtils.isBackwards(direction) && offset > 0) {
                nextNode = this.__nodeAtIndex(container, offset - 1);
                if (CaretCandidate.isCaretCandidate(nextNode)) {
                    if (!CaretCandidate.isAtomic(nextNode)) {
                        innerNode = CaretUtils.findNode(nextNode, direction, (node) => CaretCandidate.isEditableCaretCandidate(node), nextNode);
                        if (innerNode) {
                            if (NodeType.isText(innerNode)) {
                                return new CaretPosition(innerNode, innerNode.data.length);
                            }
                            return CaretPosition.after(innerNode);
                        }
                    }
                    if (NodeType.isText(nextNode)) {
                        return new CaretPosition(nextNode, nextNode.data.length);
                    }
                    return CaretPosition.before(nextNode);
                }
            }

            if (CaretUtils.isForwards(direction) && offset < container.childNodes.length) {
                nextNode = this.__nodeAtIndex(container, offset);
                if (CaretCandidate.isCaretCandidate(nextNode)) {
                    if (NodeType.isBr(nextNode)) {
                        return this.__moveForwardFromBr(root, nextNode);
                    }
                    if (!CaretCandidate.isAtomic(nextNode)) {
                        innerNode = CaretUtils.findNode(nextNode, direction, (node) => CaretCandidate.isEditableCaretCandidate(node), nextNode);
                        if (innerNode) {
                            if (NodeType.isText(innerNode)) {
                                return new CaretPosition(innerNode, 0);
                            }
                            return CaretPosition.before(innerNode);
                        }
                    }
                    if (NodeType.isText(nextNode)) {
                        return new CaretPosition(nextNode, 0);
                    }
                    return CaretPosition.after(nextNode);
                }
            }
            node = nextNode ? nextNode : caretPosition.getNode();
        }

        if ((CaretUtils.isForwards(direction) && caretPosition.isAtEnd()) || (CaretUtils.isBackwards(direction) && caretPosition.isAtStart())) {
            node = CaretUtils.findNode(node, direction, Option.constant(true), root, true);
            if (CaretCandidate.isEditableCaretCandidate(node, root)) {
                return this.__getCaretCandidatePosition(direction, node);
            }
        }

        nextNode = CaretUtils.findNode(node, direction, (node) => CaretCandidate.isEditableCaretCandidate(node), root);
        rootContentEditableFalseElm = ArrUtils.last(Tools.filter(this.__getParents(container, root), NodeType.isContentEditableFalse));
        
        if (rootContentEditableFalseElm && (!nextNode || !rootContentEditableFalseElm.contains(nextNode))) {
            if (CaretUtils.isForwards(direction)) {
                caretPosition = CaretPosition.after(rootContentEditableFalseElm);
            }
            else {
                caretPosition = CaretPosition.before(rootContentEditableFalseElm);
            }
            return caretPosition;
        }

        if (nextNode) {
            return this.__getCaretCandidatePosition(direction, nextNode);
        }

        return null;
    }

    __getParents(node, root) {
        let parents = [];
        while (node && node !== root) {
            parents.push(node);
            node = node.parentNode;
        }
        return parents;
    }

    __nodeAtIndex(container, offset) {
        if (container.hasChildNodes() && offset < container.childNodes.length) {
            return container.childNodes[offset];
        }
        return null;
    }

    __getCaretCandidatePosition(direction, node) {
        if (CaretUtils.isForwards(direction)) {
            if (CaretCandidate.isCaretCandidate(node.previousSibling) && !NodeType.isText(node.previousSibling)) {
                return CaretPosition.before(node);
            }
            if (NodeType.isText(node)) {
                return new CaretPosition(node, 0);
            }
        }
        if (CaretUtils.isBackwards(direction)) {
            if (CaretCandidate.isCaretCandidate(node.nextSibling) && !NodeType.isText(node.nextSibling)) {
                return CaretPosition.after(node);
            }
            if (NodeType.isText(node)) {
                return new CaretPosition(node, node.data.length);
            }
        }
        if (CaretUtils.isBackwards(direction)) {
            if (NodeType.isBr(node)) {
                return CaretPosition.before(node);
            }
            return CaretPosition.after(node);
        }
        return CaretPosition.before(node);
    }

    __moveForwardFromBr(root, nextNode) {
        let nextSibling = nextNode.nextSibling;

        if (nextSibling && CaretCandidate.isCaretCandidate(nextSibling)) {
            if (NodeType.isText(nextSibling)) {
                return new CaretPosition(nextSibling, 0);
            }
            else {
                return CaretPosition.before(nextSibling);
            }
        }
        else {
            return this.__findCaretPosition(HDirection.Forwards, CaretPosition.after(nextNode), root);
        }
    }
}
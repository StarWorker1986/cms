import Option from "../util/Option";
import Tools from "../util/Tools";
import CaretCandidate from "./CaretCandidate";
import CaretPosition from "./CaretPosition";
import CaretUtils from "./CaretUtils";
import CaretWalker from "./CaretWalker";
import NodeType from "../dom/NodeType";

export default class CaretFinder {
    static fromPosition(forward, root, pos) {
        let walker = new CaretWalker(root);
        return Option.from(forward ? walker.next(pos) : walker.prev(pos));
    }

    static nextPosition() {
        return Tools.curry(this.fromPosition, true);
    }

    static prevPosition() {
        return Tools.curry(this.fromPosition, false);
    }

    static navigate(forward, root, from) {
        return this.fromPosition(forward, root, from).bind((to) => {
            if (CaretUtils.isInSameBlock(from, to, root) && this.__shouldSkipPosition(forward, from, to)) {
                return this.fromPosition(forward, root, to);
            }
            else {
                return Option.some(to);
            }
        });
    }

    static positionIn(forward, element) {
        let startNode = forward ? element.firstChild : element.lastChild;

        if (NodeType.isText(startNode)) {
            return Option.some(new CaretPosition(startNode, forward ? 0 : startNode.data.length));
        }
        else if (startNode) {
            if (CaretCandidate.isCaretCandidate(startNode)) {
                return Option.some(forward ? CaretPosition.before(startNode) : this.__afterElement(startNode));
            }
            else {
                return this.__walkToPositionIn(forward, element, startNode);
            }
        }
        else {
            return Option.none();
        }
    }

    static firstPositionIn(element) {
        return this.positionIn(true, element);
    }

    static lastPositionIn(element) {
        return this.positionIn(false, element);
    }

    static __walkToPositionIn(forward, root, start) {
        let position = forward ? CaretPosition.before(start) : CaretPosition.after(start);
        return this.fromPosition(forward, root, position);
    }

    static __afterElement(node) {
        return NodeType.isBr(node) ? CaretPosition.before(node) : CaretPosition.after(node);
    }

    static __isBeforeOrStart(position) {
        if (CaretPosition.isTextPosition(position)) {
            return position.offset === 0;
        }
        else {
            return CaretCandidate.isCaretCandidate(position.getNode());
        }
    }

    static __isAfterOrEnd(position) {
        if (CaretPosition.isTextPosition(position)) {
            return position.offset === position.container.data.length;
        }
        else {
            return CaretCandidate.isCaretCandidate(position.getNode(true));
        }
    }

    static __isBeforeAfterSameElement(from, to) {
        return !CaretPosition.isTextPosition(from)
            && !CaretPosition.isTextPosition(to)
            && from.getNode() === to.getNode(true);
    }

    static __isAtBr(position) {
        return !CaretPosition.isTextPosition(position) && NodeType.isBr(position.getNode());
    }

    static __shouldSkipPosition(forward, from, to) {
        if (forward) {
            return !this.__isBeforeAfterSameElement(from, to)
                && !this.__isAtBr(from)
                && this.__isAfterOrEnd(from)
                && this.__isBeforeOrStart(to);
        }
        else {
            return !this.__isBeforeAfterSameElement(to, from)
                && this.__isBeforeOrStart(from)
                && this.__isAfterOrEnd(to);
        }
    }
}
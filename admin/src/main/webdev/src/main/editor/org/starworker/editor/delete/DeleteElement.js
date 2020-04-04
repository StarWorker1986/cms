import Option from "../util/Option";
import DOMUtils from "../dom/DOMUtils";
import CaretCandidate from "../caret/CaretCandidate";
import CaretFinder from "../caret/CaretFinder";
import CaretPosition from "../caret/CaretPosition";
import MergeText from "./MergeText";
import Empty from "../dom/Empty";
import NodeType from "../dom/NodeType";

export default class DeleteElement {
    static deleteElement(editor, forward, elm, moveCaret) {
        if (moveCaret === void 0) {
            moveCaret = true;
        }

        let afterDeletePos = this.__findCaretPosOutsideElmAfterDelete(forward, editor.getBody(), elm.dom()),
            parentBlock = DOMUtils.ancestor(elm, (e) => this.__isBlock(editor, e), this.__eqRawNode(editor.getBody()))
            normalizedAfterDeletePos = this.__deleteNormalized(elm, afterDeletePos, this.__isInlineElement(editor, elm));

        if (editor.dom.isEmpty(editor.getBody())) {
            editor.setContent('');
            editor.selection.setCursorLocation();
        }
        else {
            parentBlock.bind(paddEmptyBlock).fold(() => {
                if (moveCaret) {
                    this.__setSelection(editor, forward, normalizedAfterDeletePos);
                }
            },
            (paddPos) => {
                if (moveCaret) {
                    this.__setSelection(editor, forward, Option.some(paddPos));
                }
            });
        }
    }

    static __needsReposition(pos, elm) {
        let container = pos.container(), offset = pos.offset();
        return CaretPosition.isTextPosition(pos) === false
            && container === elm.parentNode
            && offset > CaretPosition.before(elm).offset();
    }

    static __reposition(elm, pos) {
        return this.__needsReposition(pos, elm) ? new CaretPosition(pos.container(), pos.offset() - 1) : pos;
    }

    static __beforeOrStartOf(node) {
        return NodeType.isText(node) ? new CaretPosition(node, 0) : CaretPosition.before(node);
    }

    static __afterOrEndOf(node) {
        return NodeType.isText(node) ? new CaretPosition(node, node.data.length) : CaretPosition.after(node);
    }

    static __getPreviousSiblingCaretPosition(elm) {
        if (CaretCandidate.isCaretCandidate(elm.previousSibling)) {
            return Option.some(this.__afterOrEndOf(elm.previousSibling));
        }
        else {
            return elm.previousSibling ? CaretFinder.lastPositionIn(elm.previousSibling) : Option.none();
        }
    }

    static __getNextSiblingCaretPosition(elm) {
        if (CaretCandidate.isCaretCandidate(elm.nextSibling)) {
            return Option.some(this.__beforeOrStartOf(elm.nextSibling));
        }
        else {
            return elm.nextSibling ? CaretFinder.firstPositionIn(elm.nextSibling) : Option.none();
        }
    }

    static __findCaretPositionBackwardsFromElm(rootElement, elm) {
        let startPosition = CaretPosition.before(elm.previousSibling ? elm.previousSibling : elm.parentNode);
        return CaretFinder.prevPosition(rootElement, startPosition)
                          .fold(() => CaretFinder.nextPosition(rootElement, CaretPosition.after(elm)), Option.some);
    }

    static __findCaretPositionForwardsFromElm(rootElement, elm) {
        return CaretFinder.nextPosition(rootElement, CaretPosition.after(elm))
                          .fold(() => CaretFinder.prevPosition(rootElement, CaretPosition.before(elm)), Option.some);
    }

    static __findCaretPositionBackwards(rootElement, elm) {
        return this.__getPreviousSiblingCaretPosition(elm)
                   .orThunk(() => this.__getNextSiblingCaretPosition(elm))
                   .orThunk(() => this.__findCaretPositionBackwardsFromElm(rootElement, elm));
    }

    static __findCaretPositionForward(rootElement, elm) {
        return this.__getNextSiblingCaretPosition(elm)
                   .orThunk(() => this.__getPreviousSiblingCaretPosition(elm))
                   .orThunk(() => this.__findCaretPositionForwardsFromElm(rootElement, elm));
    }

    static __findCaretPosition(forward, rootElement, elm) {
        return forward ? this.__findCaretPositionForward(rootElement, elm) : this.__findCaretPositionBackwards(rootElement, elm);
    }

    static __findCaretPosOutsideElmAfterDelete(forward, rootElement, elm) {
        return this.__findCaretPosition(forward, rootElement, elm).map((pos) => this.__reposition(elm, pos));
    }

    static __setSelection(editor, forward, pos) {
        pos.fold(() => {
            editor.focus();
        },
        (pos) => {
            editor.selection.setRng(pos.toRange(), forward);
        });
    }

    static __eqRawNode(rawNode) {
        return (elm) => elm.dom() === rawNode;
    }

    static __isBlock(editor, elm) {
        return elm && editor.schema.getBlockElements().hasOwnProperty(DOMUtils.name(elm));
    }

    static __paddEmptyBlock(elm) {
        if (Empty.isEmpty(elm)) {
            let br = DOMUtils.fromHtml('<br data-editor-bogus="1">');
            DOMUtils.empty(elm);
            DOMUtils.append(elm, br);
            return Option.some(CaretPosition.before(br.dom()));
        }
        else {
            return Option.none();
        }
    }

    static __deleteNormalized(elm, afterDeletePosOpt, normalizeWhitespace) {
        let prevTextOpt = DOMUtils.prevSibling(elm).filter((e) => NodeType.isText(e.dom())),
            nextTextOpt = DOMUtils.nextSibling(elm).filter((e) => NodeType.isText(e.dom()));

        DOMUtils.remove(elm);
       
        return Options.liftN([prevTextOpt, nextTextOpt, afterDeletePosOpt], (prev, next, pos) => {
            let prevNode = prev.dom(), nextNode = next.dom(), offset = prevNode.data.length;
            MergeText.mergeTextNodes(prevNode, nextNode, normalizeWhitespace);
            return pos.container() === nextNode ? new CaretPosition(prevNode, offset) : pos;
        }).orThunk(() => {
            if (normalizeWhitespace) {
                prevTextOpt.each((elm) => MergeText.normalizeWhitespaceBefore(elm.dom(), elm.dom().length));
                nextTextOpt.each((elm) => MergeText.normalizeWhitespaceAfter(elm.dom(), 0));
            }
            return afterDeletePosOpt;
        });
    }

    static __isInlineElement(editor, element) {
        return Object.hasOwnProperty.call(editor.schema.getTextInlineElements(), DOMUtils.name(element));
    }
}
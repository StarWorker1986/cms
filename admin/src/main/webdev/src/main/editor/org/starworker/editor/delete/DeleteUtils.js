import Option from "../util/Option";
import Tools from "../util/Tools";
import DOMUtils from "../dom/DOMUtils";
import CaretFinder from "../caret/CaretFinder";
import ElementType from "../dom/ElementType";
import InlineUtils from "../keyboard/InlineUtils";

export default class DeleteUtils {
    static getParentBlock(rootNode, elm) {
        return Tools.contains(rootNode, elm) ? DOMUtils.closest(elm,
        (element) => {
            return ElementType.isTextBlock(element) || ElementType.isListItem(element);
        },
        (rootNode) => {
            return (element) => DOMUtils.eq(rootNode, DOMUtils.fromDom(element.dom().parentNode));
        }) : Option.none();
    }

    static paddEmptyBody(editor) {
        if (editor.dom.isEmpty(editor.getBody())) {
            editor.setContent('');
            let body = editor.getBody(), firstChild = body.firstChild,
                node = firstChild && editor.dom.isBlock(firstChild) ? firstChild : body;
            editor.selection.setCursorLocation(node, 0);
        }
    }

    static willDeleteLastPositionInElement(forward, fromPos, elm) {
        return Option.liftN([
            CaretFinder.firstPositionIn(elm),
            CaretFinder.lastPositionIn(elm)
        ],
        (firstPos, lastPos) => {
            let normalizedFirstPos = InlineUtils.normalizePosition(true, firstPos),
                normalizedLastPos = InlineUtils.normalizePosition(false, lastPos),
                normalizedFromPos = InlineUtils.normalizePosition(false, fromPos);
            if (forward) {
                return CaretFinder.nextPosition(elm, normalizedFromPos)
                                  .map((nextPos) => nextPos.isEqual(normalizedLastPos) && fromPos.isEqual(normalizedFirstPos))
                                  .getOr(false);
            }
            else {
                return CaretFinder.prevPosition(elm, normalizedFromPos)
                                  .map((prevPos) => prevPos.isEqual(normalizedFirstPos) && fromPos.isEqual(normalizedLastPos))
                                  .getOr(false);
            }
        }).getOr(true);
    }
}
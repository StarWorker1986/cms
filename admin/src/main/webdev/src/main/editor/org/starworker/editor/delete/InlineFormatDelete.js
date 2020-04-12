import Option from "../util/Option";
import Tools from "../util/Tools";
import CaretPosition from "../caret/CaretPosition";
import DeleteElement from "./DeleteElement";
import DeleteUtils from "./DeleteUtils";
import DOMUtils from "../dom/DOMUtils";
import ElementType from "../dom/ElementType";
import Parents from "../dom/Parents";
import CaretFormat from "../fmt/CaretFormat";

export default class InlineFormatDelete {
    static backspaceDelete(editor, forward) {
        return editor.selection.isCollapsed() ? this.__deleteCaret(editor, forward) : false;
    }

    static __getParentInlines(rootElm, startElm) {
        let parents = Parents.parentsAndSelf(startElm, rootElm);
        return Tools.findIndex(parents, ElementType.isBlock)
                    .fold(Option.constant(parents), (index) => parents.slice(0, index));
    }

    static __deleteLastPosition(forward, editor, target, parentInlines) {
        let isFormatElement = (elm) => CaretFormat.isFormatElement(editor, elm),
            formatNodes = Tools.map(Tools.filter(parentInlines, isFormatElement), (elm) => elm.dom());

        if (formatNodes.length === 0) {
            DeleteElement.deleteElement(editor, forward, target);
        }
        else {
            let pos = CaretFormat.replaceWithCaretFormat(target.dom(), formatNodes);
            editor.selection.setRng(pos.toRange());
        }
    }

    static __deleteCaret(editor, forward) {
        let rootElm = DOMUtils.fromDom(editor.getBody()),
            startElm = DOMUtils.fromDom(editor.selection.getStart()),
            parentInlines = Tools.filter(this.__getParentInlines(rootElm, startElm),
                                        (elm) => DOMUtils.children(elm).length === 1);

        return Tools.last(parentInlines).map((target) => {
            let fromPos = CaretPosition.fromRangeStart(editor.selection.getRng());
            if (DeleteUtils.willDeleteLastPositionInElement(forward, fromPos, target.dom())
                    && !CaretFormat.isEmptyCaretFormatElement(target)) {
                this.__deleteLastPosition(forward, editor, target, parentInlines);
                return true;
            }
            else {
                return false;
            }
        }).getOr(false);
    }
}
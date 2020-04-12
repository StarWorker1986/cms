import Option from "../util/Option";
import CaretContainer from "../caret/CaretContainer";
import CaretContainerInline from "../caret/CaretContainerInline";
import CaretContainerRemove from "../caret/CaretContainerRemove";
import CaretFinder from "../caret/CaretFinder";
import CaretPosition from "../caret/CaretPosition";
import NodeType from "../dom/NodeType";

export default class BoundaryCaret {
    static renderCaret(caret, location) {
        return location.fold(
            (element) => {
                CaretContainerRemove.remove(caret.get());
                let text = CaretContainerInline.insertInlineBefore(element);
                caret.set(text);
                return Option.some(new CaretPosition(text, text.length - 1));
            },
            (element) => {
                return CaretFinder.firstPositionIn(element).map((pos) => {
                    if (!this.__isPosCaretContainer(pos, caret)) {
                        CaretContainerRemove.remove(caret.get());
                        let text = this.__insertInlinePos(pos, true);
                        caret.set(text);
                        return new CaretPosition(text, 1);
                    }
                    else {
                        return new CaretPosition(caret.get(), 1);
                    }
                });
            },
            (element) => {
                return CaretFinder.lastPositionIn(element).map((pos) => {
                    if (!this.__isPosCaretContainer(pos, caret)) {
                        CaretContainerRemove.remove(caret.get());
                        let text = this.__insertInlinePos(pos, false);
                        caret.set(text);
                        return new CaretPosition(text, text.length - 1);
                    }
                    else {
                        return new CaretPosition(caret.get(), caret.get().length - 1);
                    }
                });
            },
            (element) => {
                CaretContainerRemove.remove(caret.get());
                let text = CaretContainerInline.insertInlineAfter(element);
                caret.set(text);
                return Option.some(new CaretPosition(text, 1));
            });
    }

    static __insertInlinePos(pos, before) {
        if (NodeType.isText(pos.container())) {
            return CaretContainerInline.insertInline(before, pos.container());
        }
        else {
            return CaretContainerInline.insertInline(before, pos.getNode());
        }
    }

    static __isPosCaretContainer(pos, caret) {
        let caretNode = caret.get();
        return caretNode && pos.container() === caretNode && CaretContainer.isCaretContainerInline(caretNode);
    }
}
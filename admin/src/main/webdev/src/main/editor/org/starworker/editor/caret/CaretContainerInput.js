import { Fun } from "@ephox/katamari";
import { Element, SelectorFind } from "@ephox/sugar";
import CaretContainer from "./CaretContainer";

function findBlockCaretContainer(editor) {
    return SelectorFind.descendant(Element.fromDom(editor.getBody()), "*[data-editor-caret]").fold(Fun.constant(null), (elm) => {
        return elm.dom();
    });
}

function removeIeControlRect(editor) {
    editor.selection.setRng(editor.selection.getRng());
}

function showBlockCaretContainer(editor, blockCaretContainer) {
    if (blockCaretContainer.hasAttribute("data-editor-caret")) {
        CaretContainer.showCaretContainerBlock(blockCaretContainer);
        removeIeControlRect(editor);
        editor.selection.scrollIntoView(blockCaretContainer);
    }
}

function handleBlockContainer(editor, e) {
    let blockCaretContainer = findBlockCaretContainer(editor);
    if (!blockCaretContainer) {
        return;
    }
    if (e.type === "compositionstart") {
        e.preventDefault();
        e.stopPropagation();
        showBlockCaretContainer(editor, blockCaretContainer);
        return;
    }
    if (CaretContainer.hasContent(blockCaretContainer)) {
        showBlockCaretContainer(editor, blockCaretContainer);
        editor.undoManager.add();
    }
}

function setup(editor) {
    editor.on("keyup compositionstart", Fun.curry(handleBlockContainer, editor));
};
export default {
    setup: setup
};

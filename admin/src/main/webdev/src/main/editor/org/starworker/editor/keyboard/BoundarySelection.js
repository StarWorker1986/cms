import Cell from "../util/Cell";
import Tools from "../util/Tools";
import CaretContainerRemove from "../caret/CaretContainerRemove";
import CaretPosition from "../caret/CaretPosition";
import BoundaryCaret from "./BoundaryCaret";
import BoundaryLocation from "./BoundaryLocation";
import InlineUtils from "./InlineUtils";
import WordSelection from "../selection/WordSelection";

export default class BoundarySelection {
    static move(editor, caret, forward) {
        return () => this.__isFeatureEnabled(editor) ? this.__findLocation(editor, caret, forward).isSome() : false;
    }

    static moveNextWord(editor) {
        return () => this.__isFeatureEnabled(editor) ? WordSelection.moveByWord(true, editor) : false;
    }

    static movePrevWord(editor) {
        return () => this.__isFeatureEnabled(editor) ? WordSelection.moveByWord(false, editor) : false;
    }

    static setupSelectedState(editor) {
        let caret = new Cell(null), isInlineTarget = (elm) => InlineUtils.isInlineTarget(editor, elm);
        editor.on("NodeChange", (e) => {
            if (this.__isFeatureEnabled(editor)) {
                this.__toggleInlines(isInlineTarget, editor.dom, e.parents);
                this.__safeRemoveCaretContainer(editor, caret);
                this.__renderInsideInlineCaret(isInlineTarget, editor, caret, e.parents);
            }
        });
        return caret;
    }

    static setCaretPosition(editor, pos) {
        let rng = editor.dom.createRng();
        rng.setStart(pos.container(), pos.offset());
        rng.setEnd(pos.container(), pos.offset());
        editor.selection.setRng(rng);
    }

    static __findLocation(editor, caret, forward) {
        let rootNode = editor.getBody(), from = CaretPosition.fromRangeStart(editor.selection.getRng()),
            isInlineTarget = (elm) => InlineUtils.isInlineTarget(editor, elm),
            location = BoundaryLocation.findLocation(forward, isInlineTarget, rootNode, from);
        return location.bind((location) => this.__renderCaretLocation(editor, caret, location));
    }

    static __isFeatureEnabled(editor) {
        return editor.settings.inlineBoundaries !== false;
    }

    static __renderCaretLocation(editor, caret, location) {
        return BoundaryCaret.renderCaret(caret, location).map((pos) => {
            this.setCaretPosition(editor, pos);
            return location;
        });
    }

    static __renderInsideInlineCaret(isInlineTarget, editor, caret, elms) {
        if (editor.selection.isCollapsed()) {
            let inlines = Tools.filter(elms, isInlineTarget);
            Tools.each(inlines, (inline) => {
                let pos = CaretPosition.fromRangeStart(editor.selection.getRng());
                BoundaryLocation.readLocation(isInlineTarget, editor.getBody(), pos)
                                .bind((location) => this.__renderCaretLocation(editor, caret, location));
            });
        }
    }

    static __setSelected(state, elm) {
        if (state) {
            elm.setAttribute("data-editor-selected", "inline-boundary");
        }
        else {
            elm.removeAttribute("data-editor-selected");
        }
    }

    static __safeRemoveCaretContainer(editor, caret) {
        if (editor.selection.isCollapsed() && editor.composing !== true && caret.get()) {
            let pos = CaretPosition.fromRangeStart(editor.selection.getRng());
            if (CaretPosition.isTextPosition(pos) && InlineUtils.isAtZwsp(pos) === false) {
                this.setCaretPosition(editor, CaretContainerRemove.removeAndReposition(caret.get(), pos));
                caret.set(null);
            }
        }
    }

    static __toggleInlines(isInlineTarget, dom, elms) {
        let selectedInlines = Tools.filter(dom.select('*[data-editor-selected="inline-boundary"]'), isInlineTarget),
            targetInlines = Tools.filter(elms, isInlineTarget);
        Tools.each(Tools.difference(selectedInlines, targetInlines), (elm) => this.__setSelected(false, elm));
        Tools.each(Tools.difference(targetInlines, selectedInlines), (elm) => this.__setSelected(true, elm));
    }
}
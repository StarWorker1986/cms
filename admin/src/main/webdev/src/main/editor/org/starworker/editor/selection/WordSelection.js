import Tools from "../util/Tools";
import CaretContainer from "../caret/CaretContainer";
import CaretPosition from "../caret/CaretPosition";

export default class WordSelection {
    static hasSelectionModifyApi(editor) {
        return Tools.isFunction(editor.selection.getSel().modify);
    }

    static moveByWord(forward, editor) {
        let rng = editor.selection.getRng(),
            pos = forward ? CaretPosition.fromRangeEnd(rng) : CaretPosition.fromRangeStart(rng);

        if (!this.hasSelectionModifyApi(editor)) {
            return false;
        }
        else if (forward && CaretContainer.isBeforeInline(pos)) {
            return this.__moveRel(true, editor.selection, pos);
        }
        else if (!forward && CaretContainer.isAfterInline(pos)) {
            return this.__moveRel(false, editor.selection, pos);
        }
        else {
            return false;
        }
    }

    static __moveRel(forward, selection, pos) {
        let delta = forward ? 1 : -1;
        selection.setRng(new CaretPosition(pos.container(), pos.offset() + delta).toRange());
        selection.getSel().modify("move", forward ? "forward" : "backward", "word");
        return true;
    }

}
import InsertBlock from "./InsertBlock";
import InsertBr from "./InsertBr";
import NewLineAction from "./NewLineAction";

export default class InsertNewLine {
    static insert(editor, evt) {
        NewLineAction.getAction(editor, evt).fold(
        () => {
            InsertBr.insert(editor, evt);
        },
        () => {
            InsertBlock.insert(editor, evt);
        },
        () => { });
    }
}

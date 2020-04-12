import BlockBoundaryDelete from "./BlockBoundaryDelete";
import BlockRangeDelete from "./BlockRangeDelete";
import CefDelete from "./CefDelete";
import DeleteUtils from "./DeleteUtils";
import BoundaryDelete from "./InlineBoundaryDelete";
import TableDelete from "./TableDelete";
import InlineFormatDelete from "./InlineFormatDelete";
import CefBoundaryDelete from "./CefBoundaryDelete";

export default class DeleteCommands {
    static deleteCommand(editor) {
        if (CefDelete.backspaceDelete(editor, false)) {
            return;
        }
        else if (CefBoundaryDelete.backspaceDelete(editor, false)) {
            return;
        }
        else if (BoundaryDelete.backspaceDelete(editor, false)) {
            return;
        }
        else if (BlockBoundaryDelete.backspaceDelete(editor, false)) {
            return;
        }
        else if (TableDelete.backspaceDelete(editor)) {
            return;
        }
        else if (BlockRangeDelete.backspaceDelete(editor, false)) {
            return;
        }
        else if (InlineFormatDelete.backspaceDelete(editor, false)) {
            return;
        }
        else {
            this.__nativeCommand(editor, "Delete");
            DeleteUtils.paddEmptyBody(editor);
        }
    }

    static forwardDeleteCommand(editor) {
        if (CefDelete.backspaceDelete(editor, true)) {
            return;
        }
        else if (CefBoundaryDelete.backspaceDelete(editor, true)) {
            return;
        }
        else if (BoundaryDelete.backspaceDelete(editor, true)) {
            return;
        }
        else if (BlockBoundaryDelete.backspaceDelete(editor, true)) {
            return;
        }
        else if (TableDelete.backspaceDelete(editor)) {
            return;
        }
        else if (BlockRangeDelete.backspaceDelete(editor, true)) {
            return;
        }
        else if (InlineFormatDelete.backspaceDelete(editor, true)) {
            return;
        }
        else {
            this.__nativeCommand(editor, "ForwardDelete");
        }
    }

    static __nativeCommand(editor, command) {
        editor.getDoc().execCommand(command, false, null);
    }
}
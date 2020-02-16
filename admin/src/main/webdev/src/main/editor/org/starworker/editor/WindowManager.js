import Tools from "./util/Tools";
import Option from "./util/Option";
import SelectionBookmark from "../selection/SelectionBookmark";
import WindowManagerImpl from "../ui/WindowManagerImpl";

export default class WindowManager {
    constructor(editor) {
        this.editor = editor;
        this._dialogs = [];

        editor.on("remove", () => {
            Tools.each(this._dialogs, (dialog) => {
                this.__getImplementation().close(dialog);
            });
        });
    }

    alert(message, callback, scope) {
        this.__getImplementation().alert(message, this.__funcBind(scope ? scope : this, callback));
    }

    confirm(message, callback, scope) {
        this.__getImplementation().confirm(message, this.__funcBind(scope ? scope : this, callback));
    }

    close() {
        Option.from(this._dialogs[this._dialogs.length - 1]).each((dialog) => {
            this.__getImplementation().close(dialog);
            this.__closeDialog(dialog);
        });
    }

    open(args, params) {
        let editor = this.editor, dialog = this.__getImplementation().open(args, params, (dlg) => this.closeDialog(dlg));

        editor.editorManager.setActive(editor);
        SelectionBookmark.store(editor);
        this.__addDialog(dialog);
        return dialog;
    }

    __addDialog(dialog) {
        this._dialogs.push(dialog);
        this.__fireOpenEvent(dialog);
    }

    __closeDialog(dialog) {
        this.__fireCloseEvent(dialog);
        this._dialogs = Tools.filter(this._dialogs, (otherDialog) => {
            return otherDialog !== dialog;
        });

        // Move focus back to editor when the last window is closed
        if (this._dialogs.length === 0) {
            this.editor.focus();
        }
    }

    __fireOpenEvent(dialog) {
        this.editor.fire("OpenWindow", {
            dialog: dialog
        });
    }

    __fireCloseEvent(dialog) {
        this.editor.fire("CloseWindow", {
            dialog: dialog
        });
    }

    __funcBind(scope, fn) {
        return () => {
            return fn ? fn.apply(scope, arguments) : undefined;
        };
    }

    __getImplementation() {
        let theme = this.editor.theme;
        return theme && theme.getWindowManagerImpl ? theme.getWindowManagerImpl() : new WindowManagerImpl();
    }
}
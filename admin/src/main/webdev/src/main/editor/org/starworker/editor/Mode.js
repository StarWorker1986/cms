import DOMUtils from "./dom/DOMUtils";
import Events from "./Events";

export default class Mode {
    static getMode(editor) {
        return editor.readonly ? "readonly" : "design";
    }

    static isReadOnly(editor) {
        return editor.readonly === true;
    }
    
    static setMode(editor, mode) {
        if (mode === this.getMode(editor)) {
            return;
        }

        if (editor.initialized) {
            this.__toggleReadOnly(editor, mode === "readonly");
        }
        else {
            editor.on("init", () => {
                this.__toggleReadOnly(editor, mode === "readonly");
            });
        }
        Events.fireSwitchMode(editor, mode);
    }

    static __setEditorCommandState(editor, cmd, state) {
        try {
            editor.getDoc().execCommand(cmd, false, state);
        }
        catch (ex) {
            // Ignore
        }
    }

    static __toggleClass(elm, cls, state) {
        if (DOMUtils.hasClass(elm, cls) && state === false) {
            DOMUtils.removeClass(elm, cls);
        }
        else if (state) {
            DOMUtils.addClass(elm, cls);
        }
    }

    static __toggleReadOnly(editor, state) {
        this.__toggleClass(DOMUtils.fromDom(editor.getBody()), "editor-content-readonly", state);

        if (state) {
            editor.selection.controlSelection.hideResizeRect();
            editor.readonly = true;
            editor.getBody().contentEditable = "false";
        }
        else {
            editor.readonly = false;
            editor.getBody().contentEditable = "true";
            this.__setEditorCommandState(editor, "StyleWithCSS", false);
            this.__setEditorCommandState(editor, "enableInlineTableEditing", false);
            this.__setEditorCommandState(editor, "enableObjectResizing", false);
            editor.focus();
            editor.nodeChanged();
        }
    }
}
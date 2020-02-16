export default class Events {
    static firePreProcess(editor, args) {
        return editor.fire("PreProcess", args);
    }

    static firePostProcess(editor, args) {
        return editor.fire("PostProcess", args);
    }

    static fireRemove(editor) {
        return editor.fire("remove");
    }

    static fireDetach(editor) {
        return editor.fire("detach");
    }

    static fireSwitchMode(editor, mode) {
        return editor.fire("SwitchMode", { mode: mode });
    }

    static fireObjectResizeStart(editor, target, width, height) {
        editor.fire("ObjectResizeStart", { target: target, width: width, height: height });
    }

    static fireObjectResized(editor, target, width, height) {
        editor.fire("ObjectResized", { target: target, width: width, height: height });
    }
}
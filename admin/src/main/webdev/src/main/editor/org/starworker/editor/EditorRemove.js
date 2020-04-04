import DOMUtils from "./dom/DOMUtils";
import Option from "./util/Option";
import Events from "./Events";

export default class EditorRemove {
    static destroy = function (editor, automatic) {
        let selection = editor.selection, dom = editor.dom;

        if (editor.destroyed) {
            return;
        }
        if (!automatic && !editor.removed) {
            editor.remove();
            return;
        }

        if (!automatic) {
            editor.editorManager.off("beforeunload", editor._beforeUnload);
            if (editor.theme && editor.theme.destroy) {
                editor.theme.destroy();
            }
            this.__safeDestroy(selection);
            this.__safeDestroy(dom);
        }
        this.__restoreForm(editor);
        this.__clearDomReferences(editor);
        editor.destroyed = true;
    }

    static remove(editor) {
        let DOM = DOMUtils.DOM;

        if (!editor.removed) {
            let _selectionOverrides = editor._selectionOverrides, editorUpload = editor.editorUpload,
                body = editor.getBody(), element = editor.getElement();

            if (body) {
                editor.save({ isRemoving: true });
            }

            editor.removed = true;
            editor.unbindAllNativeEvents();

            if (editor.hasHiddenInput && element) {
                DOM.remove(element.nextSibling);
            }

            if (!editor.inline && body) {
                DOM.setStyle(editor.id, "display", editor.orgDisplay);
            }

            Events.fireRemove(editor);
            editor.editorManager.remove(editor);
            Events.fireDetach(editor);
            DOM.remove(editor.getContainer());
            this.__safeDestroy(_selectionOverrides);
            this.__safeDestroy(editorUpload);
            editor.destroy();
        }
    }

    static __clearDomReferences(editor) {
        editor.contentAreaContainer = editor.formElement = editor.container = editor.editorContainer = null;
        editor.bodyElement = editor.contentDocument = editor.contentWindow = null;
        editor.iframeElement = editor.targetElm = null;
        if (editor.selection) {
            editor.selection = editor.selection.win = editor.selection.dom = editor.selection.dom.doc = null;
        }
    }

    static __restoreForm(editor) {
        let form = editor.formElement;
        if (form) {
            if (form._editorOldSubmit) {
                form.submit = form._editorOldSubmit;
                form._editorOldSubmit = null;
            }
            DOMUtils.DOM.unbind(form, "submit reset", editor.formEventDelegate);
        }
    }

    static __safeDestroy(x) {
        return Option.from(x).each((x) => x.destroy());
    }
}
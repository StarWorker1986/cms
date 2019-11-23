import Throttler from "../util/Throttler";
import PlatformDetection from "../util/PlatformDetection";
import DOMUtils from "../dom/DOMUtils";
import SelectionBookmark from "./SelectionBookmark";

export default class SelectionRestore {
    static register(editor) {
        let throttledStore = Throttler.first(() => {
            SelectionBookmark.store(editor);
        }, 0);

        if (editor.inline) {
            this.__registerPageMouseUp(editor, throttledStore);
        }

        editor.on("init", () => {
            this.__registerEditorEvents(editor, throttledStore);
        });

        editor.on("remove", () => {
            throttledStore.cancel();
        });
    }

    static __registerPageMouseUp(editor, throttledStore) {
        let mouseUpPage = () => throttledStore.throttle();

        DOMUtils.DOM.bind(document, "mouseup", mouseUpPage);
        editor.on("remove", () => {
            DOMUtils.DOM.unbind(document, "mouseup", mouseUpPage);
        });
    }

    static __registerFocusOut(editor) {
        editor.on("focusout", () => {
            SelectionBookmark.store(editor);
        });
    }

    static __registerMouseUp(editor, throttledStore) {
        editor.on("mouseup touchend", (e) => {
            throttledStore.throttle();
        });
    }

    static __registerEditorEvents(editor, throttledStore) {
        let browser = PlatformDetection.detect().browser;

        if (browser.isIE()) {
            this.__registerFocusOut(editor);
        }
        else {
            this.__registerMouseUp(editor, throttledStore);
        }

        editor.on("keyup nodechange", (e) => {
            if (e.type !== "nodechange" || !e.selectionChange) {
                SelectionBookmark.store(editor);
            }
        });
    }
}
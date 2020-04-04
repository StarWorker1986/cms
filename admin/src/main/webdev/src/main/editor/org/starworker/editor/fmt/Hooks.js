import ArrUtils from "../util/ArrUtils";
import NodeType from "../dom/NodeType";
import DOMUtils from "../dom/DOMUtils";

export default class Hooks {
    static postProcess(name, editor) {
        ArrUtils.each(this.__getPostProcessHooks[name], (hook) => {
            hook(editor);
        });
    }

    static __getPostProcessHooks(name) {
        switch(name) {
            case "pre":
                return this.__preHook;
            default: break;
        }
    }

    static __preHook(editor) {
        let rng = editor.selection.getRng(), isPre, blocks;

        isPre = NodeType.matchNodeNames("pre");
        if (!rng.collapsed) {
            blocks = editor.selection.getSelectedBlocks();
            ArrUtils.each(ArrUtils.filter(ArrUtils.filter(blocks, isPre), 
            (pre) => isPre(pre.previousSibling) && ArrUtils.indexOf(blocks, pre.previousSibling) !== -1),
            (pre) => {
                DOMUtils.$(pre.previousSibling).remove();
                DOMUtils.$(pre.previousSibling).append('<br><br>').append(pre.childNodes);
            });
        }
    }
}
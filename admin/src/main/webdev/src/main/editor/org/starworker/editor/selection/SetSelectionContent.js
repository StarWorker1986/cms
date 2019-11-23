import ScrollIntoView from "../dom/ScrollIntoView";
import Option from "../util/Option";
import NodeType from "../dom/NodeType";
import DOMUtils from "../dom/DOMUtils";

export default class SetSelectionContent {
    static setContent(editor, content, args) {
        args = this.__setupArgs(args, content); // mutates
        
        if (!args.no_events) {
            args = editor.fire("BeforeSetContent", args);
            if (args.isDefaultPrevented()) {
                editor.fire("SetContent", args);
                return;
            }
        }

        let rng = editor.selection.getRng();
        this.__rngSetContent(rng, rng.createContextualFragment(args.content));
        editor.selection.setRng(rng);
        ScrollIntoView.scrollRangeIntoView(editor, rng);
        if (!args.no_events) {
            editor.fire("SetContent", args);
        }
    }

    static __prependData(target, data) {
        target.insertData(0, data);
    }

    static __removeEmpty(text) {
        if (text.dom().length === 0) {
            DOMUtils.remove(text);
            return Option.none();
        }
        return Option.some(text);
    }

    static __rngSetContent(rng, fragment) {
        let firstChild = Option.from(fragment.firstChild).map(Tools.fromDom),
            lastChild = Option.from(fragment.lastChild).map(Tools.fromDom);

        rng.deleteContents();
        rng.insertNode(fragment);

        let prevText = firstChild.bind(DOMUtils.prevSibling).filter(NodeType.isText).bind(this.__removeEmpty),
            nextText = lastChild.bind(DOMUtils.nextSibling).filter(NodeType.isText).bind(this.__removeEmpty);

        // Join start
        Option.liftN([prevText, firstChild.filter(NodeType.isText)], (prev, start) => {
            this.__prependData(start.dom(), prev.dom().data);
            DOMUtils.remove(prev);
        })

        // Join end
        Option.liftN([nextText, lastChild.filter(NodeType.isText)], (next, end) => {
            let oldLength = end.dom().length;
            end.dom().appendData(next.dom().data);
            rng.setEnd(end.dom(), oldLength);
            DOMUtils.remove(next);
        });
        rng.collapse(false);
    }

    static __setupArgs(args, content) {
        args = args || { format: "html" };
        args.set = true;
        args.selection = true;
        args.content = content;
        return args;
    };
}
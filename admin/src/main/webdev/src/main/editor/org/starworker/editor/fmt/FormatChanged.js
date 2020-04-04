import FormatUtils from "./FormatUtils";
import MatchFormat from "./MatchFormat";
import Tools from "../util/Tools";
import ArrUtils from "../util/ArrUtils";

export default class FormatChanged {
    static formatChanged(editor, formatChangeState, formats, callback, similar) {
        if (formatChangeState.get() === null) {
            this.__setup(formatChangeState, editor);
        }
        this.__addListeners(formatChangeState, formats, callback, similar);
    }

    static __addListeners(formatChangeData, formats, callback, similar) {
        let formatChangeItems = formatChangeData.get();
        ArrUtils.each(formats.split(','), (format) => {
            if (!formatChangeItems[format]) {
                formatChangeItems[format] = [];
                formatChangeItems[format].similar = similar;
            }
            formatChangeItems[format].push(callback);
        });
        formatChangeData.set(formatChangeItems);
    }

    static  __setup(formatChangeData, editor) {
        let currentFormats = {};

        formatChangeData.set({});
        editor.on("NodeChange", (e) => {
            let parents = FormatUtils.getParents(editor.dom, e.element), matchedFormats = {};

            // Ignore bogus nodes like the <a> tag created by moveStart()
            parents = Tools.grep(parents, (node) => {
                return node.nodeType === 1 && !node.getAttribute("data-editor-bogus");
            });

            // Check for new formats
            ArrUtils.each(formatChangeData.get(), (callbacks, format) => {
                ArrUtils.each(parents, (node) => {
                    if (editor.formatter.matchNode(node, format, {}, callbacks.similar)) {
                        if (!currentFormats[format]) {
                            ArrUtils.each(callbacks, (callback) => {
                                callback(true, { node: node, format: format, parents: parents });
                            });
                            currentFormats[format] = callbacks;
                        }
                        matchedFormats[format] = callbacks;
                        return false;
                    }

                    if (MatchFormat.matchesUnInheritedFormatSelector(editor, node, format)) {
                        return false;
                    }
                });
            });

            // Check if current formats still match
            ArrUtils.each(currentFormats, (callbacks, format) => {
                if (!matchedFormats[format]) {
                    delete currentFormats[format];
                    ArrUtils.each(callbacks, (callback) => {
                        callback(false, { node: e.element, format: format, parents: parents });
                    });
                }
            });
        });
    }
}
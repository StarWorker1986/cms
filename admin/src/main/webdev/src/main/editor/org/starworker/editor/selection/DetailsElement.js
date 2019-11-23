import Tools from "../util/Tools";

export default class DetailsElement {
    setup(editor) {
        this.__preventSummaryToggle(editor);
        this.__filterDetails(editor);
    }

    __preventSummaryToggle (editor) {
        editor.on("click", e => {
            if (editor.dom.getParent(e.target, "details")) {
                e.preventDefault();
            }
        });
    }

    __filterDetails(editor) {
        editor.parser.addNodeFilter("details", elms => {
            Tools.each(elms, details => {
                details.attr("data-editor-open", details.attr("open"));
                details.attr("open", "open");
            });
        });
    
        editor.serializer.addNodeFilter("details", elms => {
            Tools.each(elms, details => {
                let open = details.attr("data-editor-open");
                details.attr("open", Tools.isString(open) ? open : null);
                details.attr("data-editor-open", null);
            });
        });
    };
}
import Tools from "../util/Tools";
import ElementType from "../dom/ElementType";
import DOMUtils from "../dom/DOMUtils";
import Settings from "../Settings";
import NodeType from "../dom/NodeType";

export default class IndentOutdent {
    static canOutdent(editor) {
        let blocks = this.__getBlocksToIndent(editor);
        return editor.readonly !== true && (blocks.length > 1 || this.__validateBlocks(editor, blocks));
    }

    static handle(editor, command) {
        let self = this, dom = editor.dom, selection = editor.selection, formatter = editor.formatter,
            indentation = Settings.getIndentation(editor),
            indentUnit = /[a-z%]+$/i.exec(indentation)[0],
            indentValue = parseInt(indentation, 10),
            useMargin = Settings.shouldIndentUseMargin(editor),
            forcedRootBlock = Settings.getForcedRootBlock(editor);

        if (!editor.queryCommandState("InsertUnorderedList") && !editor.queryCommandState("InsertOrderedList")) {
            if (forcedRootBlock === '' && !dom.getParent(selection.getNode(), dom.isBlock)) {
                formatter.apply("div");
            }
        }

        Tools.each(this.__getBlocksToIndent(editor), (block) => {
            self.__indentElement(dom, command, useMargin, indentValue, indentUnit, block.dom());
        });
    }

    static __getBlocksToIndent(editor) {
        let self = this;
        return Tools.filter(Tools.map(editor.selection.getSelectedBlocks(), DOMUtils.fromDom), (el) => {
            return !self.__isListComponent(el) && !self.__parentIsListComponent(el) && self.__isEditable(el);
        });
    }

    static __getIndentStyleName(useMargin, element) {
        let indentStyleName = useMargin || ElementType.isTable(element) ? "margin" : "padding",
            suffix = DOMUtils.getCss(element, "direction") === "rtl" ? "-right" : "-left";
        return indentStyleName + suffix;
    }

    static __indentElement(dom, command, useMargin, value, unit, element) {
        let indentStyleName = this.__getIndentStyleName(useMargin, DOMUtils.fromDom(element));
        if (command === "outdent") {
            let styleValue = Math.max(0, this.__parseIndentValue(element.style[indentStyleName]) - value);
            dom.setStyle(element, indentStyleName, styleValue ? styleValue + unit : '');
        }
        else {
            let styleValue = this.__parseIndentValue(element.style[indentStyleName]) + value + unit;
            dom.setStyle(element, indentStyleName, styleValue);
        }
    }

    static __isEditable(target) {
        return DOMUtils.closest(target, (elm) => {
            return NodeType.isContentEditableTrue(elm.dom()) || NodeType.isContentEditableFalse(elm.dom());
        }).exists((elm) => NodeType.isContentEditableTrue(elm.dom()));
    }

    static __isListComponent(el) {
        return ElementType.isList(el) || ElementType.isListItem(el);
    }

    static __parentIsListComponent(el) {
        return DOMUtils.parent(el).map(this.__isListComponent).getOr(false);
    }

    static __parseIndentValue(value) {
        let number = parseInt(value, 10);
        return isNaN(number) ? 0 : number;
    }

    static __validateBlocks(editor, blocks) {
        let self = this;
        return Tools.forall(blocks, (block) => {
            let indentStyleName = self.__getIndentStyleName(Settings.shouldIndentUseMargin(editor), block),
                intentValue = DOMUtils.getRawCss(block, indentStyleName).map(self.__parseIndentValue).getOr(0),
                contentEditable = editor.dom.getContentEditable(block.dom());
            return contentEditable !== "false" && intentValue > 0;
        });
    }
}
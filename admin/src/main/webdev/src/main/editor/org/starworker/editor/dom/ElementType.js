import Tools from "../util/Tools";
import NodeType from "NodeType";
import { blocks, voids, tableCells, tableSections, textBlocks, headings, listItems, lists, wsElements } from "../constants/Elements";

export default class ElementType {
    static get isBlock() {
        return Tools.lazyLookup(blocks);
    }

    static get isTable() {
        return NodeType.isTable(node);
    }

    static get isInline() {
        return NodeType.isElement(node) && !this.isBlock(node);
    }

    static get isHeading() {
        return Tools.lazyLookup(headings);
    }

    static get isTextBlock() {
        return Tools.lazyLookup(textBlocks);
    }

    static get isList() {
        return Tools.lazyLookup(lists);
    }

    static get isListItem() {
        return Tools.lazyLookup(listItems);
    }

    static get isVoid() {
        return Tools.lazyLookup(voids);
    }

    static get isTableSection() {
        return Tools.lazyLookup(tableSections);
    }

    static get isTableCell() {
        return Tools.lazyLookup(tableCells);
    }

    static get isBr() {
        return NodeType.isElement(node) && NodeType.isBr(node);
    }

    static get isWsPreserveElement() {
        return Tools.lazyLookup(wsElements);
    }
}
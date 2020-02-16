import NodeType from "../dom/NodeType";

export default class FormatContainer {
    static isCaretNode(node) {
        return NodeType.isElement(node) && node.id === "_editor_caret";
    }

    static getParentCaretContainer(body, node) {
        while (node && node !== body) {
            if (node.id === "_editor_caret") {
                return node;
            }
            node = node.parentNode;
        }
        return null;
    }
}
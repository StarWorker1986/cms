import DomObject from "editor/dom/DomObject";
import NodeType from "editor/dom/NodeType";

export default class Node extends DomObject {
    constructor(nativeNode) {
        super(nativeNode);
        if (nativeNode) {
            switch(nativeNode.nodeType) {
                case NodeType.DOCUMENT:
                    return new Document(nativeNode);
                case NodeType.ELEMENT:
                    return new Element(nativeNode);
                case NodeType.TEXT:
                    return new Text(nativeNode);
                case NodeType.COMMENT:
                    return new Comment(nativeNode);
                case NodeType.FRAGMENT:
                    return new Fragment(nativeNode);
                default:
                    return new DomObject(nativeNode);
            }
        }
    }
}
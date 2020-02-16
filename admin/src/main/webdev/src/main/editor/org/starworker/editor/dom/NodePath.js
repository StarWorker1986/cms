import DOMUtils from "../dom/DOMUtils";

export default class NodePath {
    static create(rootNode, targetNode, normalized) {
        let path = [];
        for (; targetNode && targetNode !== rootNode; targetNode = targetNode.parentNode) {
            path.push(DOMUtils.nodeIndex(targetNode, normalized));
        }
        return path;
    }

    static resolve(rootNode, path) {
        let i, node, children;
        for (node = rootNode, i = path.length - 1; i >= 0; i--) {
            children = node.childNodes;
            if (path[i] > children.length - 1) {
                return null;
            }
            node = children[path[i]];
        }
        return node;
    }
}
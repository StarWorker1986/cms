class TreeWalker {
    constructor(startNode, rootNode) {
        this._node = this.startNode = startNode;
        this.rootNode = rootNode;
    }

    current() {
        return this._node;
    }

    next(shallow) {
        this._node = this.__findSiblingNode("firstChild", "nextSibling", shallow);
        return this._node;
    }

    prev(shallow) {
        this._node = this.__findSiblingNode("lastChild", "previousSibling", shallow);
        return this._node;
    }

    prev2(shallow) {
        this._node = this.__findPreviousNode("lastChild", "previousSibling", shallow);
        return this._node;
    }

    __findSiblingNode(startName, siblingName, shallow) {
        let me = this, node = me._node, rootNode = me.rootNode, sibling, parent;
        if (node) {
            if (!shallow && node[startName]) {
                return node[startName];
            }
            if (node !== rootNode) {
                sibling = node[siblingName];
                if (sibling) {
                    return sibling;
                }
                for (parent = node.parentNode; parent && parent !== rootNode; parent = parent.parentNode) {
                    sibling = parent[siblingName];
                    if (sibling) {
                        return sibling;
                    }
                }
            }
        }
    }

    __findPreviousNode(startName, siblingName, shallow) {
        let me = this, node = me._node, rootNode = me.rootNode, sibling, parent, child;
        if (node) {
            sibling = node[siblingName];
            if (rootNode && sibling === rootNode) {
                return;
            }
            if (sibling) {
                if (!shallow) {
                    for (child = sibling[startName]; child; child = child[startName]) {
                        if (!child[startName]) {
                            return child;
                        }
                    }
                }
                return sibling;
            }
            parent = node.parentNode;
            if (parent && parent !== rootNode) {
                return parent;
            }
        }
    }
}
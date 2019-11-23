import Tools from "../util/Tools";

export default class RangeWalk {
    static walk(dom, rng, callback) {
        let startContainer = rng.startContainer, startOffset = rng.startOffset,
            endContainer = rng.endContainer, endOffset = rng.endOffset,
            ancestor, startPoint, endPoint, node, siblings, nodes;

        // Handle table cell selection the table plugin enables
        // you to fake select table cells and perform formatting actions on them
        nodes = dom.select("td[data-editor-selected],th[data-editor-selected]");
        if (nodes.length > 0) {
            Tools.each(nodes, (node) => {
                callback([node]);
            });
            return;
        }

        // If index based start position then resolve it
        if (startContainer.nodeType === 1 && startContainer.hasChildNodes()) {
            startContainer = startContainer.childNodes[startOffset];
        }

        // If index based end position then resolve it
        if (endContainer.nodeType === 1 && endContainer.hasChildNodes()) {
            endContainer = this.__getEndChild(endContainer, endOffset);
        }

        // Same container
        if (startContainer === endContainer) {
            return callback(this.__exclude([startContainer]));
        }

        // Find common ancestor and end points
        ancestor = dom.findCommonAncestor(startContainer, endContainer);

        // Process left side
        for (node = startContainer; node; node = node.parentNode) {
            if (node === endContainer) {
                return this.__walkBoundary(startContainer, ancestor, true);
            }
            if (node === ancestor) {
                break;
            }
        }

        // Process right side
        for (node = endContainer; node; node = node.parentNode) {
            if (node === startContainer) {
                return this.__walkBoundary(endContainer, ancestor);
            }
            if (node === ancestor) {
                break;
            }
        }

        // Find start/end point
        startPoint = this.__findEndPoint(startContainer, ancestor) || startContainer;
        endPoint = this.__findEndPoint(endContainer, ancestor) || endContainer;

        // Walk left leaf
        this.__walkBoundary(startContainer, startPoint, true);
        // Walk the middle from start to end point
        siblings = this.__collectSiblings(startPoint === startContainer ? startPoint : startPoint.nextSibling,
                                          "nextSibling",
                                          endPoint === endContainer ? endPoint.nextSibling : endPoint);
        if (siblings.length) {
            callback(this.__exclude(siblings));
        }

        // Walk right leaf
        this.__walkBoundary(endContainer, endPoint);
    }

    static __exclude(nodes) {
        let node = nodes[0];
        if (node.nodeType === 3 && node === startContainer && startOffset >= node.nodeValue.length) {
            nodes.splice(0, 1);
        }

        node = nodes[nodes.length - 1];
        if (endOffset === 0 && nodes.length > 0 && node === endContainer && node.nodeType === 3) {
            nodes.splice(nodes.length - 1, 1);
        }

        return nodes;
    }

    static __collectSiblings(node, name, endNode) {
        let siblings = [];
        for (; node && node !== endNode; node = node[name]) {
            siblings.push(node);
        }
        return siblings;
    }

    static __findEndPoint(node, root) {
        do {
            if (node.parentNode === root) {
                return node;
            }
            node = node.parentNode;
        } while (node);
    }

    static __getEndChild(container, index) {
        let childNodes = container.childNodes;

        index--;
        if (index > childNodes.length - 1) {
            index = childNodes.length - 1;
        }
        else if (index < 0) {
            index = 0;
        }

        return childNodes[index] || container;
    }

    static __walkBoundary(startNode, endNode, next, callback) {
        let siblingName = next ? "nextSibling" : "previousSibling";

        for (let node = startNode, parent = node.parentNode; node && node !== endNode; node = parent) {
            parent = node.parentNode;
            siblings = this.__collectSiblings(node === startNode ? node : node[siblingName], siblingName);
            if (siblings.length) {
                if (!next) {
                    siblings.reverse();
                }
                callback(this.__exclude(siblings));
            }
        }
    };
}
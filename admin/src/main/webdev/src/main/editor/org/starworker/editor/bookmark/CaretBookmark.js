import NodeType from "../dom/NodeType";
import ArrUtils from "../util/ArrUtils";
import DOMUtils from "../util/DomUtils";
import CaretPosition from "../caret/CaretPosition";

export default class CaretBookmark {
    static create(root, caretPosition) {
        let container, offset, path = [], outputOffset, childNodes, parents;

        container = caretPosition.container;
        offset = caretPosition.offset;
        if (NodeType.isText(container)) {
            outputOffset = this.__normalizedTextOffset(container, offset);
        }
        else {
            childNodes = container.childNodes;
            if (offset >= childNodes.length) {
                outputOffset = "after";
                offset = childNodes.length - 1;
            }
            else {
                outputOffset = "before";
            }
            container = childNodes[offset];
        }

        path.push(this.__createPathItem(container));
        parents = this.__parentsUntil(root, container);
        parents = ArrUtils.filter(parents, n => !NodeType.isBogus(n));
        path = path.concat(ArrUtils.map(parents, node => {
            return this.__createPathItem(node);
        }));

        return path.reverse().join('/') + ',' + outputOffset;
    }

    static resolve(root, path) {
        let parts, container, offset;
        if (!path) {
            return null;
        }

        parts = path.split(',');
        path = parts[0].split('/');
        offset = parts.length > 1 ? parts[1] : "before";
        container = ArrUtils.reduce(path, (result, value) => {
            value = /([\w\-\(\)]+)\[([0-9]+)\]/.exec(value);
            if (!value) {
                return null;
            }
            if (value[1] === "text()") {
                value[1] = "#text";
            }
            return this.__resolvePathItem(result, value[1], parseInt(value[2]));
        }, root);

        if (!container) {
            return null;
        }

        if (!NodeType.isText(container)) {
            if (offset === "after") {
                offset = DOMUtils.DOM.nodeIndex(container) + 1;
            }
            else {
                offset = DOMUtils.DOM.nodeIndex(container);
            }
            return new CaretPosition(container.parentNode, offset);
        }

        return this.__findTextPosition(container, parseInt(offset));
    }

    static __normalizedParent(node) {
        let parentNode = node.parentNode;
        if (NodeType.isBogus(parentNode)) {
            return this.__normalizedParent(parentNode);
        }
        return parentNode;
    }

    static __getChildNodes(node) {
        if (!node) {
            return [];
        }

        return ArrUtils.reduce(node.childNodes, (result, node) => {
            if (NodeType.isBogus(node) && node.nodeName !== "BR") {
                result = result.concat(this.__getChildNodes(node));
            }
            else {
                result.push(node);
            }
            return result;
        }, []);
    }

    static __normalizedTextOffset(node, offset) {
        while (node = node.previousSibling) {
            if (!NodeType.isText(node)) {
                break;
            }
            offset += node.data.length;
        }
        return offset;
    }

    static __normalizedNodeIndex(node) {
        let nodes, index, numTextFragments, equals = a => (b => a === b);

        nodes = this.__getChildNodes(this.__normalizedParent(node));
        index = ArrUtils.findIndex(nodes, equals(node), node);
        nodes = nodes.slice(0, index + 1);
        numTextFragments = ArrUtils.reduce(nodes, (result, node, i) => {
            if (NodeType.isText(node) && NodeType.isText(nodes[i - 1])) {
                result++;
            }
            return result;
        }, 0);
        nodes = ArrUtils.filter(nodes, NodeType.matchNodeNames(node.nodeName));
        index = ArrUtils.findIndex(nodes, equals(node), node);

        return index - numTextFragments;
    }

    static __createPathItem(node) {
        let name;
        if (NodeType.isText(node)) {
            name = "text()";
        }
        else {
            name = node.nodeName.toLowerCase();
        }
        return name + "[" + this.__normalizedNodeIndex(node) + "]";
    }

    static __parentsUntil(root, node, predicate) {
        let parents = [];
        for (node = node.parentNode; node !== root; node = node.parentNode) {
            if (predicate && predicate(node)) {
                break;
            }
            parents.push(node);
        }
        return parents;
    }

    static __resolvePathItem(node, name, index) {
        let nodes = this.__getChildNodes(node);
        nodes = ArrUtils.filter(nodes, (node, index) => {
            return !NodeType.isText(node) || !NodeType.isText(nodes[index - 1]);
        });
        nodes = ArrUtils.filter(nodes, NodeType.matchNodeNames(name));
        return nodes[index];
    }

    static __findTextPosition(container, offset) {
        let node = container, targetOffset = 0, dataLen;
       
        while (NodeType.isText(node)) {
            dataLen = node.data.length;
            if (offset >= targetOffset && offset <= targetOffset + dataLen) {
                container = node;
                offset = offset - targetOffset;
                break;
            }

            if (!NodeType.isText(node.nextSibling)) {
                container = node;
                offset = dataLen;
                break;
            }

            targetOffset += dataLen;
            node = node.nextSibling;
        }

        if (NodeType.isText(container) && offset > container.data.length) {
            offset = container.data.length;
        }

        return new CaretPosition(container, offset);
    }
}
class NodeType {
    static matchNodeNames(names) {
        let items = names.toLowerCase().split(' ');

        return (node) => {
            if (node && node.nodeType) {
                let name = node.nodeName.toLowerCase();
                for (let i = 0; i < items.length; i++) {
                    if (name === items[i]) {
                        return true;
                    }
                }
            }
            return false;
        };
    }

    static isElement(node) {
        return this.__isNodeType(node, 1);
    }

    static isText(node) {
        return this.__isNodeType(node, 3);
    }

    static isComment(node) {
        return this.__isNodeType(node, 8);
    }

    static isDocument(node) {
        return this.__isNodeType(node, 9);
    }

    static isDocumentFragment(node) {
        return this.__isNodeType(node, 11);
    }

    static get isBr() {
        return this.matchNodeNames("Br");
    }

    static get isContentEditableTrue() {
        return this.__hasContentEditableState("true");
    }

    static get isContentEditableFalse() {
        return this.__hasContentEditableState("false");
    }

    static hasPropValue(propName, propValue) {
        return (node) => {
            return this.isElement(node) && node[propName] === propValue;
        };
    }

    static hasAttribute(attrName) {
        return (node) => {
            return this.isElement(node) && node.hasAttribute(attrName);
        };
    }

    static hasAttributeValue(attrName, attrValue) {
        return (node) => {
            return this.isElement(node) && node.getAttribute(attrName) === attrValue;
        };
    }

    static matchStyleValues(name, values) {
        let items = values.toLowerCase().split(' ');

        return (node) => {
            if (this.isElement(node)) {
                for (let i = 0; i < items.length; i++) {
                    let computed = node.ownerDocument.defaultView.getComputedStyle(node, null),
                        cssValue = computed ? computed.getPropertyValue(name) : null;
                    if (cssValue === items[i]) {
                        return true;
                    }
                }
            }

            return false;
        };
    }

    static isBogus(node) {
        return this.isElement(node) && node.hasAttribute("data-editor-bogus");
    }

    static isBogusAll(node) {
        return this.isElement(node) && node.getAttribute("data-editor-bogus") === "all";
    }

    static isTable(node) {
        return this.isElement(node) && node.tagName === "TABLE";
    }

    static __isNodeType(node, type) {
        return !!node && node.nodeType === type;
    }

    static __hasContentEditableState(value) {
        let self = this;
        return (node) => {
            if (self.isElement(node)) {
                if (node.contentEditable === value) {
                    return true;
                }
                if (node.getAttribute("data-editor-contenteditable") === value) {
                    return true;
                }
            }
            return false;
        };
    }
}
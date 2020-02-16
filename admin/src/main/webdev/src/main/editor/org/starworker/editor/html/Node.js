export default class Node {
    constructor(name, type) {
        this.name = name;
        this.type = type;
        if (type === 1) {
            this.attributes = [];
            this.attributes.map = {}; // Should be considered internal
        }
    }

    replace(node) {
        let self = this;
        if (node.parent) {
            node.remove();
        }
        self.insert(node, self);
        self.remove();
        return self;
    }

    attr(name, value) {
        let self = this, attrs, i;

        if (typeof name !== "string") {
            for (i in name) {
                self.attr(i, name[i]);
            }
            return self;
        }

        if ((attrs = self.attributes)) {
            if (value !== undefined) {
                // Remove attribute
                if (value === null) {
                    if (name in attrs.map) {
                        delete attrs.map[name];
                        i = attrs.length;
                        while (i--) {
                            if (attrs[i].name === name) {
                                attrs = attrs.splice(i, 1);
                                return self;
                            }
                        }
                    }
                    return self;
                }

                // Set attribute
                if (name in attrs.map) {
                    // Set attribute
                    i = attrs.length;
                    while (i--) {
                        if (attrs[i].name === name) {
                            attrs[i].value = value;
                            break;
                        }
                    }
                }
                else {
                    attrs.push({ name: name, value: value });
                }
                attrs.map[name] = value;

                return self;
            }

            return attrs.map[name];
        }
    }
   
    clone() {
        let self = this, clone = new Node(self.name, self.type), i, l, selfAttrs, selfAttr, cloneAttrs;

        // Clone element attributes
        if ((selfAttrs = self.attributes)) {
            cloneAttrs = [];
            cloneAttrs.map = {};
            for (i = 0, l = selfAttrs.length; i < l; i++) {
                selfAttr = selfAttrs[i];
                // Clone everything except id
                if (selfAttr.name !== "id") {
                    cloneAttrs[cloneAttrs.length] = { name: selfAttr.name, value: selfAttr.value };
                    cloneAttrs.map[selfAttr.name] = selfAttr.value;
                }
            }
            clone.attributes = cloneAttrs;
        }
        clone.value = self.value;
        clone.shortEnded = self.shortEnded;

        return clone;
    }
    
    wrap(wrapper) {
        let self = this;
        self.parent.insert(wrapper, self);
        wrapper.append(self);
        return self;
    }
    
    unwrap() {
        let self = this, node, next;

        for (node = self.firstChild; node;) {
            next = node.next;
            self.insert(node, self, true);
            node = next;
        }
        self.remove();
    }
   
    remove() {
        let self = this, parent = self.parent, next = self.next, prev = self.prev;

        if (parent) {
            if (parent.firstChild === self) {
                parent.firstChild = next;
                if (next) {
                    next.prev = null;
                }
            }
            else {
                prev.next = next;
            }
            if (parent.lastChild === self) {
                parent.lastChild = prev;
                if (prev) {
                    prev.next = null;
                }
            }
            else {
                next.prev = prev;
            }
            self.parent = self.next = self.prev = null;
        }

        return self;
    }
   
    append(node) {
        let self = this, last;

        if (node.parent) {
            node.remove();
        }
        last = self.lastChild;
        if (last) {
            last.next = node;
            node.prev = last;
            self.lastChild = node;
        }
        else {
            self.lastChild = self.firstChild = node;
        }
        node.parent = self;

        return node;
    }
   
    insert(node, refNode, before) {
        let parent;
        
        if (node.parent) {
            node.remove();
        }

        parent = refNode.parent || this;
        
        if (before) {
            if (refNode === parent.firstChild) {
                parent.firstChild = node;
            }
            else {
                refNode.prev.next = node;
            }
            node.prev = refNode.prev;
            node.next = refNode;
            refNode.prev = node;
        }
        else {
            if (refNode === parent.lastChild) {
                parent.lastChild = node;
            }
            else {
                refNode.next.prev = node;
            }
            node.next = refNode.next;
            node.prev = refNode;
            refNode.next = node;
        }
        node.parent = parent;

        return node;
    }
   
    getAll(name) {
        let self = this, node, collection = [];
        for (node = self.firstChild; node; node = this.__walk(node, self)) {
            if (node.name === name) {
                collection.push(node);
            }
        }
        return collection;
    }
    
    empty() {
        let self = this, nodes, i, node;

        // Remove all children
        if (self.firstChild) {
            nodes = [];
            // Collect the children
            for (node = self.firstChild; node; node = this.__walk(node, self)) {
                nodes.push(node);
            }
            // Remove the children
            i = nodes.length;
            while (i--) {
                node = nodes[i];
                node.parent = node.firstChild = node.lastChild = node.next = node.prev = null;
            }
        }
        self.firstChild = self.lastChild = null;

        return self;
    }
    
    isEmpty(elements, whitespace, predicate) {
        let whiteSpaceRegExp = /^[ \t\r\n]*$/, self = this, node = self.firstChild, i, name;

        whitespace = whitespace || {};
        if (node) {
            do {
                if (node.type === 1) {
                    // Ignore bogus elements
                    if (node.attributes.map["data-editor-bogus"]) {
                        continue;
                    }
                    // Keep empty elements like <img />
                    if (elements[node.name]) {
                        return false;
                    }
                    // Keep bookmark nodes and name attribute like <a name="1"></a>
                    i = node.attributes.length;
                    while (i--) {
                        name = node.attributes[i].name;
                        if (name === "name" || name.indexOf("data-editor-bookmark") === 0) {
                            return false;
                        }
                    }
                }

                // Keep comments
                if (node.type === 8) {
                    return false;
                }

                // Keep non whitespace text nodes
                if (node.type === 3 && !whiteSpaceRegExp.test(node.value)) {
                    return false;
                }

                // Keep whitespace preserve elements
                if (node.type === 3 && node.parent && whitespace[node.parent.name] && whiteSpaceRegExp.test(node.value)) {
                    return false;
                }
                
                // Predicate tells that the node is contents
                if (predicate && predicate(node)) {
                    return false;
                }
            } while ((node = __walk(node, self)));
        }
        return true;
    }

    static create(name, attrs) {
        let typeLookup = {
            "#text": 3,
            "#comment": 8,
            "#cdata": 4,
            "#pi": 7,
            "#doctype": 10,
            "#document-fragment": 11
        }, node, attrName;

        // Create node
        node = new Node(name, typeLookup[name] || 1);
        // Add attributes if needed
        if (attrs) {
            for (attrName in attrs) {
                node.attr(attrName, attrs[attrName]);
            }
        }

        return node;
    }

    __walk(node, root, prev) {
        let sibling, parent, startName = prev ? "lastChild" : "firstChild", siblingName = prev ? "prev" : "next";

        // Walk into nodes if it has a start
        if (node[startName]) {
            return node[startName];
        }
        // Return the sibling if it has one
        if (node !== root) {
            sibling = node[siblingName];
            if (sibling) {
                return sibling;
            }
            // Walk up the parents to look for siblings
            for (parent = node.parent; parent && parent !== root; parent = parent.parent) {
                sibling = parent[siblingName];
                if (sibling) {
                    return sibling;
                }
            }
        }
    }
}
import TreeWalker from '../api/dom/TreeWalker';

export default class FormatUtils {
    static isInlineBlock(node) {
        return node && /^(IMG)$/.test(node.nodeName);
    }

    static moveStart(dom, selection, rng) {
        let offset = rng.startOffset, container = rng.startContainer, walker, node, nodes;

        if (rng.startContainer === rng.endContainer) {
            if (this.isInlineBlock(rng.startContainer.childNodes[rng.startOffset])) {
                return;
            }
        }

        // Move startContainer/startOffset in to a suitable node
        if (container.nodeType === 1) {
            nodes = container.childNodes;
            if (offset < nodes.length) {
                container = nodes[offset];
                walker = new TreeWalker(container, dom.getParent(container, dom.isBlock));
            }
            else {
                container = nodes[nodes.length - 1];
                walker = new TreeWalker(container, dom.getParent(container, dom.isBlock));
                walker.next(true);
            }

            for (node = walker.current(); node; node = walker.next()) {
                if (node.nodeType === 3 && !this.isWhiteSpaceNode(node)) {
                    rng.setStart(node, 0);
                    selection.setRng(rng);
                    return;
                }
            }
        }
    }
    
    static getNonWhiteSpaceSibling(node, next, inc) {
        if (node) {
            next = next ? "nextSibling" : "previousSibling";
            for (node = inc ? node : node[next]; node; node = node[next]) {
                if (node.nodeType === 1 || !this.isWhiteSpaceNode(node)) {
                    return node;
                }
            }
        }
    }

    static isTextBlock(editor, name) {
        if (name.nodeType) {
            name = name.nodeName;
        }
        return !!editor.schema.getTextBlockElements()[name.toLowerCase()];
    }

    static isValid(ed, parent, child) {
        return ed.schema.isValidChild(parent, child);
    }

    static isWhiteSpaceNode(node) {
        return node && node.nodeType === 3 && /^([\t \r\n]+|)$/.test(node.nodeValue);
    }
    
    static replaceVars(value, vars) {
        if (typeof value !== "string") {
            value = value(vars);
        }
        else if (vars) {
            value = value.replace(/%(\w+)/g, (str, name) => vars[name] || str);
        }
        return value;
    }

    static isEq(str1, str2) {
        str1 = str1 || '';
        str2 = str2 || '';
        str1 = '' + (str1.nodeName || str1);
        str2 = '' + (str2.nodeName || str2);
        return str1.toLowerCase() === str2.toLowerCase();
    }

    static normalizeStyleValue(dom, value, name) {
        // Force the format to hex
        if (name === "color" || name === "backgroundColor") {
            value = dom.toHex(value);
        }
        // Opera will return bold as 700
        if (name === "fontWeight" && value === 700) {
            value = "bold";
        }
 
        if (name === "fontFamily") {
            value = value.replace(/[\'\"]/g, '').replace(/,\s+/g, ',');
        }
        return '' + value;
    }

    static getStyle(dom, node, name) {
        return this.normalizeStyleValue(dom, $(node).css(name), name);
    }

    static getTextDecoration(dom, node) {
        let decoration;
        dom.getParent(node, (n) => {
            decoration = $(n).css("text-decoration");
            return decoration && decoration !== "none";
        });
        return decoration;
    }

    static getParents(dom, node, selector) {
        return dom.getParents(node, selector, dom.getRoot());
    }
}
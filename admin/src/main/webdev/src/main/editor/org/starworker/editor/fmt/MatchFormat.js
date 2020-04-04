import FormatUtils from "./FormatUtils";

export default class MatchFomrat {
    static matchNode(editor, node, name, vars, similar) {
        let formatList = editor.formatter.get(name), format, i, j, classes, dom = editor.dom;

        if (formatList && node) {
            // Check each format in list
            for (i = 0; i < formatList.length; i++) {
                format = formatList[i];

                // Name name, attributes, styles and classes
                if (this.matchName(dom, node, format)
                    && this.__matchItems(dom, node, format, "attributes", similar, vars)
                    && this.__matchItems(dom, node, format, "styles", similar, vars)) {
                    
                    // Match classes
                    if ((classes = format.classes)) {
                        for (j = 0; j < classes.length; j++) {
                            if (!dom.hasClass(node, classes[j])) {
                                return;
                            }
                        }
                    }

                    return format;
                }
            }
        }
    }

    static matchName(dom, node, format) {
        // Check for inline match
        if (FormatUtils.isEq(node, format.inline)) {
            return true;
        }

        // Check for block match
        if (FormatUtils.isEq(node, format.block)) {
            return true;
        }

        // Check for selector match
        if (format.selector) {
            return node.nodeType === 1 && dom.is(node, format.selector);
        }
    }

    static match(editor, name, vars, node) {
        let startNode;

        // Check specified node
        if (node) {
            return this.__matchParents(editor, node, name, vars);
        }

        // Check selected node
        node = editor.selection.getNode();
        if (this.__matchParents(editor, node, name, vars)) {
            return true;
        }

        // Check start node if it's different
        startNode = editor.selection.getStart();
        if (startNode !== node) {
            if (this.__matchParents(editor, startNode, name, vars)) {
                return true;
            }
        }

        return false;
    }

    static matchAll(editor, names, vars) {
        let startElement, matchedFormatNames = [], checkedMap = {};

        // Check start of selection for formats
        startElement = editor.selection.getStart();
        editor.dom.getParent(startElement, (node) => {
            let i, name;
            for (i = 0; i < names.length; i++) {
                name = names[i];
                if (!checkedMap[name] && this.matchNode(editor, node, name, vars)) {
                    checkedMap[name] = true;
                    matchedFormatNames.push(name);
                }
            }
        }, editor.dom.getRoot());

        return matchedFormatNames;
    }

    static canApply(editor, name) {
        let formatList = editor.formatter.get(name), startNode, parents, i, j, selector, dom = editor.dom;

        if (formatList) {
            startNode = editor.selection.getStart();
            parents = FormatUtils.getParents(dom, startNode);

            for (i = formatList.length - 1; i >= 0; i--) {
                selector = formatList[i].selector;
                // Format is not selector based then always return TRUE
                // Is it has a defaultBlock then it's likely it can be applied for example align on a non block element line
                if (!selector || formatList[i].defaultBlock) {
                    return true;
                }
                for (j = parents.length - 1; j >= 0; j--) {
                    if (dom.is(parents[j], selector)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    static matchesUnInheritedFormatSelector(editor, node, name) {
        let formatList = editor.formatter.get(name);
        if (formatList) {
            for (let i = 0; i < formatList.length; i++) {
                if (formatList[i].inherit === false && editor.dom.is(node, formatList[i].selector)) {
                    return true;
                }
            }
        }
        return false;
    }

    static __matchItems(dom, node, format, itemName, similar, vars) {
        let key, value, items = format[itemName], i;

        // Custom match
        if (format.onmatch) {
            return format.onmatch(node, format, itemName);
        }

        // Check all items
        if (items) {
            // Non indexed object
            if (typeof items.length === "undefined") {
                for (key in items) {
                    if (items.hasOwnProperty(key)) {
                        if (itemName === "attributes") {
                            value = dom.getAttrib(node, key);
                        }
                        else {
                            value = FormatUtils.getStyle(dom, node, key);
                        }

                        if (similar && !value && !format.exact) {
                            return;
                        }

                        if ((!similar || format.exact)
                            && !FormatUtils.isEq(value, FormatUtils.normalizeStyleValue(dom, FormatUtils.replaceVars(items[key], vars), key))) {
                            return;
                        }
                    }
                }
            }
            else {
                // Only one match needed for indexed arrays
                for (i = 0; i < items.length; i++) {
                    if (itemName === "attributes" ? dom.getAttrib(node, items[i]) : FormatUtils.getStyle(dom, node, items[i])) {
                        return format;
                    }
                }
            }
        }

        return format;
    }

    static __matchParents(editor, node, name, vars) {
        let root = editor.dom.getRoot();

        if (node === root) {
            return false;
        }

        // Find first node with similar format settings
        node = editor.dom.getParent(node, (node) => {
            if (this.matchesUnInheritedFormatSelector(editor, node, name)) {
                return true;
            }
            return node.parentNode === root || !!this.matchNode(editor, node, name, vars, true);
        });

        // Do an exact check on the similar format element
        return this.matchNode(editor, node, name, vars);
    }
}
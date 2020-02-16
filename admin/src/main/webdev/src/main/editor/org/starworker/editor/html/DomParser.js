import Tools from "../util/Tools";
import ArrUtils from "../util/ArrUtils";
import LegacyFilter from "./LegacyFilter";
import ParserFilters from "./ParserFilters";
import ParserUtils from "./ParserUtils";
import Node from "./Node";
import SaxParser from "./SaxParser";
import Schema from "./Schema";

export default class DomParser {
    constructor(settings, schema) {
        if (schema === void 0) {
            schema = new Schema();
        }
        this.schema = schema;

        settings = settings || {};
        settings.validate = "validate" in settings ? settings.validate : true;
        settings.rootName = settings.rootName || "body";
        this.settings = settings;

        this._nodeFilters = {};
        this._attributeFilters = [];
        this._matchedNodes = {};
        this._matchedAttributes = {};

        ParserFilters.register(this, settings);
        LegacyFilter.register(this, settings);
    }

    addAttributeFilter(name, callback) {
        let attributeFilters = this._attributeFilters;

        Tools.each(ArrUtils.explode(name), (name) => {
            for (let i = 0; i < attributeFilters.length; i++) {
                if (attributeFilters[i].name === name) {
                    attributeFilters[i].callbacks.push(callback);
                    return;
                }
            }
            attributeFilters.push({ name: name, callbacks: [callback] });
        });
    }

    addNodeFilter(name, callback) {
        let nodeFilters = this._nodeFilters;

        Tools.each(ArrUtils.explode(name), (name) => {
            let list = nodeFilters[name];
            if (!list) {
                nodeFilters[name] = list = [];
            }
            list.push(callback);
        });
    }

    filterNode(node) {
        let i, name, list, nodeFilters = this._nodeFilters,
            matchedAttributes = this.matchedAttributes,
            matchedNodes = this._matchedNodes,
            attributeFilters = this._attributeFilters;

        name = node.name;
        // Run element filters
        if (name in nodeFilters) {
            list = matchedNodes[name];
            if (list) {
                list.push(node);
            }
            else {
                matchedNodes[name] = [node];
            }
        }

        // Run attribute filters
        i = attributeFilters.length;
        while (i--) {
            name = attributeFilters[i].name;
            if (name in node.attributes.map) {
                list = matchedAttributes[name];
                if (list) {
                    list.push(node);
                }
                else {
                    matchedAttributes[name] = [node];
                }
            }
        }

        return node;
    }

    getAttributeFilters() {
        return [].concat(this._attributeFilters);
    }

    getNodeFilters() {
        let out = [], nodeFilters = this._nodeFilters;

        for (let name in nodeFilters) {
            if (nodeFilters.hasOwnProperty(name)) {
                out.push({ name: name, callbacks: nodeFilters[name] });
            }
        }
        return out;
    }

    parse(html, args) {
        let schema, parser, nodes, i, l, fi, fl, list, name, rootNode, node, blockElements,
            invalidChildren = [], isInWhiteSpacePreservedElement,
            nonEmptyElements = schema.getNonEmptyElements(),
            whiteSpaceElements = schema.getWhiteSpaceElements(),
            children = schema.children, validate = settings.validate,
            attributeFilters, matchedAttributes, matchedNodes,
            rootBlockName, createNode, removeWhitespaceBefore,
            forcedRootBlockName = "forcedRootBlock" in args ? args.forcedRootBlock : settings.forcedRootBlock,
            startWhiteSpaceRegExp = /^[ \t\r\n]+/, endWhiteSpaceRegExp = /[ \t\r\n]+$/,
            allWhiteSpaceRegExp = /[ \t\r\n]+/g, isAllWhiteSpaceRegExp = /^[ \t\r\n]+$/;
        
        schema = this.schema;
        args = args || {};
        rootNode = node = new Node(args.context || settings.rootName, 11);
        blockElements = Tools.extend(Tools.makeMap("script,style,head,html,body,title,meta,param"), schema.getBlockElements());
        isInWhiteSpacePreservedElement = whiteSpaceElements.hasOwnProperty(args.context) || whiteSpaceElements.hasOwnProperty(settings.rootName);
        attributeFilters = this._attributeFilters;
        matchedNodes = this._matchedNodes = {};
        matchedAttributes = this._matchedAttributes = {},
        rootBlockName = this.__getRootBlockName(forcedRootBlockName);
        createNode = this.__createNode;
        removeWhitespaceBefore = this.__removeWhitespaceBefore;

        parser = new SaxParser({
            validate: validate,
            allowScriptRrls: settings.allowScriptUrls,
            allowConditionalComments: settings.allowConditionalComments,
            // Exclude P and LI from DOM parsing since it"s treated better by the DOM parser
            selfClosingElements: this.__cloneAndExcludeBlocks(schema.getSelfClosingElements()),
            
            cdata: (text) => node.append(createNode("#cdata", 4)).value = text,
            
            text: (text, raw) => {
                let textNode;
                // Trim all redundant whitespace on non white space elements
                if (!isInWhiteSpacePreservedElement) {
                    text = text.replace(allWhiteSpaceRegExp, ' ');
                    if (ParserUtils.isLineBreakNode(node.lastChild, blockElements)) {
                        text = text.replace(startWhiteSpaceRegExp, '');
                    }
                }

                // Do we need to create the node
                if (text.length !== 0) {
                    textNode = createNode("#text", 3);
                    textNode.raw = !!raw;
                    node.append(textNode).value = text;
                }
            },

            comment: (text) => {
                node.append(createNode("#comment", 8)).value = text;
            },

            pi: (name, text) => {
                node.append(createNode(name, 7)).value = text;
                removeWhitespaceBefore(node);
            },

            doctype: (text) => {
                let newNode = node.append(createNode("#doctype", 10));
                newNode.value = text;
                removeWhitespaceBefore(node);
            },

            start: (name, attrs, empty) => {
                let newNode, i, elementRule, attrName, parent;

                elementRule = validate ? schema.getElementRule(name) : {};
                if (elementRule) {
                    newNode = createNode(elementRule.outputName || name, 1);
                    newNode.attributes = attrs;
                    newNode.shortEnded = empty;
                    node.append(newNode);
                    
                    // Check if node is valid child of the parent node is the child is
                    // unknown we don"t collect it since it"s probably a custom element
                    parent = children[node.name];
                    if (parent && children[newNode.name] && !parent[newNode.name]) {
                        invalidChildren.push(newNode);
                    }

                    i = attributeFilters.length;
                    while (i--) {
                        attrName = attributeFilters[i].name;
                        if (attrName in attrs.map) {
                            list = matchedAttributes[attrName];
                            if (list) {
                                list.push(newNode);
                            }
                            else {
                                matchedAttributes[attrName] = [newNode];
                            }
                        }
                    }
                    
                    // Trim whitespace before block
                    if (blockElements[name]) {
                        removeWhitespaceBefore(newNode);
                    }
                    // Change current node if the element wasn"t empty i.e not <br /> or <img />
                    if (!empty) {
                        node = newNode;
                    }
                    // Check if we are inside a whitespace preserved element
                    if (!isInWhiteSpacePreservedElement && whiteSpaceElements[name]) {
                        isInWhiteSpacePreservedElement = true;
                    }
                }
            },

            end: (name) => {
                let textNode, elementRule, text, sibling, tempNode;

                elementRule = validate ? schema.getElementRule(name) : {};
                if (elementRule) {
                    if (blockElements[name]) {
                        if (!isInWhiteSpacePreservedElement) {
                            // Trim whitespace of the first node in a block
                            textNode = node.firstChild;
                            if (textNode && textNode.type === 3) {
                                text = textNode.value.replace(startWhiteSpaceRegExp, '');
                                // Any characters left after trim or should we remove it
                                if (text.length > 0) {
                                    textNode.value = text;
                                    textNode = textNode.next;
                                }
                                else {
                                    sibling = textNode.next;
                                    textNode.remove();
                                    textNode = sibling;
                                    // Remove any pure whitespace siblings
                                    while (textNode && textNode.type === 3) {
                                        text = textNode.value;
                                        sibling = textNode.next;
                                        if (text.length === 0 || isAllWhiteSpaceRegExp.test(text)) {
                                            textNode.remove();
                                            textNode = sibling;
                                        }
                                        textNode = sibling;
                                    }
                                }
                            }

                            // Trim whitespace of the last node in a block
                            textNode = node.lastChild;
                            if (textNode && textNode.type === 3) {
                                text = textNode.value.replace(endWhiteSpaceRegExp, "");
                                // Any characters left after trim or should we remove it
                                if (text.length > 0) {
                                    textNode.value = text;
                                    textNode = textNode.prev;
                                }
                                else {
                                    sibling = textNode.prev;
                                    textNode.remove();
                                    textNode = sibling;
                                    // Remove any pure whitespace siblings
                                    while (textNode && textNode.type === 3) {
                                        text = textNode.value;
                                        sibling = textNode.prev;
                                        if (text.length === 0 || isAllWhiteSpaceRegExp.test(text)) {
                                            textNode.remove();
                                            textNode = sibling;
                                        }
                                        textNode = sibling;
                                    }
                                }
                            }
                        }
                    }

                    // Check if we exited a whitespace preserved element
                    if (isInWhiteSpacePreservedElement && whiteSpaceElements[name]) {
                        isInWhiteSpacePreservedElement = false;
                    }

                    if (elementRule.removeEmpty && ParserUtils.isEmpty(schema, nonEmptyElements, whiteSpaceElements, node)) {
                        // Leave nodes that have a name like <a name="name">
                        if (!node.attributes.map.name && !node.attr("id")) {
                            tempNode = node.parent;
                            if (blockElements[node.name]) {
                                node.empty().remove();
                            }
                            else {
                                node.unwrap();
                            }
                            node = tempNode;
                            return;
                        }
                    }

                    if (elementRule.paddEmpty && (ParserUtils.isPaddedWithNbsp(node) || ParserUtils.isEmpty(schema, nonEmptyElements, whiteSpaceElements, node))) {
                        ParserUtils.paddEmptyNode(settings, args, blockElements, node);
                    }

                    node = node.parent;
                }
            }
        }, schema);

        parser.parse(html);

        // Fix invalid children or report invalid children in a contextual parsing
        if (validate && invalidChildren.length) {
            if (!args.context) {
                this.__fixInvalidChildren(invalidChildren);
            }
            else {
                args.invalid = true;
            }
        }
        // Wrap nodes in the root into block elements if the root is body
        if (rootBlockName && (rootNode.name === "body" || args.isRootContent)) {
            this.__addRootBlocks(rootNode, blockElements, startWhiteSpaceRegExp);
        }

        // Run filters only when the contents is valid
        if (!args.invalid) {
            // Run node filters
            for (name in matchedNodes) {
                list = nodeFilters[name];
                nodes = matchedNodes[name];
                // Remove already removed children
                fi = nodes.length;

                while (fi--) {
                    if (!nodes[fi].parent) {
                        nodes.splice(fi, 1);
                    }
                }

                for (i = 0, l = list.length; i < l; i++) {
                    list[i](nodes, name, args);
                }
            }

            // Run attribute filters
            for (i = 0, l = attributeFilters.length; i < l; i++) {
                list = attributeFilters[i];
                if (list.name in matchedAttributes) {
                    nodes = matchedAttributes[list.name];
                    // Remove already removed children
                    fi = nodes.length;
                    while (fi--) {
                        if (!nodes[fi].parent) {
                            nodes.splice(fi, 1);
                        }
                    }
                    for (fi = 0, fl = list.callbacks.length; fi < fl; fi++) {
                        list.callbacks[fi](nodes, list.name, args);
                    }
                }
            }
        }

        return rootNode;
    }

    __addRootBlocks(rootNode, blockElements, startWhiteSpaceRegExp) {
        let node = rootNode.firstChild, next, rootBlockNode, schema = this.schema,
            trim = (rootBlockNode) => this.__trim(rootBlockNode, startWhiteSpaceRegExp);

        // Check if rootBlock is valid within rootNode for example if P is valid in H1 if H1 is the contentEditabe root
        if (!schema.isValidChild(rootNode.name, rootBlockName.toLowerCase())) {
            return;
        }

        while (node) {
            next = node.next;
            if (node.type === 3 || (node.type === 1 && node.name !== 'p'&& !blockElements[node.name] && !node.attr("data-editor-type"))) {
                if (!rootBlockNode) {
                    // Create a new root block element
                    rootBlockNode = this.__createNode(rootBlockName, 1);
                    rootBlockNode.attr(settings.forcedRootBlockAttrs);
                    rootNode.insert(rootBlockNode, node);
                    rootBlockNode.append(node);
                }
                else {
                    rootBlockNode.append(node);
                }
            }
            else {
                trim(rootBlockNode);
                rootBlockNode = null;
            }
            node = next;
        }

        trim(rootBlockNode);
    }

    __cloneAndExcludeBlocks(input) {
        let name, output = {};

        for (name in input) {
            if (name !== "li" && name !== 'p') {
                output[name] = input[name];
            }
        }
        return output;
    }

    __createNode(name, type) {
        let node = new Node(name, type), list,
            nodeFilters = this._nodeFilters,
            matchedNodes = this._matchedNodes;

        if (name in nodeFilters) {
            list = matchedNodes[name];
            if (list) {
                list.push(node);
            }
            else {
                matchedNodes[name] = [node];
            }
        }
        return node;
    }

    __fixInvalidChildren(nodes) {
        let schema, ni, node, parent, parents, newParent, currentNode, tempNode, childNode, i,
            nonEmptyElements, whitespaceElements, nonSplitableElements, textBlockElements,
            specialElements, sibling, nextNode;

        schema = this.schema;
        nonSplitableElements = Tools.makeMap("tr,td,th,tbody,thead,tfoot,table");
        nonEmptyElements = schema.getNonEmptyElements();
        whitespaceElements = schema.getWhiteSpaceElements();
        textBlockElements = schema.getTextBlockElements();
        specialElements = schema.getSpecialElements();

        for (ni = 0; ni < nodes.length; ni++) {
            node = nodes[ni];
            
            // Already removed or fixed
            if (!node.parent || node.fixed) {
                continue;
            }

            // If the invalid element is a text block and the text block is within a parent LI element
            // Then unwrap the first text block and convert other sibling text blocks to LI elements similar to Word/Open Office
            if (textBlockElements[node.name] && node.parent.name === "li") {
                // Move sibling text blocks after LI element
                sibling = node.next;
                while (sibling) {
                    if (textBlockElements[sibling.name]) {
                        sibling.name = "li";
                        sibling.fixed = true;
                        node.parent.insert(sibling, node.parent);
                    }
                    else {
                        break;
                    }
                    sibling = sibling.next;
                }
                // Unwrap current text block
                node.unwrap(node);
                continue;
            }

            // Get list of all parent nodes until we find a valid parent to stick the child into
            parents = [node];
            for (parent = node.parent; parent&& !schema.isValidChild(parent.name, node.name) && !nonSplitableElements[parent.name]; parent = parent.parent) {
                parents.push(parent);
            }

            // Found a suitable parent
            if (parent && parents.length > 1) {
                // Reverse the array since it makes looping easier
                parents.reverse();
                // Clone the related parent and insert that after the moved node
                newParent = currentNode = this.filterNode(parents[0].clone());

                // Start cloning and moving children on the left side of the target node
                for (i = 0; i < parents.length - 1; i++) {
                    if (schema.isValidChild(currentNode.name, parents[i].name)) {
                        tempNode = this.filterNode(parents[i].clone());
                        currentNode.append(tempNode);
                    }
                    else {
                        tempNode = currentNode;
                    }

                    for (childNode = parents[i].firstChild; childNode && childNode !== parents[i + 1];) {
                        nextNode = childNode.next;
                        tempNode.append(childNode);
                        childNode = nextNode;
                    }
                    currentNode = tempNode;
                }

                if (!ParserUtils.isEmpty(schema, nonEmptyElements, whitespaceElements, newParent)) {
                    parent.insert(newParent, parents[0], true);
                    parent.insert(node, newParent);
                }
                else {
                    parent.insert(node, parents[0], true);
                }

                // Check if the element is empty by looking through it"s contents and special treatment for <p><br /></p>
                parent = parents[0];
                if (ParserUtils.isEmpty(schema, nonEmptyElements, whitespaceElements, parent) || ParserUtils.hasOnlyChild(parent, "br")) {
                    parent.empty().remove();
                }
            }
            else if (node.parent) {

                // If it"s an LI try to find a UL/OL for it or wrap it
                if (node.name === "li") {
                    sibling = node.prev;
                    if (sibling && (sibling.name === "ul" || sibling.name === "ul")) {
                        sibling.append(node);
                        continue;
                    }

                    sibling = node.next;
                    if (sibling && (sibling.name === "ul" || sibling.name === "ul")) {
                        sibling.insert(node, sibling.firstChild, true);
                        continue;
                    }

                    node.wrap(this.filterNode(new Node("ul", 1)));
                    continue;
                }

                // Try wrapping the element in a DIV
                if (schema.isValidChild(node.parent.name, "div") && schema.isValidChild("div", node.name)) {
                    node.wrap(this.filterNode(new Node("div", 1)));
                }
                else {
                    // We failed wrapping it, then remove or unwrap it
                    if (specialElements[node.name]) {
                        node.empty().remove();
                    }
                    else {
                        node.unwrap();
                    }
                }
            }
        }
    }

    __getRootBlockName(name) {
        if (name === false) {
            return '';
        }
        else if (name === true) {
            return 'p';
        }
        else {
            return name;
        }
    }

    __removeWhitespaceBefore(node) {
        let textNode, textNodeNext, textVal, sibling, blockElements = this.schema.getBlockElements();

        for (textNode = node.prev; textNode && textNode.type === 3;) {
            textVal = textNode.value.replace(endWhiteSpaceRegExp, '');
            // Found a text node with non whitespace then trim that and break
            if (textVal.length > 0) {
                textNode.value = textVal;
                return;
            }

            textNodeNext = textNode.next;
            if (textNodeNext) {
                if (textNodeNext.type === 3 && textNodeNext.value.length) {
                    textNode = textNode.prev;
                    continue;
                }

                if (!blockElements[textNodeNext.name] && textNodeNext.name !== "script" && textNodeNext.name !== "style") {
                    textNode = textNode.prev;
                    continue;
                }
            }

            sibling = textNode.prev;
            textNode.remove();
            textNode = sibling;
        }
    }

    __trim(rootBlockNode, startWhiteSpaceRegExp) {
        if (rootBlockNode) {
            node = rootBlockNode.firstChild;
            if (node && node.type === 3) {
                node.value = node.value.replace(startWhiteSpaceRegExp, '');
            }
            
            node = rootBlockNode.lastChild;
            if (node && node.type === 3) {
                node.value = node.value.replace(endWhiteSpaceRegExp, '');
            }
        }
    }
}
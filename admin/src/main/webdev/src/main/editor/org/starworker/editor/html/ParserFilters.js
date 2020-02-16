import Tools from "../api/util/Tools";
import { isEmpty, paddEmptyNode } from "./ParserUtils";
import Node from "../api/html/Node";

export default class ParserFilters {
    register(parser, settings) {
        let schema = parser.schema;
        // Remove <br> at end of block elements Gecko and WebKit injects BR elements to
        // make it possible to place the caret inside empty blocks. This logic tries to remove
        // these elements and keep br elements that where intended to be there intact
        if (settings.removeTrailingBrs) {
            parser.addNodeFilter("br", (nodes, _, args) => {
                let i, l = nodes.length, node, blockElements = Tools.extend({}, schema.getBlockElements()),
                    nonEmptyElements = schema.getNonEmptyElements(), parent, lastParent, prev, prevName,
                    whiteSpaceElements = schema.getNonEmptyElements(), elementRule, textNode;

                // Remove brs from body element as well
                blockElements.body = 1;
                // Must loop forwards since it will otherwise remove all brs in <p>a<br><br><br></p>
                for (i = 0; i < l; i++) {
                    node = nodes[i];
                    parent = node.parent;

                    if (blockElements[node.parent.name] && node === parent.lastChild) {
                        // Loop all nodes to the left of the current node and check for other BR elements
                        // excluding bookmarks since they are invisible
                        prev = node.prev;
                        while (prev) {
                            prevName = prev.name;
                            // Ignore bookmarks
                            if (prevName !== "span" || prev.attr("data-editor-type") !== "bookmark") {
                                // Found a non BR element
                                if (prevName !== "br") {
                                    break;
                                }
                                // Found another br it"s a <br><br> structure then don"t remove anything
                                if (prevName === "br") {
                                    node = null;
                                    break;
                                }
                            }
                            prev = prev.prev;
                        }

                        if (node) {
                            node.remove();
                            // Is the parent to be considered empty after we removed the BR
                            if (ParserUtils.isEmpty(schema, nonEmptyElements, whiteSpaceElements, parent)) {
                                elementRule = schema.getElementRule(parent.name);
                                // Remove or padd the element depending on schema rule
                                if (elementRule) {
                                    if (elementRule.removeEmpty) {
                                        parent.remove();
                                    }
                                    else if (elementRule.paddEmpty) {
                                        ParserUtils.paddEmptyNode(settings, args, blockElements, parent);
                                    }
                                }
                            }
                        }
                    }
                    else {
                        // Replaces BR elements inside inline elements like <p><b><i><br></i></b></p>
                        // so they become <p><b><i>&nbsp;</i></b></p>
                        lastParent = node;
                        while (parent && parent.firstChild === lastParent && parent.lastChild === lastParent) {
                            lastParent = parent;
                            if (blockElements[parent.name]) {
                                break;
                            }
                            parent = parent.parent;
                        }

                        if (lastParent === parent && settings.paddEmptyWithBr !== true) {
                            textNode = new Node("#text", 3);
                            textNode.value = "\u00a0";
                            node.replace(textNode);
                        }
                    }
                }
            });
        }

        parser.addAttributeFilter("href", (nodes) => {
            let i = nodes.length, node;

            if (!settings.allowUnsafeLinkTarget) {
                while (i--) {
                    node = nodes[i];
                    if (node.name === 'a' && node.attr("target") === "_blank") {
                        node.attr("rel", this.__addNoOpener(node.attr("rel")));
                    }
                }
            }
        });
        
        // Force anchor names closed, unless the setting "allow_html_in_named_anchor" is explicitly included.
        if (!settings.allowHtmlInNamedAnchor) {
            parser.addAttributeFilter("id,name", (nodes) => {
                let i = nodes.length, sibling, prevSibling, parent, node;
                while (i--) {
                    node = nodes[i];
                    if (node.name === 'a' && node.firstChild && !node.attr("href")) {
                        parent = node.parent;
                        // Move children after current node
                        sibling = node.lastChild;
                        do {
                            prevSibling = sibling.prev;
                            parent.insert(sibling, node);
                            sibling = prevSibling;
                        } while (sibling);
                    }
                }
            });
        }

        if (settings.fixListElements) {
            parser.addNodeFilter("ul,ol", (nodes) => {
                let i = nodes.length, node, parentNode;
                while (i--) {
                    node = nodes[i];
                    parentNode = node.parent;
                    if (parentNode.name === "ul" || parentNode.name === "ol") {
                        if (node.prev && node.prev.name === "li") {
                            node.prev.append(node);
                        }
                        else {
                            let li = new Node("li", 1);
                            li.attr("style", "list-style-type: none");
                            node.wrap(li);
                        }
                    }
                }
            });
        }

        if (settings.validate && schema.getValidClasses()) {
            parser.addAttributeFilter("class", (nodes) => {
                let i = nodes.length, node, classList, ci, className, classValue,
                    validClasses = schema.getValidClasses(), validClassesMap, valid;

                while (i--) {
                    node = nodes[i];
                    classList = node.attr("class").split(' ');
                    classValue = '';

                    for (ci = 0; ci < classList.length; ci++) {
                        className = classList[ci];
                        valid = false;
                        validClassesMap = validClasses["*"];

                        if (validClassesMap && validClassesMap[className]) {
                            valid = true;
                        }

                        validClassesMap = validClasses[node.name];
                        if (!valid && validClassesMap && validClassesMap[className]) {
                            valid = true;
                        }

                        if (valid) {
                            if (classValue) {
                                classValue += ' ';
                            }
                            classValue += className;
                        }
                    }

                    if (!classValue.length) {
                        classValue = null;
                    }
                    node.attr("class", classValue);
                }
            });
        }
    }

    __appendRel(rel) {
        let parts = rel.split(' ').filter((p) => {
            return p.length > 0;
        });
        return parts.concat(["noopener"]).sort().join(' ');
    }

    __addNoOpener(rel) {
        let newRel = rel ? Tools.trim(rel) : '';
        if (!/\b(noopener)\b/g.test(newRel)) {
            return this.__appendRel(newRel);
        }
        else {
            return newRel;
        }
    }
}
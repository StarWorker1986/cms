import Tools from "../util/Tools";
import Entities from "../html/Entities";
import ElementType from "./ElementType";

export default class DomSerializerFilters {
    static register(htmlParser, settings, dom) {
        // Convert tabindex back to elements when serializing contents
        htmlParser.addAttributeFilter("data-editor-tabindex", (nodes, name) => {
            let i = nodes.length, node;
            while (i--) {
                node = nodes[i];
                node.attr("tabindex", node.attributes.map["data-editor-tabindex"]);
                node.attr(name, null);
            }
        });

        // Convert move data-editor-src, data-editor-href and data-editor-style into nodes or process them if needed
        htmlParser.addAttributeFilter("src,href,style", (nodes, name) => {
            let i = nodes.length, node, value, internalName = "data-editor-" + name,
                urlConverter = settings.urlConverter,
                urlConverterScope = settings.urlConverterScope;

            while (i--) {
                node = nodes[i];
                value = node.attributes.map[internalName];
                if (value !== undefined) {
                    // Set external name to internal value and remove internal
                    node.attr(name, value.length > 0 ? value : null);
                    node.attr(internalName, null);
                }
                else {
                    // No internal attribute found then convert the value we have in the DOM
                    value = node.attributes.map[name];
                    if (name === "style") {
                        value = dom.serializeStyle(dom.parseStyle(value), node.name);
                    }
                    else if (urlConverter) {
                        value = urlConverter.call(urlConverterScope, value, name, node.name);
                    }
                    node.attr(name, value.length > 0 ? value : null);
                }
            }
        });

        // Remove internal classes mceItem<..> or mceSelected
        htmlParser.addAttributeFilter("class", (nodes) => {
            let i = nodes.length, node, value;
            while (i--) {
                node = nodes[i];
                value = node.attr("class");
                if (value) {
                    value = node.attr("class").replace(/(?:^|\s)editor-item-\w+(?!\S)/g, '');
                    node.attr("class", value.length > 0 ? value : null);
                }
            }
        });

        // Remove bookmark elements
        htmlParser.addAttributeFilter("data-editor-type", (nodes, name, args) => {
            let i = nodes.length, node;
            while (i--) {
                node = nodes[i];
                if (node.attributes.map["data-editor-type"] === "bookmark" && !args.cleanup) {
                    node.remove();
                }
            }
        });

        htmlParser.addNodeFilter("noscript", (nodes) => {
            let i = nodes.length, node;
            while (i--) {
                node = nodes[i].firstChild;
                if (node) {
                    node.value = Entities.decode(node.value);
                }
            }
        });

        // Force script into CDATA sections and remove the editor- prefix also add comments around styles
        htmlParser.addNodeFilter("script,style", (nodes, name) => {
            let i = nodes.length, node, value, type;

            while (i--) {
                node = nodes[i];
                value = node.firstChild ? node.firstChild.value : '';
                if (name === "script") {
                    // Remove editor- prefix from script elements and remove default type since the user specified
                    // a script element without type attribute
                    type = node.attr("type");
                    if (type) {
                        node.attr("type", type === "editor-no/type" ? null : type.replace(/^editor\-/, ''));
                    }

                    if (settings.elementFormat === "xhtml" && value.length > 0) {
                        node.firstChild.value = "// <![CDATA[\n" + this.__trim(value) + "\n// ]]>";
                    }
                }
                else {
                    if (settings.elementFormat === "xhtml" && value.length > 0) {
                        node.firstChild.value = "<!--\n" + this.__trim(value) + "\n-->";
                    }
                }
            }
        });

        // Convert comments to cdata and handle protected comments
        htmlParser.addNodeFilter("#comment", (nodes) => {
            let i = nodes.length, node;
            while (i--) {
                node = nodes[i];
                if (node.value.indexOf("[CDATA[") === 0) {
                    node.name = "#cdata";
                    node.type = 4;
                    node.value = node.value.replace(/^\[CDATA\[|\]\]$/g, "");
                }
                else if (node.value.indexOf("editor:protected ") === 0) {
                    node.name = "#text";
                    node.type = 3;
                    node.raw = true;
                    node.value = unescape(node.value).substr(14);
                }
            }
        });

        htmlParser.addNodeFilter("xml:namespace,input", (nodes, name) => {
            let i = nodes.length, node;

            while (i--) {
                node = nodes[i];
                if (node.type === 7) {
                    node.remove();
                }
                else if (node.type === 1) {
                    if (name === "input" && !("type" in node.attributes.map)) {
                        node.attr("type", "text");
                    }
                }
            }
        });

        htmlParser.addAttributeFilter("data-editor-type", (nodes) => {
            Tools.each(nodes, (node) => {
                if (node.attr("data-editor-type") === "format-caret") {
                    if (node.isEmpty(htmlParser.schema.getNonEmptyElements())) {
                        node.remove();
                    }
                    else {
                        node.unwrap();
                    }
                }
            });
        });

        // Remove internal data attributes
        htmlParser.addAttributeFilter("data-editor-src,data-editor-href,data-editor-style," +
                                      "data-editor-selected,data-editor-expando," +
                                      "data-editor-type,data-editor-resize",
        (nodes, name) => {
            let i = nodes.length;
            while (i--) {
                nodes[i].attr(name, null);
            }
        });
    }

    trimTrailingBr(rootNode) {
        let brNode1, brNode2;

        brNode1 = rootNode.lastChild;
        if (ElementType.isBr(brNode1)) {
            brNode2 = brNode1.prev;
            if (ElementType.isBr(brNode2)) {
                brNode1.remove();
                brNode2.remove();
            }
        }
    }

    __trim(value) {
        return value.replace(/(<!--\[CDATA\[|\]\]-->)/g, '\n')
                    .replace(/^[\r\n]*|[\r\n]*$/g, '')
                    .replace(/^\s*((<!--)?(\s*\/\/)?\s*<!\[CDATA\[|(<!--\s*)?\/\*\s*<!\[CDATA\[\s*\*\/|(\/\/)?\s*<!--|\/\*\s*<!--\s*\*\/)\s*[\r\n]*/gi, '')
                    .replace(/\s*(\/\*\s*\]\]>\s*\*\/(-->)?|\s*\/\/\s*\]\]>(-->)?|\/\/\s*(-->)?|\]\]>|\/\*\s*-->\s*\*\/|\s*-->\s*)\s*$/g, '');
    }
}
import Writer from "./Writer";
import Schema from "./Schema";

export default class Serializer {
    constructor(settings, schema) {
        if (schema === void 0) { 
            schema = new Schema(); 
        }
        this._schema = schema;
        this._writer = new Writer(settings);

        settings = settings || {};
        settings.validate = "validate" in settings ? settings.validate : true;
        this._settings = settings;
    }

    serialize(node) {
        let settings = this._settings, writer = this._writer, handlers,
            walk = (node) => this._walk(node, handlers, settings.validate);

        handlers = {
            // #text
            3: (node) => {
                writer.text(node.value, node.raw);
            },

            // #comment
            8: (node) => {
                writer.comment(node.value);
            },

            // Processing instruction
            7: (node) => {
                writer.pi(node.name, node.value);
            },

            // Doctype
            10: (node) => {
                writer.doctype(node.value);
            },

            // CDATA
            4: (node) => {
                writer.cdata(node.value);
            },

            // Document fragment
            11: (node) => {
                if ((node = node.firstChild)) {
                    do {
                        walk(node);
                    } while ((node = node.next));
                }
            }
        };

        writer.reset();

        // Serialize element and treat all non elements as fragments
        if (node.type === 1 && !settings.inner) {
            walk(node);
        }
        else {
            handlers[11](node);
        }

        return writer.getContent();
    }

    _walk(node, handlers, validate) {
        let handler = handlers[node.type], name, isEmpty, attrs, attrName, attrValue, sortedAttrs, i, l, elementRule;

        if (!handler) {
            name = node.name;
            isEmpty = node.shortEnded;
            attrs = node.attributes;

            // Sort attributes
            if (validate && attrs && attrs.length > 1) {
                sortedAttrs = [];
                sortedAttrs.map = {};
                elementRule = this._schema.getElementRule(node.name);
                if (elementRule) {
                    for (i = 0, l = elementRule.attributesOrder.length; i < l; i++) {
                        attrName = elementRule.attributesOrder[i];
                        if (attrName in attrs.map) {
                            attrValue = attrs.map[attrName];
                            sortedAttrs.map[attrName] = attrValue;
                            sortedAttrs.push({ name: attrName, value: attrValue });
                        }
                    }
                    for (i = 0, l = attrs.length; i < l; i++) {
                        attrName = attrs[i].name;
                        if (!(attrName in sortedAttrs.map)) {
                            attrValue = attrs.map[attrName];
                            sortedAttrs.map[attrName] = attrValue;
                            sortedAttrs.push({ name: attrName, value: attrValue });
                        }
                    }
                    attrs = sortedAttrs;
                }
            }

            this._writer.start(node.name, attrs, isEmpty);
            if (!isEmpty) {
                if ((node = node.firstChild)) {
                    do {
                        this._walk(node);
                    } while ((node = node.next));
                }
                this._writer.end(name);
            }
        }
        else {
            handler(node);
        }
    };
}
import Tools from "../util/Tools";
import ArrUtils from "../util/ArrUtils";
import DOMUtils from "./DOMUtils";
import ElementType from "./ElementType";
import Events from "../Events";
import DomSerializerFilters from "./DomSerializerFilters";
import DomSerializerPreProcess from "./DomSerializerPreProcess";
import DomParser from "../html/DomParser";
import Schema from "../html/Schema";
import Serializer from "../html/Serializer";
import Zwsp from "../text/Zwsp";

export default class DomSerializer {
    constructor(settings, editor) {
        let dom, schema, htmlParser;
    
        dom = editor && editor.dom ? editor.dom : DOMUtils.DOM;
        schema = editor && editor.schema ? editor.schema : new Schema(settings);
        settings.entityEncoding = settings.entityEncoding || "named";
        settings.removeTrailingBrs = "removeTrailingBrs" in settings ? settings.removeTrailingBrs : true;
        htmlParser = new DomParser(settings, schema);
        DomSerializerFilters.register(htmlParser, settings, dom);

        this.schema = schema;
        this._settings = settings;
        this._htmlParser = htmlParser;
        this._tempAttrs = ["data-editor-selected"];
    }

    addAttributeFilter(name, callback) {
        return this._htmlParser.addAttributeFilter(name, callback);
    }

    addNodeFilter(name, callback) {
        return this._htmlParser.addNodeFilter(name, callback);
    }
    
    addRules(rules) {
        this.schema.addValidElements(rules);
    }

    addTempAttr(name) {
        if (ArrUtils.indexOf(this._tempAttrs, name) === -1) {
            this._htmlParser.addAttributeFilter(name, (nodes, name) => {
                let i = nodes.length;
                while (i--) {
                    nodes[i].attr(name, null);
                }
            });
            this._tempAttrs.push(name);
        } 
    }

    getTempAttrs() {
        return this._tempAttrs;
    }

    setRules(rules) {
        this.schema.setValidElements(rules);
    }

    serialize(node, parserArgs) {
        let args = Tools.merge({ format: "html" }, parserArgs ? parserArgs : {}),
            targetNode = DomSerializerPreProcess.process(editor, node, args),
            html = this.__getHtmlFromNode(dom, targetNode, args),
            rootNode = this.__parseHtml(htmlParser, html, args);

        return args.format === "tree" ? rootNode : this.__toHtml(editor, settings, schema, rootNode, args);
    }

    __getHtmlFromNode(dom, node, args) {
        let html = Zwsp.trim(args.getInner ? node.innerHTML : dom.getOuterHTML(node));
        return args.selection || ElementType.isWsPreserveElement(DOMUtils.fromDom(node)) ? html : Tools.trim(html);
    }

    __parseHtml(htmlParser, html, args) {
        let parserArgs = args.selection ? Tools.merge({ forcedRootBlock: false }, args) : args,
            rootNode = htmlParser.parse(html, parserArgs);
        DomSerializerFilters.trimTrailingBr(rootNode);
        return rootNode;
    }

    __postProcess(editor, args, content) {
        if (!args.noEvents && editor) {
            let outArgs = Events.firePostProcess(editor, Tools.merge(args, { content: content }));
            return outArgs.content;
        }
        else {
            return content;
        }
    }

    __serializeNode(settings, schema, node) {
        let htmlSerializer = new Serializer(settings, schema);
        return htmlSerializer.serialize(node);
    }

    __toHtml(editor, settings, schema, rootNode, args) {
        let content = this.__serializeNode(settings, schema, rootNode);
        return this.__postProcess(editor, args, content);
    }
}
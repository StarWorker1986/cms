import Tools from "../util/Tools";
import Events from "../Events";

export default class DomSerializerPreProcess {
    process(editor, node, args) {
        return this.__shouldFireEvent(editor, args) ? this.__preProcess(editor, node, args) : node;
    }

    __preProcess(editor, node, args) {
        let impl, doc, oldDoc, dom = editor.dom;

        node = node.cloneNode(true);
        // Nodes needs to be attached to something in WebKit/Opera
        // This fix will make DOM ranges and make Sizzle happy!
        impl = document.implementation;
        if (impl.createHTMLDocument) {

            // Create an empty HTML document
            doc = impl.createHTMLDocument('');
            
            // Add the element or it's children if it's a body element to the new document
            Tools.each(node.nodeName === "BODY" ? node.childNodes : [node], (node) => {
                doc.body.appendChild(doc.importNode(node, true));
            });

            // Grab first child or body element for serialization
            if (node.nodeName !== "BODY") {
                node = doc.body.firstChild;
            }
            else {
                node = doc.body;
            }

            // set the new document in DOMUtils so createElement etc works
            oldDoc = dom.doc;
            dom.doc = doc;
        }
        Events.firePreProcess(editor, Tools.merge(args, { node: node }));
        if (oldDoc) {
            dom.doc = oldDoc;
        }

        return node;
    }

    __shouldFireEvent(editor, args) {
        return editor && editor.hasEventListeners("PreProcess") && !args.noEvents;
    }
}
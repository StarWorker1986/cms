import Option from "../util/Option";
import Tools from "../util/Tools";
import DOMUtils from "../dom/DOMUtils";
import Markings from "./Markings";

export default class Identification {
    static findAll(editor, name) {
        let body = DOMUtils.fromDom(editor.getBody()),
            markers = DOMUtils.getAllDescendants(body, '[' + Markings.dataAnnotation() + '="' + name + '"]'),
            directory = {};

        Tools.each(markers, (m) => {
            let attr = m.dom().getAttribute(Markings.dataAnnotationId()),
                uid = (attr === null ? undefined : attr),
                nodesAlready = directory.hasOwnProperty(uid) ? directory[uid] : [];
            directory[uid] = nodesAlready.concat([m]);
        });
        return directory;
    }

    static identify(editor, annotationName) {
        let rng = editor.selection.getRng(),
            start = DOMUtils.fromDom(rng.startContainer),
            root = DOMUtils.fromDom(editor.getBody()),
            selector = annotationName.fold(() => '.' + Markings.annotation(), (an) => '[' + Markings.dataAnnotation() + '="' + an + '"]'),
            newStart = DOMUtils.child(start, rng.startOffset).getOr(start),
            closest = DOMUtils.closest(newStart, selector, (n) => n.dom() === root.dom());

        return closest.bind((c) => {
            return this.__getAttr(c, '' + Markings.dataAnnotationId()).bind((uid) => {
                return this.__getAttr(c, '' + Markings.dataAnnotation()).map((name) => {
                    let elements = this.__findMarkers(editor, uid);
                    return {
                        uid: uid,
                        name: name,
                        elements: elements
                    };
                });
            });
        });
    }

    static isAnnotation(elem) {
        let dom = elem.dom();
        return NodeType.isElement(dom) && $(dom).hasClass(Markings.annotation());
    }

    static __findMarkers(editor, uid) {
        let body = DOMUtils.fromDom(editor.getBody());
        return DOMUtils.getAllDescendants(body, '[' + Markings.dataAnnotationId() + '="' + uid + '"]');
    }

    static __getAttr(c, property) {
        let dom = c.dom(), hasAttr = dom && dom.hasAttribute ? dom.hasAttribute(property) : false;;
        if (hasAttr) {
            let attr = dom.getAttribute(property);
            return Option.some(attr === null ? undefined : attr);
        }
        else {
            return Option.none();
        }
    }
}
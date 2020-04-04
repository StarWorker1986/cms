import Bookmarks from "../../bookmark/Bookmarks";
import Tools from "../util/Tools";

export default class ElementUtils {
    constructor(dom) {
        this.dom = dom;
    }

    compare(node1, node2) {
        // Not the same name
        if (node1.nodeName !== node2.nodeName) {
            return false;
        }
        
        let dom = this.dom;

        if (!this.__compareObjects(this.__getAttribs(node1), this.__getAttribs(node2))) {
            return false;
        }

        // Styles are not the same
        if (!this.__compareObjects(dom.parseStyle(dom.getAttrib(node1, "style")),
                                   dom.parseStyle(dom.getAttrib(node2, "style")))) {
            return false;
        }

        return !Bookmarks.isBookmarkNode(node1) && !Bookmarks.isBookmarkNode(node2);
    }

    __compareObjects(obj1, obj2) {
        let value, name;

        for (name in obj1) {
            if (obj1.hasOwnProperty(name)) {
                value = obj2[name];
                if (typeof value === "undefined") {
                    return false;
                }
                if (obj1[name] !== value) {
                    return false;
                }
                delete obj2[name];
            }
        }

        for (name in obj2) {
            if (obj2.hasOwnProperty(name)) {
                return false;
            }
        }

        return true;
    }

    __getAttribs(node) {
        let dom = this.dom, attribs = {};

        Tools.each(dom.getAttribs(node), (attr) => {
            let name = attr.nodeName.toLowerCase();
            // Don"t compare internal attributes or style
            if (name.indexOf('_') !== 0 && name !== "style" && name.indexOf("data-") !== 0) {
                attribs[name] = dom.getAttrib(node, name);
            }
        });

        return attribs;
    }
}
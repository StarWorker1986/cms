import Tools from "../util/Tools";
import Option from "../util/Option";
import DOMUtils from "../dom/DOMUtils";

export default class Parents {
    static parentsUntil(start, root, predicate) {
        if (Tools.contains(root, start)) {
            return this.__dropLast(DOMUtils.parents(start, (elm) => {
                return predicate(elm) || elm.dom() === root.dom();
            }));
        }
        else {
            return [];
        }
    }

    static parents(start, root) {
        return this.parentsUntil(start, root, Option.constant(false));
    }

    static parentsAndSelf(start, root) {
        return [start].concat(this.parents(start, root));
    }

    static __dropLast(xs) {
        return xs.slice(0, -1);
    }
};

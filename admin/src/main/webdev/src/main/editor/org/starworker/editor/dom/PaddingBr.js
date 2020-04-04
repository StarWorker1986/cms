import Tools from "../util/Tools";
import DOMUtils from "./DOMUtils";
import NodeType from "./NodeType";
import ElementType from "./ElementType";

export default class PaddingBr {
    
    static fillWithPaddingBr(elm) {
        DOMUtils.empty(elm);
        DOMUtils.append(elm, DOMUtils.fromHtml('<br data-editor-bogus="1">'));
    }

    static isPaddedElement(elm) {
        return Tools.filter(DOMUtils.children(elm), child => {
            let dom = child.dom();
            return NodeType.isText(dom) ? dom.nodeValue === '\u00a0' : ElementType.isBr(dom);
        }).length === 1;
    }

    static removeTrailingBr(elm) {
        let allBrs = DOMUtils.getAllDescendants(elm, "br"),
            brs = Tools.filter(this.__getLastChildren(elm).slice(-1), ElementType.isBr);
        if (allBrs.length === brs.length) {
            Tools.each(brs, DOMUtils.remove);
        }
    }

    static trimBlockTrailingBr(elm) {
        DOMUtils.lastChild(elm).each((lastChild) => {
            DOMUtils.prevSibling(lastChild).each((lastChildPrevSibling) => {
                if (ElementType.isBlock(elm) && ElementType.isBr(lastChild) && ElementType.isBlock(lastChildPrevSibling)) {
                    DOMUtils.remove(lastChild);
                }
            });
        });
    }

    static __getLastChildren(elm) {
        let children = [], rawNode = elm.dom();

        while (rawNode) {
            children.push(DOMUtils.fromDom(rawNode));
            rawNode = rawNode.lastChild;
        }
        return children;
    }
}
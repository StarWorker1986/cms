import Tools from "../util/Tools";
import Entities from "../html/Entities";
import Diff from "./Diff";
import NodeType from "../dom/NodeType";

export default class Fragments {
    static read(elm) {
        return Tools.filter(Tools.map(Tools.from(elm.childNodes), this.__getOuterHtml), (item) => item.length > 0);
    }

    static write(fragments, elm) {
        let currentFragments = Tools.map(Tools.from(elm.childNodes), this.__getOuterHtml);
        this.__applyDiff(Diff.diff(currentFragments, fragments), elm);
        return elm;
    }

    static __applyDiff(diff, elm) {
        let index = 0;
        Tools.each(diff, (action) => {
            if (action[0] === Diff.KEEP) {
                index++;
            }
            else if (action[0] === Diff.INSERT) {
                this.__insertAt(elm, action[1], index);
                index++;
            }
            else if (action[0] === Diff.DELETE) {
                this.__removeAt(elm, index);
            }
        });
    }

    static __createFragment(html) {
        let frag, node, container;
        
        container = document.createElement("div");
        frag = document.createDocumentFragment();
        if (html) {
            container.innerHTML = html;
        }
        while ((node = container.firstChild)) {
            frag.appendChild(node);
        }
        return frag;
    }

    static __getOuterHtml(elm) {
        if (NodeType.isElement(elm)) {
            return elm.outerHTML;
        }
        else if (NodeType.isText(elm)) {
            return Entities.encodeRaw(elm.data, false);
        }
        else if (NodeType.isComment(elm)) {
            return "<!--" + elm.data + "-->";
        }
        return '';
    }

    static __insertAt(elm, html, index) {
        let fragment = this.__createFragment(html);

        if (elm.hasChildNodes() && index < elm.childNodes.length) {
            let target = elm.childNodes[index];
            target.parentNode.insertBefore(fragment, target);
        }
        else {
            elm.appendChild(fragment);
        }
    }

    static __removeAt(elm, index) {
        if (elm.hasChildNodes() && index < elm.childNodes.length) {
            let target = elm.childNodes[index];
            target.parentNode.removeChild(target);
        }
    }
}
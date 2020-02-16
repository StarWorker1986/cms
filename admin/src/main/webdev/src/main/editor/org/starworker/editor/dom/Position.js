import Tools from "../util/Tools";
import PlatformDetection from "../util/PlatformDetection";
import NodeType from "./NodeType";
import DOMUtils from "./DOMUtils";

export default class Position {
    static getPos(body, elm, rootElm) {
        let x = 0, y = 0, offsetParent, doc = body.ownerDocument, pos;

        rootElm = rootElm ? rootElm : body;
        if (elm) {
            // Use getBoundingClientRect if it exists since it's faster than looping offset nodes
            // Fallback to offsetParent calculations if the body isn't static better since it stops at the body root
            if (rootElm === body && elm.getBoundingClientRect && DOMUtils.getCss(DOMUtils.fromDom(body), "position") === "static") {
                pos = elm.getBoundingClientRect();
                // Add scroll offsets from documentElement or body since IE with the wrong box model will use d.body and so do WebKit
                // Also remove the body/documentelement clientTop/clientLeft on IE 6, 7 since they offset the position
                x = pos.left + (doc.documentElement.scrollLeft || body.scrollLeft) - doc.documentElement.clientLeft;
                y = pos.top + (doc.documentElement.scrollTop || body.scrollTop) - doc.documentElement.clientTop;
                return { x: x, y: y };
            }

            offsetParent = elm;
            while (offsetParent && offsetParent !== rootElm && offsetParent.nodeType) {
                x += offsetParent.offsetLeft || 0;
                y += offsetParent.offsetTop || 0;
                offsetParent = offsetParent.offsetParent;
            }

            offsetParent = elm.parentNode;
            while (offsetParent && offsetParent !== rootElm && offsetParent.nodeType) {
                x -= offsetParent.scrollLeft || 0;
                y -= offsetParent.scrollTop || 0;
                offsetParent = offsetParent.parentNode;
            }
            y += this.__getTableCaptionDeltaY(DOMUtils.fromDom(elm));
        }

        return { x: x, y: y };
    }

    static __getTableCaptionDeltaY(elm) {
        let browser = PlatformDetection.detect().browser,
            firstElement = nodes => Tools.find(nodes, NodeType.isElement);

        if (browser.isFirefox() && DOMUtils.name(elm) === "table") {
            return firstElement(DOMUtils.children(elm)).filter((elm) => {
                return DOMUtils.name(elm) === "caption";
            })
            .bind((caption) => {
                return firstElement(DOMUtils.nextSiblings(caption)).map((body) => {
                    let bodyTop = body.dom().offsetTop,
                        captionTop = caption.dom().offsetTop,
                        captionHeight = caption.dom().offsetHeight;
                    return bodyTop <= captionTop ? -captionHeight : 0;
                });
            }).getOr(0);
        }
        else {
            return 0;
        }
    }
}
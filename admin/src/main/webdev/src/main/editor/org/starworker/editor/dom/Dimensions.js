import NodeType from "./NodeType";
import Tools from "../util/Tools";
import GeomClientRect from "../geom/ClientRect";

export default class Dimensions {
    static getClientRects(node) {
        return Tools.foldl(node, (result, node) => {
            return result.concat(this.__getNodeClientRects(node));
        }, []);
    }

    static __getNodeClientRects(node) {
        if (NodeType.isElement(node)) {
            return this.__toArrayWithNode(node.getClientRects());
        }

        if (NodeType.isText(node)) {
            let rng = node.ownerDocument.createRange();
            rng.setStart(node, 0);
            rng.setEnd(node, node.data.length);
            return this.__toArrayWithNode(rng.getClientRects());
        }
    }

    static __toArrayWithNode(clientRects) {
        return Tools.map(clientRects, (clientRect) => {
            clientRect = GeomClientRect.clone(clientRect);
            clientRect.node = node;
            return clientRect;
        });
    }
}

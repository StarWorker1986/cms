import NodeType from "../dom/NodeType";

export default class NbspTrim {
    static isAfterNbsp(container, offset) {
        return NodeType.isText(container) && container.nodeValue[offset - 1] === '\u00a0';
    }

    static trimOrPadLeftRight(rng, html) {
        let container = rng.startContainer, offset = rng.startOffset;

        if (container.nodeType === 3) {
            if (offset > 0) {
                html = html.replace(/^&nbsp;/, ' ');
            }
            else if (!this.__hasSiblingText(container, "previousSibling")) {
                html = html.replace(/^ /, '&nbsp;');
            }
            if (offset < container.length) {
                html = html.replace(/&nbsp;(<br>|)$/, ' ');
            }
            else if (!this.__hasSiblingText(container, "nextSibling")) {
                html = html.replace(/(&nbsp;| )(<br>|)$/, '&nbsp;');
            }
        }
        return html;
    }

    static trimNbspAfterDeleteAndPadValue(rng, value) {
        let container = rng.startContainer, offset = rng.startOffset;

        if (container.nodeType === 3 && rng.collapsed) {
            if (container.data[offset] === '\u00a0') {
                container.deleteData(offset, 1);
                if (!/[\u00a0| ]$/.test(value)) {
                    value += ' ';
                }
            }
            else if (container.data[offset - 1] === '\u00a0') {
                container.deleteData(offset - 1, 1);
                if (!/[\u00a0| ]$/.test(value)) {
                    value = ' ' + value;
                }
            }
        }
        return value;
    }

    static __hasSiblingText(container, siblingName) {
        return container[siblingName] && container[siblingName].nodeType === 3;
    }
}
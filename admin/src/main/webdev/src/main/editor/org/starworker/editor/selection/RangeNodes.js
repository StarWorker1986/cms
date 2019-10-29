export class RangeNodes {
    static getSelectedNode(range) {
        let startContainer = range.startContainer, startOffset = range.startOffset;
        if (startContainer.hasChildNodes() && range.endOffset === startOffset + 1) {
            return startContainer.childNodes[startOffset];
        }
        return null;
    }

    static getNode(container, offset) {
        if (container.nodeType === 1 && container.hasChildNodes()) {
            if (offset >= container.childNodes.length) {
                offset = container.childNodes.length - 1;
            }
            container = container.childNodes[offset];
        }
        return container;
    }
}
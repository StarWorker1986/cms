import Tools from "../util/Tools";
import DOMUtils from "../dom/DOMUtils";

export default class MergeText {
    static normalizeWhitespaceBefore(node, offset) {
        let content = node.data.slice(0, offset),
            whitespaceCount = content.length - Tools.rTrim(content).length;
        return this.__normalize(node, offset - whitespaceCount, whitespaceCount);
    }

    static normalizeWhitespaceAfter(node, offset) {
        let content = node.data.slice(offset),
            whitespaceCount = content.length - Tools.lTrim(content).length;
        return this.__normalize(node, offset, whitespaceCount);
    }

    static mergeTextNodes(prevNode, nextNode, normalizeWhitespace) {
        let whitespaceOffset = Tools.rTrim(prevNode.data).length;

        // Merge the elements
        prevNode.appendData(nextNode.data);
        DOMUtils.remove(DOMUtils.fromDom(nextNode));
        // Normalize the whitespace around the merged elements, to ensure it doesn't get lost
        if (normalizeWhitespace) {
            this.normalizeWhitespaceAfter(prevNode, whitespaceOffset);
        }

        return prevNode;
    }

    static __normalize(node, offset, count) {
        if (count === 0) {
            return;
        }

        let whitespace = node.data.slice(offset, offset + count),
            isEndOfContent = offset + count >= node.data.length,
            isStartOfContent = offset === 0;

        // Replace the original whitespace with the normalized whitespace content
        node.replaceData(offset, count, this.__normalizeContent(whitespace, isStartOfContent, isEndOfContent));
    }

    static __normalizeContent(content, isStartOfContent, isEndOfContent) {
        let result = Tools.foldl(content.split(''), (acc, c) => {
            // Are we dealing with a char other than some collapsible whitespace or nbsp? if so then just use it as is
            if (" \f\n\r\t\v".indexOf(c) !== -1 || c === '\u00a0') {
                if (acc.previousCharIsSpace
                    || (acc.str === '' && isStartOfContent)
                    || (acc.str.length === content.length - 1 && isEndOfContent)) {
                    return { previousCharIsSpace: false, str: acc.str + '\u00a0' };
                }
                else {
                    return { previousCharIsSpace: true, str: acc.str + ' ' };
                }
            }
            else {
                return { previousCharIsSpace: false, str: acc.str + c };
            }
        }, { previousCharIsSpace: false, str: '' });
        
        return result.str;
    }
}
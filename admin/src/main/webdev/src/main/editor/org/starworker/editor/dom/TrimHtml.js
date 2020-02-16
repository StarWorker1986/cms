import SaxParser from "../html/SaxParser";
import Zwsp from "../text/Zwsp";

export default class trimHtml {
    static trimInternal(serializer, html) {
        let content = html, bogusAllRegExp = /<(\w+) [^>]*data-editor-bogus="all"[^>]*>/g,
            endTagIndex, index, matchLength, matches, shortEndedElements, schema = serializer.schema;

        content = this.__trimHtml(serializer.getTempAttrs(), content);
        shortEndedElements = schema.getShortEndedElements();
        
        // Remove all bogus elements marked with "all"
        while ((matches = bogusAllRegExp.exec(content))) {
            index = bogusAllRegExp.lastIndex;
            matchLength = matches[0].length;
            if (shortEndedElements[matches[1]]) {
                endTagIndex = index;
            }
            else {
                endTagIndex = SaxParser.findEndTagIndex(schema, content, index);
            }
            content = content.substring(0, index - matchLength) + content.substring(endTagIndex);
            bogusAllRegExp.lastIndex = index - matchLength;
        }
        
        return Zwsp.trim(content);
    }

    static __trimHtml(tempAttrs, html) {
        let trimContentRegExp = new RegExp([
            '\\s?(' + tempAttrs.join('|') + ')="[^"]+"'
        ].join('|'), 'gi');
        return html.replace(trimContentRegExp, '');
    }
}
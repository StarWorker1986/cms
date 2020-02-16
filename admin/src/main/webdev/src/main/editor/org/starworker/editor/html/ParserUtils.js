import Node from "./Node";

export default class ParserUtils {
    static paddEmptyNode(settings, args, blockElements, node) {
        let brPreferred = settings.paddEmptyWithBr || args.insert;
        if (brPreferred && blockElements[node.name]) {
            node.empty().append(new Node("br", 1)).shortEnded = true;
        }
        else {
            node.empty().append(new Node("#text", 3)).value = '\u00a0';
        }
    }

    static isPaddedWithNbsp(node) {
        return this.hasOnlyChild(node, "#text") && node.firstChild.value === "\u00a0";
    }

    static hasOnlyChild(node, name) {
        return node && node.firstChild && node.firstChild === node.lastChild && node.firstChild.name === name;
    }

    static isPadded(schema, node) {
        let rule = schema.getElementRule(node.name);
        return rule && rule.paddEmpty;
    }

    static isEmpty(schema, nonEmptyElements, whitespaceElements, node) {
        return node.isEmpty(nonEmptyElements, whitespaceElements, (node) => this.isPadded(schema, node));
    }

    static isLineBreakNode(node, blockElements) {
        return node && (blockElements[node.name] || node.name === "br");
    }
}
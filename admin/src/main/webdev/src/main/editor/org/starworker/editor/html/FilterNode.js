import Tools from "../util/Tools";

export default class FilterNode {
    static filter(nodeFilters, attributeFilters, node) {
        let matches = this.__findMatchingNodes(nodeFilters, attributeFilters, node);
        Tools.each(matches, (match) => {
            Tools.each(match.filter.callbacks, (callback) => {
                callback(match.nodes, match.filter.name, {});
            });
        });
    }

    static __findMatchingNodes(nodeFilters, attributeFilters, node) {
        let nodeMatches = {}, attrMatches = {}, matches = [];

        if (node.firstChild) {
            this.__traverse(node.firstChild, (node) => {
                Tools.each(nodeFilters, (filter) => {
                    if (filter.name === node.name) {
                        if (nodeMatches[filter.name]) {
                            nodeMatches[filter.name].nodes.push(node);
                        }
                        else {
                            nodeMatches[filter.name] = { filter: filter, nodes: [node] };
                        }
                    }
                });

                Tools.each(attributeFilters, (filter) => {
                    if (typeof node.attr(filter.name) === "string") {
                        if (attrMatches[filter.name]) {
                            attrMatches[filter.name].nodes.push(node);
                        }
                        else {
                            attrMatches[filter.name] = { filter: filter, nodes: [node] };
                        }
                    }
                });
            });
        }

        for (let name in nodeMatches) {
            if (nodeMatches.hasOwnProperty(name)) {
                matches.push(nodeMatches[name]);
            }
        }

        for (let name in attrMatches) {
            if (attrMatches.hasOwnProperty(name)) {
                matches.push(attrMatches[name]);
            }
        }

        return matches;
    }

    static __traverse(node, fn) {
        fn(node);
        if (node.firstChild) {
            this.__traverse(node.firstChild, fn);
        }
        if (node.next) {
            this.__traverse(node.next, fn);
        }
    }
}
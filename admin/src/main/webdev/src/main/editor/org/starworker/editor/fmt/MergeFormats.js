import Bookmarks from "../bookmark/Bookmarks";
import ElementUtils from "../dom/ElementUtils";
import NodeType from "../dom/NodeType";
import FormatUtils from "./FormatUtils";
import MatchFormat from "./MatchFormat";
import RemoveFormat from "./RemoveFormat";
import Tools from "../util/Tools";
import ArrUtils from "../util/ArrUtils";
import FormatContainer from "../fmt/FormatContainer";

export default class MergeFormats {
    static mergeWithChildren(editor, formatList, vars, node) {
        Tools.each(formatList, (format) => {
            // Merge all children of similar type will move styles from child to parent
            // this: <span style="color:red"><b><span style="color:red; font-size:10px">text</span></b></span>
            // will become: <span style="color:red"><b><span style="font-size:10px">text</span></b></span>
            Tools.each(editor.dom.select(format.inline, node), (child) => {
                if (!this.__isElementNode(child)) {
                    return;
                }
                RemoveFormat.removeFormat(editor, format, vars, child, format.exact ? child : null);
            });
            this.__clearChildStyles(editor.dom, format, node);
        });
    }

    static mergeUnderlineAndColor(dom, format, vars, node) {
        // Colored nodes should be underlined so that the color of the underline matches the text color.
        if (format.styles.color || format.styles.textDecoration) {
            ArrUtils.walk(node, (node) => this.__processUnderlineAndColor(dom, node), "childNodes");
            this.__processUnderlineAndColor(dom, node);
        }
    }

    static mergeBackgroundColorAndFontSize(dom, format, vars, node) {
        // nodes with font-size should have their own background color as well to fit the line-height (see TINY-882)
        if (format.styles && format.styles.backgroundColor) {
            this.__processChildElements(node, this.__hasStyle(dom, "fontSize"),
                                        this.__applyStyle(dom, "backgroundColor",
                                        FormatUtils.replaceVars(format.styles.backgroundColor, vars)));
        }
    }

    static mergeSubSup(dom, format, vars, node) {
        // Remove font size on all chilren of a sub/sup and remove the inverse element
        if (format.inline === "sub" || format.inline === "sup") {
            this.__processChildElements(node, this.__hasStyle(dom, "fontSize"), this.__applyStyle(dom, "fontSize", ''));
            dom.remove(dom.select(format.inline === "sup" ? "sub" : "sup", node), true);
        }
    }

    static mergeSiblings(dom, format, vars, node) {
        // Merge next and previous siblings if they are similar <b>text</b><b>text</b> becomes <b>texttext</b>
        if (node && format.mergeSiblings !== false) {
            node = this.__mergeSiblingsNodes(dom, FormatUtils.getNonWhiteSpaceSibling(node), node);
            node = this.__mergeSiblingsNodes(dom, node, FormatUtils.getNonWhiteSpaceSibling(node, true));
        }
    }

    static mergeWithParents(editor, format, name, vars, node) {
        // Remove format if direct parent already has the same format
        if (MatchFormat.matchNode(editor, node.parentNode, name, vars)) {
            if (RemoveFormat.removeFormat(editor, format, vars, node)) {
                return;
            }
        }

        // Remove format if any ancestor already has the same format
        if (format.mergeWithParents) {
            editor.dom.getParent(node.parentNode, (parent) => {
                if (MatchFormat.matchNode(editor, parent, name, vars)) {
                    RemoveFormat.removeFormat(editor, format, vars, node);
                    return true;
                }
            });
        }
    }

    static __applyStyle(dom, name, value) {
        return (node) => {
            dom.setStyle(node, name, value);
            if (node.getAttribute("style") === '') {
                node.removeAttribute("style");
            }
            this.__unwrapEmptySpan(dom, node);
        }
    }

    static __clearChildStyles(dom, format, node) {
        if (format.clearChildStyles) {
            let selector = format.links ? "*:not(a)" : '*';
            Tools.each(dom.select(selector, node), (node) => {
                if (this.__isElementNode(node)) {
                    Tools.each(format.styles, (value, name) => {
                        dom.setStyle(node, name, '');
                    });
                }
            });
        }
    }

    static __findElementSibling(node, siblingName) {
        let sibling;
        for (sibling = node; sibling; sibling = sibling[siblingName]) {
            if (sibling.nodeType === 3 && sibling.nodeValue.length !== 0) {
                return node;
            }
            if (sibling.nodeType === 1 && !Bookmarks.isBookmarkNode(sibling)) {
                return sibling;
            }
        }
        return node;
    }

    static __hasStyle(dom, name) {
        return (node) => {
            return !!(node && FormatUtils.getStyle(dom, node, name));
        }
    }

    static __isElementNode(node) {
        return node && node.nodeType === 1
                    && !Bookmarks.isBookmarkNode(node)
                    && !FormatContainer.isCaretNode(node)
                    && !NodeType.isBogus(node);
    }

    static __mergeSiblingsNodes(dom, prev, next) {
        let sibling, tmpSibling, elementUtils = new ElementUtils(dom);
        
        if (prev && next) {
            // If previous sibling is empty then jump over it
            prev = this.__findElementSibling(prev, "previousSibling");
            next = this.__findElementSibling(next, "nextSibling");
            
            // Compare next and previous nodes
            if (elementUtils.compare(prev, next)) {
                // Append nodes between
                for (sibling = prev.nextSibling; sibling && sibling !== next;) {
                    tmpSibling = sibling;
                    sibling = sibling.nextSibling;
                    prev.appendChild(tmpSibling);
                }

                dom.remove(next);
                Tools.each(Tools.grep(next.childNodes), (node) => {
                    prev.appendChild(node);
                });

                return prev;
            }
        }

        return next;
    }

    static __processUnderlineAndColor(dom, node) {
        let textDecoration;
        if (node.nodeType === 1 && node.parentNode && node.parentNode.nodeType === 1) {
            textDecoration = FormatUtils.getTextDecoration(dom, node.parentNode);
            if (dom.getStyle(node, "color") && textDecoration) {
                dom.setStyle(node, "text-decoration", textDecoration);
            }
            else if (dom.getStyle(node, "text-decoration") === textDecoration) {
                dom.setStyle(node, "text-decoration", null);
            }
        }
    }

    static __processChildElements(node, filter, process) {
        Tools.each(node.childNodes, (node) => {
            if (this.__isElementNode(node)) {
                if (filter(node)) {
                    process(node);
                }
                if (node.hasChildNodes()) {
                    this.__processChildElements(node, filter, process);
                }
            }
        });
    }

    static __unwrapEmptySpan(dom, node) {
        if (node.nodeName === "SPAN" && dom.getAttribs(node).length === 0) {
            dom.remove(node, true);
        }
    }
}
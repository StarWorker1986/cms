import Bookmarks from "../bookmark/Bookmarks";
import GetBookmark from "../bookmark/GetBookmark";
import NodeType from "../dom/NodeType";
import CaretFormat from "./CaretFormat";
import ExpandRange from "./ExpandRange";
import FormatUtils from "./FormatUtils";
import Hooks from "./Hooks";
import MatchFormat from "./MatchFormat";
import MergeFormats from "./MergeFormats";
import FormatContainer from "./FormatContainer";
import RangeNormalizer from "../selection/RangeNormalizer";
import RangeWalk from "../selection/RangeWalk";
import Tools from "../util/Tools";

export default class ApplyFormat {
    static applyFormat(editor, name, vars, root) {
        let formatList = editor.formatter.get(name), format = formatList[0], bookmark, rng,
            isCollapsed = !root && editor.selection.isCollapsed(),
            dom = editor.dom, selection = editor.selection,

            setElementFormat = (elm, fmt) => this.__setElementFormat(dom, elm, fmt || format, vars, root),
            applyNodeStyle = (formatList, node) => this.__applyNodeStyle(dom, formatList, format, vars, node, isCollapsed),
            applyRngStyle = (editor, rng, nodeSpecific) => this.__applyRngStyle(editor, rng, nodeSpecific, formatList, format, vars, root, isCollapsed);
        
        if (dom.getContentEditable(selection.getNode()) === "false") {
            root = selection.getNode();
            for (let i = 0, l = formatList.length; i < l; i++) {
                if (formatList[i].ceFalseOverride && dom.is(root, formatList[i].selector)) {
                    setElementFormat(root, formatList[i]);
                    return;
                }
            }
            return;
        }

        if (format) {
            if (root) {
                if (root.nodeType) {
                    if (!applyNodeStyle(formatList, root)) {
                        rng = dom.createRng();
                        rng.setStartBefore(root);
                        rng.setEndAfter(root);
                        applyRngStyle(editor, ExpandRange.expandRng(editor, rng, formatList), true);
                    }
                }
                else {
                    applyRngStyle(editor, root, true);
                }
            }
            else {
                if (!isCollapsed || !format.inline || dom.select("td[data-editor-selected],th[data-editor-selected]").length) {
                    // Obtain selection node before selection is unselected by applyRngStyle
                    let curSelNode = editor.selection.getNode();
                    // If the formats have a default block and we can"t find a parent block then start wrapping it with a DIV
                    // It"s kind of a hack but people should be using the default block type P since all desktop editors work that way
                    if (!editor.settings.forcedRootBlock
                            && formatList[0].defaultBlock
                            && !dom.getParent(curSelNode, dom.isBlock)) {
                        this.applyFormat(editor, formatList[0].defaultBlock);
                    }

                    // Apply formatting to selection
                    editor.selection.setRng(RangeNormalizer.normalize(editor.selection.getRng()));
                    bookmark = GetBookmark.getPersistentBookmark(editor.selection, true);
                    applyRngStyle(editor, ExpandRange.expandRng(editor, selection.getRng(), formatList), bookmark);

                    if (format.styles) {
                        MergeFormats.mergeUnderlineAndColor(dom, format, vars, curSelNode);
                    }

                    selection.moveToBookmark(bookmark);
                    FormatUtils.moveStart(dom, selection, selection.getRng());
                    editor.nodeChanged();
                }
                else {
                    CaretFormat.applyCaretFormat(editor, name, vars);
                }
            }
            Hooks.postProcess(name, editor);
        }
    }

    static __applyNodeStyle(dom, formatList, format, vars, node, isCollapsed) {
        let found = false;
        if (!format.selector) {
            return false;
        }

        // Look for matching formats
        Tools.each(formatList, (fmt) => {
            // Check collapsed state if it exists
            if ("collapsed" in fmt && fmt.collapsed !== isCollapsed) {
                return;
            }

            if (dom.is(node, fmt.selector) && !FormatContainer.isCaretNode(node)) {
                this.__setElementFormat(dom, node, fmt || format, vars, node);
                found = true;
                return false;
            }
        });

        return found;
    }

    static __applyRngStyle(editor, rng, nodeSpecific, formatList, format, vars, root, isCollapsed) {
        let dom = editor.dom, newWrappers = [], wrapName, wrapElm, contentEditable = true;

        // Setup wrapper element
        wrapName = format.inline || format.block;
        wrapElm = dom.create(wrapName);
        this.__setElementFormat(dom, wrapElm, format, vars, root);

        RangeWalk.walk(dom, rng, (nodes) => {
            let currentWrapElm, process = (node) => {
                let nodeName, parentName, hasContentEditableState, lastContentEditable;

                lastContentEditable = contentEditable;
                nodeName = node.nodeName.toLowerCase();
                parentName = node.parentNode.nodeName.toLowerCase();

                // Node has a contentEditable value
                if (node.nodeType === 1 && dom.getContentEditable(node)) {
                    lastContentEditable = contentEditable;
                    contentEditable = dom.getContentEditable(node) === "true";
                    hasContentEditableState = true; // We don"t want to wrap the container only it"s children
                }

                // Stop wrapping on br elements
                if (FormatUtils.isEq(nodeName, "br")) {
                    currentWrapElm = 0;
                    // Remove any br elements when we wrap things
                    if (format.block) {
                        dom.remove(node);
                    }
                    return;
                }

                // If node is wrapper type
                if (format.wrapper && MatchFormat.matchNode(editor, node, name, vars)) {
                    currentWrapElm = 0;
                    return;
                }

                // Can we rename the block
                // TODO: Break this if up, too complex
                if (contentEditable && !hasContentEditableState
                                    && format.block && !format.wrapper
                                    && FormatUtils.isTextBlock(editor, nodeName)
                                    && FormatUtils.isValid(editor, parentName, wrapName)) {
                    node = dom.rename(node, wrapName);
                    this.__setElementFormat(dom, node, format, vars, root);
                    newWrappers.push(node);
                    currentWrapElm = 0;
                    return;
                }

                // Handle selector patterns
                if (format.selector) {
                    let found = this.__applyNodeStyle(dom, formatList, format, vars, node, isCollapsed);
                    // Continue processing if a selector match wasn"t found and a inline element is defined
                    if (!format.inline || found) {
                        currentWrapElm = 0;
                        return;
                    }
                }

                if (contentEditable && !hasContentEditableState
                                    && FormatUtils.isValid(editor, wrapName, nodeName)
                                    && FormatUtils.isValid(editor, parentName, wrapName)
                                    && !(!nodeSpecific && node.nodeType === 3 && node.nodeValue.length === 1 && node.nodeValue.charCodeAt(0) === 65279)
                                    && !FormatContainer.isCaretNode(node) && (!format.inline || !dom.isBlock(node))) {
                    if (!currentWrapElm) {
                        // Wrap the node
                        currentWrapElm = dom.clone(wrapElm, false);
                        node.parentNode.insertBefore(currentWrapElm, node);
                        newWrappers.push(currentWrapElm);
                    }
                    currentWrapElm.appendChild(node);
                }
                else {
                    // Start a new wrapper for possible children
                    currentWrapElm = 0;
                    Tools.each(Tools.grep(node.childNodes), process);
                    if (hasContentEditableState) {
                        contentEditable = lastContentEditable; // Restore last contentEditable state from stack
                    }
                    // End the last wrapper
                    currentWrapElm = 0;
                }
            }
        
            // Process siblings from range
            Tools.each(nodes, process);
        });

        // Apply formats to links as well to get the color of the underline to change as well
        if (format.links === true) {
            Tools.each(newWrappers, (node) => {
                process = (node) => {
                    if (node.nodeName === 'A') {
                        this.__setElementFormat(dom, node, format, vars, root);
                    }
                    Tools.each(Tools.grep(node.childNodes), process);
                };
                process(node);
            });
        }

        // Cleanup
        Tools.each(newWrappers, (node) => {
            let childCount;

            childCount = this.__getChildCount(node);
            // Remove empty nodes but only if there is multiple wrappers and they are not block
            // elements so never remove single <h1></h1> since that would remove the
            // current empty block element where the caret is at
            if ((newWrappers.length > 1 || !dom.isBlock(node)) && childCount === 0) {
                dom.remove(node, 1);
                return;
            }
            if (format.inline || format.wrapper) {
                // Merges the current node with it"s children of similar type to reduce the number of elements
                if (!format.exact && childCount === 1) {
                    node = this.__mergeStyles(dom, node, vars, root, format);
                }
                MergeFormats.mergeWithChildren(editor, formatList, vars, node);
                MergeFormats.mergeWithParents(editor, format, name, vars, node);
                MergeFormats.mergeBackgroundColorAndFontSize(dom, format, vars, node);
                MergeFormats.mergeSubSup(dom, format, vars, node);
                MergeFormats.mergeSiblings(dom, format, vars, node);
            }
        });
    }

    static __getChildCount(node) {
        let count = 0;
        Tools.each(node.childNodes, (node) => {
            if (!FormatUtils.isWhiteSpaceNode(node) && !Bookmarks.isBookmarkNode(node)) {
                count++;
            }
        });
        return count;
    }

    static __getChildElementNode(root) {
        let child = false;
        Tools.each(root.childNodes, (node) => {
            if (this.__isElementNode(node)) {
                child = node;
                return false; // break loop
            }
        });
        return child;
    }

    static __isElementNode(node) {
        return node && node.nodeType === 1
                    && !Bookmarks.isBookmarkNode(node)
                    && !FormatContainer.isCaretNode(node)
                    && !NodeType.isBogus(node);
    }

    static __mergeStyles(dom, node, vars, root, format) {
        let child, clone;
        child = this.__getChildElementNode(node);
        
        // If child was found and of the same type as the current node
        if (child && !Bookmarks.isBookmarkNode(child) && MatchFormat.matchName(dom, child, format)) {
            clone = dom.clone(child, false);
            this.__setElementFormat(dom, clone, format, vars, root);
            dom.replace(clone, node, true);
            dom.remove(child, 1);
        }
        return clone || node;
    }

    static __setElementFormat(dom, elm, fmt, vars, root) {
        if (elm) {
            if (fmt.onformat) {
                fmt.onformat(elm, fmt, vars, root);
            }

            Tools.each(fmt.styles, (value, name) => {
                dom.setStyle(elm, name, FormatUtils.replaceVars(value, vars));
            });

            // Needed for the WebKit span spam bug
            // TODO: Remove this once WebKit/Blink fixes this
            if (fmt.styles) {
                let styleVal = dom.getAttrib(elm, "style");
                if (styleVal) {
                    elm.setAttribute("data-editor-style", styleVal);
                }
            }

            Tools.each(fmt.attributes, (value, name) => {
                dom.setAttrib(elm, name, FormatUtils.replaceVars(value, vars));
            });

            Tools.each(fmt.classes, (value) => {
                value = FormatUtils.replaceVars(value, vars);
                if (!dom.hasClass(elm, value)) {
                    dom.addClass(elm, value);
                }
            });
        }
    }
}
import Bookmarks from "../bookmark/Bookmarks";
import NodeType from "../dom/NodeType";
import TreeWalker from "../dom/TreeWalker";
import CaretFormat from "./CaretFormat";
import ExpandRange from "./ExpandRange";
import FormatUtils from "./FormatUtils";
import MatchFormat from "./MatchFormat";
import RangeWalk from "../selection/RangeWalk";
import Tools from "../util/Tools";
import GetBookmark from "../bookmark/GetBookmark";
import SplitRange from "../selection/SplitRange";
import Option from "../util/Option";
import Settings from "../Settings";

export default class RemoveFormat {
    static removeFormat(editor, format, vars, node, compareNode) {
        let i, attrs, attrName, stylesModified, dom = editor.dom;

        // Check if node matches format
        if (!this.__matchName(dom, node, format) && !this.__isColorFormatAndAnchor(node, format)) {
            return false;
        }

        // Should we compare with format attribs and styles
        if (format.remove !== "all") {
            // Remove styles
            Tools.each(format.styles, (value, name) => {
                value = FormatUtils.normalizeStyleValue(dom, FormatUtils.replaceVars(value, vars), name);
                // Indexed array
                if (typeof name === "number") {
                    name = value;
                    compareNode = 0;
                }
                if (format.removeSimilar || (!compareNode || FormatUtils.isEq(FormatUtils.getStyle(dom, compareNode, name), value))) {
                    dom.setStyle(node, name, '');
                }
                stylesModified = 1;
            });

            // Remove style attribute if it"s empty
            if (stylesModified && dom.getAttrib(node, "style") === '') {
                node.removeAttribute("style");
                node.removeAttribute("data-editor-style");
            }

            // Remove attributes
            Tools.each(format.attributes, (value, name) => {
                let valueOut;
                value = FormatUtils.replaceVars(value, vars);

                // Indexed array
                if (typeof name === "number") {
                    name = value;
                    compareNode = 0;
                }

                if (!compareNode || FormatUtils.isEq(dom.getAttrib(compareNode, name), value)) {
                    // Keep internal classes
                    if (name === "class") {
                        value = dom.getAttrib(node, name);
                        if (value) {
                            // Build new class value where everything is removed except the internal prefixed classes
                            valueOut = '';
                            Tools.each(value.split(/\s+/), (cls) => {
                                if (/editor\-\w+/.test(cls)) {
                                    valueOut += (valueOut ? ' ' : '') + cls;
                                }
                            });
                            // We got some internal classes left
                            if (valueOut) {
                                dom.setAttrib(node, name, valueOut);
                                return;
                            }
                        }
                    }

                    // IE6 has a bug where the attribute doesn"t get removed correctly
                    if (name === "class") {
                        node.removeAttribute("className");
                    }
                    
                    // Remove mce prefixed attributes
                    if (/^(src|href|style)$/.test(name)) {
                        node.removeAttribute("data-editor-" + name);
                    }
                    node.removeAttribute(name);
                }
            });

            // Remove classes
            Tools.each(format.classes, (value) => {
                value = FormatUtils.replaceVars(value, vars);
                if (!compareNode || dom.hasClass(compareNode, value)) {
                    dom.removeClass(node, value);
                }
            });

            // Check for non internal attributes
            attrs = dom.getAttribs(node);
            for (i = 0; i < attrs.length; i++) {
                attrName = attrs[i].nodeName;
                if (attrName.indexOf('_') !== 0 && attrName.indexOf("data-") !== 0) {
                    return false;
                }
            }
        }

        // Remove the inline child if it"s empty for example <b> or <span>
        if (format.remove !== "none") {
            this.__removeNode(editor, node, format);
            return true;
        }
    }

    static remove(editor, name, vars, node, similar) {
        let formatList = editor.formatter.get(name), format = formatList[0],
            bookmark, rng, dom = editor.dom, selection = editor.selection,
            removeRngStyle = (rng) => this.__removeRngStyle(editor, name, vars, rng, similar);

        // Handle node
        if (node) {
            if (node.nodeType) {
                rng = dom.createRng();
                rng.setStartBefore(node);
                rng.setEndAfter(node);
                removeRngStyle(rng);
            }
            else {
                removeRngStyle(node);
            }
            return;
        }

        if (dom.getContentEditable(selection.getNode()) === "false") {
            node = selection.getNode();
            for (let i = 0, l = formatList.length; i < l; i++) {
                if (formatList[i].ceFalseOverride) {
                    if (this.removeFormat(editor, formatList[i], vars, node, node)) {
                        break;
                    }
                }
            }
            return;
        }

        if (!selection.isCollapsed() || !format.inline || dom.select("td[data-editor-selected],th[data-editor-selected]").length) {
            bookmark = GetBookmark.getPersistentBookmark(editor.selection, true);
            removeRngStyle(selection.getRng());
            selection.moveToBookmark(bookmark);
            
            // Check if start element still has formatting then we are at: "<b>text|</b>text"
            // and need to move the start into the next text node
            if (format.inline && MatchFormat.match(editor, name, vars, selection.getStart())) {
                FormatUtils.moveStart(dom, selection, selection.getRng());
            }
            editor.nodeChanged();
        }
        else {
            CaretFormat.removeCaretFormat(editor, name, vars, similar);
        }
    }

    static __find(dom, node, next, inc) {
        node = FormatUtils.getNonWhiteSpaceSibling(node, next, inc);
        return !node || (node.nodeName === "BR" || dom.isBlock(node));
    }

    static __findFormatRoot(editor, container, name, vars, similar) {
        let formatRoot;

        Tools.each(FormatUtils.getParents(editor.dom, container.parentNode).reverse(), (parent) => {
            let format;
            // Find format root element
            if (!formatRoot && parent.id !== "_start" && parent.id !== "_end") {
                // Is the node matching the format we are looking for
                format = MatchFormat.matchNode(editor, parent, name, vars, similar);
                if (format && format.split !== false) {
                    formatRoot = parent;
                }
            }
        });

        return formatRoot;
    }

    static __getContainer(editor, rng, start) {
        let container, offset, lastIdx;

        container = rng[start ? "startContainer" : "endContainer"];
        offset = rng[start ? "startOffset" : "endOffset"];

        if (NodeType.isElement(container)) {
            lastIdx = container.childNodes.length - 1;
            if (!start && offset) {
                offset--;
            }
            container = container.childNodes[offset > lastIdx ? lastIdx : offset];
        }

        // If start text node is excluded then walk to the next node
        if (NodeType.isText(container) && start && offset >= container.nodeValue.length) {
            container = new TreeWalker(container, editor.getBody()).next() || container;
        }

        // If end text node is excluded then walk to the previous node
        if (NodeType.isText(container) && !start && offset === 0) {
            container = new TreeWalker(container, editor.getBody()).prev() || container;
        }

        return container;
    }

    static __isChildOfInlineParent(dom, node, parent) {
        return dom.isChildOf(node, parent) && node !== parent && !dom.isBlock(parent);
    }

    static __isColorFormatAndAnchor(node, format) {
        return format.links && node.tagName === 'A';
    }

    static __isRemoveBookmarkNode(node) {
        // Make sure to only check for bookmarks created here (eg _start or _end)
        // as there maybe nested bookmarks
        return Bookmarks.isBookmarkNode(node) 
            && NodeType.isElement(node)
            && (node.id === "_start" || node.id === "_end");
    }

    static __matchName(dom, node, format) {
        // Check for inline match
        if (FormatUtils.isEq(node, format.inline)) {
            return true;
        }
        // Check for block match
        if (FormatUtils.isEq(node, format.block)) {
            return true;
        }
        // Check for selector match
        if (format.selector) {
            return NodeType.isElement(node) && dom.is(node, format.selector);
        }
    }

    static __process(editor, name, vars, node) {
        let dom = editor.dom, formatList = editor.formatter.get(name), format = formatList[0],
            children, i, l, contentEditable = true, lastContentEditable, hasContentEditableState;

        // Node has a contentEditable value
        if (NodeType.isElement(node) && dom.getContentEditable(node)) {
            lastContentEditable = contentEditable;
            contentEditable = dom.getContentEditable(node) === "true";
            hasContentEditableState = true; // We don"t want to wrap the container only it"s children
        }

        // Grab the children first since the nodelist might be changed
        children = Tools.grep(node.childNodes);
        // Process current node
        if (contentEditable && !hasContentEditableState) {
            for (i = 0, l = formatList.length; i < l; i++) {
                if (this.removeFormat(editor, formatList[i], vars, node, node)) {
                    break;
                }
            }
        }

        // Process the children
        if (format.deep) {
            if (children.length) {
                for (i = 0, l = children.length; i < l; i++) {
                    this.__process(editor, name, vars, children[i]);
                }
                if (hasContentEditableState) {
                    contentEditable = lastContentEditable; // Restore last contentEditable state from stack
                }
            }
        }
    }

    static __removeNode(editor, node, format) {
        let parentNode = node.parentNode, rootBlockElm, dom = editor.dom,
            forcedRootBlock = Settings.getForcedRootBlock(editor);

        if (format.block) {
            if (!forcedRootBlock) {
                // Append BR elements if needed before we remove the block
                if (dom.isBlock(node) && !dom.isBlock(parentNode)) {
                    if (!this.__find(dom, node, false) && !this.__find(dom, node.firstChild, true, 1)) {
                        node.insertBefore(dom.create("br"), node.firstChild);
                    }
                    if (!this.__find(dom, node, true) && !this.__find(dom, node.lastChild, false, 1)) {
                        node.appendChild(dom.create("br"));
                    }
                }
            }
            else {
                // Wrap the block in a forcedRootBlock if we are at the root of document
                if (parentNode === dom.getRoot()) {
                    if (!format.listBlock || !FormatUtils.isEq(node, format.listBlock)) {
                        Tools.each(Tools.grep(node.childNodes), (node) => {
                            if (FormatUtils.isValid(editor, forcedRootBlock, node.nodeName.toLowerCase())) {
                                if (!rootBlockElm) {
                                    rootBlockElm = this.__wrap(dom, node, forcedRootBlock);
                                    dom.setAttribs(rootBlockElm, editor.settings.forcedRootBlockAttrs);
                                }
                                else {
                                    rootBlockElm.appendChild(node);
                                }
                            }
                            else {
                                rootBlockElm = 0;
                            }
                        });
                    }
                }
            }
        }

        // Never remove nodes that isn"t the specified inline element if a selector is specified too
        if (format.selector && format.inline && !FormatUtils.isEq(format.inline, node)) {
            return;
        }
        dom.remove(node, 1);
    }

    static __removeRngStyle(editor, name, vars, rng, similar) {
        let formatList = editor.formatter.get(name), format = formatList[0], marker,
            startContainer, endContainer, commonAncestorContainer = rng.commonAncestorContainer,
            process = (node) => this.__process(editor, name, vars, node),
            unwrap = (start) => this.__unwrap(editor, start)
            splitToFormatRoot = (container) => this.__splitToFormatRoot(editor, name, vars, container, similar);

        rng = ExpandRange.expandRng(editor, rng, formatList, true);
        if (format.split) {
            // Split text nodes
            rng = SplitRange.split(rng);
            startContainer = this.__getContainer(editor, rng, true);
            endContainer = this.__getContainer(editor, rng);

            if (startContainer !== endContainer) {
                // WebKit will render the table incorrectly if we wrap a TH or TD in a SPAN
                // so let"s see if we can use the first child instead
                // This will happen if you triple click a table cell and use remove formatting
                if (/^(TR|TH|TD)$/.test(startContainer.nodeName) && startContainer.firstChild) {
                    if (startContainer.nodeName === "TR") {
                        startContainer = startContainer.firstChild.firstChild || startContainer;
                    }
                    else {
                        startContainer = startContainer.firstChild || startContainer;
                    }
                }

                // Try to adjust endContainer as well if cells on the same row were selected - bug #6410
                if (commonAncestorContainer && /^T(HEAD|BODY|FOOT|R)$/.test(commonAncestorContainer.nodeName)
                                            && /^(TH|TD)$/.test(endContainer.nodeName)
                                            && endContainer.firstChild) {
                    endContainer = endContainer.firstChild || endContainer;
                }

                // Wrap and split if nested
                if (this.__isChildOfInlineParent(dom, startContainer, endContainer)) {
                    marker = Option.from(startContainer.firstChild).getOr(startContainer);
                    splitToFormatRoot(this.__wrapWithSiblings(dom, marker, true, "span", { "id": "_start", "data-editor-type": "bookmark" }));
                    unwrap(true);
                    return;
                }

                // Wrap and split if nested
                if (this.__isChildOfInlineParent(dom, endContainer, startContainer)) {
                    marker = Option.from(endContainer.lastChild).getOr(endContainer);
                    splitToFormatRoot(this.__wrapWithSiblings(dom, marker, false, "span", { "id": "_end", "data-editor-type": "bookmark" }));
                    unwrap(false);
                    return;
                }
                // Wrap start/end nodes in span element since these might be cloned/moved
                startContainer = this.__wrap(dom, startContainer, "span", { "id": "_start", "data-editor-type": "bookmark" });
                endContainer = this.__wrap(dom, endContainer, "span", { "id": "_end", "data-editor-type": "bookmark" });
                
                // Split start/end
                splitToFormatRoot(startContainer);
                splitToFormatRoot(endContainer);
                
                // Unwrap start/end to get real elements again
                startContainer = unwrap(true);
                endContainer = unwrap();
            }
            else {
                startContainer = endContainer = splitToFormatRoot(startContainer);
            }

            // Update range positions since they might have changed after the split operations
            rng.startContainer = startContainer.parentNode ? startContainer.parentNode : startContainer;
            rng.startOffset = dom.nodeIndex(startContainer);
            rng.endContainer = endContainer.parentNode ? endContainer.parentNode : endContainer;
            rng.endOffset = dom.nodeIndex(endContainer) + 1;
        }

        // Remove items between start/end
        RangeWalk.walk(dom, rng, (nodes) => {
            Tools.each(nodes, (node) => {
                process(node);
                // Remove parent span if it only contains text-decoration: underline, yet a parent node is also underlined.
                if (NodeType.isElement(node) && editor.dom.getStyle(node, "text-decoration") === "underline"
                                             && node.parentNode 
                                             && FormatUtils.getTextDecoration(dom, node.parentNode) === "underline") {
                    this.removeFormat(editor, {
                        deep: false,
                        exact: true,
                        inline: "span",
                        styles: {
                            textDecoration: "underline"
                        }
                    }, null, node);
                }
            });
        });
    }

    static __splitToFormatRoot(editor, name, vars, container, similar) {
        let formatRoot = this.__findFormatRoot(editor, container, name, vars, similar);
        return this.__wrapAndSplit(editor, formatList, formatRoot, container, container, true, format, vars);
    }

    static __wrap(dom, node, name, attrs) {
        let wrapper = dom.create(name, attrs);
        node.parentNode.insertBefore(wrapper, node);
        wrapper.appendChild(node);
        return wrapper;
    }

    static __wrapWithSiblings(dom, node, next, name, attrs) {
        let start = DOMUtils.fromDom(node), wrapper = DOMUtils.fromDom(dom.create(name, attrs)),
            siblings = next ? DOMUtils.nextSiblings(start) : DOMUtils.prevSiblings(start);

        DOMUtils.append(wrapper, siblings);
        if (next) {
            DOMUtils.before(start, wrapper);
            DOMUtils.prepend(wrapper, start);
        }
        else {
            DOMUtils.after(start, wrapper);
            DOMUtils.append(wrapper, start);
        }

        return wrapper.dom();
    }

    static __unwrap(editor, start) {
        let dom = editor.dom, node = dom.get(start ? "_start" : "_end"),
            out = node[start ? "firstChild" : "lastChild"];

        // If the end is placed within the start the result will be removed
        // So this checks if the out node is a bookmark node if it is it
        // checks for another more suitable node
        if (this.__isRemoveBookmarkNode(out)) {
            out = out[start ? "firstChild" : "lastChild"];
        }

        // Since dom.remove removes empty text nodes then we need to try to find a better node
        if (NodeType.isText(out) && out.data.length === 0) {
            out = start ? node.previousSibling || node.nextSibling : node.nextSibling || node.previousSibling;
        }
        dom.remove(node, true);

        return out;
    }

    static __wrapAndSplit(editor, formatList, formatRoot, container, target, split, format, vars) {
        let parent, clone, lastClone, firstClone, i, formatRootParent, dom = editor.dom;

        if (formatRoot) {
            formatRootParent = formatRoot.parentNode;
            for (parent = container.parentNode; parent && parent !== formatRootParent; parent = parent.parentNode) {
                clone = dom.clone(parent, false);

                for (i = 0; i < formatList.length; i++) {
                    if (this.removeFormat(editor, formatList[i], vars, clone, clone)) {
                        clone = 0;
                        break;
                    }
                }

                if (clone) {
                    if (lastClone) {
                        clone.appendChild(lastClone);
                    }
                    if (!firstClone) {
                        firstClone = clone;
                    }
                    lastClone = clone;
                }
            }

            if (split && (!format.mixed || !dom.isBlock(formatRoot))) {
                container = dom.split(formatRoot, container);
            }

            if (lastClone) {
                target.parentNode.insertBefore(lastClone, target);
                firstClone.appendChild(target);
            }
        }

        return container;
    }
}
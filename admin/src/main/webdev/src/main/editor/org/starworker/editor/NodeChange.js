import Env from "./util/Env";
import Delay from "./util/Delay";
import DOMUtils from "./dom/DOMUtils";
import SelectionUtils from "./selection/SelectionUtils";

export default class NodeChange {
    constructor(editor) {
        this.editor = editor;
        this._lastPath = [];
        this._lastRng = null;
        this.__init();
    }

    nodeChanged(args) {
        let editor = this.editor, selection = editor.selection, node, parents, root;

        // Fix for bug #1896577 it seems that this can not be fired while the editor is loading
        if (editor.initialized && selection && !editor.settings.disableNodechange && !editor.readonly) {
            // Get start node
            root = editor.getBody();
            node = selection.getStart(true) || root;

            // Make sure the node is within the editor root or is the editor root
            if (node.ownerDocument !== editor.getDoc() || !editor.dom.isChildOf(node, root)) {
                node = root;
            }

            // Get parents and add them to object
            parents = [];
            editor.dom.getParent(node, (node) => {
                if (node === root) {
                    return true;
                }
                parents.push(node);
            });

            args = args || {};
            args.element = node;
            args.parents = parents;
            editor.fire("NodeChange", args);
        }
    }

    __init() {
        let editor = this.editor;

        // Gecko doesn"t support the "selectionchange" event
        if (!("onselectionchange" in editor.getDoc())) {
            editor.on("NodeChange Click MouseUp KeyUp Focus", (e) => {
                let nativeRng, fakeRng;

                // Since DOM Ranges mutate on modification
                // of the DOM we need to clone it"s contents
                nativeRng = editor.selection.getRng();
                fakeRng = {
                    startContainer: nativeRng.startContainer,
                    startOffset: nativeRng.startOffset,
                    endContainer: nativeRng.endContainer,
                    endOffset: nativeRng.endOffset
                };

                // Always treat nodechange as a selectionchange since applying
                // formatting to the current range wouldn"t update the range but it"s parent
                if (e.type === "nodechange" || !DOMUtils.isRangeEq(fakeRng, this._lastRng)) {
                    editor.fire("SelectionChange");
                }
                this._lastRng = fakeRng;
            });
        }

        // IE has a bug where it fires a selectionchange on right click that has a range at the start of the body
        // When the contextmenu event fires the selection is located at the right location
        editor.on("contextmenu", () => editor.fire("SelectionChange"));

        // Selection change is delayed ~200ms on IE when you click inside the current range
        editor.on("SelectionChange", () => {
            let startElm = editor.selection.getStart(true);
            // When focusout from after cef element to other input element the startelm can be undefined.
            // IE 8 will fire a selectionchange event with an incorrect selection
            // when focusing out of table cells. Click inside cell -> toolbar = Invalid SelectionChange event
            if (!startElm || (!Env.range && editor.selection.isCollapsed())) {
                return;
            }

            if (SelectionUtils.hasAnyRanges(editor) && !this.__isSameElementPath(startElm) && editor.dom.isChildOf(startElm, editor.getBody())) {
                editor.nodeChanged({ selectionChange: true });
            }
        });

        // Fire an extra nodeChange on mouseup for compatibility reasons
        editor.on("MouseUp", (e) => {
            if (!e.isDefaultPrevented() && SelectionUtils.hasAnyRanges(editor)) {
                // Delay nodeChanged call for WebKit edge case issue where the range
                // isn"t updated until after you click outside a selected image
                if (editor.selection.getNode().nodeName === "IMG") {
                    Delay.setEditorTimeout(editor, () => editor.nodeChanged());
                }
                else {
                    editor.nodeChanged();
                }
            }
        });
    }

    __isSameElementPath(startElm) {
        let i, currentPath, lastPath = this._lastPath;
        
        currentPath = this.__getParentsUnit(startElm, editor.getBody()).add(startElm);
        if (currentPath.length === lastPath.length) {
            for (i = currentPath.length; i >= 0; i--) {
                if (currentPath[i] !== lastPath[i]) {
                    break;
                }
            }
            
            if (i === -1) {
                lastPath = currentPath;
                return true;
            }
        }
        lastPath = currentPath;

        return false;
    }

    __getParentsUnit(startNode, endNode) {
        let matched = [], currNode = startNode.parentNode;

        while (currNode && currNode.nodeType !== 9) {
            if (endNode !== undefined && currNode === endNode) {
                break;
            }

            if (currNode.nodeType === 1) {
                matched.push(currNode);
            }
            currNode = currNode.parentNode;
        }

        return matched;
    }
}
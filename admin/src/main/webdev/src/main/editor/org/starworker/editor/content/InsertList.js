import CaretPosition from "../caret/CaretPosition";
import CaretWalker from "../caret/CaretWalker";
import NodeType from "../dom/NodeType";
import Tools from "../util/Tools";
import ArrUtils from "../util/ArrUtils";

export default class InsertList {
    static isListFragment(schema, fragment) {
        let firstChild = fragment.firstChild, lastChild = fragment.lastChild;

        if (firstChild && firstChild.name === "meta") {
            firstChild = firstChild.next;
        }
        if (lastChild && lastChild.attr("id") === "editor_marker") {
            lastChild = lastChild.prev;
        }
        if (this.__isEmptyFragmentElement(schema, lastChild)) {
            lastChild = lastChild.prev;
        }
        if (!firstChild || firstChild !== lastChild) {
            return false;
        }

        return firstChild.name === "ul" || firstChild.name === "ol";
    }

    static insertAtCaret(serializer, dom, rng, fragment) {
        let domFragment = this.__toDomFragment(dom, serializer, fragment),
            liTarget = this.__getParentLi(dom, rng.startContainer),
            liElms = this.trimListItems(this.listItems(domFragment.firstChild)),
            BEGINNING = 1, END = 2, rootNode = dom.getRoot(),
            isAt = (location) => this.__isAt(location, dom, rng, liTarget);

        if (isAt(BEGINNING)) {
            return this.__insertBefore(liTarget, liElms, rootNode);
        }
        else if (isAt(END)) {
            return this.__insertAfter(liTarget, liElms, rootNode, dom);
        }
        return this.__insertMiddle(liTarget, liElms, rootNode, rng);
    }

    static isParentBlockLi(dom, node) {
        return !!this.__getParentLi(dom, node);
    }

    static listItems(elm) {
        return Tools.grep(elm.childNodes, (child) => child.nodeName === "LI");
    }

    static trimListItems(elms) {
        return elms.length > 0 && this.__isEmptyOrPadded(elms[elms.length - 1]) ? elms.slice(0, -1) : elms;
    }

    static __cleanupDomFragment(domFragment) {
        let firstChild = domFragment.firstChild, lastChild = domFragment.lastChild;
        if (firstChild && firstChild.nodeName === "META") {
            firstChild.parentNode.removeChild(firstChild);
        }
        if (lastChild && lastChild.id === "editor_marker") {
            lastChild.parentNode.removeChild(lastChild);
        }
        return domFragment;
    }

    static __findFirstIn(node, rootNode) {
        let caretPos = CaretPosition.before(node),
            caretWalker = new CaretWalker(rootNode),
            newCaretPos = caretWalker.next(caretPos);
        return newCaretPos ? newCaretPos.toRange() : null;
    }

    static __findLastOf(node, rootNode) {
        let caretPos = CaretPosition.after(node),
            caretWalker = new CaretWalker(rootNode),
            newCaretPos = caretWalker.prev(caretPos);
        return newCaretPos ? newCaretPos.toRange() : null;
    }

    static __getParentLi(dom, node) {
        let parentBlock = dom.getParent(node, dom.isBlock);
        return parentBlock && parentBlock.nodeName === "LI" ? parentBlock : null;
    }

    static __getSplit(parentNode, rng) {
        let beforeRng = rng.cloneRange(), afterRng = rng.cloneRange();
        beforeRng.setStartBefore(parentNode);
        afterRng.setEndAfter(parentNode);
        return [
            beforeRng.cloneContents(),
            afterRng.cloneContents()
        ];
    }

    static __insertAfter(target, elms, rootNode, dom) {
        dom.insertAfter(elms.reverse(), target);
        return this.__findLastOf(elms[0], rootNode);
    }

    static __insertBefore(target, elms, rootNode) {
        let parentElm = target.parentNode;
        ArrUtils.each(elms, (elm) => {
            parentElm.insertBefore(elm, target);
        });
        return this.__findFirstIn(target, rootNode);
    }

    static __insertMiddle(target, elms, rootNode, rng) {
        let parts = this.__getSplit(target, rng), parentElm = target.parentNode;
        parentElm.insertBefore(parts[0], target);
        ArrUtils.each(elms, (li) => {
            parentElm.insertBefore(li, target);
        });
        parentElm.insertBefore(parts[1], target);
        parentElm.removeChild(target);
        return this.__findLastOf(elms[elms.length - 1], rootNode);
    }

    static __isAt(location, dom, rng, liTarget) {
        let caretPos = CaretPosition.fromRangeStart(rng),
            caretWalker = new CaretWalker(dom.getRoot()),
            newPos = (location === BEGINNING ? caretWalker.prev(caretPos) : caretWalker.next(caretPos));
        return newPos ? this.__getParentLi(dom, newPos.getNode()) !== liTarget : true;
    }

    static __isEmptyFragmentElement(schema, node) {
        if(!node) {
            return false;
        }

        let nonEmptyElements = schema.getNonEmptyElements(),
            blockElements = schema.getBlockElements(),
            hasOnlyOneChild = node.firstChild === node.lastChild,
            isPaddedNode = (node.firstChild.name === "br" || node.firstChild.value === '\u00a0'),
            isPaddedEmptyBlock = blockElements[node.name] && node.firstChild && hasOnlyOneChild && isPaddedNode;
        return node.isEmpty(nonEmptyElements) || isPaddedEmptyBlock;
    }

    static __isEmptyOrPadded(elm) {
        if(!elm || !elm.firstChild) {
            return true;
        }

        let firstChild = elm.firstChild,
            isPadded = firstChild.data === '\u00a0' || NodeType.isBr(firstChild);
        return firstChild === elm.lastChild && isPadded;
    }

    static __toDomFragment(dom, serializer, fragment) {
        let html = serializer.serialize(fragment),
            domFragment = dom.createFragment(html);
        return this.__cleanupDomFragment(domFragment);
    }
}
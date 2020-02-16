import Tools from "../util/Tools";
import DOMUtils from "../dom/DOMUtils";
import { Arr, Cell, Id, Option } from '@ephox/katamari';
import { Attr, Class, Classes, Element, Insert, Node, Replication, Traverse, Html } from '@ephox/sugar';
import GetBookmark from 'tinymce/core/bookmark/GetBookmark';
import ExpandRange from 'tinymce/core/fmt/ExpandRange';
import RangeWalk from '../selection/RangeWalk';
import { context } from './AnnotationContext';
import * as Markings from './Markings';
// We want it to apply to trailing spaces (like removeFormat does) when dealing with non breaking spaces. There
// will likely be other edge cases as well.
var shouldApplyToTrailingSpaces = function (rng) {
    return rng.startContainer.nodeType === 3 && rng.startContainer.nodeValue.length >= rng.startOffset && rng.startContainer.nodeValue[rng.startOffset] === '\u00A0';
};
var applyWordGrab = function (editor, rng) {
    var r = ExpandRange.expandRng(editor, rng, [{ inline: true }], shouldApplyToTrailingSpaces(rng));
    rng.setStart(r.startContainer, r.startOffset);
    rng.setEnd(r.endContainer, r.endOffset);
    editor.selection.setRng(rng);
};
var makeAnnotation = function (eDoc, data, annotationName, decorate) {
    let uid = data.uid, master = DOMUtils.fromTag("span", eDoc);

    uid = (uid === void 0 ? Tools.generateId("editor-annotation") : uid);
    data = Tools.rest(data, ["uid"]);

    Class.add(master, Markings.annotation());
    Attr.set(master, "" + Markings.dataAnnotationId(), uid);
    Attr.set(master, "" + Markings.dataAnnotation(), annotationName);
    var c = decorate(uid, data), d = c.attributes, attributes = d === void 0 ? {} : d, e = c.classes, classes = e === void 0 ? [] : e;
    Attr.setAll(master, attributes);
    Classes.add(master, classes);
    return master;
};
var annotate = function (editor, rng, annotationName, decorate, data) {
    // Setup all the wrappers that are going to be used.
    var newWrappers = [];
    // Setup the spans for the comments
    var master = makeAnnotation(editor.getDoc(), data, annotationName, decorate);
    // Set the current wrapping element
    var wrapper = Cell(Option.none());
    // Clear the current wrapping element, so that subsequent calls to
    // getOrOpenWrapper spawns a new one.
    var finishWrapper = function () {
        wrapper.set(Option.none());
    };
    // Get the existing wrapper, or spawn a new one.
    var getOrOpenWrapper = function () {
        return wrapper.get().getOrThunk(function () {
            var nu = Replication.shallow(master);
            newWrappers.push(nu);
            wrapper.set(Option.some(nu));
            return nu;
        });
    };
    var processElements = function (elems) {
        Arr.each(elems, processElement);
    };
    var processElement = function (elem) {
        var ctx = context(editor, elem, 'span', Node.name(elem));
        switch (ctx) {
            case "invalid-child" /* InvalidChild */: {
                finishWrapper();
                var children = Traverse.children(elem);
                processElements(children);
                finishWrapper();
                break;
            }
            case "valid" /* Valid */: {
                var w = getOrOpenWrapper();
                Insert.wrap(elem, w);
                break;
            }
            // INVESTIGATE: Are these sensible things to do?
            case "skipping" /* Skipping */:
            case "existing" /* Existing */:
            case "caret" /* Caret */: {
                // Do nothing.
            }
        }
    };
    var processNodes = function (nodes) {
        var elems = Arr.map(nodes, Element.fromDom);
        processElements(elems);
    };
    RangeWalk.walk(editor.dom, rng, function (nodes) {
        finishWrapper();
        processNodes(nodes);
    });
    return newWrappers;
};
var annotateWithBookmark = function (editor, name, settings, data) {
    editor.undoManager.transact(function () {
        var initialRng = editor.selection.getRng();
        if (initialRng.collapsed) {
            applyWordGrab(editor, initialRng);
        }
        // Even after applying word grab, we could not find a selection. Therefore,
        // just make a wrapper and insert it at the current cursor
        if (editor.selection.getRng().collapsed) {
            var wrapper = makeAnnotation(editor.getDoc(), data, name, settings.decorate);
            // Put something visible in the marker
            Html.set(wrapper, '\u00A0');
            editor.selection.getRng().insertNode(wrapper.dom());
            editor.selection.select(wrapper.dom());
        }
        else {
            // The bookmark is responsible for splitting the nodes beforehand at the selection points
            // The "false" here means a zero width cursor is NOT put in the bookmark. It seems to be required
            // to stop an empty paragraph splitting into two paragraphs. Probably a better way exists.
            var bookmark = GetBookmark.getPersistentBookmark(editor.selection, false);
            var rng = editor.selection.getRng();
            annotate(editor, rng, name, settings.decorate, data);
            editor.selection.moveToBookmark(bookmark);
        }
    });
};
export { annotateWithBookmark };
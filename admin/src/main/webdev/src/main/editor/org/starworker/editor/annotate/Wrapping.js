import Tools from "../util/Tools";
import Cell from "../util/Cell";
import Option from "../util/Option";
import DOMUtils from "../dom/DOMUtils";
import GetBookmark from "../bookmark/GetBookmark";
import ExpandRange from "../fmt/ExpandRange";
import RangeWalk from "../selection/RangeWalk";
import AnnotationContext from "./AnnotationContext";
import Markings from "./Markings";

export default class Wrapping {
    static annotateWithBookmark(editor, name, settings, data) {
        editor.undoManager.transact(() => {
            let initialRng = editor.selection.getRng();
            if (initialRng.collapsed) {
                this.__applyWordGrab(editor, initialRng);
            }

            // Even after applying word grab, we could not find a selection. Therefore,
            // just make a wrapper and insert it at the current cursor
            if (editor.selection.getRng().collapsed) {
                let wrapper = this.__makeAnnotation(editor.getDoc(), data, name, settings.decorate);
                // Put something visible in the marker
                $(wrapper.dom()).html('\u00A0');
                editor.selection.getRng().insertNode(wrapper.dom());
                editor.selection.select(wrapper.dom());
            }
            else {
                // The bookmark is responsible for splitting the nodes beforehand at the selection points
                // The "false" here means a zero width cursor is NOT put in the bookmark. It seems to be required
                // to stop an empty paragraph splitting into two paragraphs. Probably a better way exists.
                let bookmark = GetBookmark.getPersistentBookmark(editor.selection, false),
                    rng = editor.selection.getRng();
                this.__annotate(editor, rng, name, settings.decorate, data);
                editor.selection.moveToBookmark(bookmark);
            }
        });
    }

    static __annotate(editor, rng, annotationName, decorate, data) {
        let newWrappers = [], master = this.__makeAnnotation(editor.getDoc(), data, annotationName, decorate),
            wrapper = new Cell(Option.none()),
            processElement = (elem) => {
                let ctx = AnnotationContext.context(editor, elem, "span", DOMUtils.name(elem));

                switch (ctx) {
                    case "invalid-child": {
                        wrapper.set(Option.none());
                        Tools.each(DOMUtils.children(elem), processElement);
                        wrapper.set(Option.none());
                        break;
                    }

                    case "valid": {
                        let w = wrapper.get().getOrThunk(() => {
                            let nu = DOMUtils.shallow(master);
                            newWrappers.push(nu);
                            wrapper.set(Option.some(nu));
                            return nu;
                        });
                        DOMUtils.wrap(elem, w);
                        break;
                    }

                    case "skipping":
                    case "existing":
                    case "caret":
                        break;
                }
            };

        RangeWalk.walk(editor.dom, rng, (nodes) => {
            wrapper.set(Option.none());
            Tools.each(Tools.map(nodes, DOMUtils.fromDom), processElement);
        });

        return newWrappers;
    }

    static __applyWordGrab(editor, rng) {
        let r = ExpandRange.expandRng(editor, rng, [{ inline: true }], this.__shouldApplyToTrailingSpaces(rng));
        rng.setStart(r.startContainer, r.startOffset);
        rng.setEnd(r.endContainer, r.endOffset);
        editor.selection.setRng(rng);
    }

    static __makeAnnotation(eDoc, data, annName, decorate) {
        let uid = data.uid, master = DOMUtils.fromTag("span", eDoc), ann, annId, attrs, clss;

        Wrapings._idGenerator = Wrappings._idGenerator || Tools.generateId("editor-annotation");
        uid = (uid === void 0 ? Wrappings._idGenerator() : uid);
        data = Tools.rest(data, ["uid"]);

        ann = Markings.dataAnnotation();
        annId = Markings.dataAnnotationId();
        $(master.dom()).addClass(Markings.annotation())
            .attr({ ann: annName, annId: uid });

        data = decorate(uid, data);
        attrs = (data.attributes === void 0 ? {} : data.attributes);
        clss = (data.classes === void 0 ? [] : data.classes);
        $(master.dom()).attr(attts).addClass(clss);

        return master;
    }

    static __shouldApplyToTrailingSpaces(rng) {
        return rng.startContainer.nodeType === 3
            && rng.startContainer.nodeValue.length >= rng.startOffset
            && rng.startContainer.nodeValue[rng.startOffset] === '\u00A0';
    }
}
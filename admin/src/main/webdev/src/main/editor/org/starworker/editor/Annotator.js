import Option from "./util/Option";
import Objects from "./util/Objects";
import Tools from "./util/Tools";
import DOMUtils from "./dom/DOMUtils";
import AnnotationChanges from "./annotate/AnnotationChanges";
import AnnotationFilter from "./annotate/AnnotationFilter";
import AnnotationsRegistry from "./annotate/AnnotationsRegistry";
import Identification from "./annotate/Identification";
import Wrapping from "./annotate/Wrapping";

export default class Annotator {
    constructor(editor) {
        this.editor = editor;
        this._registry = AnnotationsRegistry.create();
        this._changes = AnnotationChanges.setup(editor, this._registry);

        AnnotationFilter.setup(editor, this._registry);
    }

    register(name, settings) {
        this._registry.register(name, settings);
    }
    
    annotate(name, data) {
        this._registry.lookup(name).each((settings) => {
            Wrapping.annotateWithBookmark(editor, name, settings, data);
        });
    }
   
    annotationChanged(name, callback) {
        this._changes.addListener(name, callback);
    }
    
    remove(name) {
        Identification.identify(editor, Option.some(name)).each((a) => {
            Tools.each(a.elements, DOMUtils.unwrap);
        });
    }

    getAll(name) {
        return Objects.map(Identification.findAll(editor, name), (elems) => Tools.map(elems, (elem) => elem.dom()));
    }
}
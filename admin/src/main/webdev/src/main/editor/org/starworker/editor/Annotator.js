import Option from "./util/Option";
import Objects from "./util/Objects";
import Tools from "./util/Tools";
import DOMUtils from "./dom/DOMUtils";
import AnnotationChanges from "./annotate/AnnotationChanges";
import AnnotationFilter from "./annotate/AnnotationFilter";
import AnnotationsRegistry from "./annotate/AnnotationsRegistry";
import Identification from "./annotate/Identification";
import Wrapping from "./annotate/Wrapping";

export default function (editor) {
    var registry = AnnotationsRegistry.create();
    AnnotationFilter.setup(editor, registry);
    var changes = AnnotationChanges.setup(editor, registry);
    return {
        /**
         * Registers a specific annotator by name
         *
         * @method register
         * @param {String} name the name of the annotation
         * @param {Object} settings settings for the annotation (e.g. decorate)
         */
        register: function (name, settings) {
            registry.register(name, settings);
        },
        /**
         * Applies the annotation at the current selection using data
         *
         * @method annotate
         * @param {String} name the name of the annotation to apply
         * @param {Object} data information to pass through to this particular
         * annotation
         */
        annotate: function (name, data) {
            registry.lookup(name).each(function (settings) {
                Wrapping.annotateWithBookmark(editor, name, settings, data);
            });
        },
        /**
         * Executes the specified callback when the current selection matches the annotation or not.
         *
         * @method annotationChanged
         * @param {String} name Name of annotation to listen for
         * @param {function} callback Calback with (state, name, and data) fired when the annotation
         * at the cursor changes. If state if false, data will not be provided.
         */
        annotationChanged: function (name, callback) {
            changes.addListener(name, callback);
        },
        /**
         * Removes any annotations from the current selection that match
         * the name
         *
         * @param remove
         * @param {String} name the name of the annotation to remove
         */
        remove: function (name) {
            Identification.identify(editor, Option.some(name)).each(function (_a) {
                var elements = _a.elements;
                Tools.each(elements, DOMUtils.unwrap);
            });
        },
        /**
         * Retrieve all the annotations for a given name
         *
         * @method getAll
         * @param {String} name the name of the annotations to retrieve
         * @return {Object} an index of annotations from uid => DOM nodes
         */
        getAll: function (name) {
            var directory = Identification.findAll(editor, name);
            return Objects.map(directory, function (elems) { return Tools.map(elems, function (elem) { return elem.dom(); }); });
        }
    };
}
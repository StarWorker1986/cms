import Option from "../util/Option";

export default class Markings {
    static get annotation() {
        return Option.constant("editor-annotation");
    }

    static get dataAnnotation() {
        return Option.constant("data-editor-annotation");
    }

    static get dataAnnotationId() {
        return Option.constant("data-editor-annotation-uid");
    }
}
import Option from "../util/Option";

class Annotation {
    constructor() {
        this._annotations = {};
    }

    register(name, settings) {
        this._annotations[name] = {
            name: name,
            settings: settings
        };
    }

    lookup(name) {
        return this._annotations.hasOwnProperty(name) ? Option.from(this._annotations[name]).map((a) => a.settings) : Option.none();
    }
}

export default class AnnotationsRegistry {
    static create() {
        return new Annotation();
    }
}
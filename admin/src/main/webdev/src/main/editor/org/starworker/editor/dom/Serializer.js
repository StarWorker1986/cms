import DomSerializer from "./DomSerializer";

export default class Serializer {
    constructor(settings, editor) {
        this._domSerializer = new DomSerializer(settings, editor);
    }

    get schema() {
        return this._domSerializer.schema;
    }

    get addNodeFilter() {
        return this._domSerializer.addNodeFilter;
    }

    get addAttributeFilter() {
        return this._domSerializer.addAttributeFilter;
    }

    get serialize() {
        return this._domSerializer.serialize;
    }

    get addRules() {
        return this._domSerializer.addRules;
    }

    get setRules() {
        return this._domSerializer.setRules;
    }

    get addTempAttr() {
        return this._domSerializer.addTempAttr;
    }

    get getTempAttrs() {
        return this._domSerializer.getTempAttrs;
    }
}
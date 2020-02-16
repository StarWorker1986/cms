export default class IconManager {
    constructor() {
        this._lookup = {};
    }

    add(id, iconPack) {
        this._lookup[id] = iconPack;
    }

    get(id) {
        if (this._lookup[id]) {
            return this._lookup[id];
        }
        return { icons: {} };
    }

    static get iconManager() {
        return new IconManager();
    }
}
import ScriptLoader from "./dom/ScriptLoader";
import Tools from "./util/Tools";
import ArrUtils from "./util/ArrUtils";
import I18n from "./util/I18n";

export default class AddOnManager {
    constructor(baseUrl) {
        this._items = [];
        this._urls = {};
        this._lookup = {};
        this._listeners = [];
        this._languageLoad = false;
        this._baseUrl = baseUrl;
    }

    get items() {
        return this._items;
    }

    get urls() {
        return this._urls;
    }

    get lookup() {
        return this._lookup;
    }

    get listeners() {
        return this._listeners;
    }

    add(id, addOn, dependencies) {
        this._items.push(addOn);
        this._lookup[id] = { instance: addOn, dependencies: dependencies };
        
        let result = Tools.partition(this._listeners, (listener) => listener.name === id);
        _listeners = result.fail;
        ArrUtils.each(result.pass, (listener) => listener.callback());

        return addOn;
    }

    addComponents(pluginName, scripts) {
        let pluginUrl = this._urls[pluginName];
        ArrUtils.each(scripts, (script) => ScriptLoader.scriptLoader.add(pluginUrl + '/' + script));
    }

    createUrl(baseUrl, dep) {
        if (typeof dep === "object") {
            return dep;
        }

        return typeof baseUrl === "string" ? { prefix: '', resource: dep, suffix: '' }
                                           : { prefix: baseUrl.prefix, resource: dep, suffix: baseUrl.suffix };
    }

    dependencies(name) {
        let result;
        if (this._lookup[name]) {
            result = this._lookup[name].dependencies;
        }
        return result || [];
    }

    get(name) {
        if (this._lookup[name]) {
            return this._lookup[name].instance;
        }
        return undefined;
    }

    load(name, addOnUrl, success, scope, failure) {
        if (this._urls[name]) {
            return;
        }

        let urlString = typeof addOnUrl === "string" ? addOnUrl : addOnUrl.prefix + addOnUrl.resource + addOnUrl.suffix;
        if (urlString.indexOf('/') !== 0 && urlString.indexOf("://") === -1) {
            urlString = this._baseURL + "/" + urlString;
        }

        this._urls[name] = urlString.substring(0, urlString.lastIndexOf('/'));
        if (this._lookup[name]) {
            this.__loadDependencies(name, addOnUrl, success, scope);
        }
        else {
            ScriptLoader.scriptLoader.add(urlString, () => this.__loadDependencies(name, addOnUrl, success, scope), scope, failure);
        }
    }

    requireLangPack(name, languages) {
        let language = I18n.i18n.getCode();

        if (language) {
            if (languages) {
                languages = ',' + languages + ',';

                // Load short form sv.js or long form sv_SE.js
                if (languages.indexOf(',' + language.substr(0, 2) + ',') !== -1) {
                    language = language.substr(0, 2);
                }
                else if (languages.indexOf(',' + language + ',') === -1) {
                    return;
                }
            }
            ScriptLoader.scriptLoader.add(urls[name] + "/langs/" + language + ".js");
        }
    }

    remove(name) {
        delete this._urls[name];
        delete this._lookup[name];
    }

    waitFor(name, callback) {
        if (this._lookup.hasOwnProperty(name)) {
            callback();
        }
        else {
            this._listeners.push({ name: name, callback: callback });
        }
    }

    static get pluginManager() {
        return new AddOnManager();
    }

    static get themeManager() {
        return new AddOnManager();
    }

    __loadDependencies(name, addOnUrl, success, scope) {
        let deps = this.dependencies(name);
        ArrUtils.each(deps, (dep) => {
            let newUrl = this.createUrl(addOnUrl, dep);
            this.load(newUrl.resource, newUrl, undefined, undefined);
        });

        if (success) {
            if (scope) {
                success.call(scope);
            }
            else {
                success.call(ScriptLoader);
            }
        }
    }
}
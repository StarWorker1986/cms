import ObjectUtil from "util/ObjectUtil";

let isObject = ObjectUtil.isObject, 
    isArry = ObjectUtil.isArry, 
    isString = ObjectUtil.isString;

export default class Stream {
	constructor(obj) {
		this.obj = obj;
	}

	static of(obj) {
		return new Stream(obj);
	}

	forEach(callback) {
        let obj = this.obj;
        
		if(isArry(obj) || isString(obj)) {
			for(let i = 0; i < obj.length; i++) {
				if(callback(i, obj[i]) === false) {
					break;
				}
			}
		}
		else if(isObject(obj)) {
			for(let key in obj) {
				if(callback(key, obj[key]) === false) {
					break;
				}
			}
		}
	}
}
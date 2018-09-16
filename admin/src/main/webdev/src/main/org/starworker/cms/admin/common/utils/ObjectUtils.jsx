export default class ObjectUtils {
	static join(arry, separator) {
        if(arry == null || arry.length === 0) {
            return '';
        }

        for(let i = 0; i < arry.length; i++) {
            if(arry[i] == null) {
                arry.splice(i, 1);
            }
        }

        return arry.join(separator);
    }

	static formObject(key, value, defaultValue) {
		value = value || defaultValue;

		if(key == null || value == null) {
			return null;
		}

		return { key: value };
	}

	static getIdGenerator(prefix) {
		return (function() {
			var id = 1;
			return {
				nextId: function() {
					return prefix + id++;
				}
			}
		})();
	}
}
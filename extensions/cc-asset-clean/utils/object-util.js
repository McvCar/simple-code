/**
 * 对象工具
 */
const ObjectUtil = {

    /**
     * 判断指定值是否是一个对象
     * @param {any} arg 参数
     */
    isObject(arg) {
        return Object.prototype.toString.call(arg) === '[object Object]';
    },

    /**
     * 对象中是否包含指定的属性
     * @param {object} object 对象
     * @param {any} name 属性名
     */
    containsProperty(object, name) {
        let result = false;
        const search = (_object) => {
            if (this.isObject(_object)) {
                for (const key in _object) {
                    if (key == name) {
                        result = true;
                        return;
                    }
                    search(_object[key]);
                }
            } else if (Array.isArray(_object)) {
                for (let i = 0; i < _object.length; i++) {
                    search(_object[i]);
                }
            }
        }
        search(object);
        return result;
    },

    /**
     * 对象中是否包含指定的值
     * @param {object} object 对象
     * @param {any} value 值
     */
    containsValue(object, value) {
        let result = false;
        const search = (_object) => {
            if (this.isObject(_object)) {
                for (const key in _object) {
                    if (_object[key] === value) {
                        result = true;
                        return;
                    }
                    search(_object[key]);
                }
            } else if (Array.isArray(_object)) {
                for (let i = 0; i < _object.length; i++) {
                    search(_object[i]);
                }
            }
        }
        search(object);
        return result;
    }

}

module.exports = ObjectUtil;

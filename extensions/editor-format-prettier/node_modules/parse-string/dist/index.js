"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toValue = exports.formatData = exports.parseBody = exports.parseData = exports.checkLength = exports.errorInfo = exports.validSign = exports.filterData = void 0;
var lodash_1 = require("lodash");
var rule_judgment_1 = require("rule-judgment");
var MD5 = require("md5.js");
function filterData(options, customize) {
    return function (data, errorCode) {
        var e_1, _a;
        var values = {};
        var _loop_1 = function (item) {
            var key = item.key, type = item.type, rules = item.rules, format = item.format, defaultValue = item.defaultValue, md5 = item.md5, separator = item.separator;
            var value = data[key];
            if (/\[\]$/.test(type) && !lodash_1.isArray(value)) {
                value = toValue('string')(value || '').split(separator || /\,/);
            }
            if (/\[\]$/.test(type) && lodash_1.isArray(value)) {
                var _a = __read(type.match(/(\S+)(\[\])$/), 2), itype = _a[1];
                value = lodash_1.compact(value).map(toValue(itype));
                if (rules) {
                    value.forEach(function (v) { return validateRule(rules || [], customize)(v, errorCode); });
                }
                if (defaultValue && value.length === 0) {
                    value = defaultValue;
                }
                if (format) {
                    value = value.map(formatData(format, customize));
                }
            }
            else {
                value = toValue(type)(value);
                if (rules) {
                    validateRule(rules, customize)(value, errorCode);
                }
                value = value || defaultValue;
                if (format) {
                    value = formatData(format, customize)(value);
                }
                if (md5) {
                    value = new MD5().update(lodash_1.template(md5)(values)).digest('hex');
                }
            }
            lodash_1.set(values, key, value);
        };
        try {
            for (var options_1 = __values(options), options_1_1 = options_1.next(); !options_1_1.done; options_1_1 = options_1.next()) {
                var item = options_1_1.value;
                _loop_1(item);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (options_1_1 && !options_1_1.done && (_a = options_1.return)) _a.call(options_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return values;
    };
}
exports.filterData = filterData;
function validSign(options, sign) {
    if (sign === void 0) { sign = 'sign'; }
    return function (data) {
        var md5 = new MD5().update(lodash_1.template(options)(data)).digest('hex');
        return data[sign] === md5;
    };
}
exports.validSign = validSign;
function validateRule(rules, customize) {
    return function (value, errorCode) {
        var e_2, _a;
        try {
            for (var rules_1 = __values(rules), rules_1_1 = rules_1.next(); !rules_1_1.done; rules_1_1 = rules_1.next()) {
                var rule = rules_1_1.value;
                var required = rule.required, message = rule.message, min = rule.min, max = rule.max, pattern = rule.pattern, validator = rule.validator, code = rule.code;
                if (required && (lodash_1.isUndefined(value) || value === '')) {
                    throw errorInfo(message, code || errorCode);
                }
                if (lodash_1.isString(value)) {
                    if (min && checkLength(value) < min) {
                        throw errorInfo(message, code || errorCode);
                    }
                    if (max && checkLength(value) > max) {
                        throw errorInfo(message, code || errorCode);
                    }
                    if (pattern) {
                        var reg = getRegexp(pattern);
                        if (!reg.test(value)) {
                            throw errorInfo(message, code || errorCode);
                        }
                    }
                }
                if (validator && lodash_1.isString(validator)) {
                    if (customize && Object.keys(customize).includes(validator)) {
                        validator = customize[validator];
                    }
                }
                if (validator && lodash_1.isFunction(validator)) {
                    if (!validator(value) || String(value) === 'Invalid Date') {
                        throw errorInfo(message, code || errorCode);
                    }
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (rules_1_1 && !rules_1_1.done && (_a = rules_1.return)) _a.call(rules_1);
            }
            finally { if (e_2) throw e_2.error; }
        }
    };
}
function errorInfo(message, code) {
    var error = new Error(message);
    if (code) {
        error.code = code;
    }
    return error;
}
exports.errorInfo = errorInfo;
function checkLength(str) {
    var e_3, _a;
    var size = 0;
    if (lodash_1.isNull(str))
        return size;
    var arr = str.split('');
    try {
        for (var arr_1 = __values(arr), arr_1_1 = arr_1.next(); !arr_1_1.done; arr_1_1 = arr_1.next()) {
            var word = arr_1_1.value;
            size++;
            (/[^\x00-\xff]/g.test(word)) && size++;
        }
    }
    catch (e_3_1) { e_3 = { error: e_3_1 }; }
    finally {
        try {
            if (arr_1_1 && !arr_1_1.done && (_a = arr_1.return)) _a.call(arr_1);
        }
        finally { if (e_3) throw e_3.error; }
    }
    return size;
}
exports.checkLength = checkLength;
function parseData(options, customize) {
    return function (data) {
        var e_4, _a;
        if (!options)
            return data;
        var separator = options.separator, collection = options.collection, omits = options.omits;
        var list = data.split(separator);
        var notResults = collection.filter(rule_judgment_1.default({ result: { $exists: false } }));
        var values = list.map(function (v, i) {
            var _a = notResults[i] || {}, type = _a.type, format = _a.format;
            var value = formatData(format, customize)(toValue(type)(v));
            return value;
        });
        var obj = lodash_1.zipObject(lodash_1.map(collection, 'key'), values);
        var results = collection.filter(rule_judgment_1.default({ result: { $exists: true } }));
        try {
            for (var results_1 = __values(results), results_1_1 = results_1.next(); !results_1_1.done; results_1_1 = results_1.next()) {
                var item = results_1_1.value;
                lodash_1.set(obj, item.key, formatData(item.format, customize)(getResultValue(item.result, customize)(obj)));
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (results_1_1 && !results_1_1.done && (_a = results_1.return)) _a.call(results_1);
            }
            finally { if (e_4) throw e_4.error; }
        }
        return lodash_1.omit(obj, omits || []);
    };
}
exports.parseData = parseData;
function parseBody(options, customize) {
    return function (msgbody) {
        if (!options)
            return msgbody;
        for (var key in msgbody) {
            var opts = options.find(rule_judgment_1.default({ key: key }));
            if (opts) {
                var parser = parseData(opts, customize);
                var value = msgbody[key];
                if (lodash_1.isArray(value)) {
                    value = value.map(parser);
                    if (opts.orderBy) {
                        var _a = opts.orderBy, iteratees = _a.iteratees, orders = _a.orders;
                        value = lodash_1.orderBy(value, iteratees, orders);
                    }
                }
                else {
                    parser(value);
                }
                lodash_1.set(msgbody, key, value);
            }
        }
        return msgbody;
    };
}
exports.parseBody = parseBody;
function formatData(formats, customize) {
    return function (value) {
        var e_5, _a;
        formats = lodash_1.isArray(formats) ? formats : lodash_1.compact([formats]);
        if (formats.length === 0)
            return value;
        try {
            for (var formats_1 = __values(formats), formats_1_1 = formats_1.next(); !formats_1_1.done; formats_1_1 = formats_1.next()) {
                var format = formats_1_1.value;
                value = formatUtil(format, customize)(value);
            }
        }
        catch (e_5_1) { e_5 = { error: e_5_1 }; }
        finally {
            try {
                if (formats_1_1 && !formats_1_1.done && (_a = formats_1.return)) _a.call(formats_1);
            }
            finally { if (e_5) throw e_5.error; }
        }
        return value;
    };
}
exports.formatData = formatData;
function formatUtil(format, customize) {
    return function (value) {
        if (!format)
            return value;
        var val = toValue(format.type)(value);
        if (format.regexp && lodash_1.isString(val)) {
            val = formatUtilRegexp(format.regexp, format.substr || '')(val);
        }
        else if (format.maps) {
            val = formatUtilMap(format.maps)(val);
        }
        else if (format.func) {
            val = formatUtilFunc(format.func, format.options, customize)(val);
        }
        return val;
    };
}
function formatUtilRegexp(regexp, substr) {
    return function (value) { return value.replace(getRegexp(regexp), substr); };
}
function formatUtilMap(options) {
    return function (value) {
        if (lodash_1.isString(options) && lodash_1.isPlainObject(value)) {
            return lodash_1.get(value, options);
        }
        if (lodash_1.isNumber(options) && lodash_1.isArray(value)) {
            return value[options] || value;
        }
        if (lodash_1.isPlainObject(options) && ['string', 'number'].includes(typeof value)) {
            return options[value] || value;
        }
        return value;
    };
}
function formatUtilFunc(name, options, customize) {
    return function (value) {
        try {
            value = value[name || 'toLocaleString'].apply(value, __spread(options || []));
        }
        catch (error) {
            if (customize && Object.keys(customize).includes(name)) {
                value = customize[name].apply(customize, __spread([value], options || []));
            }
        }
        return value;
    };
}
function getResultValue(options, customize) {
    return function (data) {
        var defaultValue = options.defaultValue, formula = options.formula;
        if (formula) {
            var exec = formula.exec;
            var opts = (formula.opts || []).map(getValue(data, customize));
            if (typeof exec === 'function') {
                return exec.apply(void 0, __spread(opts));
            }
            if (customize && Object.keys(customize).includes(exec)) {
                return customize[exec].apply(customize, __spread(opts));
            }
        }
        return getValue(data, customize)(defaultValue);
    };
}
function getValue(data, customize) {
    return function (value) {
        if (lodash_1.isString(value) && /^\$(\_){2}/.test(value)) {
            var _a = __read(value.match(/^\$(\_){2}([a-zA-Z0-9\_\-\.]+)/) || [], 3), key = _a[2];
            return lodash_1.get(data, key);
        }
        if (lodash_1.isArray(value)) {
            var _b = __read(value), exec = _b[0], opts = _b.slice(1);
            if (customize && Object.keys(customize).includes(exec)) {
                return customize[exec].apply(customize, __spread(opts));
            }
        }
        return value;
    };
}
function getRegexp(regexp) {
    if (lodash_1.isRegExp(regexp))
        return regexp;
    try {
        return new RegExp(regexp);
    }
    catch (error) {
        throw Error("This is not a regular expression.");
    }
}
function toValue(type) {
    if (type === void 0) { type = 'string'; }
    return function (value) {
        if (type === 'any')
            return value;
        var val = value;
        if (lodash_1.isString(value)) {
            if (/^([\d\.]+)\%$/.test(value)) {
                val = Number(value.replace(/\%$/i, '')) / 100;
                val = String(val);
            }
            else if (type === 'date') {
                val = new Date(rule_judgment_1.isDateString(value) ? value : (/^\d+$/.test(value) ? Number(value) : value));
            }
            else if (type === 'map') {
                try {
                    val = rule_judgment_1.emit(value);
                }
                catch (error) {
                    val = undefined;
                }
            }
        }
        else {
            if (type === 'string' && !lodash_1.isUndefined(value)) {
                val = lodash_1.isPlainObject(value) ? JSON.stringify(value) : String(value);
            }
            else if (type === 'date' && lodash_1.isNumber(value)) {
                val = new Date(value);
            }
        }
        if (type === 'number') {
            if (lodash_1.isString(val) && !/^\d+$/.test(val) && rule_judgment_1.isDateString(val)) {
                val = new Date(val);
            }
            val = Number(val);
        }
        return val;
    };
}
exports.toValue = toValue;

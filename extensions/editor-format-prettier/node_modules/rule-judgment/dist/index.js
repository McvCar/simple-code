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
exports.parseAssign = exports.emit = exports.isDateString = void 0;
var lodash_1 = require("lodash");
var __BigInt;
try {
    __BigInt = BigInt;
}
catch (error) {
    __BigInt = Number;
}
var operators = {
    $lt: function (a, b) { return toValue(a) < toValue(b); },
    $lte: function (a, b) { return toValue(a) <= toValue(b); },
    $gt: function (a, b) { return toValue(a) > toValue(b); },
    $gte: function (a, b) { return toValue(a) >= toValue(b); },
    $eq: function (a, b) { return lodash_1.isEqual(toValue(a), toValue(b)); },
    $ne: function (a, b) { return !lodash_1.isEqual(toValue(a), toValue(b)); },
    $regex: function (a, reg) { return reg.test(a); },
    $mod: function (a, mod) {
        var _a = __read(mod, 2), x = _a[0], y = _a[1];
        return __BigInt(a) % __BigInt(x || 0) === __BigInt(y || 0);
    },
    $in: function (a, b) {
        if (lodash_1.isArray(a)) {
            return lodash_1.intersection(toValue(a), toValue(b)).length > 0;
        }
        return toValue(b).includes(toValue(a));
    },
    $nin: function (a, b) {
        if (lodash_1.isArray(a)) {
            return lodash_1.intersection(toValue(a), toValue(b)).length === 0;
        }
        return !toValue(b).includes(toValue(a));
    },
    $_in: function (a, b) {
        if (lodash_1.isArray(b)) {
            return lodash_1.intersection(toValue(a), toValue(b)).length > 0;
        }
        return toValue(a).includes(toValue(b));
    },
    $_nin: function (a, b) {
        if (lodash_1.isArray(b)) {
            return lodash_1.intersection(toValue(a), toValue(b)).length === 0;
        }
        return !toValue(a).includes(toValue(b));
    },
    $size: function (a, query) {
        if (lodash_1.isNumber(query)) {
            return a.length === query;
        }
        return calculation(a.length, query);
    },
    $exists: function (a, exists) { return (lodash_1.isNull(a) || lodash_1.isUndefined(a)) != exists; },
    $type: function (a, type) { return typeof a === type; },
    $not: function (a, query) { return !calculation(a, query); },
    $or: function () {
        var __result = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            __result[_i] = arguments[_i];
        }
        return emit(__result.map(String).join(' || '));
    },
    $nor: function () {
        var __result = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            __result[_i] = arguments[_i];
        }
        return !emit(__result.map(String).join(' || '));
    },
    $and: function () {
        var __result = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            __result[_i] = arguments[_i];
        }
        return emit(__result.map(String).join(' && '));
    }
};
function isDateString(value) {
    var date = new Date(value);
    return String(date) === 'Invalid Date' ? false : true;
}
exports.isDateString = isDateString;
function toValue(value) {
    var val = value;
    if (typeof value === 'number') {
        val = __BigInt(value);
    }
    else if (lodash_1.isString(value) && isDateString(value)) {
        val = new Date(value).getTime();
    }
    else if (lodash_1.isDate(value)) {
        val = value.getTime();
    }
    else if (lodash_1.isArray(value)) {
        val = value.map(toValue);
    }
    return val;
}
function calculation(data, query) {
    var e_1, _a;
    var __result = [];
    try {
        for (var _b = __values(lodash_1.toPairs(query)), _c = _b.next(); !_c.done; _c = _b.next()) {
            var pairs = _c.value;
            var _d = __read(pairs, 2), operator = _d[0], value = _d[1];
            if (['$and', '$or', '$nor'].includes(operator)) {
                __result.push(calculationJoin(data, value, operator));
            }
            else if (operator === '$where') {
                __result.push(query['$where'](data));
            }
            else if (/^\$/.test(operator)) {
                __result.push(operators[operator](data, value));
            }
            else if (lodash_1.isPlainObject(value)) {
                if (/^\$/.test(operator)) {
                    __result.push(calculation(data, value));
                }
                else {
                    __result.push(calculation(lodash_1.result(data, operator), value));
                }
            }
            else {
                __result.push(operators.$eq(lodash_1.result(data, operator), value));
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_1) throw e_1.error; }
    }
    return operators.$and.apply(operators, __spread(__result));
}
function calculationJoin(data, query, mode) {
    var e_2, _a;
    if (mode === void 0) { mode = '$and'; }
    var __result = [];
    try {
        for (var query_1 = __values(query), query_1_1 = query_1.next(); !query_1_1.done; query_1_1 = query_1.next()) {
            var item = query_1_1.value;
            for (var key in item) {
                __result.push(calculation(data, item));
            }
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (query_1_1 && !query_1_1.done && (_a = query_1.return)) _a.call(query_1);
        }
        finally { if (e_2) throw e_2.error; }
    }
    return operators[mode].apply(operators, __spread(__result));
}
function judgment(data, query, options) {
    if (lodash_1.isEmpty(query))
        return true;
    query = parseAssign(query, options);
    var __result = [];
    for (var key in query) {
        if (['$and', '$or', '$nor'].includes(key)) {
            __result.push(calculationJoin(data, query[key], key));
        }
        else {
            __result.push(calculation(data, lodash_1.isPlainObject(query[key]) && !isOperator(query[key]) ? query[key] : query));
        }
    }
    return operators.$and.apply(operators, __spread(__result));
}
function isOperator(query) {
    var e_3, _a;
    try {
        for (var _b = __values(Object.keys(query)), _c = _b.next(); !_c.done; _c = _b.next()) {
            var key = _c.value;
            if (/^\$/.test(key)) {
                return true;
            }
        }
    }
    catch (e_3_1) { e_3 = { error: e_3_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_3) throw e_3.error; }
    }
    return false;
}
function emit(value) {
    var fn = Function;
    return new fn('return ' + value)();
}
exports.emit = emit;
function parseAssign(data, options) {
    var e_4, _a;
    if (!lodash_1.isPlainObject(options))
        return data;
    var str = JSON.stringify(data);
    try {
        for (var _b = __values(lodash_1.toPairs(options)), _c = _b.next(); !_c.done; _c = _b.next()) {
            var item = _c.value;
            var _d = __read(assign.apply(void 0, __spread(item)), 2), search = _d[0], value = _d[1];
            if (/^\$/.test(item[0])) {
                str = str.replace(search, value);
            }
        }
    }
    catch (e_4_1) { e_4 = { error: e_4_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_4) throw e_4.error; }
    }
    return JSON.parse(str);
}
exports.parseAssign = parseAssign;
function assign(key, value) {
    var search;
    var str = /^\$/.test(key) ? "\\" + key : key;
    if (lodash_1.isString(value)) {
        search = new RegExp("" + str, 'gi');
    }
    else {
        search = new RegExp("\\\"(" + str + ")\\\"", 'gi');
    }
    return [search, value];
}
function ruleJudgment(query, options) {
    return function (data) {
        return judgment(data, query, options);
    };
}
exports.default = ruleJudgment.bind(this);


import { isEqual, isString, isDate, isArray, intersection, toPairs, isPlainObject, isEmpty, isUndefined, isNumber, isNull, result } from 'lodash'

let __BigInt
try {
  __BigInt = BigInt as Function
} catch (error) {
  __BigInt = Number
}

/**
 * 操作符
 */
const operators = {
  /**
   * 小于
   */
  $lt: (a: number | bigint | Date, b: number | bigint | Date) => toValue(a) < toValue(b),
  /**
   * 小于等于
   */
  $lte: (a: number | bigint | Date, b: number | bigint | Date) => toValue(a) <= toValue(b),
  /**
   * 大于
   */
  $gt: (a: number | bigint | Date, b: number | bigint | Date) => toValue(a) > toValue(b),
  /**
   * 大于等于
   */
  $gte: (a: number | bigint | Date, b: number | bigint | Date) => toValue(a) >= toValue(b),
  /**
   * 等于
   */
  $eq: (a: any, b: any) => isEqual(toValue(a), toValue(b)),
  /**
   * 不等于
   */
  $ne: (a: any, b: any) => !isEqual(toValue(a), toValue(b)),
  /**
   * 正则匹配
   */
  $regex: (a: string, reg: RegExp) => reg.test(a),
  /**
   * 取模运算
   */
  $mod: (a: number | bigint, mod: number[]) => {
    let [ x, y ] = mod
    return __BigInt(a) % __BigInt(x || 0) === __BigInt(y || 0)
  },
  /**
   * 包含
   */
  $in: (a: any, b: any[]): boolean => {
    if (isArray(a)) {
      return intersection(toValue(a), toValue(b)).length > 0
    }
    return toValue(b).includes(toValue(a))
  },
  /**
   * 不包含
   */
  $nin: (a: any, b: any[]): boolean => {
    if (isArray(a)) {
      return intersection(toValue(a), toValue(b)).length === 0
    }
    return !toValue(b).includes(toValue(a))
  },
  /**
   * 反包含
   */
  $_in: (a: any[], b: any): boolean => {
    if (isArray(b)) {
      return intersection(toValue(a), toValue(b)).length > 0
    }
    return toValue(a).includes(toValue(b))
  },
  /**
   * 反不包含
   */
  $_nin: (a: any[], b: any): boolean => {
    if (isArray(b)) {
      return intersection(toValue(a), toValue(b)).length === 0
    }
    return !toValue(a).includes(toValue(b))
  },
  /**
   * 数组长度
   */
  $size: (a: any[], query: Partial<any> | number) => {
    if (isNumber(query)) {
      return a.length === query
    }
    return calculation(a.length, query)
  },
  /**
   * 判断字段是否存在
   */
  $exists: (a: any, exists: boolean) => (isNull(a) || isUndefined(a)) != exists,
  /**
   * 判断类型
   */
  $type: (a: any, type: string) => typeof a === type,
  /**
   * Not 连接
   */
  $not: (a: any, query: Partial<any>) => !calculation(a, query),
  /**
   * Or 连接
   */
  $or: (...__result: boolean[]) => emit(__result.map(String).join(' || ')),
  /**
   * Nor 连接
   */
  $nor: (...__result: boolean[]) => !emit(__result.map(String).join(' || ')),
  /**
   * And 连接
   */
  $and: (...__result: boolean[]) => emit(__result.map(String).join(' && '))
}

/**
 * 判断 DateString
 * @param value 
 */
export function isDateString (value: string): boolean {
  let date = new Date(value)
  return String(date) === 'Invalid Date' ? false : true
}

/**
 * 转换数值
 * @param value 
 */
function toValue (value: any): any {
  let val = value
  if (typeof value === 'number') {
    val = __BigInt(value)
  }
  else if (isString(value) && isDateString(value)) {
    val = new Date(value).getTime()
  }
  else if (isDate(value)) {
    val = value.getTime()
  }
  else if (isArray(value)) {
    val = value.map(toValue)
  }
  return val
}

/**
 * 运算操作
 * @param data 
 * @param query 
 */
function calculation (data: any, query: Partial<any>): boolean {
  let __result: boolean[] = []
  for (let pairs of toPairs(query)) {
    let [ operator, value ] = pairs
    if (['$and', '$or', '$nor'].includes(operator)) {
      __result.push(calculationJoin(data, value, operator as '$and' | '$or' | '$nor'))
    }
    else if (operator === '$where') {
      __result.push(query['$where'](data))
    }
    else if (/^\$/.test(operator)) {
      __result.push(operators[operator](data, value))
    }
    else if (isPlainObject(value)) {
      if (/^\$/.test(operator)) {
        __result.push(calculation(data, value))
      }
      else {
        __result.push(calculation(result(data, operator), value))
      }
    }
    else {
      __result.push(operators.$eq(result(data, operator), value))
    }
  }
  return operators.$and(...__result)
}

/**
 * 运算操作连接
 * @param data 
 * @param query 
 * @param mode 
 */
function calculationJoin (data: any, query: Array<Partial<any>>, mode: '$and' | '$or' | '$nor' = '$and'): boolean {
  let __result: boolean[] = []
  for (let item of query) {
    for (let key in item) {
      __result.push(calculation(data, item))
    }
  }
  return operators[mode](...__result)
}

function judgment (data: any, query: Partial<any>, options?: Partial<any>): boolean {
  if (isEmpty(query)) return true
  query = parseAssign(query, options)
  let __result: boolean[] = []
  for (let key in query) {
    if (['$and', '$or', '$nor'].includes(key)) {
      __result.push(calculationJoin(data, query[key], key as '$and' | '$or' | '$nor'))
    }
    else {
      __result.push(calculation(data, isPlainObject(query[key]) && !isOperator(query[key]) ? query[key] : query))
    }
  }
  return operators.$and(...__result)
}

function isOperator (query: Partial<any>): boolean {
  for (let key of Object.keys(query)) {
    if (/^\$/.test(key)) {
      return true
    }
  }
  return false
}

export function emit (value: string): any {
  let fn = Function
  return new fn('return ' + value)()
}

export function parseAssign (data: any, options?: Partial<any>): any {
  if (!isPlainObject(options)) return data
  let str = JSON.stringify(data)
  for (let item of toPairs(options)) {
    let [ search, value ] = assign(...item)
    if (/^\$/.test(item[0])) {
      str = str.replace(search, value)
    }
  }
  return JSON.parse(str)
}

function assign (key: string, value: any): [ RegExp, any ] {
  let search: RegExp
  let str = /^\$/.test(key) ? `\\${key}` : key
  if (isString(value)) {
    search = new RegExp(`${str}`, 'gi')
  }
  else {
    search = new RegExp(`\\"(${str})\\"`, 'gi')
  }
  return [ search, value ]
}

function ruleJudgment (query: Partial<any>, options?: Partial<any>): (data: any) => boolean {
  return function (data: any): boolean {
    return judgment(data, query, options)
  }
}

export default ruleJudgment.bind(this)

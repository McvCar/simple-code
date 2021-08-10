import { isString, isPlainObject, isNumber, isRegExp, isArray, compact, get, zipObject, map, omit, set, orderBy, isUndefined, isNull, isFunction, template } from 'lodash'
import { ParseData, FilterData } from '../types'
import ruleJudgment, { emit, isDateString } from 'rule-judgment'
import * as MD5 from 'md5.js'

/**
 * 过滤数据
 * @param options 
 * @param customize 
 */
export function filterData (options: FilterData.options[], customize?: Record<string, Function>): (data: Record<string, any>, errorCode?: number) => Record<string, any> {
  return (data: Record<string, any>, errorCode?: number) => {
    let values: Record<string, any> = {}
    for (let item of options) {
      let { key, type, rules, format, defaultValue, md5, separator } = item
      let value = data[key]
      if (/\[\]$/.test(type) && !isArray(value)) {
        value = toValue('string')(value || '').split(separator || /\,/)
      }
      if (/\[\]$/.test(type) && isArray(value)) {
        let [, itype] = type.match(/(\S+)(\[\])$/)
        value = compact(value).map( toValue(itype as ParseData.parseType) )
        if (rules) {
          value.forEach( v => validateRule(rules || [], customize)(v, errorCode) )
        }
        if (defaultValue && value.length === 0) {
          value = defaultValue
        }
        if (format) {
          value = value.map( formatData(format, customize) )
        }
      }
      else {
        value = toValue(type as ParseData.parseType)(value)
        if (rules) {
          validateRule(rules, customize)(value, errorCode)
        }
        value = value || defaultValue
        if (format) {
          value = formatData(format, customize)(value)
        }
        if (md5) {
          value = new MD5().update( template(md5)(values) ).digest('hex')
        }
      }
      set(values, key, value)
    }
    return values
  }
}

/**
 * 验证签名
 * @param options 
 * @param sign 
 */
export function validSign (options: string, sign: string = 'sign'): (data: Record<string, any>) => boolean {
  return (data: Record<string, any>) => {
    let md5 = new MD5().update( template(options)(data) ).digest('hex')
    return data[sign] === md5
  }
}

/**
 * 验证规则
 * @param rules 
 * @param customize 
 */
function validateRule (rules: FilterData.rule[], customize?: Record<string, Function>): (value: any, errorCode?: number) => void {
  return (value: any, errorCode?: number) => {
    for (let rule of rules ) {
      let { required, message, min, max, pattern, validator, code } = rule
      if (required && (isUndefined(value) || value === '')) {
        throw errorInfo(message, code || errorCode)
      }
      if (isString(value)) {
        if (min && checkLength(value) < min) {
          throw errorInfo(message, code || errorCode)
        }
        if (max && checkLength(value) > max) {
          throw errorInfo(message, code || errorCode)
        }
        if (pattern) {
          let reg = getRegexp(pattern)
          if (!reg.test(value)) {
            throw errorInfo(message, code || errorCode)
          }
        }
      }
      if (validator && isString(validator)) {
        if (customize && Object.keys(customize).includes(validator)) {
          validator = customize[validator] as (value: any) => boolean
        }
      }
      if (validator && isFunction(validator)) {
        if (!validator(value) || String(value) === 'Invalid Date') {
          throw errorInfo(message, code || errorCode)
        }
      }
    }
  }
}

/**
 * 生成错误信息
 * @param message 
 * @param code 
 */
export function errorInfo (message: string, code?: number): FilterData.error {
  let error: FilterData.error = new Error(message)
  if (code) {
    error.code = code
  }
  return error
}

/**
 * 检测字符串长度，中文算2个字符
 * @param str string
 * @returns number
 */
export function checkLength (str: string): number {
  let size: number = 0
  if (isNull(str)) return size
  let arr: string[] = str.split('')
  for (let word of arr) {
    size++
    (/[^\x00-\xff]/g.test(word)) && size++
  }
  return size
}

/**
 * 解析字符串
 * @param options 
 * @param customize 
 */
export function parseData (options: ParseData.options, customize?: Record<string, Function>): (data: string) => Record<string, any> | string {
  return (data: string) => {
    if (!options) return data
    let { separator, collection, omits } = options
    let list = data.split(separator)
    let notResults = collection.filter( ruleJudgment({ result: { $exists: false } }) )
    let values: any[] = list.map( (v: string, i: number) => {
      let { type, format } = notResults[i] || {}
      let value = formatData(format, customize)(toValue(type)(v))
      return value
    })
    let obj = zipObject(map(collection, 'key'), values)
    let results = collection.filter( ruleJudgment({ result: { $exists: true } }) )
    for (let item of results) {
      set( obj, item.key, formatData(item.format, customize)(getResultValue(item.result!, customize)(obj)) )
    }
    return omit(obj, omits || [])
  }
}

/**
 * 解析一个MsgBody
 * @param options 
 * @param customize 
 */
export function parseBody (options: ParseData.parse[], customize?: Record<string, Function>): (msgbody: Record<string, any>) => Record<string, any> {
  return (msgbody: Record<string, any>) => {
    if (!options) return msgbody
    for (let key in msgbody) {
      let opts = options.find( ruleJudgment({ key }) )
      if (opts) {
        let parser = parseData(opts, customize)
        let value = msgbody[key]
        if (isArray(value)) {
          value = value.map( parser )
          if (opts.orderBy) {
            let { iteratees, orders } = opts.orderBy
            value = orderBy(value, iteratees, orders)
          }
        }
        else {
          parser(value)
        }
        set(msgbody, key, value)
      }
    }
    return msgbody
  }
}

/**
 * 格式化数据
 * @param formats 
 * @param customize 
 */
export function formatData (formats?: ParseData.format | ParseData.format[], customize?: Record<string, Function>): (value: any) => any {
  return (value: any) => {
    formats = isArray(formats) ? formats : compact([ formats ])
    if (formats.length === 0) return value
    for (let format of formats) {
      value = formatUtil(format, customize)(value)
    }
    return value
  }
}

/**
 * 格式化数据单元
 * @param format 
 * @param customize 
 */
function formatUtil (format?: ParseData.format, customize?: Record<string, Function>): (value: any) => any {
  return (value: any) => {
    if (!format) return value
    let val = toValue(format.type)(value)
    if (format.regexp && isString(val)) {
      val = formatUtilRegexp(format.regexp, format.substr || '')(val)
    }
    else if (format.maps) {
      val = formatUtilMap(format.maps)(val)
    }
    else if (format.func) {
      val = formatUtilFunc(format.func, format.options, customize)(val)
    }
    return val
  }
}

/**
 * 通过正则替换
 * @param regexp 
 * @param substr 
 */
function formatUtilRegexp (regexp: RegExp | string, substr: string): (value: string) => string {
  return (value: string) => value.replace(getRegexp(regexp), substr)
}

/**
 * 通过Map转换
 * @param options 
 */
function formatUtilMap (options: Record<string, any> | string | number): (value: any) => any {
  return (value: any) => {
    if (isString(options) && isPlainObject(value)) {
      return get(value, options)
    }
    if (isNumber(options) && isArray(value)) {
      return value[options] || value
    }
    if (isPlainObject(options) && ['string', 'number'].includes(typeof value)) {
      return options[value] || value
    }
    return value
  }
}

/**
 * 通过函数转换
 * @param name 
 * @param options 
 * @param customize 
 */
function formatUtilFunc (name: string, options?: any[] | null, customize?: Record<string, Function>): (value: any) => any {
  return (value: any) => {
    try {
      value = value[name || 'toLocaleString'](...options || [])
    } catch (error) {
      if (customize && Object.keys(customize).includes(name)) {
        value = customize[name](value, ...options || [])
      }
    }
    return value
  }
}

function getResultValue (options: ParseData.result, customize?: Record<string, Function>): (data: Record<string, any>) => any {
  return (data: Record<string, any>) => {
    let { defaultValue, formula } = options
    if (formula) {
      let { exec } = formula
      let opts = (formula.opts || []).map( getValue(data, customize) )
      if (typeof exec === 'function') {
        return exec(...opts)
      }
      if (customize && Object.keys(customize).includes(exec)) {
        return customize[exec](...opts)
      }
    }
    return getValue(data, customize)(defaultValue)
  }
}

function getValue (data: Record<string, any>, customize?: Record<string, Function>): (value: any) => any {
  return (value: any) => {
    if (isString(value) && /^\$(\_){2}/.test(value)) {
      let [,, key ] = value.match(/^\$(\_){2}([a-zA-Z0-9\_\-\.]+)/) || []
      return get(data, key)
    }
    if (isArray(value)) {
      let [ exec, ...opts ] = value
      if (customize && Object.keys(customize).includes(exec)) {
        return customize[exec](...opts)
      }
    }
    return value
  }
}

/**
 * 获取正则表达式
 * @param regexp 
 */
function getRegexp (regexp: RegExp | string): RegExp {
  if (isRegExp(regexp)) return regexp
  try {
    return new RegExp(regexp)
  } catch (error) {
    throw Error(`This is not a regular expression.`)
  }
}

/**
 * 转换指定类型值
 * @param type 'string' | 'number' | 'date' | 'map' | 'any', 默认值 'string'
 */
export function toValue (type: ParseData.parseType = 'string'): (value: any) => any {
  return (value: any) => {
    if (type === 'any') return value
    let val = value
    if (isString(value)) {
      if (/^([\d\.]+)\%$/.test(value)) {
        val = Number(value.replace(/\%$/i, '')) / 100
        val = String(val)
      }
      else if (type === 'date') {
        val = new Date(isDateString(value) ? value : (/^\d+$/.test(value) ? Number(value) : value))
      }
      else if (type === 'map') {
        try {
          val = emit(value)
        } catch (error) {
          val = undefined
        }
      }
    }
    else {
      if (type === 'string' && !isUndefined(value)) {
        val = isPlainObject(value) ? JSON.stringify(value) : String(value)
      }
      else if (type === 'date' && isNumber(value)) {
        val = new Date(value)
      }
    }
    if (type === 'number') {
      if (isString(val) && !/^\d+$/.test(val) && isDateString(val)) {
        val = new Date(val)
      }
      val = Number(val)
    }
    return val
  }
}
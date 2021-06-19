
export declare namespace ParseData {

  type parseType = 'string' | 'number' | 'date' | 'map' | 'any'

  interface parse extends options {
    key               : string
    orderBy          ?: orderBy
  }

  interface options {
    separator         : string | RegExp
    collection        : collection[]
    filter           ?: number[]
    omits            ?: string[]
  }

  interface collection {
    key               : string
    type             ?: parseType
    format           ?: format | format[]
    result           ?: result
    
  }

  interface format {
    type             ?: parseType
    regexp           ?: RegExp | string
    substr           ?: string
    func             ?: string
    options          ?: any[]
    maps             ?: Record<string, any> | string | number
  }

  interface result {
    defaultValue      : any
    formula          ?: formula
  }

  interface formula {
    exec              : Function | string
    opts             ?: any[]
  }

  interface orderBy {
    iteratees         : string[]
    orders            : Array<'asc' | 'desc'>
  }
}

export declare namespace FilterData {

  type filterType = 'string' | 'number' | 'date' | 'map' | 'string[]' | 'number[]' | 'date[]' | 'map[]' | 'any[]'

  interface options {
    key               : string
    type              : filterType
    separator        ?: string | RegExp
    rules            ?: rule[]
    format           ?: ParseData.format | ParseData.format[]
    defaultValue     ?: any
    md5              ?: string
  }

  interface rule {
    required         ?: true
    pattern          ?: RegExp | string
    validator        ?: string | ((value: any) => boolean)
    message           : string
    min              ?: number
    max              ?: number
    code             ?: number
  }

  interface error extends Error {
    code             ?: number
  }
}

export function parseData (options: ParseData.options): (data: string) => Record<string, any> | string
export function parseData (options: ParseData.options, customize: Record<string, Function>): (data: string) => Record<string, any> | string

export function parseBody (options: ParseData.parse[]): (msgbody: Record<string, any>) => Record<string, any>
export function parseBody (options: ParseData.parse[], customize: Record<string, Function>): (msgbody: Record<string, any>) => Record<string, any>

export function formatData (): (value: any) => any
export function formatData (formats: ParseData.format | ParseData.format[]): (value: any) => any
export function formatData (formats: ParseData.format | ParseData.format[], customize: Record<string, Function>): (value: any) => any

export function toValue (): (value: any) => any
export function toValue (type: ParseData.parseType): (value: any) => any

export function checkLength (str: string): number

export function filterData (options: FilterData.options[]): (data: Record<string, any>, errorCode?: number) => Record<string, any>
export function filterData (options: FilterData.options[], customize: Record<string, Function>): (data: Record<string, any>, errorCode?: number) => Record<string, any>

export function validSign (options: string): (data: Record<string, any>) => boolean
export function validSign (options: string, sign: string): (data: Record<string, any>) => boolean

export function errorInfo (message: string): FilterData.error
export function errorInfo (message: string, code: number): FilterData.error
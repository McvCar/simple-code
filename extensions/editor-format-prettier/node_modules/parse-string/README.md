# parse-string

Parse the string into a Map.

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Build Status][travis-image]][travis-url]
[![Gratipay][licensed-image]][licensed-url]

## Installation

```bash
$ npm install parse-string
#
$ yarn add parse-string
```

## Features

- parse string into Map
- format data
- filter and verify data.
- verify signature.

## API

### toValue (type: 'string' | 'number' | 'date' | 'map' = 'string'): (value: any) => any

Convert specified type value.

- `type` - target type
- `value` - value of need convert

### formatData (formats?: ParseData.format | ParseData.format[], customize?: Record<string, Function>): (value: any) => any

Format Data.

- `formats` - formatting options
- `customize` - map of custom function
- `value` - value of need format

### parseData (options: ParseData.options, customize?: Record<string, Function>): (data: string) => Record<string, any>

Parse the string to the specified result.

- `options` - parsing options
- `customize` - map of custom function
- `data` - data of need parse

### parseBody (options: ParseData.parse[], customize?: Record<string, Function>): (msgbody: Record<string, any>) => Record<string, any>

Parse the msbody to the specified result.

- `options` - parsing options
- `customize` - map of custom function
- `msbody` - msbody of need parse

### filterData (options: FilterData.options[], customize?: Record<string, Function>): (data: Record<string, any>) => Record<string, any>

Filter and verify data.

- `options` - filter options
- `customize` - map of custom function
- `data` - data of need filter

### validSign (options: string, sign: string = 'sign'): (data: Record<string, any>) => boolean

Verify signature.

- `options` - style of signature
- `sign` - feild of signature
- `data` - data of submit

## Usages

Example: Parse string

```js
import { parseData } from 'parse-string'

const customize = {
  add: (a, b) => a + b
}

const options = {
  separator: /\;/,
  collection: [
    {
      key: 'date',
      type: 'string',
      format: [
        {
          type: 'string',
          regexp: /^(\d{4})(\d{2})(\d{2})$/,
          substr: '$1-$2-$3'
        },
        {
          type: 'date'
        }
      ]
    },
    {
      key: 'amount',
      type: 'number'
    },
    {
      key: 'user',
      type: 'map'
    },
    {
      key: 'username',
      result: {
        defaultValue: '$__user'
      },
      format: {
        type: 'map',
        maps: 'username'
      }
    },
    {
      key: 'group',
      result: {
        defaultValue: '$__user'
      },
      format: {
        type: 'map',
        maps: 'group.name'
      }
    },
    {
      key: 'level',
      result: {
        defaultValue: '$__user'
      },
      format: {
        type: 'map',
        maps: 'group.level'
      }
    },
    {
      key: 'money1',
      result: {
        defaultValue: '$__amount',
        formula: {
          exec: (a, b) => a + b,
          opts: [ '$__amount', '$__level' ]
        }
      }
    },
    {
      key: 'money2',
      result: {
        defaultValue: '$__amount',
        formula: {
          exec: 'add',
          opts: [ '$__amount', '$__level' ]
        }
      }
    }
  ],
  omits: [ 'user' ]
}

const data = '20201027;39554;{username:\'thondery\',group:{name:\'管理员\',level:9999}}'

parseData(options, customize)(data)
// { 
//   date: 2020-10-27T00:00:00.000Z,
//   amount: 39554,
//   username: 'thondery',
//   group: '管理员',
//   level: 9999,
//   money1: 49553,
//   money2: 49553 
// }
```

Example: Filter and verify data

```js
import { filterData, validSign } from 'parse-string'

const customize = {
  isPassword: value => /^(?=.*[A-Za-z])[A-Za-z0-9$@$!%*#?&]/.test(value)
}

const options = [
  {
    key: 'username',
    type: 'string',
    rules: [
      { required: true, message: '用户名不能为空' },
      { min: 4, max: 12, message: '用户名长度不能小于4或大于12（字符）' },
      { pattern: '^[a-zA-Z]{1}[a-zA-Z0-9\_\-]', message: '用户名格式错误' }
    ]
  },
  {
    key: 'password',
    type: 'string',
    rules: [
      { required: true, message: '密码不能为空' },
      { min: 6, max: 15, message: '密码长度不能小于6或大于15（字符）' },
      { validator: 'isPassword', message: '密码格式错误' }
    ]
  },
  {
    key: 'items',
    type: 'string[]',
    defaultValue: []
  },
  {
    key: 'sign',
    type: 'string',
    md5: '${password}${username}'
  }
]

const data = { username: 'thondery', password: 'a123456', items: '1001,1002,1003' }

try {
  let result = filterData(options, customize)(data)
  // {
  //   username: 'thondery', 
  //   password: 'a123456', 
  //   items: ['1001', '1002', '1003'],
  //   sign: '61a0375131b33b72b56e4e244d0b2f29'
  // }
} catch (error) {
  console.error(error.message)
}

validSign('${password}${username}', 'sign')({ username: 'thondery', password: 'a123456', sign: '61a0375131b33b72b56e4e244d0b2f29' })
// true or false
```

## License

this repo is released under the [MIT License](https://github.com/kenote/parse-string/blob/main/LICENSE).

[npm-image]: https://img.shields.io/npm/v/parse-string.svg
[npm-url]: https://www.npmjs.com/package/parse-string
[downloads-image]: https://img.shields.io/npm/dm/parse-string.svg
[downloads-url]: https://www.npmjs.com/package/parse-string
[travis-image]: https://travis-ci.com/kenote/parse-string.svg?branch=main
[travis-url]: https://travis-ci.com/kenote/parse-string
[licensed-image]: https://img.shields.io/badge/license-MIT-blue.svg
[licensed-url]: https://github.com/kenote/parse-string/blob/main/LICENSE
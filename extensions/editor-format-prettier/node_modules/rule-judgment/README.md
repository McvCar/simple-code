# rule-judgment

A query statement similar to mongodb, judge and retrieve data.

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Build Status][travis-image]][travis-url]
[![Gratipay][licensed-image]][licensed-url]

## Installation

```bash
$ npm install rule-judgment
#
$ yarn add rule-judgment
```

## Features

- Supported operators: [\$lt](#lt), [\$lte](#lte), [\$gt](#gt), [\$gte](#gte), [\$eq](#eq), [\$ne](#ne), [\$regex](#regex), [\$mod](#mod), [\$in](#in), [\$nin](#nin), [\$size](#size), [\$exists](#exists), [\$type](#type), [\$where](#where), [\$and](#and), [\$or](#or), [\$not](#not), [\$nor](#nor)
- Regexp searches
- Supports node.js, and web

## Usages

```js
import ruleJudgment from 'rule-judgment'

// target data is non-object data
const filter = ruleJudgment({ $lt: 5 })

// target data is object data
const filter = ruleJudgment({ level: { $lt: 5 } })

// use context
const context = {
  $__username: 'thondery',
  $__level: 5
}
const filter = ruleJudgment({ 
  $or: [
    { username: '$__username' },
    { level: { $gte: '$__level' }}
  ] 
}, context)

[
  { username: 'admin', level: 9 },
  { username: 'thondery', level: 5 },
  { username: 'test', level: 1 },
].filter( filter )
// [ { username: 'admin', level: 9 }, { username: 'thondery', level: 5 } ]
```

## API

### ruleJudgment (query: MongoQuery, options?: Options): (data: any) => boolean

Creates a filter with all of the built-in MongoDB query operations.

- `query` - the filter to use against the target data
- `options` - `context` hash
- `data` - target data

Example:

```js
import ruleJudgment from 'rule-judgment'

const filter = ruleJudgment({ $lt: 5 })

filter(6) // false
filter(4) // true

[0, 1, 2, 3, 4, 5].filter( filter )
// [0, 1, 2, 3, 4]
```

## Supported Operators

### \$lt

Matches values that are less than a specified value.

```js
// types: number | bigint | Date

[0, 1, 2, 3, 4, 5].filter( ruleJudgment({ $lt: 3 }) )
// [0, 1, 2]
```

### \$lte

Matches values that are less than or equal to a specified value.

```js
// types: number | bigint | Date

[0, 1, 2, 3, 4, 5].filter( ruleJudgment({ $lte: 3 }) )
// [0, 1, 2, 3]
```

### \$gt

Matches values that are greater than a specified value.

```js
// types: number | bigint | Date

[0, 1, 2, 3, 4, 5].filter( ruleJudgment({ $gt: 3 }) )
// [4, 5]
```

### \$gte

Matches values that are greater than or equal to a specified value.

```js
// types: number | bigint | Date

[0, 1, 2, 3, 4, 5].filter( ruleJudgment({ $gte: 3 }) )
// [3, 4, 5]
```

### \$eq

Matches values that are equal to a specified value.

```js
// types: any

['admin', 'thondery', 'test'].filter( ruleJudgment({ $eq: 'thondery' }) )
// ['thondery']
```

### \$ne

Matches all values that are not equal to a specified value.

```js
// types: any

['admin', 'thondery', 'test'].filter( ruleJudgment({ $ne: 'thondery' }) )
// ['admin', 'test']
```

### \$regex

Selects documents where values match a specified regular expression.

```js
// types: string

['admin', 'thondery', 'test'].filter( ruleJudgment({ $regex: /thondery/i }) )
// ['thondery']
```

### \$mod

Performs a modulo operation on the value of a field and selects documents with a specified result.

```js
// types: number | bigint

[0, 1, 2, 3, 4, 5].filter( ruleJudgment({ $mod: [2, 0] }) )
// [0, 2, 4]
```

### \$in

Matches any of the values specified in an array.

```js
// types: any

['admin', 'thondery', 'test'].filter( ruleJudgment({ $in: ['thondery', 'admin'] }) )
// ['admin', 'thondery']
```

### \$nin

Matches none of the values specified in an array.

```js
// types: any

['admin', 'thondery', 'test'].filter( ruleJudgment({ $nin: ['thondery', 'admin'] }) )
// ['test']
```

### \$size

Selects documents if the array field is a specified size.

```js
// types: any[]

[['admin', 'thondery', 'test'], [0, 1, 2, 3, 4, 5]].filter( ruleJudgment({ $size: 6 }) )
// [ [0, 1, 2, 3, 4, 5] ]
[['admin', 'thondery', 'test'], [0, 1, 2, 3, 4, 5]].filter( ruleJudgment({ $size: { $lt: 5 } }) )
// [ ['admin', 'thondery', 'test'] ]
```

### \$exists

Matches documents that have the specified field.

```js
// types: any

['test', 0, 1, 2, 3, null, undefined, true, false].filter( ruleJudgment({ $exists: true }) )
// ['test', 0, 1, 2, 3, true, false]
['test', 0, 1, 2, 3, null, undefined, true, false].filter( ruleJudgment({ $exists: false }) )
// [null, undefined]
```

### \$type

Selects documents if a field is of the specified type.

```js
// types: any

['test', 0, 1, 2, 3, null, undefined, true, false].filter( ruleJudgment({ $type: 'number' }) )
// [0, 1, 2, 3]
```

### \$where

Matches documents that satisfy a JavaScript expression.

```js
// types: any

['test', 0, 1, 2, 3, null, undefined, true, false].filter( ruleJudgment({ $where: item => item === 'test' }) )
// ['test']
```

### \$and

Joins query clauses with a logical AND returns all documents that match the conditions of both clauses.

```js
// types: any

['test', 0, 1, 2, 3, null, undefined, true, false].filter( ruleJudgment({ $and: [{ $eq: 'test' }, { $type: 'string' }] }) )
// ['test']
```

### \$or

Joins query clauses with a logical OR returns all documents that match the conditions of either clause.

```js
// types: any

['test', 0, 1, 2, 3, null, undefined, true, false].filter( ruleJudgment({ $or: [{ $eq: 'test' }, { $type: 'boolean' }] }) )
// ['test', true, false]
```

### \$not

Inverts the effect of a query expression and returns documents that do not match the query expression.

```js
// types: any

['test', 0, 1, 2, 3, null, undefined, true, false].filter( ruleJudgment({ $not: { $eq: 'test' } }) )
// [0, 1, 2, 3, null, undefined, true, false]
```

### \$nor

Joins query clauses with a logical NOR returns all documents that fail to match both clauses.

```js
// types: any

['test', 0, 1, 2, 3, null, undefined, true, false].filter( ruleJudgment({ $nor: [{ $eq: 'test' }, { $type: 'boolean' }] }) )
// [0, 1, 2, 3, null, undefined]
```

## License

this repo is released under the [MIT License](https://github.com/kenote/rule-judgment/blob/main/LICENSE).

[npm-image]: https://img.shields.io/npm/v/rule-judgment.svg
[npm-url]: https://www.npmjs.com/package/rule-judgment
[downloads-image]: https://img.shields.io/npm/dm/rule-judgment.svg
[downloads-url]: https://www.npmjs.com/package/rule-judgment
[travis-image]: https://travis-ci.com/kenote/rule-judgment.svg?branch=main
[travis-url]: https://travis-ci.com/kenote/rule-judgment
[licensed-image]: https://img.shields.io/badge/license-MIT-blue.svg
[licensed-url]: https://github.com/kenote/rule-judgment/blob/main/LICENSE
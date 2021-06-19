import ruleJudgment, { isDateString, parseAssign } from '../src'

const context = { $__username: 'thondery', $__level: 5 }

describe('\nTests', () => {

  describe('\n    Funtion isDateString\n', () => {
    test('2020/10/21 15:59:13 => true', () => {
      let result = isDateString('2020/10/21 15:59:13')
      expect(result).toBe(true)
    })
    test('October 21, 2020 15:59:13 => true', () => {
      let result = isDateString('October 21, 2020 15:59:13')
      expect(result).toBe(true)
    })
  })

  describe('\n    Funtion parseAssign\n', () => {
    test('{ username: \'$__username\', level: \'$__level\' } => { username: \'thondery\', level: 5 }', () => {
      let result = parseAssign({ username: '$__username', level: '$__level' }, context)
      expect(result.username).toBe('thondery')
      expect(result.level).toBe(5)
    })
  })

  describe('\n    Funtion ruleJudgment\n', () => {
    test('Operator $lt: 3 < 5', () => {
      let result = ruleJudgment({ $lt: 5 })(3)
      expect(result).toBe(true)
    })
    test('Operator $lte: 5 <= 5', () => {
      let result = ruleJudgment({ $lte: 5 })(5)
      expect(result).toBe(true)
    })
    test('Operator $gt: 5 > 3', () => {
      let result = ruleJudgment({ $gt: 3 })(5)
      expect(result).toBe(true)
    })
    test('Operator $gte: 5 >= 5', () => {
      let result = ruleJudgment({ $gte: 5 })(5)
      expect(result).toBe(true)
    })
    test('Operator $eq: \'thondery\' === \'thondery\'', () => {
      let result = ruleJudgment({ $eq: 'thondery' })('thondery')
      expect(result).toBe(true)
    })
    test('Operator $ne: \'admin\' != \'thondery\'', () => {
      let result = ruleJudgment({ $ne: 'thondery' })('admin')
      expect(result).toBe(true)
    })
    test('Operator $regex: \'thondery\' === \'thondery\'', () => {
      let result = ruleJudgment({ $regex: /thondery/i })('thondery')
      expect(result).toBe(true)
    })
    test('Operator $mod: 3 % 2 === 1', () => {
      let result = ruleJudgment({ $mod: [2, 1] })(3)
      expect(result).toBe(true)
    })
    test('Operator $in: \'thondery\' in [\'thondery\', \'admin\']', () => {
      let result = ruleJudgment({ $in: ['thondery', 'admin'] })('thondery')
      expect(result).toBe(true)
    })
    test('Operator $nin: \'test\' not in [\'thondery\', \'admin\']', () => {
      let result = ruleJudgment({ $nin: ['thondery', 'admin'] })('test')
      expect(result).toBe(true)
    })
    test('Operator $size: [\'thondery\', \'admin\'].length === 2', () => {
      let result = ruleJudgment({ $size: 2 })(['thondery', 'admin'])
      expect(result).toBe(true)
    })
    test('Operator $exists: \'thondery\' != (undefined || null)', () => {
      let result = ruleJudgment({ $exists: true })('thondery')
      expect(result).toBe(true)
    })
    test('Operator $type: typeof \'thondery\' === \'string\'', () => {
      let result = ruleJudgment({ $type: 'string' })('thondery')
      expect(result).toBe(true)
    })
    test('Operator $where: (data = \'thondery\') => data === \'thondery\'', () => {
      let result = ruleJudgment({ $where: data => data === 'thondery' })('thondery')
      expect(result).toBe(true)
    })
    test('Operator $and: 4 < 5 && 4 > 3', () => {
      let result = ruleJudgment({ $and: [{ $lt: 5 }, { $gt: 3 }] })(4)
      expect(result).toBe(true)
    })
    test('Operator $or: 4 < 5 || 4 > 3', () => {
      let result = ruleJudgment({ $or: [{ $lt: 5 }, { $gt: 3 }] })(4)
      expect(result).toBe(true)
    })
    test('Operator $not: !(5 < 5)', () => {
      let result = ruleJudgment({ $not: { $lt: 5 } })(5)
      expect(result).toBe(true)
    })
    test('Operator $nor: !(5 < 5 || 5 > 5)', () => {
      let result = ruleJudgment({ $nor: [{ $lt: 5 }, { $gt: 5 }] })(5)
      expect(result).toBe(true)
    })
  })
})
// Jest Configuration ...
module.exports = {
  collectCoverage: true,
  testEnvironment: 'node',
  rootDir: 'tests',
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'json',
    'node'
  ],
  moduleDirectories: [
    'node_modules',
    'src'
  ]
}
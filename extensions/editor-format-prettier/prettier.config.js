/**
 * Configuration instructions: https://prettier.io/docs/en/options.html#print-width
 * This modification will take effect after restarting Creator
 * 修改完重启Creator后生效
 */

 module.exports = {
    // 打印宽度，超过最大值换行
    printWidth: 80,
    // 指定每个缩进级别的空格数
    tabWidth: 4,
    // 用制表符而不是空格缩进行。
    // useTabs:true,
    // true - 在每条语句的末尾添加一个分号。false- 仅在可能导致 ASI 失败的行的开头添加分号。
    semi: true,
    // 使用单引号代替双引号。
    singleQuote: true,
    // 引号属性,引用对象中的属性时更改。
    quoteProps: 'as-needed', // "<as-needed|consistent|preserve>",
    // 在多行逗号分隔的句法结构中尽可能打印尾随逗号，none 函数最后不需要逗号
    trailingComma: 'es5', // "<es5|none|all>"
    // 在对象文字中的括号之间打印空格。true- 示例：{ foo: bar } ,false- 示例：{foo: bar}
    bracketSpacing: true,
    // 箭头函数括号。 "always"- 始终包括括号。例子：(x) => x ，"avoid"- 尽可能省略括号。例子：x => x
    arrowParens: 'always', // "<always|avoid>"
    // 行结束 , "auto" - 维护现有的行尾（通过查看第一行之后使用的内容来规范化一个文件中的混合值）
    endOfLine: 'auto', // "<lf|crlf|cr|auto>"
    // 控制 Prettier 是否格式化文件中嵌入的引用代码。"auto" – 如果 Prettier 可以自动识别嵌入代码，请对其进行格式化。
    embeddedLanguageFormatting: 'off', // <auto|off>
    // 不执行格式动作的语言
    disableLanguages: ["vue"] // 不格式化vue文件
};

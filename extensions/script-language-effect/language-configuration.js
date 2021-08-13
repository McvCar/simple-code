// 语法高亮, 规则定义: https://microsoft.github.io/monaco-editor/monarch.html
/**
 * 语言对应扩展名
 */
exports.extnames = ['effect'];

exports.conf = {
	comments: {
		lineComment: '//',
		blockComment: ['/*', '*/'],
	},
	brackets: [
		['{', '}'],
		['[', ']'],
		['(', ')']
	],
	autoClosingPairs: [
		{ open: '[', close: ']' },
		{ open: '{', close: '}' },
		{ open: '(', close: ')' },
		{ open: '\'', close: '\'', notIn: ['string', 'comment'] },
		{ open: '"', close: '"', notIn: ['string'] },
		{ open: "'", close: "'", notIn: ['string'] },
		{ open: "`", close: "`", notIn: ['string'] },
	],
	surroundingPairs: [
		{ open: '{', close: '}' },
		{ open: '[', close: ']' },
		{ open: '(', close: ')' },
		{ open: '\'', close: '\'' },
		{ open: "'", close: "'", notIn: ['string'] },
		{ open: "`", close: "`", notIn: ['string'] },
	],
};


exports.language = {
	defaultToken: '',
	tokenPostfix: '.effect',

	brackets: [
		{ token: 'delimiter.curly', open: '{', close: '}' },
		{ token: 'delimiter.parenthesis', open: '(', close: ')' },
		{ token: 'delimiter.square', open: '[', close: ']' },
		{ token: 'delimiter.angle', open: '<', close: '>' }
	],

	keywords: [
	],

	operators: [
	],

	// we include these common regular expressions
	symbols: /[=><!~?:&|+\-*\/\^%]+/,
	escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
	integersuffix: /(ll|LL|u|U|l|L)?(ll|LL|u|U|l|L)?/,
	floatsuffix: /[fFlL]?/,
	encoding: /u|u8|U|L/,

	// The main tokenizer for our languages
	tokenizer: {
		root: [
			[/\/\/.*/,'comment'], // 注释
			[/\/\*/,'comment','@comment'],// 注释
			[/CCEffect/,{ token: 'type.identifier', next: '@yaml' }],
			[/CCProgram/,{ token: 'type.identifier', next: '@glsl' }],
		],

		yaml: [
			[/%{/, { token: 'identifier', next: '@scriptEmbedded', nextEmbedded: 'yaml' }], // 使用yaml语法解析
			[/}%|%}/, 'identifier', '@pop'],
		],

		glsl: [
			[/%{/, { token: 'identifier', next: '@scriptEmbedded', nextEmbedded: 'cshader' }], // 使用cshader glsl语法解析
			[/}%|%}/, 'identifier', '@pop'],
		],

		scriptEmbedded: [
			[/}%|%}/, { token: '@rematch', next: '@pop', nextEmbedded: '@pop' }],
		],
		
		comment:[
			[/\*\//,'comment','@pop'],
			[/./,'comment']
		]
	},
};

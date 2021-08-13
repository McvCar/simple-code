// 语法高亮, 规则定义: https://microsoft.github.io/monaco-editor/monarch.html
/**
 * 语言对应扩展名
 */
exports.extnames = ['glsl', 'vert', 'frag', 'chunk'];

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
	],
	surroundingPairs: [
		{ open: '{', close: '}' },
		{ open: '[', close: ']' },
		{ open: '(', close: ')' },
		{ open: '"', close: '"' },
		{ open: '\'', close: '\'' },
	],
	folding: {
		markers: {
			start: new RegExp("^\\s*#pragma\\s+region\\b"),
			end: new RegExp("^\\s*#pragma\\s+endregion\\b")
		}
	}
};

var buildinConstants = (
	"radians|degrees|sin|cos|tan|asin|acos|atan|pow|" +
	"exp|log|exp2|log2|sqrt|inversesqrt|abs|sign|floor|ceil|fract|mod|" +
	"min|max|clamp|mix|step|smoothstep|length|distance|dot|cross|" +
	"normalize|faceforward|reflect|refract|matrixCompMult|lessThan|" +
	"lessThanEqual|greaterThan|greaterThanEqual|equal|notEqual|any|all|" +
	"not|dFdx|dFdy|fwidth|texture2D|texture2DProj|texture2DLod|" +
	"texture2DProjLod|textureCube|textureCubeLod|" +
	"gl_MaxVertexAttribs|gl_MaxVertexUniformVectors|gl_MaxVaryingVectors|" +
	"gl_MaxVertexTextureImageUnits|gl_MaxCombinedTextureImageUnits|" +
	"gl_MaxTextureImageUnits|gl_MaxFragmentUniformVectors|gl_MaxDrawBuffers|" +
	"gl_DepthRangeParameters|gl_DepthRange|" +
	"gl_Position|gl_PointSize|" +
	"gl_FragCoord|gl_FrontFacing|gl_PointCoord|gl_FragColor|gl_FragData"
)
let cus_keywords_green = 'break|case|continue|default|do|else|for|goto|if|_Pragma|return|switch|while|catch|operator|try|throw|using';

let keywords_str_violet = '\\b(' + cus_keywords_green + ')\\b'
let keywords_str_green = '\\b(' + buildinConstants + ')\\b'

exports.language = {
	defaultToken: '',
	tokenPostfix: '.glsl',

	brackets: [
		{ token: 'delimiter.curly', open: '{', close: '}' },
		{ token: 'delimiter.parenthesis', open: '(', close: ')' },
		{ token: 'delimiter.square', open: '[', close: ']' },
		{ token: 'delimiter.angle', open: '<', close: '>' }
	],

	keywords: [
		"attribute",
		"const",
		"uniform",
		"varying",
		"break",
		"continue",
		"do",
		"for",
		"while",
		"if",
		"else",
		"in",
		"out",
		"inout",
		"float",
		"int",
		"void",
		"bool",
		"true",
		"false",
		"lowp",
		"mediump",
		"highp",
		"precision",
		"invariant",
		"discard",
		"return",
		"mat2",
		"mat3",
		"mat4",
		"vec2",
		"vec3",
		"vec4",
		"ivec2",
		"ivec3",
		"ivec4",
		"bvec2",
		"bvec3",
		"bvec4",
		"sampler2D",
		"samplerCube",
		"struct",
		"and",
		"and_eq",
		"bitand",
		"bitor",
		"compl",
		"not",
		"not_eq",
		"or",
		"or_eq",
		"typeid",
		"xor",
		"xor_eq",
		"const_cast",
		"dynamic_cast",
		"reinterpret_cast",
		"static_cast",
		"sizeof",
		"namespace",
		"NULL",
		"true",
		"false",
		"TRUE",
		"FALSE",
		"nullptr",

		"radians",
		"degrees",
		"sin",
		"cos",
		"tan",
		"asin",
		"acos",
		"atan",
		"pow",
		"exp",
		"log",
		"exp2",
		"log2",
		"sqrt",
		"inversesqrt",
		"abs",
		"sign",
		"floor",
		"ceil",
		"fract",
		"mod",
		"min",
		"max",
		"clamp",
		"mix",
		"step",
		"smoothstep",
		"length",
		"distance",
		"dot",
		"cross",
		"normalize",
		"faceforward",
		"reflect",
		"refract",
		"matrixCompMult",
		"lessThan",
		"lessThanEqual",
		"greaterThan",
		"greaterThanEqual",
		"equal",
		"notEqual",
		"any",
		"all",
		"not",
		"dFdx",
		"dFdy",
		"fwidth",
		"texture2D",
		"texture2DProj",
		"texture2DLod",
		"texture2DProjLod",
		"textureCube",
		"textureCubeLod",
		"gl_MaxVertexAttribs",
		"gl_MaxVertexUniformVectors",
		"gl_MaxVaryingVectors",
		"gl_MaxVertexTextureImageUnits",
		"gl_MaxCombinedTextureImageUnits",
		"gl_MaxTextureImageUnits",
		"gl_MaxFragmentUniformVectors",
		"gl_MaxDrawBuffers",
		"gl_DepthRangeParameters",
		"gl_DepthRange",
		"gl_Position",
		"gl_PointSize",
		"gl_FragCoord",
		"gl_FrontFacing",
		"gl_PointCoord",
		"gl_FragColor",
		"gl_FragData",
	],

	operators: [
		'=', '>', '<', '!', '~', '?', ':',
		'==', '<=', '>=', '!=', '&&', '||', '++', '--',
		'+', '-', '*', '/', '&', '|', '^', '%', '<<',
		'>>', '>>>', '+=', '-=', '*=', '/=', '&=', '|=',
		'^=', '%=', '<<=', '>>=', '>>>='
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
			// C++ 11 Raw String
			[/@encoding?R\"(?:([^ ()\\\t]*))\(/, { token: 'string.raw.begin', next: '@raw.$1' }],

			// identifiers and keywords

			[/^\s*#include/, { token: 'js.keywords.violet', next: '@include' }],
			[/#[a-zA-Z_].*/, 'js.keywords.violet'], // 紫色关键字定义
			[new RegExp(keywords_str_green), 'js.keywords.green'], // 绿色关键函数定义
			[new RegExp(keywords_str_violet), 'js.keywords.violet'], // 紫色关键字定义
			[/[a-zA-Z_][\w]*( ){0,5}(?=\()/, 'func'], // 函数定义
			// [/[A-Z][\w\$]*/, 'type.identifier'], // 大写绿色
			[/[a-zA-Z_]\w*/, {
				cases: {
					'@keywords': { token: 'keyword.$0' },
					'@default': 'identifier'
				}
			}],

			// whitespace
			{ include: '@whitespace' },

			// [[ attributes ]].
			[/\[\[.*\]\]/, 'annotation'],


			// Preprocessor directive
			[/^\s*#\s*\w+/, 'keyword'],

			// delimiters and operators
			[/[{}()\[\]]/, '@brackets'],
			[/[<>](?!@symbols)/, '@brackets'],
			[/@symbols/, {
				cases: {
					'@operators': 'delimiter',
					'@default': ''
				}
			}],

			// numbers
			[/\d*\d+[eE]([\-+]?\d+)?(@floatsuffix)/, 'number.float'],
			[/\d*\.\d+([eE][\-+]?\d+)?(@floatsuffix)/, 'number.float'],
			[/0[xX][0-9a-fA-F']*[0-9a-fA-F](@integersuffix)/, 'number.hex'],
			[/0[0-7']*[0-7](@integersuffix)/, 'number.octal'],
			[/0[bB][0-1']*[0-1](@integersuffix)/, 'number.binary'],
			[/\d[\d']*\d(@integersuffix)/, 'number'],
			[/\d(@integersuffix)/, 'number'],

			// delimiter: after number because of .\d floats
			[/[;,.]/, 'delimiter'],

			// strings
			[/"([^"\\]|\\.)*$/, 'string.invalid'],  // non-teminated string
			[/"/, 'string', '@string'],

			// characters
			[/'[^\\']'/, 'string'],
			[/(')(@escapes)(')/, ['string', 'string.escape', 'string']],
			[/'/, 'string.invalid']
		],

		whitespace: [
			[/[ \t\r\n]+/, ''],
			[/\/\*\*(?!\/)/, 'comment.doc', '@doccomment'],
			[/\/\*/, 'comment', '@comment'],
			[/\/\/.*$/, 'comment'],
		],

		comment: [
			[/[^\/*]+/, 'comment'],
			[/\*\//, 'comment', '@pop'],
			[/[\/*]/, 'comment']
		],
		//Identical copy of comment above, except for the addition of .doc
		doccomment: [
			[/[^\/*]+/, 'comment.doc'],
			[/\*\//, 'comment.doc', '@pop'],
			[/[\/*]/, 'comment.doc']
		],

		string: [
			[/[^\\"]+/, 'string'],
			[/@escapes/, 'string.escape'],
			[/\\./, 'string.escape.invalid'],
			[/"/, 'string', '@pop']
		],

		raw: [
			[/(.*)(\))(?:([^ ()\\\t]*))(\")/, {
				cases: {
					'$3==$S2': ['string.raw', 'string.raw.end', 'string.raw.end', { token: 'string.raw.end', next: '@pop' }],
					'@default': ['string.raw', 'string.raw', 'string.raw', 'string.raw']
				}
			}
			],
			[/.*/, 'string.raw']
		],

		include: [
			[/(\s*)(<)([^<>]*)(>)/, ['', 'keyword.directive.include.begin', 'string.include.identifier', { token: 'keyword.directive.include.end', next: '@pop' }]],
			[/(\s*)(")([^"]*)(")/, ['', 'keyword.directive.include.begin', 'string.include.identifier', { token: 'keyword.directive.include.end', next: '@pop' }]]
		]
	},
};

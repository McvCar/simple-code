const { ScriptFile, ImportSymbols } = require('../../panel/vs-panel/component-base/ScriptFile');
const { language } = require('./language-configuration');

let keywords_str = 
"const|uniform|in|out|inout|float|int|void|bool|" +
"mat2|mat3|mat4|vec2|vec3|vec4|ivec2|ivec3|ivec4|bvec2|bvec3|bvec4|sampler2D|samplerCube|struct"

let parseVariableReg = new RegExp(`(${keywords_str})\\s+(?!${keywords_str})([a-zA-Z_][\\w]*)`,'g')

/**
 * 脚本符号解析
 */
class ShaderScriptFile extends ScriptFile {

	/**
	 * @param {monaco.editor.ITextModel} model 
	 */
	constructor(model){
		super(model);
	}
	
	// 解析导入路径
	updateImportPaths(){
		super.updateImportPaths()
		var regEx = /(#include\s*<)([\.\/a-zA-Z_\-]*)>{0,1}/g;
		let text = this.model.getValue();
		var match;
		while (match = regEx.exec(text)) {
			let startOffset = match.index + match[1].length;
			let endOffset = startOffset + match[2].length;
			let s_pos = this.model.getPositionAt(startOffset)
			let e_pos = this.model.getPositionAt(endOffset)
			let ind = this.model.getLineContent(s_pos.lineNumber).indexOf('//');
			if(ind == -1 || ind>=e_pos.column){
				let item = new ImportSymbols(s_pos.lineNumber,s_pos.column,e_pos.lineNumber,e_pos.column,match[2]);
				this.imports.push(item)
			}
		}
	}

	// 解析符号信息
	updateSymbols(){
		super.updateSymbols();
		this.parseFunctionSymbols();
		this.parseDefineSymbols();
		this.parseVariableSymbols();
	}


	parseFunctionSymbols(){
		this.parseSymbols(/([a-zA-Z_][\w]*)[ ]*(?=\(.*\)[\s\t]*\{)/g,1,monaco.languages.CompletionItemKind.Function)
	}

	parseDefineSymbols(){
		this.parseSymbols(/(#define )([a-zA-Z_][\w]*)/g,2,monaco.languages.CompletionItemKind.Constant)
	}

	parseVariableSymbols(){
		this.parseSymbols(parseVariableReg,2,monaco.languages.CompletionItemKind.Variable)
	}

	parseSymbols(regEx,symbolNameInd,kind){
		let text = this.model.getValue();
		let list = this.getRegs(regEx,text)
		for (let i = 0; i < list.length; i++) {
			const findObj = list[i];
			let symbolName = findObj[symbolNameInd];
			let pos = this.model.getPositionAt(findObj.index);
			let range = new monaco.Range(pos.lineNumber,pos.column,pos.lineNumber,pos.column);
			this.pushSymbol(symbolName,range,kind)
		}
		return list;
	}
}

module.exports = ShaderScriptFile
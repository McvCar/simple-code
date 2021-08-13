/* 
* 语法解析
*/
'use strict';
const path 			= require('path');
const fs 			= require('fs');
const md5			= require('md5');
const prsPath 		= Editor.Project && Editor.Project.path ? Editor.Project.path : Editor.remote.projectPath;
const MENU_PANEL_TYPE = {"create-node":"layerMenu","create-node":"layerMenu","文件夹":"assetMenu","Folder":"assetMenu"};


class ImportSymbols {
	startLineNumber;
	startColumn;
	endLineNumber;
	endColumn;
	path;
	constructor(startLineNumber,startColumn,endLineNumber,endColumn,path='')
	{	
		this.startLineNumber = startLineNumber;
		this.startColumn = startColumn;
		this.endLineNumber = endLineNumber;
		this.endColumn = endColumn;
		this.path = path;
	}
}

class ScriptSymbols {
	/** @type monaco.Range */
	range;
	/** @type monaco.Range */
	selectionRange;
	name;
	kind;
	detail;
	uri;
	constructor(name,range,kind,uri,detail='')
	{
		this.name = name;
		this.range = range;
		this.selectionRange = range;
		this.kind = kind;
		this.detail = detail;
		this.uri = uri;
	}
}

class ScriptFile {
	
	/** @type {Array<ScriptSymbols>} */
	symbols = [];
	/** @type {Array<ImportSymbols>} */
	imports = null;
	/**
	 * 
	 * @param {monaco.editor.ITextModel} model 
	 */
	constructor(model)
	{
		this.uri = model.uri;
		this.model = model;
		this.versionId = model.getVersionId()
		this.updateSymbols();
	}

	// 子类重写
	updateSymbols(){
	}

	// 子类重写
	updateImportPaths(){
		this.imports = []
	}

	pushSymbol(name,range,kind,detail=''){
		for (let i = 0; i < this.symbols.length; i++) {
			const symbol = this.symbols[i];
			if(symbol.name == name){
				return // 同名符号已经存在
			}
		}
		return this.symbols.push(new ScriptSymbols(name,range,kind,this.uri,detail));
	}

	getSymbols(){
		return this.symbols;
	}

	getImportPaths(){
		if(this.imports){
			return this.imports;
		}
		this.updateImportPaths()
		return this.imports;
	}

	
	/**
	 * 全局搜索
	 * @param {RegExp} regEx 
	 * @param {string} text 
	 * @returns {Array<RegExpExecArray>}
	 */
	getRegs(regEx,text){
		let list = []
		let match
		while (match = regEx.exec(text)) {
			list.push(match)
		}
		return list;
	}

	/** @return {Array<ScriptSymbols>} */
	getSymbolsByName(name){
		let list = []
		for (let i = 0; i < this.symbols.length; i++) {
			const symbol = this.symbols[i];
			if(symbol.name == name){
				list.push(symbol);
			}
		}
		return list;
	}

	// 脚本是否已经被修改过
	isOlderVersion(){
		return this.versionId != this.model.getVersionId()
	}
}

exports.ScriptFile = ScriptFile;
exports.ScriptSymbols = ScriptSymbols;
exports.ImportSymbols = ImportSymbols;

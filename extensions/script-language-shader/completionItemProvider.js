/**
 * 代码输入法，提示
 */

 const tools = require('../../tools/tools');
 const path = require('path');
 const fs = require('fs');
const { language } = require('./language-configuration');

class CompletionItemProvider {

	/** @type {import('../../panel/vs-panel/vs-panel').EditorPanel} parent  */
	parent;
	control;
	languageId;

	triggerCharacters = ['.','/','<']
	all_suggestions = [];

	/**
	 * @param {import('./panel_ex')} control 
	 */
	constructor(control){
		this.control = control;
		this.parent = control.parent;
		this.languageId = this.control.languageId;
	}
	
	/**
	 * 
	 * @param {monaco.editor.ITextModel} model 
	 * @param {monaco.Position} position 
	 * @param {string} context 
	 * @param {object} token 
	 * @returns 
	 */
    async provideCompletionItems(model,position,context,token) {
		let suggestions = [];
		if(model != this.parent.vs_editor.getModel()){
			return {suggestions};
		}

		let text        = model.getLineContent(position.lineNumber);
		// 1.文件路径提示
		await this.getPathItems(model,position,text,suggestions);
		if(suggestions.length){
			return {suggestions};
		}

		// 允许混合文本单词提示
		token.isAllowNextGroup = 1;
		// let offset = model.getOffsetAt(position);
		// let wordInfo = model.getWordAtPosition(position);
		suggestions = this.getAllKeywords()
		return {suggestions,incomplete:false};
    }

	// 路径提示
    async getPathItems(model,position,text,suggestions){

		let scriptFile = await this.control.getScriptFile(model.uri);
		let imports = scriptFile.getImportPaths();
        if(!imports.length) return;

        let item ;
        for (let i = 0; i < imports.length; i++) {
            // “”范围内路径
            if(imports[i].startColumn <= position.column && imports[i].startLineNumber == position.lineNumber){
                item = imports[i];
                break;
            }
        }
        if(!item) {
            return;
        }

        // 读取目录
        let i = item.path.lastIndexOf('/')
        if(i == -1){
			// 没有相对路径,使用全部提示
			this.getAllChunkFileItems(suggestions)
        }else{
			let importFsPath = tools.relativePathTofsPath(model.fsPath,item.path.substr(0,i+1));
			if(!tools.isDirectory(importFsPath)){
				return;// 没有目录
			}
			this.getDirItems(importFsPath,suggestions,/\.chunk/,false);
		}
    }

	getAllChunkFileItems(suggestions){
		for (let i = 0; i < this.parent.file_list_buffer.length; i++) {
			const item = this.parent.file_list_buffer[i];
			if(item.extname == '.chunk'){
				let name = path.basename(item.url,item.extname);
				suggestions.push({
					label: name,
					insertText: name,
					kind:  this.parent.monaco.languages.CompletionItemKind.File ,
					detail: item.url,
				})
			}
		}
	}

    getDirItems(fsPath,suggestions,useExtnames,isShowExtname){
        let files = fs.readdirSync(fsPath);
        files.forEach((dirFile, index) => 
        {
            if(dirFile.indexOf('.') != -1 && (
                dirFile == '.DS_Store' || 
                dirFile.indexOf(".meta") != -1 || 
                useExtnames && !dirFile.match(useExtnames))){
                return;
            }
            let kind = dirFile.indexOf('.') != -1 ? this.parent.monaco.languages.CompletionItemKind.File : this.parent.monaco.languages.CompletionItemKind.Folder;
            let extname = tools.getFileExtname(dirFile) || '文件夹';
            if(!isShowExtname){
                dirFile = tools.getFileName(dirFile);
            }
            suggestions.push({
                label: dirFile,
                insertText: dirFile,
                kind:  kind,
                detail: extname,
            });
        });
    }
    
	// 获得import路径
	// getImportStringPaths(codeText) {

	// 	var regEx = /(#include\s*<)([\.\/a-zA-Z_\-]*)>{0,1}/g;
	// 	var match = regEx.exec(codeText);
	// 	var imports = []
	// 	while (match) {
	// 		let start = match.index + match[1].length + match[2].length;
	// 		imports.push({
	// 			path: match[2],
	// 			start: start,
	// 			length: match[2].length,
	// 		})
	// 		match = regEx.exec(codeText);
	// 	}
	// 	return imports
	// }

	getAllKeywords(){
		this.all_suggestions = [];

		for (let i = 0; i < language.keywords.length; i++) {
			const key = language.keywords[i];
            this.all_suggestions.push({
                label: key,
                insertText: key,
                kind:  this.parent.monaco.languages.CompletionItemKind.Keyword,
                detail: tools.T('关键字','Keyword'),
            });
		}

		return this.all_suggestions;
	}
}

module.exports = CompletionItemProvider

const path 			= require('path');
/**
 * 转跳到定义
 */
class DefinitionProvider {

	/** @type {import('../../panel/vs-panel/vs-panel').EditorPanel} parent  */
	parent;
	control;
	languageId;

	/**
	 * @param {import('./panel_ex')} control 
	 */
	constructor(control){
		this.control = control;
		this.parent = control.parent;
		this.languageId = this.control.languageId;
	}
	
	/**
	 * ctrl+点击触发
	 * @param {monaco.editor.ITextModel} model 
	 * @param {monaco.Position} position 
	 * @param {object} token 
	 * @returns 
	 */
	async provideDefinition(model, position, token)
	{
		// let wordInfo = model.getWordAtPosition(position);
		let lineText = model.getLineContent(position.lineNumber);
		let findObj = lineText.match(/#include\s*<(.*)>/)
		if(findObj){
			let importFileName = findObj[1];
			let list = await this.getFile(importFileName);
			return list;
		}else{
			let wordInfo = model.getWordAtPosition(position);
			if(!wordInfo){
				return undefined;
			}

			let list = await this.control.getSymbolsByName(wordInfo.word,model.uri)
			return list;
		}
	}


	/**
	 * 鼠标悬停提示
	 * @param {monaco.editor.ITextModel} model 
	 * @param {monaco.Position} position 
	 * @param {object} token 
	 * @returns 
	 */
	async provideHover(model, position, token){
		let wordInfo = model.getWordAtPosition(position);
		if(!wordInfo){
			return undefined
		}
		

		let symbol = (await this.control.getSymbolsByName(wordInfo.word,model.uri))[0];
		if(!symbol){
			return undefined;
		}

		let scriptFile = await this.control.getScriptFile(symbol.uri);
		let text = scriptFile.model.getLineContent(symbol.range.startLineNumber);

		if(text[0] == ' ' || text[0] == '	'){
			let findObj = text.match(/[^\s]/)
			if(findObj) text = text.substr(findObj.index);
		}
		return {
			contents: [{ 
				isTrusted: false,
				supportThemeIcons:true,
				value: text == '' ? '' : `\`\`\`${this.languageId}\n* ${text}\n\`\`\``,
			}],
		};
	}

	/**
	 * 打开大纲目录 ctrl+shift+o 
	 * @param {monaco.editor.ITextModel} model 
	 * @param {object} token 
	 * @returns 
	 */
	 async provideDocumentSymbols(model, token){
		let scriptFile = await this.control.getScriptFile(model.uri);
		if(scriptFile){
			let list = scriptFile.getSymbols();
			return list;
		}
	}

	// 获得鼠标点击位置文件信息
	async getFile(fileName){
		let fileList = this.control.getFileItemByImportPath(fileName);
		let list = [];
		for (let i = 0; i < fileList.length; i++) {
			const item = fileList[i];
			if(!this.parent.fileMgr.getModelByFsPath(item.fsPath)){
				await this.parent.loadVsModel(item.url,item.extname,true)
			}
			list.push({
				uri: this.parent.monaco.Uri.parse(this.parent.fileMgr.fsPathToModelUrl(item.fsPath)),
				range: new this.parent.monaco.Range(1,1,1,1),
			})
		}
		return list;
	}
}

module.exports = DefinitionProvider
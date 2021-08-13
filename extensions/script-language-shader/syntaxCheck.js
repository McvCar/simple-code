/**
 * 语法检查
 */

const path = require('path');
const fs = require('fs');

class SyntaxCheck {

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

		this.parent.pushMonacoEvent(this.parent.vs_editor.onDidChangeModelContent(this.onDidChangeModelContent.bind(this)));
	}
	
	onDidChangeModelContent(event){
		// 输入完1s后检查
		this.parent.setTimeoutById(async ()=>{

			let model = this.parent.vs_editor.getModel()
			let url = model.uri.toString()
			if(path.extname(url) == '.effect' || path.extname(url) == '.chunk'){
				let markers = [];
				await this.clickImportPaths(model,markers);
				// 显示标记
				this.parent.monaco.editor.setModelMarkers(model, model.getLanguageIdentifier().language, markers);
			}
		},1000,'shaderSyntaxCheck')
	}
	
	// 检查导入路径是否存在
	async clickImportPaths(model,markers){
		let scriptFile = await this.control.getScriptFile(model.uri);
		let imports = scriptFile.getImportPaths()
		for (let i = 0; i < imports.length; i++) {
			const item = imports[i];
			let fileList = this.control.getFileItemByImportPath(item.path);
			if(fileList.length == 0){
				markers.push({
					severity: this.parent.monaco.MarkerSeverity.Error,
					startLineNumber: item.startLineNumber,
					startColumn: item.startColumn,
					endLineNumber: item.endLineNumber,
					endColumn: item.endColumn,
					message: 'file does not exist'
				});
			}
		}
	}
}

module.exports = SyntaxCheck
/* 
shader语法解析
*/
'use strict';
const path = require('path');
const fs = require('fs');
const Editor2D = require('../../tools/editor2D');
const config = Editor2D.require('packages://simple-code/config.js');
const languageConfig = require('./language-configuration');
const DefinitionProvider = require('./definitionProvider');
const CompletionItemProvider = require('./completionItemProvider');
const ShaderScriptFile = require('./shaderScriptFile');
const { ScriptSymbols } = require('../../panel/vs-panel/component-base/ScriptFile');
const SyntaxCheck = require('./syntaxCheck');

let id = 'editor-book-mark'

module.exports = {
	/** @type import('../../panel/vs-panel/vs-panel').EditorPanel */
	parent: null,
	/** @type Object<string,ShaderScriptFile> */
	scripts: {},
	languageId: 'cshader',

	// 面板初始化
	onLoadEvent(parent) {
		// index.js 对象
		this.parent = parent;
		this.scripts = {}
		this.is_init_all_script = false;
		

		// 注册一门新语言
		this.parent.registerLanguage(this.languageId,languageConfig.extnames);
		if(!this.parent.monaco.languages.getEncodedLanguageId(this.languageId)){
			this.parent.monaco.languages.register({ id: this.languageId });
		}
		
		// 为该语言注册一个令牌提供程序
		this.parent.pushMonacoEvent(this.parent.monaco.languages.setMonarchTokensProvider(this.languageId,languageConfig.language));
		this.parent.pushMonacoEvent(this.parent.monaco.languages.setLanguageConfiguration(this.languageId,languageConfig.conf));
		

		// 转跳文件 #include
		let definitionProvider = new DefinitionProvider(this);
		this.parent.pushMonacoEvent(this.parent.monaco.languages.registerDefinitionProvider(this.languageId, definitionProvider))
		this.parent.pushMonacoEvent(this.parent.monaco.languages.registerDefinitionProvider('effect', definitionProvider))
		
		// 鼠标悬停提示
		this.parent.pushMonacoEvent(this.parent.monaco.languages.registerHoverProvider(this.languageId, definitionProvider))
		this.parent.pushMonacoEvent(this.parent.monaco.languages.registerHoverProvider('effect', definitionProvider))

		// ctrl+shift+o 文档列表
		this.parent.pushMonacoEvent(this.parent.monaco.languages.registerDocumentSymbolProvider(this.languageId, definitionProvider))
		this.parent.pushMonacoEvent(this.parent.monaco.languages.registerDocumentSymbolProvider('effect', definitionProvider))

		// 输入提示 
		let completionItemProvider = new CompletionItemProvider(this);
		this.parent.pushMonacoEvent(this.parent.monaco.languages.registerCompletionItemProvider(this.languageId, completionItemProvider))
		this.parent.pushMonacoEvent(this.parent.monaco.languages.registerCompletionItemProvider('effect', completionItemProvider))

		// 语法检查
		this.syntaxCheck = new SyntaxCheck(this);
	},

	// 加载并刷新所有脚本，用于函数跳转
	async updateAllScriptFile(){
		if(this.is_init_all_script){
			return; // 节省性能, 只初始化一次
		}
		this.is_init_all_script = true
		for (let i = 0; i < this.parent.file_list_buffer.length; i++) {
			const fileItem = this.parent.file_list_buffer[i];
			if(fileItem.extname == '.chunk'){
				await this.getScriptFile(this.parent.fileMgr.fsPathToModelUrl(fileItem.fsPath));
			}
		}
	},

	/**
	 * 获得脚本对象并更新
	 * @param {monaco.Uri} uri 
	 * @returns {Promise<ShaderScriptFile>}
	 */
	async getScriptFile(uri){
		let scriptFile = this.scripts[uri.toString()];
		if(scriptFile && !scriptFile.isOlderVersion()) {
			return scriptFile
		}
		return await this.updateScriptFile(uri);
	},

	/**
	 * 更新脚本对象
	 * @param {monaco.Uri} uri 
	 * @returns {Promise<ShaderScriptFile>}
	 */
	async updateScriptFile(uri){
		let model = this.parent.monaco.editor.getModel(uri);
		if(!model){
			let fileItem = this.parent.file_list_map[this.parent.fileMgr.modelUrlToFsPath(uri.toString())]
			if(!fileItem){
				return
			}
			model = await this.parent.loadVsModel(fileItem.url,fileItem.extname,fileItem.uuid != 'outside');
			if(!model){
				return
			}
		}

		let scriptFile = new ShaderScriptFile(model);
		return this.scripts[uri.toString()] = scriptFile;
	},

	/**
	 * 获得同名符号列表
	 * @param {string} name 
	 * @param {monaco.Uri} uri 
	 * @returns {Promise<Array<ScriptSymbols>>}
	 */
	async getSymbolsByName(name,uri){
		await this.updateAllScriptFile();

		let scriptFile = uri ? await this.getScriptFile(uri) : null;
		let list = []
		if(scriptFile){
			list.push(...scriptFile.getSymbolsByName(name));
			if(list.length){
				return list;
			}
		}
		
		for (const key in this.scripts) {
			const o_scriptFile = this.scripts[key];
			if(o_scriptFile != scriptFile){
				let ls = o_scriptFile.getSymbolsByName(name);
				list.push(...ls);
			}
		}
		return list;
	},

	/**
	 * 通过import路径获取同名文件信息
	 * @param {string} importPath 
	 * @returns {Array<FileItem>}
	 */
	getFileItemByImportPath(importPath){
		importPath = path.basename(importPath)
		importPath = importPath + '.chunk'
		let list = [];
		for (let i = 0; i < this.parent.file_list_buffer.length; i++) {
			const item = this.parent.file_list_buffer[i];
			if(item.url.endsWith(importPath)){
				list.push(item);
			}
		}
		return list;
	},

	// 面板销毁
	onDestroy() {
		delete this.scripts;
	},


	messages: {

		// 'cleanFile'()
		// {
		// },
	},

};
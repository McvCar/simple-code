/* 
shader语法解析
*/
'use strict';
const path = require('path');
const fs = require('fs');
const config = Editor2D.require('packages://simple-code/config.js');
const languageConfig = require('./language-configuration');
const DefinitionProvider = require('./definitionProvider');
const CompletionItemProvider = require('./completionItemProvider');
let id = 'editor-book-mark'

module.exports = {
	/** @type import('../../panel/vs-panel/vs-panel').EditorPanel */
	parent: null,
	languageId: 'effect',

	// 面板初始化
	onLoadEvent(parent) {
		// index.js 对象
		this.parent = parent;

		// 注册一门新语言
		this.parent.registerLanguage(this.languageId,languageConfig.extnames);
		if(!this.parent.monaco.languages.getEncodedLanguageId(this.languageId)){
			this.parent.monaco.languages.register({ id: this.languageId });
		}
		
		// 为该语言注册一个令牌提供程序
		this.parent.pushMonacoEvent(this.parent.monaco.languages.setMonarchTokensProvider(this.languageId,languageConfig.language));
		this.parent.pushMonacoEvent(this.parent.monaco.languages.setLanguageConfiguration(this.languageId,languageConfig.conf));
		

		// 转跳文件 #include
		// let definitionProvider = new DefinitionProvider(this.parent,this.languageId);
		// this.parent.pushMonacoEvent(this.parent.monaco.languages.registerDefinitionProvider(this.languageId, definitionProvider))
		// // 输入提示 
		// let completionItemProvider = new CompletionItemProvider(this.parent,this.languageId);
		// this.parent.pushMonacoEvent(this.parent.monaco.languages.registerCompletionItemProvider(this.languageId, completionItemProvider))
	},


	// 面板销毁
	onDestroy() {
	},


	messages: {

		// 'cleanFile'()
		// {
		// },
	},

};
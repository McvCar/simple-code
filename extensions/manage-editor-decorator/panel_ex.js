/* 
面板扩展
功能: 管理编辑器装饰物，如字体颜色或样式、光标样式、文本编辑器内嵌图标、自定义描述文字等等样式
功能详情介绍: https://microsoft.github.io/monaco-editor/playground.html#interacting-with-the-editor-line-and-inline-decorations
*/
'use strict';
const path 			= require('path');
const fs 			= require('fs');

module.exports = {
	/** @type import('../../panel/vs-panel/vs-panel').EditorPanel */
	parent : null,


	// 面板初始化
	ready(parent){
		// index.js 对象
		this.parent = parent;
		this.styles = {};
		this.old_decoration = {};
		this.disposables = []
		this.debounce = 200;
	},

	// monaco 编辑器初始化
	onLoad(){
		// 1.生成装饰物样式信息
		// 2.监听编辑器改动消息
		// 3.清除旧的装饰物
		// 4.写入新的装饰物
		// 5.释放时删除装饰物
		
		this.onLoadDecoratorStyleHandle();
        this.disposables.push(this.parent.vs_editor.onDidChangeModel(this.onLoadDecoratorStyleHandle.bind(this)));
        this.disposables.push(this.parent.vs_editor.onDidChangeModelContent(this.onLoadDecoratorStyleHandle.bind(this)));
	},
	
	// 添加装饰物样式
	setDecoratorStyle(id,styleText=''){
		if(this.styles[id]){
			this.styles[id].remove();
		}
		if(styleText == ''){
			return;
		}
		
		let dom = this.parent.vs_editor._domElement
		var style = document.createElement("style");
		style.innerHTML = styleText;
		this.styles[id] = style;
		dom.appendChild(style);
	},

	// 添加装饰物位置信息
	setDecorator(id,decoration)
	{
		var model = this.parent.vs_editor.getModel();
		if(model == null){
			return	
		}

		// 释放之前的装饰对象
		if(this.old_decoration[id]){
			let oldModel = this.old_decoration[id].model
			if(oldModel && !oldModel._isDisposed){
				this.old_decoration[id].decoration  = oldModel.deltaDecorations(this.old_decoration[id].decoration, []);
			}
		}

        this.old_decoration[id] = {
			decoration: model.deltaDecorations(this.old_decoration[id] && this.old_decoration[id].decoration || [], decoration),
			model:model,
		}
	},

	// 删除装饰物信息
	removeDecorator(id){
		this.setDecoratorStyle(id,'');
		var model = this.parent.vs_editor.getModel();
		if(model == null || this.old_decoration[id] == null){
			return	
		}
		model.deltaDecorations(this.old_decoration[id].decoration || [], []);
		this.old_decoration[id] = null;
	},

	// 广播通知需要刷新装饰物
	onLoadDecoratorStyleHandle(){ 
        var model = this.parent.vs_editor.getModel();
        if (!model || model.getLineCount() > 100000) {
            return; // 1万行不进行解析工作
		}
		
		if (!this.debounceTimer) 
		{
            this.debounceTimer = window.setTimeout(()=>{
                this.debounceTimer = null;
				this.parent.runExtendFunc('onLoadDecoratorStyle')
            }, this.debounce);
        }
	},

	// 面板销毁
	onDestroy(){
		this.disposables.forEach(function (d) {
			return d.dispose();
		});
		if( this.debounceTimer){
			clearTimeout(this.debounceTimer)
		}
		// 后续跟随面板销毁自动释放
	},


	messages:{

		// 'cleanFile'()
		// {
		// },
	},
	
};
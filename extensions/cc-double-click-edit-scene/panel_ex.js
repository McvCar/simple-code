/* 
面板扩展
功能: 双击编辑Label
*/
'use strict';
const path 		= require('path');
const md5     	= require('md5');
const fs 		= require('fs');
const fe 		= Editor2D.require('packages://simple-code/tools/tools.js');
const cfg 		= Editor2D.require('packages://simple-code/config.js');

module.exports = {
	/** @type import('../../panel/vs-panel/vs-panel').EditorPanel */
	parent : null,


	// 面板初始化
	onLoad(parent){
		// index.js 对象
		this.parent = parent; 

		// 绑定页面全局快捷键事件
		this.parent.addKeybodyEvent([["F2"]],(e)=>
		{
			if(this.openEditBox()){
				e.preventDefault();// 吞噬捕获事件
				return false;
			}
		},0)
	},

	openEditBox(){
		let div = Editor2D.Panel.getFocusedPanel()
		if(div && div.name == 'scene'){

			Editor2D.Scene.callSceneScript('simple-code', 'getCurrNodeLabelInfo',{},(err, labelInfo) => 
			{ 
				if(!labelInfo || !labelInfo.uuid){
					return
				}
				this.editString((string)=>{
					labelInfo.string = string;
					Editor2D.Scene.callSceneScript('simple-code', 'setCurrNodeLabelInfo',labelInfo)
				},labelInfo.string)
			})
			return true
		}
	},
	
	// 双击事件
	onMouseDoubleClick(mousePos)
	{
		this.openEditBox()
	},


	editString(callback,defineName='',result=[])
	{
		let reSize = (pos)=>
		{
			let line = 0
			for (let index = 0; index < defineName.length; index++) if(defineName[index] == '\n') line++
			let width = 100
			let isAutoHeight = 1;
			let isEditMode = 0;
			if(defineName.length >100 || line>4){
				width = 800
				isEditMode = 1
			}else if(defineName.length >20){
				width = 300
				isAutoHeight = 1
			}else if(defineName.length >12){
				width = 150
			}
			this.parent.ace.setMiniSearchBox(pos,width,1,isEditMode,true);
		} 
		
		let onSearchAccept = (data,cmdLine)=>
		{
			let name = cmdLine.getValue();
			callback(name);
		}
		// 修改搜索框时，通过该函数读取显示的实时显示下拉列表内容, cmdLine为输入文本框对象
		let onCompletionsFunc = (cmdLine)=>{
			let name = cmdLine.getValue();
			defineName = name;
			callback(name);
			reSize();
			return result;
		}
		this.parent.ace.openSearchBox(defineName,[],(data,cmdLine)=>onSearchAccept(data,cmdLine),(cmdLine)=>onCompletionsFunc(cmdLine),null,'editorText')
		reSize(this.parent.mouse_pos);
		// 场景快照
		Editor.Message.send('scene','snapshot')

	},


	/*************  事件 *************/  

	messages:{

	},
	
};
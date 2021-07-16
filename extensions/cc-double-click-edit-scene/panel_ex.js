/* 
面板扩展
功能: 双击编辑Label
*/
'use strict';
const path 		= require('path');
const md5     	= require('md5');
const fs 		= require('fs');
const fe 		= Editor.require('packages://simple-code/tools/tools.js');
const cfg 		= Editor.require('packages://simple-code/config.js');

module.exports = {
	/** @type import('../../panel/vs-panel/vs-panel-base') */
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
		let div = Editor.Panel.getFocusedPanel()
		if(div && div.id == 'scene'){

			Editor.Scene.callSceneScript('simple-code', 'getCurrNodeLabelInfo', (err, labelInfo) => 
			{ 
				if(!labelInfo){
					return
				}
				this.editString((string)=>{
					labelInfo.string = string;
					Editor.Scene.callSceneScript('simple-code', 'setCurrNodeLabelInfo',labelInfo)
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
		this.parent.ace.openSearchBox(defineName,[],(data,cmdLine)=>onSearchAccept(data,cmdLine),(cmdLine)=>onCompletionsFunc(cmdLine))
		reSize(this.parent.mouse_pos);

		// 记录撤销
		Editor.Ipc.sendToAll('scene:undo-commit')
	},


	/*************  事件 *************/  

	messages:{

	},
	
};
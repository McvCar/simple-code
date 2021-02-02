/* 
面板扩展
功能: 
*/
'use strict';
const path 			= require('path');
const fs 			= require('fs');
const md5			= require('md5');
const fe 			= Editor.require('packages://simple-code/tools/FileTools.js');
const prsPath 		= Editor.Project && Editor.Project.path ? Editor.Project.path : Editor.remote.projectPath;

let is_lock			= false;

module.exports = {

	// 面板初始化
	onLoad(parent){
		// index.js 对象
		this.parent = parent; 
	},
	
	// 面板销毁
	onDestroy(){
		Editor.Ipc.sendToMain('simple-code:cleanMenuConfigAll')
	},


	messages:{

		'cleanFile'()
		{
		},
	},
	
};
/* 
*主线程扩展
*对话框功能扩展
*/

'use strict';
var path 	= require('path');
var fs 		= require('fs');
var md5     = require('md5');



module.exports = {

	// 初始化
	onLoad(parent)
	{
		// 主线程对象: main.js
		this.parent = parent;

	},

	

	// 窗口销毁
	onDestroy()
	{

	},
	/*************  事件 *************/  

	messages:
	{
		// 'rename'(){
		// 	Editor.Panel.open('simple-code');
		// 	// Editor.Ipc.sendToPanel('simple-code', 'rename');
		// },
		
	}
};
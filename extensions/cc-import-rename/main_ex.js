/* 
*主线程扩展
*代码输入提示
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
		'openNodeFile'(){
			// Editor.Ipc.sendToPanel('simple-code', 'custom-cmd',{cmd:"findFileGoto"});
			// Editor.log("openNodeFile")
		},
		'scene:saved'(){
			// Editor.log("scene save")
		},
	}
};
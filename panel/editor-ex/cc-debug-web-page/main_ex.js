/* 
*主线程扩展
*绑定快捷键事件
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
		// 删除节点与脚本回收
		'removeNodeAndScript'(){
			// 发送事件到场景脚本处理
			Editor.Scene.callSceneScript('simple-code', 'removeNodeAndScript' ,{},function (err, event) {
				// Editor.log("delect node")
			});
			
		}
	}
};
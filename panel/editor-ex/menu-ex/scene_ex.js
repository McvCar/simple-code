/* 
*场景逻辑扩展
*删除选中的节点以及节点所绑定的脚本
*/
'use strict';
var path 	= require('path');
var fs 		= require('fs');
var md5     = require('md5');
const fe 	= Editor.require('packages://simple-code/tools/FileTools.js');


module.exports = {
	
	
	/*************  事件 *************/  
	messages: 
	{
		'get-active-uuid'(event,args,parent){
			// Editor.log("scene test")
		}
	}
};
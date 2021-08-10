/* 
*主线程扩展
*
*/

'use strict';
var path 	= require('path');
var fs 		= require('fs');
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
	}
};
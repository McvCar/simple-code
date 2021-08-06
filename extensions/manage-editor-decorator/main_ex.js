/* 
*主线程扩展
*/

'use strict';

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
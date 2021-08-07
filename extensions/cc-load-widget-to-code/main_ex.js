/* 
*主线程扩展
*
*/

'use strict';

const Editor2D = require("../../tools/editor2D");

module.exports = {

	// 初始化
	onLoad(parent)
	{
	},

	// 窗口销毁
	onDestroy()
	{

	},
	/*************  事件 *************/  

	messages:
	{
		'loadCustomWidgetsToCode'(){
			Editor2D.Ipc.sendToPanel('simple-code','loadCustomWidgetsToCode');
		},

		'openDragVarRuleFile'(){
			Editor2D.Ipc.sendToPanel('simple-code','openDragVarRuleFile');
		}
	}
};
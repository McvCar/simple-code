/* 
*主线程扩展
*
*/

'use strict';

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
			Editor.Ipc.sendToPanel('simple-code','loadCustomWidgetsToCode');
		},

		'openDragVarRuleFile'(){
			Editor.Ipc.sendToPanel('simple-code','openDragVarRuleFile');
		}
	}
};
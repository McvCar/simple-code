/* 
*主线程扩展
*/

'use strict';

module.exports = {

	// 初始化
	onLoad(parent) {
		// 主线程对象: main.js
		this.parent = parent;
	},

	// 窗口销毁
	onDestroy() {

	},
	/*************  事件 *************/

	messages:
	{
		// 'newFile'() {
		// 	Editor.Ipc.sendToPanel('simple-code','new-js-file');
		// },

		// 'newFileDir'(){
		// 	// 打开目录
		// 	Editor.Message.send('simple-code','vsEditor.openSetting')
		// },
	
	}
};
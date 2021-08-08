/* 
面板扩展
功能: 绑定快捷键事件
*/
'use strict';
var path 	= require('path');
var fs 		= require('fs');
var md5     = require('md5');



module.exports = {

	/** @type import('../../panel/vs-panel/vs-panel').EditorPanel */
	parent : null,

	// 面板初始化
	onLoad(parent){
		// index.js 对象
		this.parent = parent; 
		// this.init()
	},


	init(){

		// let infoObj = document.getElementsByClassName('label select style-scope app-top-bar')[0];
		// if (infoObj && infoObj.innerText.indexOf(":74") == -1){
		// 	infoObj = document.getElementsByClassName('info')[0];
		// 	if (infoObj && infoObj.innerText.indexOf(":74") == -1){
		// 		return
		// 	}
		// }
			
		// let prot = 7310;
		// let s_i = infoObj.innerText.indexOf(":74")+3
		// let num = Number( infoObj.innerText.substr(s_i,2) )
		// prot = prot + num
		// const ws = Editor2D.require('packages://simple-code/node_modules/nodejs-websocket');//引入websocket
		 
		// const server = ws.createServer(connection => {
		// 	// console.log('有一名用户连接进来了...')
		//     connection.on("text", function (str) {
		// 		console.log('我来接收客户端发过来的消息' + str)
		// 		connection.sendText(str);//返回给客户端的数据
		// 		server.connections.forEach(function (conn) {
		// 			conn.sendText(str)//返回给所有客户端的数据(相当于公告、通知)
		// 		})
		//     })
		//     //监听关闭
		//     connection.on("close", function (code, reason) {
		//         console.log("Connection closed")
		//     })
		//     //监听异常
		// 	connection.on("error",() => {
		// 		console.log('服务异常关闭...')
		// 	})
		// }).listen(prot)
	},

	// 面板销毁
	onDestroy(){

	},
	/*************  事件 *************/  



	messages:{

		// 快捷键打开当前选中文件/节点进入编辑
		// 'custom-cmd' (event,info) {
		// },

		// 'scene:saved'(){
		// 	// Editor.log("事件 save")
		// }
	},
	
};
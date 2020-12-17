'use strict';

const fe 			= Editor.require('packages://simple-code/tools/FileTools.js');
const fs            = require('fs');
const path 			= require("fire-path");


var eventFuncs = 
 {
 	// 合并事件
 	eventvMerge(old_msg,moduleFile="panel_ex.js"){
 		let fileList = fe.getDirAllFiles(Editor.url("packages://simple-code/panel/editor-ex"),[])

 		let messages = {}
 		let scripts = []
 		fileList.forEach((v)=>
 		{
 			if(v.substr(v.lastIndexOf(path.sep)+1) == moduleFile){
 				let obj = require(v);
 				scripts.push(obj);

 				for(let name in obj.messages){
 					// electron.ipcRenderer.on(name,obj[name].bind(obj)); // 只能监听其它面板发送的事件
 					// 合并监听函数
 					if (messages[name])
 					{
 						let old_func = messages[name]
 						let now_func = obj.messages[name].bind(obj)
 						messages[name] = function(...args){
 							old_func(...args,old_msg);
 							now_func(...args,old_msg);
 						}
 					}else{
 						let now_func = obj.messages[name].bind(obj)
 						messages[name] = function(...args){ now_func(...args,old_msg)}
 					}
 				}
 			}
 		})

 		for(let name in old_msg){
 			if (messages[name])
 			{
 				let old_func = old_msg[name]
 				let now_func = messages[name]
 				messages[name] = function(...args){
 					(old_func.bind(this))(...args,old_msg);
 					now_func(...args,old_msg);
 				}
 			}else{
 				messages[name] = old_msg[name]
 			}
 		}

 		return {messages,scripts}
 	},
};

module.exports = eventFuncs;
'use strict';
const path      = require('path');
const electron  = require('electron');
const exec 		= require('child_process').exec;
let fs 			= require("fs");

// 加载编辑器里的 node_modules,有些公共库需要用的如：md5
module.paths.push(path.join(Editor.App.path, 'node_modules'));
const Editor2D = require('./tools/editor2D');
const tools  = require('./tools/tools');

const extensionPath = path.resolve(__dirname,'.','extensions');
let _lastUuid ;//最后打开的预制节点,记录当前打开层的uuid

let scripts = [];
let methods = { 

	load () {
		// 上次加载事件未释放
		if(global._simpleCodeMain){
			this.unload.bind(global._simpleCodeMain)()
		}else{
			// 兼容creator2dApi
			Editor2D.analogApi();
		}
	
		// 执行扩展逻辑
		// this.initExtend();
		this.runExtendFunc("onLoad",this);
		global._simpleCodeMain = this;
	},
	
	// 2.4.4 发现保存后不会刷新
	unload () {
		delete global._simpleCodeMain
		scripts.forEach((obj)=>
		{ 
			// for(let name in obj.messages)
			// {
			// 	let state = electron.ipcMain.removeListener( name.indexOf(':') == -1 ? "simple-code:"+name : name,obj.messages[name] ) ; 
			// }

			try {
				if(obj.onDestroy){
					obj.onDestroy()
				}
			} catch (error) {
				Editor.error(error);
			}
		})
	}, 

	// 读取扩展逻辑文件
	initExtend()
	{
		scripts = [];
		let fileList = tools.getDirAllFiles(extensionPath,[]);
		fileList.forEach((v)=>
		{
			if(v.substr(v.lastIndexOf(path.sep)+1) == "main_ex.js")
			{ 
				let obj = require(v);
				scripts.push(obj);
				
				for(let name in obj.messages){
					if (this[name])
					{
						let old_func = this[name]
						let now_func = obj.messages[name].bind(obj)
						this[name] = function(...args){
							old_func(...args,this);
							return now_func(...args,this);
						}
					}else{
						let now_func = obj.messages[name].bind(obj)
						this[name] = function(...args){ return now_func(...args,this)}
					}
					// electron.ipcMain.on(name.indexOf(':') == -1 ? "simple-code:"+name : name,obj.messages[name]); 
				}
			}
		})
	},

	// 运行扩展文件的方法
	runExtendFunc(funcName,...args){
		scripts.forEach((obj)=>{
		if (obj[funcName])
		{
			obj[funcName](...args);
		}
		})
	},

	'loadWidgetToCode'(){
		Editor2D.Ipc.sendToPanel('simple-code', 'loadWidgetToCode');
	},
	'open' () {
	  // open entry panel registered in package.json
	  Editor2D.Panel.open('simple-code.vsEditor');
	},

	'openPreview' () {
	  // open entry panel registered in package.json
	  Editor2D.Panel.open('simple-code.preview');
	},

	'getPrefabUuid'(event,a){
		if (event.reply) {
			event.reply(null, _lastUuid);
		}
	},

	'openConfigExtendDir'(){
		// 打开目录
		exec( (Editor2D.isWin32 ? "start " : "open ")+Editor2D.url("packages://simple-code/extensions") )
	},

	// 联系作者
	'contactAuthor'(){
		let url = 'https://qm.qq.com/cgi-bin/qm/qr?k=uha480KkJZa0P0rh_Pmrt8OkzQ6QIBqX&jump_from=webapi';
		exec(Editor2D.isWin32 ? "cmd /c start "+url : "open "+url);
	},

	 
	'scene:enter-prefab-edit-mode' (event,uuid) {
	   _lastUuid = uuid;
	},

	'refresh-preview'(){
		Editor2D.Ipc.sendToPanel('simple-code.preview','refresh-preview');
	},

	'injectScriptToMainWindow'(code){
		let mainWin = this.getMainWebContents();
		let isSuccess = false;
		if(mainWin){
			let result = mainWin.executeJavaScript(code);
			isSuccess = true;
			return {isSuccess, result};
		}
		return {isSuccess};
	},
	
	// 获得主窗口
	getMainWebContents(){
		let allwins = electron.BrowserWindow.getAllWindows();
		for (let i = 0; i < allwins.length; i++) {
			const win = allwins[i];
			if(win.title && win.title.startsWith('Cocos Creator')){
				return win.webContents;
			}
		}
		
		return;
	}
}

methods.initExtend();

module.exports = 
{
  load () {
	methods.load()
  },
  // 2.4.4 发现保存后不会刷新
  unload () {
	methods.unload()
  }, 
  // register your ipc messages here
  methods,
};
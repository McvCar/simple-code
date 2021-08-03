'use strict';
const path      = require('path');
const electron  = require('electron');
const exec 		= require('child_process').exec;
let fs 			= require("fs");

// 加载编辑器里的 node_modules,有些公共库需要用的如：md5
module.paths.push(path.join(Editor.App.path, 'node_modules'));
const compatibleApi = require('./tools/compatibleApi');
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
			compatibleApi.analogApi();
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
		Editor.Ipc.sendToPanel('simple-code', 'loadWidgetToCode');
	},
	'open' () {
	  // open entry panel registered in package.json
	  Editor.Panel.open('simple-code.vsEditor');
	},

	'openPreview' () {
	  // open entry panel registered in package.json
	  Editor.Panel.open('simple-code.preview');
	},

	'openNodeFileByOutside' () {
	  // send ipc message to panel
	  Editor.Scene.callSceneScript('simple-code', 'open-file-by-outside' ,"", (err, event)=>{

	  } );
	},

	'uuidToUrl'(event,a){
		if (event.reply) { 
			//if no error, the first argument should be null
			if(a.uuids)
			{
				let arrUrl = []
				a.uuids.forEach((uuid,i)=>{
					arrUrl.push(Editor.assetdb.uuidToUrl(uuid))
				})
				event.reply(null, {urls:arrUrl});
			}
		}
	},

	'getPrefabUuid'(event,a){
		if (event.reply) {
			event.reply(null, _lastUuid);
		}
	},

	'openConfigExtendDir'(){
		// 打开目录
		exec( (Editor.isWin32 ? "start " : "open ")+Editor.url("packages://simple-code/extensions") )
	},

	// 联系作者
	'contactAuthor'(){
		let url = 'https://qm.qq.com/cgi-bin/qm/qr?k=uha480KkJZa0P0rh_Pmrt8OkzQ6QIBqX&jump_from=webapi';
		exec(Editor.isWin32 ? "cmd /c start "+url : "open "+url);
	},

	 
	'scene:enter-prefab-edit-mode' (event,uuid) {
	   _lastUuid = uuid;
	},

	'refresh-preview'(){
		Editor.Ipc.sendToPanel('simple-code.preview','refresh-preview');
	},
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
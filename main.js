'use strict';
const path      = require('path');
const electron  = require('electron');
const exec 		= require('child_process').exec;
let fs 			= require("fire-fs");


let _lastUuid ;//最后打开的预制节点,记录当前打开层的uuid
module.exports = 
{

  load () {
	// 执行扩展逻辑
	this.initExtend();
	this.runExtendFunc("onLoad",this);

	try{
		this.changeConfig();
	} catch (exception) {
		Editor.error("配置插件config.js出错:,",exception);
	} 
  },

  unload () {
	this.scripts.forEach((obj)=>
	{
		for(let name in obj.messages)
		{
			let state = electron.ipcMain.removeListener( name.indexOf(':') == -1 ? "simple-code:"+name : name,obj.messages[name] ) ; 
		}
	})
  }, 


  changeConfig(){

  	let packageJson = JSON.parse( fs.readFileSync(Editor.url("packages://simple-code/package.json")) );
  	let cfg 		= eval( fs.readFileSync(Editor.url("packages://simple-code/config.js")).toString() );
  	let menuCfg 	= cfg["main-menu"]
  	let menuCfgOld 	= packageJson["main-menu"];
  	let isNeedSave  = false;

  	for (let key in menuCfg) 
  	{
  		let v = menuCfg[key];
  		if (menuCfgOld[key] == null || v.accelerator != menuCfgOld[key].accelerator || v.message != menuCfgOld[key].message)
  		{
  			isNeedSave = true;
  			break;
  		}
  	}

  	if (isNeedSave){
  		packageJson["main-menu"] = menuCfg;
  		Editor.log("替换编辑器插件快捷方式")
  		fs.writeFile(Editor.url("packages://simple-code/package.json"),JSON.stringify( packageJson , null, "\t"));
  	}
  },

  // 读取扩展逻辑文件
  initExtend()
  {
  	const fe     = Editor.require('packages://simple-code/tools/FileTools.js'); 

	this.scripts = [];
	let fileList = fe.getDirAllFiles(Editor.url("packages://simple-code/panel/editor-ex"),[]);
	fileList.forEach((v)=>
	{
		if(v.substr(v.lastIndexOf(path.sep)+1) == "main_ex.js")
		{
			let obj = require(v);
			this.scripts.push(obj);
			for(let name in obj.messages)
			{
				obj.messages[name] = obj.messages[name].bind(obj)
				electron.ipcMain.on(name.indexOf(':') == -1 ? "simple-code:"+name : name,obj.messages[name]); 
			}
		}
	})
  },

  // 运行扩展文件的方法
  runExtendFunc(funcName,...args){
	this.scripts.forEach((obj)=>{
	  if (obj[funcName])
	  {
		obj[funcName](...args);
	  }
	})
  },

  // register your ipc messages here
  messages: { 
	'open' () {
	  // open entry panel registered in package.json
	  Editor.Panel.open('simple-code');
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
	
	'openNodeFile' () {
	  // send ipc message to panel
	  Editor.Panel.open('simple-code');
	  Editor.Ipc.sendToPanel('simple-code', 'custom-cmd',{cmd:"openFile"});
	},


	'newFile' () {
	   Editor.Panel.open('simple-code');
	  Editor.Scene.callSceneScript('simple-code', 'new-js-file' ,_lastUuid,function (err, event) {
	  	Editor.Ipc.sendToPanel('simple-code', 'custom-cmd',{cmd:"openFile"});
  	  });
	},

	'findFileAndOpen' () {
		Editor.Panel.open('simple-code');
		Editor.Ipc.sendToPanel('simple-code', 'custom-cmd',{cmd:"findFileAndOpen"});
	},

	'findFileGoto' () {
		Editor.Panel.open('simple-code');
		Editor.Ipc.sendToPanel('simple-code', 'custom-cmd',{cmd:"findFileGoto"});
	},

	'simple-code:selectNode'(){

		Editor.Scene.callSceneScript('simple-code', 'select-node' ,{});
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
	
	'setting'(){
		Editor.Panel.open('simple-code');
		Editor.Ipc.sendToPanel('simple-code', 'custom-cmd',{cmd:"setting"});
	},
	
	'openConfig'(){
		// 打开目录
		exec( (Editor.isWin32 ? "start " : "open ")+Editor.url("packages://simple-code/config.js") )
	},

	'openConfigHitn'(){
		// 打开目录
		exec( (Editor.isWin32 ? "start " : "open ")+Editor.url("packages://simple-code/template/hint_text.txt") )
	},

	'openConfigExtendDir'(){
		// 打开目录
		exec( (Editor.isWin32 ? "start " : "open ")+Editor.url("packages://simple-code/panel/editor-ex") )
	},

	'newFileDir'(){
		// 打开目录
		exec( (Editor.isWin32 ? "start " : "open ")+Editor.url("packages://simple-code/template") )
	},

	'runCommandLine'(){

	  	Editor.Panel.open('simple-code');
	  	Editor.Ipc.sendToPanel('simple-code','run-command-code',"cmd");
	},

	'run-node-js'(){
		Editor.Panel.open('simple-code');
		Editor.Ipc.sendToPanel('simple-code','run-command-code',"scene");
	},
	
	'scene:enter-prefab-edit-mode' (event,uuid) {
	   _lastUuid = uuid;
	},

	'refresh-preview'(){
		Editor.Ipc.sendToPanel('simple-code.preview','refresh-preview');
	},

  },
};
'use strict';
const path      = require('path');
const electron  = require('electron');
const exec 		= require('child_process').exec;
let fs 			= require("fs");
const compatibleApi = require('./tools/compatibleApi');


let _lastUuid ;//最后打开的预制节点,记录当前打开层的uuid
module.exports = 
{
  load () 
  {
	// 兼容creator2dApi
	compatibleApi.analogApi();
  },

  unload () {
  }, 

  // register your ipc messages here
  methods: { 
	'open' () {
	  // open entry panel registered in package.json
	  Editor.Panel.open('simple-code.vsEditor');
	},

	'openPreview' () {
	  // open entry panel registered in package.json
	  Editor.Panel.open('simple-code.preview');
	},

	'openNodeFile' () {
	  // send ipc message to panel
	  Editor.Panel.open('simple-code.vsEditor');
	},


	'newFile' () {
	//    Editor.Panel.open('simple-code.vsEditor');
	//    Editor.Scene.callSceneScript('simple-code', 'new-js-file' ,_lastUuid,function (err, event) {
	//   		Editor.Ipc.sendToPanel('simple-code', 'custom-cmd',{cmd:"openFile"});
  	//    });
	},

	'findFileAndOpen' () {
		Editor.Panel.open('simple-code.vsEditor');
	},

	'findFileGoto' () {
		Editor.Panel.open('simple-code.vsEditor');
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
		Editor.Panel.open('simple-code.vsEditor');
		Editor.Ipc.sendToPanel('simple-code', 'custom-cmd',{cmd:"setting"});
	},
	
	'openConfig'(){
		// exec( (Editor.isWin32 ? "start " : "open ")+Editor.url("packages://simple-code/config.js") )
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

	'scene:enter-prefab-edit-mode' (event,uuid) {
	   _lastUuid = uuid;
	},

  },
};
/* 
面板扩展
功能: 绑定快捷键事件
*/
'use strict';
const path 			= require('path');
const fs 			= require('fs');
const md5			= require('md5');
const fe 			= Editor.require('packages://simple-code/tools/FileTools.js');
const prsPath 		= Editor.Project && Editor.Project.path ? Editor.Project.path : Editor.remote.projectPath;

let is_lock			= false;

module.exports = {

	// 面板初始化
	onLoad(parent){
		// index.js 对象
		this.parent = parent;
	},

	// 加载组件到代码
	loadWidgetToCode(widgetType,symbolName){
		if(this.parent.file_info == null || this.parent.code_file_rename_buf.is_use){
			return;
		}

		let file_uuid = this.parent.file_info.uuid;

		//1.获得当前打开的脚本是否该场景内节点绑定
		//2.获得与当前脚本绑定的Node
		//3.往脚本添加组件类型字段
		//4.往脚本的类型字段写入当前选中的组件或资源
		this.getCurrEditorFileBindNodes((bindInfos)=>
		{
			if(!bindInfos || bindInfos.length == 0){
				console.log("没有绑定文件")
				return;
			}
			let curSlsInfo = Editor.Selection.curGlobalActivate()
			let isArray = curSlsInfo && curSlsInfo.type ? Editor.Selection.curSelection(curSlsInfo.type).length>1 : false;

			this.insertTextToFile(file_uuid,widgetType,symbolName,isArray);
			this.insertWidgetInfo(bindInfos,widgetType,symbolName,isArray);
		});
	},

	insertWidgetInfo(bindInfos,widgetType,symbolName,isArray){
		let args = {bindInfos,widgetType,symbolName,isArray}
		Editor.Scene.callSceneScript('simple-code', 'insertWidgetInfo',args, (err, isEnd) => { 
			console.log('生成完成.',isEnd)
		});
	},

	getCurrEditorFileBindNodes(calback){
		let args = {code_uuid:this.parent.file_info.uuid}
		Editor.Scene.callSceneScript('simple-code', 'getCurrEditorFileBindNodes',args, (err, bindInfos) => { 
			calback(bindInfos);
		});
	},

	// 面板销毁
	onDestroy(){

	},
	
	//3.往脚本添加组件类型字段
	insertTextToFile(uuid,widgetType,symbolName,isArray){
		// 1.获得脚本变量插入text位置
		// 2.获得插入组件文本内容
		// 3.向脚本指定位置插入获刚得到的文本,并保存文件
		if(this.parent.file_info.uuid != uuid) {
			return;
		}
		
		let file_url  = this.parent.file_info.path;
		let vs_model  = this.parent.file_info.vs_model;
		let text 	  = vs_model.getValue()
		let file_ 	  = this.parent.getUriInfo(file_url);
		let isTs  	  = file_.extname != '.js';
		let start_pos 
		if(isTs){

		}else{
			let findObj = text.match(/properties[	 ]{0,5}:[	 ]{0,5}[\n]{0,5}[	 ]{0,15}{[	 ]{0,5}/);
			if(findObj)
			{
				start_pos = findObj.index + findObj[0].length;
			}
		}

		if(start_pos)
		{
			let insertText = this.getInsertText(widgetType,symbolName,isArray,isTs);
			text = text.substr(0,start_pos)+insertText+text.substr(start_pos)
			vs_model.pushStackElement();
			vs_model.setValue(text);
			this.parent.saveFile();
		}
	},

	// 获得插入的代码文字
	getInsertText(widgetType,symbolName,isArray,isTs){
		let text = ''
		if(isTs){
			if(isArray){
				text = 
				`\n@property([${widgetType}])`+'\n'+
				`${symbolName}:${widgetType} [] = [];`
			}else{
				text = 
				`\n@property(${widgetType})`+'\n'+
				`${symbolName}:${widgetType};`
			}
		}else{
			text = 
			'\n'+symbolName+':{\n'+
				'default: '+(isArray? "[]":"null")+',\n'+
				'type: '+widgetType+',\n'+
			'},\n';
		}
		return text;
	},


	messages:{

		'loadWidgetToCode'()
		{
			this.loadWidgetToCode('cc.Node','testWidget')
		},
	},
	
};
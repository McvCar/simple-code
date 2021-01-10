/* 
面板扩展
功能: 绑定组件到代码
*/
'use strict';
const path 			= require('path');
const fs 			= require('fs');
const md5			= require('md5');
const fe 			= Editor.require('packages://simple-code/tools/FileTools.js');
const prsPath 		= Editor.Project && Editor.Project.path ? Editor.Project.path : Editor.remote.projectPath;

let is_lock			= false;
let ASSETS_TYPE_MAP = {'sprite-atlas':"cc.SpriteAtlas",'sprite-frame':"cc.SpriteFrame",'texture':"cc.SpriteFrame",'prefab':"cc.Prefab",'audio-clip':'cc.AudioClip','raw-asset':'cc.RawAsset'};
let IS_URL_TYPE 	= ['cc.AudioClip','cc.RawAsset']
module.exports = {

	// 面板初始化
	onLoad(parent){
		// index.js 对象
		this.parent = parent;
	},

	// 加载资源到代码
	loadAssetsToCode(insertUuids,symbolName)
	{
		//1.读取选中的资源
		//2.解析资源类型 == cc.SpriteFrame ? || xxxx
		//3.接下来流程和加载组件一样
		if(insertUuids == null || insertUuids.length == 0){
			return
		}
		
		Editor.assetdb.queryInfoByUuid(insertUuids[0],(_,fileInfo)=>{
			if(fileInfo==null){
				return
			}
			let widgetType = ASSETS_TYPE_MAP[fileInfo.type];
			if(widgetType==null){
				Editor.info('不支持插入的资源类型:',fileInfo.type)
				return;
			}
			if(symbolName == null){
				let file_ 	  = this.parent.getUriInfo(fileInfo.url);
				symbolName = file_.name
				if(file_.extname != ''){
					symbolName = symbolName.substr(0,symbolName.lastIndexOf('.'));
				}
			}
			this.loadWidgetToCode(widgetType,symbolName,insertUuids,true);
		});
	},

	// 加载组件到代码
	loadWidgetToCode(widgetType,symbolName,insertUuids,isAssets=false){
		if(this.parent.file_info == null || this.parent.code_file_rename_buf.is_use){
			return;
		}

		let file_uuid = this.parent.file_info.uuid;

		//1.获得当前打开的脚本是否该场景内节点绑定的
		//2.获得与当前脚本绑定的Nodes
		//3.往脚本添加组件类型字段
		//4.往脚本的类型字段写入当前选中的组件或资源
		this.getCurrEditorFileBindNodes((bindInfos)=>
		{
			if(!bindInfos || bindInfos.length == 0){
				console.log("没有绑定文件")
				return;
			}
			if(this.parent.file_info.uuid != file_uuid) {
				return;
			}
			let isArray = Editor.Selection.curSelection(isAssets ? 'asset':'node').length>1 ;

			this.insertTextToFile(widgetType,symbolName,isArray);
			this.insertWidgetInfo(bindInfos,widgetType,symbolName,isArray,insertUuids,isAssets);
		});
	},

	insertWidgetInfo(bindInfos,widgetType,symbolName,isArray,insertUuids,isAssets){
		let args = {bindInfos,widgetType,symbolName,isArray,insertUuids,isAssets}
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
	insertTextToFile(widgetType,symbolName,isArray){
		// 1.获得脚本变量插入text位置
		// 2.获得插入组件文本内容
		// 3.向脚本指定位置插入获刚得到的文本,并保存文件
		
		let file_url  = this.parent.file_info.path;
		let vs_model  = this.parent.file_info.vs_model;
		let text 	  = vs_model.getValue()
		let file_ 	  = this.parent.getUriInfo(file_url);
		let isTs  	  = file_.extname != '.js';
		let start_pos 

		let reg = isTs ? /class [a-zA-Z_$][\w$]* extends.*[\n]{0,5}[ ]{0,15}[	]{0,5}{/ : /properties[	 ]{0,5}:[	 ]{0,5}[\n]{0,5}[	 ]{0,15}{[	 ]{0,5}/
		let findObj = text.match(reg);
		if(findObj)
		{
			start_pos = findObj.index + findObj[0].length;
			if(start_pos)
			{
				let insertText = this.getInsertText(widgetType,symbolName,isArray,isTs);
				text = text.substr(0,start_pos)+insertText+text.substr(start_pos)
				vs_model.pushStackElement();
				vs_model.setValue(text);
				this.parent.saveFile();
			}
		}

	},

	// 获得插入的代码文字
	getInsertText(widgetType,symbolName,isArray,isTs){
		let text = ''
		if(isTs){
			if(isArray){
				text = 
				`\n\n	@property([${widgetType}])`+'\n'+
				`	${symbolName}:${widgetType} [] = [];`
			}else{
				text = 
				`\n\n	@property(${widgetType})`+'\n'+
				`	${symbolName}:${widgetType} = null;`
			}
		}else{
			let key = IS_URL_TYPE.indexOf(widgetType) == -1 ? 'type: ' : "url: " 
			text = 
			'\n		'+symbolName+':{\n'+
			'			default: '+(isArray? "[]":"null")+',\n'+
			'			'+key+widgetType+',\n'+
			'		},';
		}
		return text;
	},

	loadSymbolName(callback,defineName='',result=[])
	{
		// 打开场景转跳
		let ps = {value:'请输入变量名字',meta:'',score:0};
		result.push(ps)
		// 下拉框选中后操作事件
		let onSearchAccept = (data,cmdLine)=>
		{
			let name = cmdLine.getValue();
			if(ps.value != data.item.value){
				name = data.item.value
			}
			if(name && name != ps.value){
				callback(name);
			}
		}
		// 修改搜索框时，通过该函数读取显示的实时显示下拉列表内容, cmdLine为输入文本框对象
		let onCompletionsFunc = (cmdLine)=>{
			return result;
		}
		
		this.parent.openSearchBox(defineName,[],(data,cmdLine)=>onSearchAccept(data,cmdLine),(cmdLine)=>onCompletionsFunc(cmdLine))
		this.parent.setMiniSearchBoxToTouchPos();
	},


	messages:{
		'insertWidgetByName'(e,args)
		{
			Editor.log(args)
			let nodes = Editor.Selection.curSelection('node');
			let uuid = nodes && nodes[0];

			Editor.Scene.callSceneScript('simple-code', 'getNodeName',uuid, (err, name) => 
			{ 
				if(args.paths[0] == '快速生成拖拽组件')
				{
					if(name) this.loadWidgetToCode(args.label,name);
				}else{
					this.loadSymbolName((name)=>
					{
						this.loadWidgetToCode(args.label,name);
					},name || '')
				}
			})
		},

		'insertAssets'(e,args){

			this.loadSymbolName((name)=>
			{
				let list = Editor.Selection.curSelection('asset');
				this.loadAssetsToCode(list,name);
			})
		},

		'quickInsertAssets'(e,args){
			let list = Editor.Selection.curSelection('asset');
			this.loadAssetsToCode(list);
		},
		
		'loadWidgetToCode'()
		{
			// this.loadWidgetToCode('cc.Node','testWidget')
			this.loadAssetsToCode(Editor.Selection.curSelection('asset'),'testWidget')
		},

		 
		'selection:activated'(){
			let nodes = Editor.Selection.curSelection('node');
			let uuid = nodes && nodes[0];
			Editor.Scene.callSceneScript('simple-code', 'getNodeCompNames',uuid, (err, compNames) => 
			{ 
				let submenu = [{ label: 'cc.Node', enabled: true, cmd:'insertWidgetByName'},];

				for (let i = 0; i < compNames.length; i++) 
				{
					const name = compNames[i];
					let item = { label: name, enabled: true, cmd: "insertWidgetByName"};
					submenu.push(item);
				}

				let menuCfg = {
					layerMenu : [
						{ type: 'separator' },
						{ label : "快速生成拖拽组件", enabled:true, submenu:submenu, },
						{ label : "生成拖拽组件", enabled:true, submenu:submenu, },
					],
					assetMenu : [
						{ type: 'separator' },
						{ label : "快速生成拖拽资源", enabled:true, cmd: "quickInsertAssets"},
						{ label : "生成拖拽资源", enabled:true, cmd: "insertAssets"},
					],
				}

				Editor.Ipc.sendToMain('simple-code:setMenuConfig',{id:"cc-widget-to-code",menuCfg:menuCfg})
			});
			
		},
	},
	
};
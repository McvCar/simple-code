/* 
面板扩展
功能: 绑定组件到代码
*/
'use strict';
const path 			= require('path');
const fs 			= require('fs');
const md5			= require('md5');
const fe 			= Editor.require('packages://simple-code/tools/tools.js');
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

	// 入口
	insertWidgetAction(isQuick,symbolName)
	{
		let nodes = Editor.Selection.curSelection('node');
		let uuid = nodes && nodes[0];

		Editor.Scene.callSceneScript('simple-code', 'getNodeName',uuid, (err, name) => 
		{ 
			let codeInfo = this.getCurrEditorFileInfo();
			if(isQuick)
			{
				if(name) this.loadWidgetToCode(symbolName,name,codeInfo);
			}else{
				this.loadSymbolName((name)=>
				{
					this.loadWidgetToCode(symbolName,name,codeInfo);
				},name || '',codeInfo.symbols)
			}
		})
	},

	// 入口
	insertAssets(isQuick)
	{
		let insertUuids = Editor.Selection.curSelection('asset');
		//1.读取选中的资源
		//2.解析资源类型 == cc.SpriteFrame ? || xxxx
		//3.接下来流程和加载组件一样
		if(insertUuids == null || insertUuids.length == 0){
			Editor.info("生成失败,由于Creator API限制,请点击一下需要拖动的资源然后再拖入")
			return
		}
		
		Editor.assetdb.queryInfoByUuid(insertUuids[0],(_,fileInfo)=>
		{
			if(fileInfo==null){
				return
			}

			let widgetType = ASSETS_TYPE_MAP[fileInfo.type];
			if(widgetType==null){
				Editor.info('不支持插入的资源类型:',fileInfo.type)
				return;
			}

			let codeInfo = this.getCurrEditorFileInfo();
			if(codeInfo == null){
				return;
			}

			let file_ 	  = this.parent.fileMgr.getUriInfo(fileInfo.url);
			let symbolName = file_.name;
			if(file_.extname != ''){
				symbolName = symbolName.substr(0,symbolName.lastIndexOf('.'));
			}
			if(isQuick){
				this.loadWidgetToCode(widgetType,symbolName,codeInfo,insertUuids,true);
			}else{

				this.loadSymbolName((symbolName)=>
				{
					let list = Editor.Selection.curSelection('asset');
					this.loadWidgetToCode(widgetType,symbolName,codeInfo,insertUuids,true);
				},symbolName,codeInfo.symbols);
			}
		});
	},

	// 加载组件到代码
	loadWidgetToCode(widgetType,symbolName,codeInfo,insertUuids=null,isAssets=false){
		if(symbolName.match(/[a-zA-Z_$][\w$]*/) == null){
			Editor.info('生成拖拽组件:变量命名不符合规范:',symbolName);
			return;
		}
		if(this.parent.file_info == null || this.parent.file_info.uuid != codeInfo.editInfo.uuid ){
			return;
		}

		//1.获得当前打开的脚本是否该场景内节点绑定的
		//2.获得与当前脚本绑定的Nodes
		//3.往脚本添加组件类型字段
		//4.往脚本的类型字段写入当前选中的组件或资源
		this.getCurrEditorFileBindNodes(codeInfo.editInfo.uuid, (bindInfos)=>
		{
			if(!bindInfos || bindInfos.length == 0){
				console.info("生成拖拽组件失败,当前场景Nodes没有绑定当前编辑中的脚本")
				return;
			}
			if(this.parent.file_info.uuid != codeInfo.editInfo.uuid) {
				return;
			}
			let isArray = Editor.Selection.curSelection(isAssets ? 'asset':'node').length>1 ;

			this.insertTextToFile(widgetType,symbolName,codeInfo,isArray);
			this.insertWidgetInfo(bindInfos,widgetType,symbolName,isArray,insertUuids,isAssets);
		});
	},

	insertWidgetInfo(bindInfos,widgetType,symbolName,isArray,insertUuids,isAssets){
		let args = {bindInfos,widgetType,symbolName,isArray,insertUuids,isAssets}
		Editor.Scene.callSceneScript('simple-code', 'insertWidgetInfo',args, (err, isEnd) => { 
			// console.log('生成完成.',isEnd)
		});
	},

	getCurrEditorFileBindNodes(uuid,calback){
		let args = {code_uuid:uuid}
		Editor.Scene.callSceneScript('simple-code', 'getCurrEditorFileBindNodes',args, (err, bindInfos) => { 
			calback(bindInfos);
		});
	},

	// 面板销毁
	onDestroy(){

	},
	
	//3.往脚本添加组件类型字段
	insertTextToFile(widgetType,symbolName,codeInfo,isArray)
	{
		// 1.获得脚本变量插入text位置
		// 2.获得插入组件文本内容
		// 3.向脚本指定位置插入获刚得到的文本,并保存文件
		
		let vs_model  = codeInfo.editInfo.vs_model;
		let text 	  = vs_model.getValue()

		let reg = codeInfo.isTs ? /class [a-zA-Z_$][\w$]* extends.*[\n]{0,5}[ ]{0,15}[	]{0,5}{/ : /properties[	 ]{0,5}:[	 ]{0,5}[\n]{0,5}[	 ]{0,15}{[	 ]{0,5}/
		let findObj = text.match(reg);
		if(findObj)
		{
			// 1.获得插入文本内容
			let startPos = findObj.index + findObj[0].length;
			let symbolInfo = this.getSymbolInfoByName(codeInfo.symbols,symbolName);
			let insertText = this.getInsertText(widgetType,symbolName,isArray,symbolInfo,codeInfo.isTs);
			// 2.检测变量是否已经存在，若存在则需要替换旧的变量字符串
			if(symbolInfo){
				text = text.substr(0,symbolInfo.startPos)+insertText+text.substr(symbolInfo.endPos)
			}else{
				text = text.substr(0,startPos)+insertText+text.substr(startPos)
			}
			vs_model.pushStackElement();
			vs_model.setValue(text);
			this.parent.saveFile(true,true);
		}
	},

	getSymbolInfoByName(symbols,symbolName){
		for (let i = 0; i < symbols.length; i++) {
			const item = symbols[i];
			if(item.symbolName == symbolName){
				return item;
			}
		}
	},

	// 获得插入的代码文字
	getInsertText(widgetType,symbolName,isArray,isReplaceMode,isTs){
		let text = ''
		if(isTs){
			let intext = isReplaceMode ? '' : '\n\n	';
			if(isArray){
				text = intext+
					`@property([${widgetType}])`+'\n'+
				`	${symbolName}:${widgetType} [] = [];`
			}else{
				text = intext+
					`@property(${widgetType})`+'\n'+
				`	${symbolName}:${widgetType} = null;`
			}
		}else{
			let key = IS_URL_TYPE.indexOf(widgetType) == -1 ? 'type: ' : "url: " 
			let intext = isReplaceMode ? '' : '\n		';
			text = intext + 
				symbolName+':{\n'+
			'			default: '+(isArray? "[]":"null")+',\n'+
			'			'+key+widgetType+',\n'+
			'		},';
		}
		return text;
	},


	// 获得当前编辑文件的信息
	getCurrEditorFileInfo()
	{
		if(!this.parent.file_info){
			return;
		}

		let file_url  = this.parent.file_info.path;
		let vs_model  = this.parent.file_info.vs_model;
		let text 	  = vs_model.getValue()
		let file_ 	  = this.parent.fileMgr.getUriInfo(file_url);
		let isTs  	  = file_.extname != '.js';
		let symbols   = this.parseSctSymbolInfo(text,isTs);
		return {
			text,
			isTs,
			name:file_.name,
			extname:file_.extname,
			editInfo:this.parent.file_info,
			symbols, // 获得当前编辑文件的成员变量信息
		};
	},

	// 解析变量符号
	parseSctSymbolInfo(text,isTs){
		let symbols = [];

		if(isTs)
		{
			let parseTs = (code_text, start_ind = 0)=>
			{
				let findObj = code_text.substr(start_ind).match(/@property\(.*\)[ ]{0,10}[	]{0,5}[\n]{0,5}[ ]{0,10}[	]{0,5}(.*):([\w$.]*)[ ]{0,5}[=]{0,1}.*/)
				if (findObj) 
				{
					let startPos = findObj.index + start_ind;
					let endPos = startPos + findObj[0].length;
					let symbolName = findObj[1]
					let widgetType = findObj[2]
					let symbolInfo = { startPos, endPos, symbolName, widgetType, value: symbolName, meta: widgetType }
					symbols.push(symbolInfo);
					parseTs(code_text, endPos)
				}
			}
			parseTs(text)
		}else
		{
			// JS 解析代码格式是否正常的,
			let esprima = Editor.require('packages://simple-code/node_modules/esprima/esprima')
			try {
			    esprima.parse(text)
			} catch (error) {
			    return [];
			}

			// 变量 properties 对象位置
			let findObj = text.match(/properties[	 ]{0,5}:[	 ]{0,5}[\n]{0,5}[	 ]{0,15}{[	 ]{0,5}/)
			if(!findObj){
				Editor.info('JS脚本缺少 properties:{}, 对象，无法自动拖拽组件')
				return;
			}
			let start_ind = findObj.index + findObj[0].length;

			let getBracketEndPos = (s_ind) => {
				if (text[s_ind] != '{') return -1;

				for (let i = s_ind + 1; i < text.length; i++) {
					if (text[i] == '{') {
						i = getBracketEndPos(i);
						if (i == -1) return -1;
					} else if (text[i] == '}') {
						return i;
					}
				}

				return -1;
			};

			// properties对象的结尾位置
			let end_ind = getBracketEndPos(start_ind - 1)
			if(end_ind != -1)
			{
				// 读取对象成员信息
				let code = text.substr(start_ind, end_ind - start_ind)
				let parseJs = (code_text, start_ind = 0) => 
				{
					let findObj = code_text.substr(start_ind).match(/([\w$_][\w$._0-9]*)[ 	]{0,5}:[ 	]{0,15}[\n]{0,15}{[ 	]{0,15}[\n]{0,15}[ 	]{0,15}default.*[\n]{0,15}.*(cc\.[a-zA-Z_]*).*[\n]{0,15}[ 	]{0,15}.{0,50}[\n]{0,15}[ 	]{0,15}[ 	]{0,15}}[ 	]{0,15}[,]{0,15}/);
					if (findObj) 
					{
						let startPos = findObj.index + start_ind;
						let endPos = startPos + findObj[0].length;
						let symbolName = findObj[1]
						let widgetType = findObj[2]
						let symbolInfo = { startPos, endPos, symbolName, widgetType, value: symbolName, meta: widgetType }
						symbols.push(symbolInfo);
						parseJs(code_text, endPos)
					}
				}
				parseJs(code)
				for (let i = 0; i < symbols.length; i++) {
					const symbolInfo = symbols[i];
					symbolInfo.startPos +=start_ind;
					symbolInfo.endPos +=start_ind;
				}
			}
		}
		return symbols;
	},

	loadSymbolName(callback,defineName='',result=[])
	{
		// 打开场景转跳
		let ps = {value:'请输入变量名字',meta:'',score:0};
		result.unshift(ps)
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
		
		this.parent.ace.openSearchBox(defineName,[],(data,cmdLine)=>onSearchAccept(data,cmdLine),(cmdLine)=>onCompletionsFunc(cmdLine))
		this.parent.ace.setMiniSearchBoxToTouchPos();
	},


	onDrag(e){
		let panel = Editor.Panel.getFocusedPanel()
		if(!panel || !this.menuCfg) return;

		if(panel.id == 'assets'){
			this.insertAssets(this.parent.cfg.isQuickDrag)
		}if(panel.id == 'hierarchy'){
			this.insertWidgetAction(this.parent.cfg.isQuickDrag,'cc.Node');
		}
	},


	messages:{
		// 添加组件
		'insertWidgetByName'(e,args)
		{
			if(this.parent == null) return;
			this.insertWidgetAction(args.paths[0] == '快速生成拖拽组件',args.label);
		},

		// 添加资源
		'insertAssets'(e,args){
			if(this.parent == null) return;

			this.insertAssets(false)
		},

		// 快速添加资源
		'quickInsertAssets'(e,args){
			if(this.parent == null) return;
			this.insertAssets(true)
		},
		 
		'selection:activated'(){
			if(this.parent == null) return;
			let nodes = Editor.Selection.curSelection('node');
			let uuid = nodes && nodes[0];
			this.getCurrEditorFileBindNodes(this.parent.file_info && this.parent.file_info.uuid, (bindInfos)=>
			{
				if(bindInfos == null){
					// 清除菜单
					Editor.Ipc.sendToMain('simple-code:setMenuConfig',{id:"cc-widget-to-code",menuCfg:undefined})
					return;
				}

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
					this.menuCfg = menuCfg;
					Editor.Ipc.sendToMain('simple-code:setMenuConfig',{id:"cc-widget-to-code",menuCfg:menuCfg})
				});
			})
			
		},
	},
	
	// 拖动文件到inspector面板
	// getCodePanet(){

	// 	console.log('开始查找')
	// 	let inspector = document.getElementById('inspector');
	// 	if(!inspector){
	// 		return
	// 	}
	// 	inspector = inspector.shadowRoot.getElementById('view')
	// 	if(!inspector) return
	// 	let props = inspector.getElementsByClassName('props')[0];
	// 	if(!props) return;

	// 	let prop,assertName,uuid;
	// 	for (let i = 0; i < props.children.length; i++) {
	// 		let div = props.children[i];
	// 		let assetNode = div.getElementsByTagName('ui-asset')[0];
	// 		if(!assetNode || assetNode._type != "script") continue;
	// 		// 资源拖拽接收器

	// 		prop = div;
	// 		uuid = assetNode._value;
	// 		assertName = assetNode._name;
	// 		break;
	// 	}

	// 	if(!prop) return;
	// 	prop = prop.children[0]
	// 	console.log(prop)
	// 	// 读取拖入的文件
	// 	prop.addEventListener('drag',(e)=>{
	// 		// if(e.dataTransfer.files[0]){
	// 			e.preventDefault();
	// 			e.stopPropagation();
	// 		// }
	// 	},true)
		
	// 	prop.addEventListener('dragover',(e)=>{
	// 		// if(e.dataTransfer.files[0]){
	// 			e.preventDefault();
	// 			e.stopPropagation();
	// 		// }
	// 	},true)
		
	// 	// 读取拖入的文件
	// 	prop.addEventListener('drop',(e)=>{
	// 		e.preventDefault();
	// 		console.log('解析:',e)
	// 	},true)

	// 	console.log('找到面板:',assertName,uuid)
	// },
};
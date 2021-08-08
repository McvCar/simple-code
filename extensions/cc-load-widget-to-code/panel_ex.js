/* 
面板扩展
功能: 绑定组件到代码
*/
'use strict';
const path 			= require('path');
const fs 			= require('fs');
const md5			= require('md5');
const config 		= require('../../config');
const tools 		= require('../../tools/tools');
const Editor2D = require('../../tools/editor2D');
const prsPath 		= Editor.Project && Editor.Project.path ? Editor.Project.path : Editor.remote.projectPath;

let is_lock			= false;
// 资源类型对应组件关系映射
let ASSETS_TYPE_MAP = {
	'sprite-atlas':"cc.SpriteAtlas",'sprite-frame':"cc.SpriteFrame",'texture':"cc.SpriteFrame",'image':"cc.SpriteFrame",
	'prefab':"cc.Prefab",'audio-clip':'cc.AudioClip','raw-asset':'cc.RawAsset','dragonbones':'dragonBones.DragonBonesAsset',
	'dragonbones-atlas':'dragonBones.DragonBonesAtlasAsset','spine':'sp.SkeletonData',"particle":"cc.ParticleAsset",
	'asset':'cc.Asset','material':'cc.Material','mesh':'cc.Mesh','skeleton-animation-clip':'cc.SkeletonAnimationClip'
};

let IS_URL_TYPE 	= ['cc.AudioClip','cc.RawAsset','cc.Asset']
// 拖拽加入组件优先顺序
let QUICK_LOAD_TYPE_ORDER 	= ['cc.SkinnedMeshRenderer','cc.MeshRenderer','cc.Slider','cc.ProgressBar','cc.Toggle','dragonBones.ArmatureDisplay','sp.Skeleton','cc.Animation','cc.Sprite','cc.Label','cc.EditBox','cc.RichText']

let NEW_VAR_RULE 	 	=  path.join(path.resolve(__dirname,"./"),"drag_var_rule.js");
let USER_NEW_VAR_RULE 	=  path.join(config.cacheDir,"drag_var_rule.js");

module.exports = {
	/** @type import('../../panel/vs-panel/vs-panel').EditorPanel */
	parent : null,
	USER_NEW_VAR_RULE,

	// 面板初始化
	onLoad(parent){
		// index.js 对象
		this.parent = parent;
		this.currSelectInfo = {}

		// 首次使用拷贝模板到可写路径
		if(!tools.isFileExit(USER_NEW_VAR_RULE)){
			tools.createDir(USER_NEW_VAR_RULE)
			tools.copyFile(NEW_VAR_RULE,USER_NEW_VAR_RULE)
		}
	},

	// 插入组件入口
	insertWidgetAction(isQuick,widgetType,insertUuids)
	{
		let nodes = insertUuids || Editor2D.Selection.curSelection('node') || [];
		isQuick = isQuick || nodes.length >1
		Editor2D.Scene.callSceneScript('simple-code', 'getNodesInfo',nodes, (err, nodeInfos) => 
		{ 
			if(!nodeInfos.length) return;

			let codeInfo = this.getCurrEditorFileInfo();
			if(isQuick)
			{
				// 加载多个变量
				let names = [];
				let symbolNames = [];
				for (let i = 0; i < nodeInfos.length; i++) 
				{
					// 定义变量类型
					const nodeInfo = nodeInfos[i];
					let symbolName = 'cc.Node';
					if(widgetType && nodeInfo.compNames.indexOf(widgetType) != -1){
						symbolName = widgetType
					}else{
						for (let i = 0; i < QUICK_LOAD_TYPE_ORDER.length; i++) 
						{
							if( nodeInfo.compNames.indexOf(QUICK_LOAD_TYPE_ORDER[i]) != -1){
								symbolName = QUICK_LOAD_TYPE_ORDER[i];
								break;
							}
						}
					}
					names.push(nodeInfo.name);
					symbolNames.push(symbolName);
				}
				this.loadWidgetsToCode(symbolNames,names,codeInfo,nodes);
			}else{
				// 加载单个变量
				let defineName = widgetType.indexOf('.') != -1 ? nodeInfos[0].name  : widgetType
				this.loadSymbolName((name)=>
				{
					this.loadWidgetToCode(widgetType,name,codeInfo,insertUuids);
				},defineName || '',codeInfo.symbols)
			}
		})
	},

	// 插入资源入口
	insertAssets(isQuick,insertUuids)
	{
		insertUuids = insertUuids || Editor2D.Selection.curSelection('asset');
		//1.读取选中的资源
		//2.解析资源类型 == cc.SpriteFrame ? || xxxx
		//3.接下来流程和加载组件一样
		if(insertUuids == null || insertUuids.length == 0){
			Editor.log("生成绑定资源失败")
			return
		}
		// let meta = await Editor.Message.request("asset-db",'query-asset-meta',uuid)
		Editor2D.assetdb.queryInfoByUuid(insertUuids[0],(_,fileInfo)=>
		{
			if(fileInfo==null){
				return;
			}

			let widgetType = fileInfo.redirect && fileInfo.redirect.type ? fileInfo.redirect.type : fileInfo.type //ASSETS_TYPE_MAP[fileInfo.importer];
			if(widgetType==null){
				Editor.log('不支持插入的资源类型:',fileInfo.importer,fileInfo)
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
					// let list = Editor.Selection.curSelection('asset');
					this.loadWidgetToCode(widgetType,symbolName,codeInfo,insertUuids,true);
				},symbolName,codeInfo.symbols);
			}
		});
	},

	// 加载自定义的组件
	loadCustomWidgetsToCode(codeInfo){
		if(this.parent.file_info == null || this.parent.file_info.uuid != codeInfo.editInfo.uuid ){
			return;
		}
		let info = Editor2D.Selection.curGlobalActivate();

		let rootNodeUuid = info.type == 'node' && info.id ? info.id : null;

		//1.获得生成组件规则
		Editor2D.Scene.callSceneScript('simple-code', 'getCustomWidgetRule',{rootNodeUuid,fileUuid: codeInfo.editInfo.uuid,url: codeInfo.editInfo.url}, (err, args) => { 
			
			// rules = [{symbolName:'',widgetType:'',componentUuid:''}]
			let rules = args.rules;
			// if(rules.length == 0){
			// 	alert("生成拖拽组件失败,当前场景Nodes没有可解析的 node.name")
			// 	return;
			// }
			if(this.parent.file_info.uuid != codeInfo.editInfo.uuid) {
				return;
			}

			// 提供撤销
			codeInfo.editInfo.vs_model.pushStackElement();
			let oldCodeText = codeInfo.editInfo.vs_model.getValue();

			for (let i = 0; i < rules.length; i++) 
			{
				let rule = rules[i];
				let widgetType = rule.widgetType;
				let symbolName = rule.symbolName;
				let nodeUuids  = [ rule.nodeUuid ];
				if(!rule || !rule.disableGenerated)
				{
					if(symbolName[0].match(/[0-9]/)){
						Editor.log('生成拖拽组件:变量命名不符合规范:',symbolName);
						continue;
					}
					// 2.插入成员变量文本
					symbolName = this.insertTextToModel(widgetType,symbolName,codeInfo,false,rule);
				}

				this.parent.setTimeout(()=>{
					// 4.给成员变量赋值引用对象
					this.insertWidgetInfo(args.bindNodeList,widgetType,symbolName,false,nodeUuids,false,rule);
				},100);
			}

			// 3.保存刷新creator生成变量拖拽组件
			this.saveFile(codeInfo.editInfo.vs_model,oldCodeText,rules);

		});
	},

	// 加载多个组件到代码
	loadWidgetsToCode(widgetTypes,symbolNames,codeInfo,insertUuids=null,isAssets=false){
		if(this.parent.file_info == null || this.parent.file_info.uuid != codeInfo.editInfo.uuid ){
			return;
		}

		//1.获得当前打开的脚本是否该场景内节点绑定的
		//2.获得与当前脚本绑定的Nodes
		//3.往脚本添加组件类型字段
		//4.往脚本的类型字段写入当前选中的组件或资源
		this.getCurrEditorFileBindNodes(codeInfo.editInfo.uuid, (bindNodeList)=>
		{
			if(!bindNodeList || bindNodeList.length == 0){
				alert("生成拖拽组件失败,当前场景Nodes没有绑定当前编辑中的脚本")
				return;
			}
			if(this.parent.file_info.uuid != codeInfo.editInfo.uuid) {
				return;
			}

			// 提供撤销
			codeInfo.editInfo.vs_model.pushStackElement();
			let oldCodeText = codeInfo.editInfo.vs_model.getValue();

			for (let i = 0; i < symbolNames.length; i++) 
			{
				let widgetType = widgetTypes[i];
				let symbolName = symbolNames[i];
				let uuids 	   = [insertUuids[i]];
				if(!this.isNormalSymbolName(symbolName)){
					alert('生成拖拽组件:变量命名不符合规范:'+symbolName);
					continue;
				}

				// 插入成员变量文本
				symbolName = this.insertTextToModel(widgetType,symbolName,codeInfo,false);
				this.parent.setTimeout(()=>{
					// 2.添加引用
					this.insertWidgetInfo(bindNodeList,widgetType,symbolName,false,uuids,isAssets);
				},100);
			}
			
			// 1.保存刷新creator生成变量拖拽组件
			this.saveFile(codeInfo.editInfo.vs_model,oldCodeText);

		});
	},

	// 加载单个或数组组件到代码
	loadWidgetToCode(widgetType,symbolName,codeInfo,insertUuids=null,isAssets=false){
		if(!this.isNormalSymbolName(symbolName)){
			alert('生成拖拽组件:变量命名不符合规范:'+symbolName);
			return;
		}
		if(this.parent.file_info == null || this.parent.file_info.uuid != codeInfo.editInfo.uuid ){
			return;
		}

		//1.获得当前打开的脚本是否该场景内节点绑定的
		//2.获得与当前脚本绑定的Nodes
		//3.往脚本添加组件类型字段
		//4.往脚本的类型字段写入当前选中的组件或资源
		this.getCurrEditorFileBindNodes(codeInfo.editInfo.uuid, (bindNodeList)=>
		{
			if(!bindNodeList || bindNodeList.length == 0){
				alert("生成拖拽组件失败,当前场景Nodes没有绑定当前编辑中的脚本")
				return;
			}
			if(this.parent.file_info.uuid != codeInfo.editInfo.uuid) {
				return;
			}
			let isArray = (insertUuids || Editor2D.Selection.curSelection(isAssets ? 'asset':'node') ).length>1 ;

			// 提供撤销
			codeInfo.editInfo.vs_model.pushStackElement();
			let oldCodeText = codeInfo.editInfo.vs_model.getValue();
			// 插入成员变量文本 
			symbolName = this.insertTextToModel(widgetType,symbolName,codeInfo,isArray);

			// save
			this.saveFile(codeInfo.editInfo.vs_model,oldCodeText);

			this.parent.setTimeout(()=>{
				this.insertWidgetInfo(bindNodeList,widgetType,symbolName,isArray,insertUuids,isAssets);
			},100);
		});
	},

	// 变量名是否正常
	isNormalSymbolName(symbolName){
		return !symbolName[0].match(/[0-9]/);
	},

	insertWidgetInfo(bindNodeList,widgetType,symbolName,isArray,insertUuids,isAssets,rule){
		let args = {bindNodeList,widgetType,symbolName,isArray,insertUuids,isAssets,rule}
		Editor2D.Scene.callSceneScript('simple-code', 'insertWidgetInfo',args, (err, isEnd) => { 
			// console.log('生成完成.',isEnd)
		});
	},

	getCurrEditorFileBindNodes(uuid,calback){
		let args = {code_uuid:uuid}
		Editor2D.Scene.callSceneScript('simple-code', 'getCurrEditorFileBindNodes',args, (err, bindNodeList) => { 
			calback(bindNodeList);
		});
	},

	saveFile(model,oldCodeText,rules){
		// 加工代码块
		let codeText = model.getValue();
		try {
			codeText = require(USER_NEW_VAR_RULE).processCode(codeText, model.dbUrl, rules || [], model)
		} catch (error) {
			Editor.error('生成自定义绑定规则配置出错: ',error)
		}
		model.setValue(codeText);

		// 1.保存刷新creator生成变量拖拽组件
		if(oldCodeText === null || oldCodeText != codeText){
			this.parent.saveFile(true,true);
		}
		// 场景快照
		Editor.Message.send('scene','snapshot')
	},

	// 面板销毁
	onDestroy(){

	},

	// 判断类型相等
	isWidgetTypeEqual(fileWidgetType,addWidgetType){
		// Node == cc.Node || Node == 'cc.Node'.split('.')[1]
		// sp.SpineSocket == sp.SpineSocket
		return (fileWidgetType == addWidgetType || fileWidgetType == addWidgetType.split('.')[1])
	},

	// 获得插入文本名, widgetType = 'cc.Node' -> Node
	getWidgetTypeImportName(widgetType){
		let temp = widgetType.split('.');
		if(temp.length == 2 && temp[0] == 'cc'){
			return temp[1];
		}else{
			return widgetType
		}
	},
	
	//3.往脚本添加组件类型字段
	insertTextToModel(widgetType,symbolName,codeInfo,isArray,rule)
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
			// 变量名去掉不符合规则的符号
			symbolName = symbolName[0].toLowerCase() + symbolName.substr(1);
			symbolName = symbolName.replace(/( |\.|\-|\~|\!|\@|\#|\%|\^|\&|\*|\(|\)|\=|\+|\`|\<|\>|\?)/g,''); 
			
			// 1.获得插入文本内容
			let startPos = findObj.index + findObj[0].length;
			let symbols  = this.upSymbolInfoByName(text,codeInfo);
			let symbolInfo = this.getSymbolInfoByName(symbols,symbolName);
			let ccModelue = symbols.ccModelue;
			let isUrl = IS_URL_TYPE.indexOf(widgetType) != -1;
			let importName = this.getWidgetTypeImportName(widgetType);

			if(symbolInfo && !isArray == !symbolInfo.isArray && symbolInfo.symbolName == symbolName && symbolInfo.widgetType == importName){
				// 代码内已存在同名同类型变量，不再覆盖
				return symbolName;
			}
			
			try {
				let oldText = symbolInfo && symbolInfo.text;
				let insertText = require(USER_NEW_VAR_RULE).getInsertText(importName,symbolName,oldText,rule,isArray,codeInfo.isTs,isUrl);
				// 2.检测变量是否已经存在，若存在则需要替换旧的变量字符串
				if(symbolInfo){
					text = text.substr(0,symbolInfo.startPos)+insertText+text.substr(symbolInfo.endPos)
				}else{
					text = text.substr(0,startPos)+insertText+text.substr(startPos)
				}

				// 如果不存在 import widgetType from 'xxx' 路径，则生成一个
				text = this.insertScriptImportPath(text,vs_model.dbUrl,widgetType,codeInfo.isTs,ccModelue);
				vs_model.setValue(text);
			} catch (error) {
				Editor.error('生成自定义绑定规则配置出错: ',error)
			}
		}

		return symbolName;
	},
	
	// 插入 cocos 组件import路径
	insertCcImportPath(text,currPath,widgetType,isTs,ccModelue){
		if(ccModelue.regObj == null){
			return text;
		}
		// widgetType == cc.Node
		let arr = widgetType.split('.');
		let importName = arr[0] == 'cc' ? arr[1] : arr[0]; // cc.Node变量 : sp.SpineSocket 或其它cc模块
		
		if(ccModelue.modules.includes(importName)){
			return text;// 已存在
		}

		// 生成变量文本准备插入
		// 搜索插入文本位置
		let startPos = ccModelue.regObj.index+ccModelue.regObj[1].length+ccModelue.regObj[2].length;
		text = text.substr(0,startPos) + ', ' + importName + text.substr(startPos);
		return text;
	},

	// 插入自定义脚本的import路径
	insertScriptImportPath(text,currPath,widgetType,isTs,ccModelue){
		if(!text || !currPath) {
			return text;
		}

		if(widgetType.indexOf('.') != -1){
			return this.insertCcImportPath(text,currPath,widgetType,isTs,ccModelue)
		}

		// 1.搜索脚本
		// 2.转换相对路径
		// 3.检测是路径否已存在
		// 4.搜索插入位置
		// 5.覆盖文本
		let reg = /(.js|.ts)/;
		let subReg = new RegExp(`(${widgetType}.js|${widgetType}.ts)`,'i');
		let fileUrl 
		for (let i = 0; i < this.parent.file_list_buffer.length; i++) {
			const fileItem = this.parent.file_list_buffer[i];
			if(fileItem.extname.match(reg) && fileItem.value.match(subReg)){
				fileUrl = fileItem.meta;
				break;
			}
		}

		if(!fileUrl){
			return text;
		} 

		
		let importPath = tools.fsPathToRelativePath(currPath,fileUrl)
		importPath = importPath.substr(0,importPath.length-3) // '.ts'.length == 3 
		if(text.match(importPath)){
			return text; // import路径已存在
		}
		
		// 找出import的最后一行，将代码插入这一行下面
		let importText = isTs ? `import { ${widgetType} } from "${importPath}";` : `\nlet ${widgetType} = require("${importPath}");`
		let regImport = /import .+?from.+[\r\n]/g
		let temp 
		let lastImort 
		while(temp = regImport.exec(text)){
			lastImort = temp;
		}

		let insertPos = 0;
		if(lastImort){
			insertPos = lastImort.index + lastImort[0].length;
			importText = '\n' + importText 
		}else{
			importText = importText + '\n'
		}
		text = text.substr(0,insertPos) + importText + text.substr(insertPos);
		return text;
	},

	upSymbolInfoByName(text,codeInfo){
		// 重新解析过成员变量文本的范围,
		return codeInfo.symbols = this.parseSctSymbolInfo(text,codeInfo.isTs);
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
	// getInsertText(widgetType,symbolName,isArray,isReplaceMode,isTs,isUrl){
	// 	let text = ''
	// 	if(isTs){
	// 		let intext = isReplaceMode ? '' : '\n\n	';
	// 		if(isArray){
	// 			text = intext+
	// 				`@property({ type: ['${widgetType}'] }' )`+'\n'+
	// 			`	${symbolName}: ${widgetType} [] = [];`
	// 		}else{
	// 			text = intext+
	// 				`@property({ type: ${widgetType} })`+'\n'+
	// 			`	${symbolName}: ${widgetType} = null;`
	// 		}
	// 	}else
	// 	{
	// 		let key = isUrl ? "url: " : 'type: ' 
	// 		let intext = isReplaceMode ? '' : '\n		';
	// 		text = intext + 
	// 			symbolName+':{\n'+
	// 		'			default: '+(isArray? "[]":"null")+',\n'+
	// 		'			'+key+widgetType+',\n'+
	// 		'		},';
	// 	}
	// 	return text;
	// },


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
				let findObj = code_text.substr(start_ind).match(/@property\(.+\)[\s]{0,35}([\w$]+)[\s]{0,10}:[\s]{0,10}([\w$.]+)[\s]{0,5}[=]{0,1}.+/)
				if (findObj) 
				{
					let startPos = findObj.index + start_ind;
					let endPos = startPos + findObj[0].length;
					let symbolName = findObj[1]
					let widgetType = findObj[2]
					let isArray    = findObj[0].match(/\[[\s\S]*?\]/) != null;
					let symbolInfo = { startPos, endPos, symbolName, widgetType, value: symbolName, meta: widgetType,text:findObj[0], isArray }
					symbols.push(symbolInfo);
					parseTs(code_text, endPos)
				}
			}
			parseTs(text)
		}else
		{
			// JS 解析代码格式是否正常的,
			let esprima = Editor2D.require('packages://simple-code/node_modules/esprima/esprima')
			try {
			    esprima.parse(text)
			} catch (error) {
			    return [];
			}

			// 变量 properties 对象位置
			let findObj = text.match(/properties[	 ]{0,5}:[	 ]{0,5}[\n]{0,5}[	 ]{0,15}{[	 ]{0,5}/)
			if(!findObj){
				Editor.log('JS脚本缺少 properties:{}, 对象，无法自动拖拽组件')
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
					let findObjDefind = code_text.substr(start_ind).match(/([\w$_][\w$._0-9]*)[\s]{0,}:[\s]{0,}\{[\s\S]{0,}?type[\s\:]{0,}([\w$_][\w$._0-9]*)[\s\S]{0,}?,{0,1}[\s]{0,}?\}[\s]{0,}?,{0,1}/)
					let findOjbMini   = code_text.substr(start_ind).match(/([\w$_][\w$._0-9]*)[\s]{0,}:[\s]{0,}[\s\[]{0,}([\w$_][\w$._0-9]+).*[\s]{0,},/); // 简写  value : [ cc.Node ],
					let findObj = findObjDefind
					if(findObjDefind){
						if(findOjbMini && !findOjbMini.input.substr(0,findOjbMini.index).match(/[\{\}]/)){
							if(findOjbMini.index < findObjDefind.index){
								findObj = findOjbMini;
							}
						}
					}else if(findOjbMini && !findOjbMini.input.substr(0,findOjbMini.index).match(/[\{\}]/)){
						findObj = findOjbMini
					}

					if (findObj) 
					{
						let startPos = findObj.index + start_ind;
						let endPos = startPos + findObj[0].length;
						let symbolName = findObj[1]
						let widgetType = findObj[2]
						let isArray    = findObj[0].match(/\[[\s\S]*?\]/) != null;
						let symbolInfo = { startPos, endPos, symbolName, widgetType, value: symbolName, meta: widgetType, text:findObj[0],isArray  }
						symbols.push(symbolInfo);
						parseJs(code_text, endPos)
					}
				}
				parseJs(code,0);

				for (let i = 0; i < symbols.length; i++) {
					const symbolInfo = symbols[i];
					symbolInfo.startPos +=start_ind;
					symbolInfo.endPos +=start_ind;
				}
			}
		}
		symbols.ccModelue = isTs ? this.getCodeCcImports(text) : {modules:[]};
		return symbols;
	},

	getCodeCcImports(code){
		let regObj = code.match(/(import\s*?\{)(.*?)[ ]*?\}\s*?from\s*['"]cc['"]/s);
		if(!regObj){
			return [];
		}
		let temp = regObj[2].replace(/\s/g,'');
		let modules = temp.split(',')
		return {modules,regObj};
	},

	loadSymbolName(callback,defineName='',result=[])
	{
		// 要求输入变量名
		let ps = {value:tools.translateZhAndEn('请确认变量名','Please confirm the variable name'),meta:'',score:0};
		result.unshift(ps)
		// 下拉框选中后操作事件
		let onSearchAccept = (data,cmdLine)=>
		{
			let name = cmdLine.getValue();
			if(ps.value != data.item.value){
				name = data.item.value
			}else{
				name = defineName;
			}
			if(name && name != ps.value){
				callback(name);
			}
		}
		// 修改搜索框时，通过该函数读取显示的实时显示下拉列表内容, cmdLine为输入文本框对象
		let onCompletionsFunc = (cmdLine)=>{
			defineName = cmdLine.getValue()
			return result;
		}
		
		this.parent.ace.openSearchBox(defineName,[],(data,cmdLine)=>onSearchAccept(data,cmdLine),(cmdLine)=>onCompletionsFunc(cmdLine),null,'cc-load-widget-name')
		this.parent.ace.setMiniSearchBoxToTouchPos();
	},


	/**
	 * 拖入事件
	 * @param {evnt} e 
	 * @param {object} dragsArgs - 拖拽的资源信息们 {type:'node',items:[{value:'uuidxx',name:'',type:"cc.Node"}]} || {}
	 * @param {object} mouseDownItem - 点击时鼠标悬停位置资源的信息 {type:'node',uuid:'xxxx'} || {}
	 */
	onDrag(e,dragArgs,mouseDownItem){
		let panel = Editor2D.Panel.getFocusedPanel()
		if(!panel) return;

		// 获得拖拽的组件资源uuid
		let type = dragArgs.type || panel.id

		if(type == 'asset' || type == 'assets'){
			let uuids = this.getSelections('asset',mouseDownItem);
			this.insertAssets(this.parent.cfg.isQuickDrag,uuids)
		}if(type == 'node' || type == 'hierarchy'){
			let uuids = this.getSelections('node',mouseDownItem);
			this.insertWidgetAction(this.parent.cfg.isQuickDrag,null,uuids);
		}
	},

	/** 需要刷新creator右键菜单
	 * @param type = node | asset 
	 * */ 
    onRefreshCreatorMenu(type,uuid){
		this.updateMenu(type,uuid)
	},

	updateMenu(type,uuid){

		// 当前选中的对象
		this.currSelectInfo.type = type;
		this.currSelectInfo.uuid = uuid;
		 
		this.getCurrEditorFileBindNodes(this.parent.file_info && this.parent.file_info.uuid, (bindNodeList)=>
		{
			if(type == 'asset'){

				// 资源菜单
				if(!uuid || !bindNodeList || !bindNodeList.length){
					this.parent.ccMenuMgr.setMenuConfig({id:"cc-widget-assets-to-code",menuCfg:undefined})
				}else{
					
					let menuCfg = {
						assetMenu : [
							{ type: 'separator' },
							{ label : tools.translate('quickly-drop-asset'), enabled:true, click: this.messages["quickInsertAssets"].bind(this)}, // 快速生成拖拽资源
							{ label : tools.translate('drop-asset'), enabled:true, click: this.messages["insertAssets"].bind(this)},// 生成拖拽资源
						],
					}
					this.parent.ccMenuMgr.setMenuConfig({id:"cc-widget-assets-to-code",menuCfg:menuCfg})
				}
			}else if(type == 'node'){

				// nodeTree菜单
				if(!uuid || !bindNodeList || !bindNodeList.length){
					// 清除菜单
					this.parent.ccMenuMgr.setMenuConfig({id:"cc-widget-comp-to-code",menuCfg:undefined})
				}else
				{
					Editor2D.Scene.callSceneScript('simple-code', 'getNodeCompNames',uuid, (err, compNames) => { 

						let submenu = [{ label: 'cc.Node', enabled: true, click: this.messages['insertWidgetByName'].bind(this,'cc.Node')},];
		
						for (let i = 0; i < compNames.length; i++) {
							const name = compNames[i];
							let item = { label: name, enabled: true, click: this.messages["insertWidgetByName"].bind(this,name)};
							submenu.push(item);
						}
		
						let menuCfg = {
							layerMenu : [
								{ type: 'separator' },
								{ label : tools.translate('quickly-drop-component'), enabled:true, click: this.messages["quickInsertWidget"].bind(this), }, // 快速生成拖拽组件
								{ label : tools.translate('drop-component'), enabled:true, submenu:submenu, }, // 生成拖拽组件
							],
						}
						this.parent.ccMenuMgr.setMenuConfig({id:"cc-widget-comp-to-code",menuCfg:menuCfg})
					});
				}
			}
		})
	},

	getSelections(type,currSelectInfo){
		if(currSelectInfo.type != type || !currSelectInfo.uuid){
			return [];
		}
		// 判断当前选中资源中有无当前鼠标所在位置的资源
		let uuids = Editor2D.Selection.curSelection(type) || [];
		if(uuids.indexOf(this.currSelectInfo.uuid) != -1){
			return uuids;
		}else{
			return [this.currSelectInfo.uuid];
		}
	},
	
	messages:{

		// 加载自定义组件绑定规则
		'loadCustomWidgetsToCode'(){
			let codeInfo = this.getCurrEditorFileInfo();
			if(codeInfo == null){
				return;
			}
			this.loadCustomWidgetsToCode(codeInfo)
		},

		// 打开生成规则配置
		'openDragVarRuleFile'()
		{
			this.parent.openOutSideFile(USER_NEW_VAR_RULE,true);
		},
		
		// 添加组件
		'insertWidgetByName'(name)
		{
			if(this.parent == null) return;
			
			let uuids = this.getSelections('node',this.currSelectInfo);
			this.insertWidgetAction(false,name,uuids);
		},

		// 快速添加组件
		'quickInsertWidget'(args)
		{
			if(this.parent == null) return;
			let uuids = this.getSelections('node',this.currSelectInfo);
			this.insertWidgetAction(true,null,uuids);
		},

		// 添加资源
		'insertAssets'(args){
			if(this.parent == null) return;

			let uuids = this.getSelections('asset',this.currSelectInfo);
			this.insertAssets(false,uuids)
		},

		// 快速添加资源
		'quickInsertAssets'(args){
			if(this.parent == null) return;
			let uuids = this.getSelections('asset',this.currSelectInfo);
			this.insertAssets(true,uuids)
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
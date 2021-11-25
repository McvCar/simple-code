/* 
*场景逻辑扩展
*删除选中的节点以及节点所绑定的脚本
*/
'use strict';
var path = require('path');
var fs = require('fs');
var md5 = require('md5');
const tools = require('../../tools/tools');
const config = require('../../config');
const fe = Editor.require('packages://simple-code/tools/tools.js');

let USER_NEW_VAR_RULE 	=  path.join(config.cacheDir,"drag_var_rule.js");

// 资源对象读取方法
let LoadAssetObj = 
{
	load(uuid,callback){
		if(cc.AssetLibrary && cc.AssetLibrary.loadAsset)
		{
			cc.AssetLibrary.loadAsset(uuid,callback);
		}else{
			cc.loader.load({ type: 'uuid', uuid: uuid},()=>{}, callback);
		}
	},

	// 未知类型
	'tryLoad'(uuid,callback)
	{
		LoadAssetObj.load(uuid,(err, obj) => {
			callback(obj);
		})
	},

	'cc.SpriteFrame'(uuid,callback)
	{
		let meta = Editor.remote.assetdb.loadMetaByUuid(uuid)
		if(meta.type == 'sprite' && meta.__subMetas__)
		{
			let spriteFramInfo = meta.__subMetas__[Object.getOwnPropertyNames( meta.__subMetas__)[0]];
			if(spriteFramInfo.uuid){
				LoadAssetObj.load(spriteFramInfo.uuid,(err, obj) => {
					callback(obj);
				})
			}else{
				callback();
			}
		}else{
			LoadAssetObj.load(uuid,(err, obj) => {
				callback(obj);
			})
		}
	},
}

let getSelectedComps = (args,callback) => 
{
	let rets = []
	// 禁止生成拖拽变量
	if(args.rule && args.rule.disableGenerated){
		callback(rets);
		return ;
	}

	let slsAssets = args.insertUuids && args.insertUuids.length ? args.insertUuids : Editor.Selection.curSelection(args.isAssets ? 'asset' : 'node');
	if (args.isAssets) 
	{
		for (let i = 0; i < slsAssets.length; i++) 
		{
			let loadFunc = LoadAssetObj[args.widgetType] || LoadAssetObj['tryLoad'];
			loadFunc(slsAssets[i],(obj)=>
			{
				if(obj) rets.push(obj);
				if(i+1 == slsAssets.length) callback(rets);
			});
		}
	}else
	{
		for (let i = 0; i < slsAssets.length; i++) 
		{
			let node = cc.engine.getInstanceById(slsAssets[i]);
			if (args.widgetType == 'cc.Node') {
				rets.push(node)
			} else {
				let comp = node.getComponent(args.widgetType)
				if (comp) rets.push(comp)
			}
		}
		callback(rets);
	}
}

let getCurrEditorFileBindNodes = (fileUuid,parent)=>{
	var canvas = cc.director.getScene();
	var bindNodeList = [];
	if (canvas && fileUuid) {
		parent.getNodeChildren(canvas, (node) => {
			// 检测该node是否绑定了该脚本
			let code_comp_list = parent.getJsFileList(node);
			code_comp_list.forEach((code_comp, i) => {
				if (code_comp.__scriptUuid == fileUuid) {
					bindNodeList.push({ node_uuid: node.uuid, comp_name: code_comp.__classname__ });
				}
			});
		})
	}
	return bindNodeList;
}

module.exports = {


	/*************  事件 *************/
	messages:
	{
		
		'getNodesInfo'(event, uuids, parent) 
		{

			let nodeInfos = []
			for (let i = 0; i < uuids.length; i++) 
			{
				const uuid = uuids[i];
				let node = cc.engine.getInstanceById(uuid || '');
				if(node){
					let compNames = []
					node._components.forEach((code_comp, i) => {
						if (code_comp.__classname__ ) {
							compNames.push(code_comp.__classname__)
						}
					});
					nodeInfos.push({
						name: node.name,
						uuid: uuid,
						compNames:compNames,
					})
				}
			}
			event.reply(null,nodeInfos);
		},

		'getNodeCompNames'(event, uuid, parent) 
		{
			let node = cc.engine.getInstanceById(uuid || '');
			if(node)
			{
				// 检测该node是否绑定了该脚本
				let compNames = []
				node._components.forEach((code_comp, i) => {
					if (code_comp.__classname__ ) {
						compNames.push(code_comp.__classname__)
					}
				});
				event.reply(null,compNames);
			}else{
				event.reply(null,[]);
			}
		},
		
		'getCurrEditorFileBindNodes'(event, args, parent) {
			let bindNodeList = getCurrEditorFileBindNodes(args.code_uuid, parent);
			event.reply(null, bindNodeList);
		},

		// 获得自定义加载组件列表
		'getCustomWidgetRule'(event,args,parent){
			/**
			 * 1. 获得当前脚本所绑定的Node
			 * 2. 解析 node.name 生成规则
			 */
			let bindNodeList = getCurrEditorFileBindNodes(args.fileUuid, parent);
			if(!bindNodeList.length) {
				event.reply(null,{rules:[],bindNodeList});
				return;
			}

			let rules = []
			try {
				let rootNode = args.rootNodeUuid != null && cc.engine.getInstanceById(args.rootNodeUuid) || cc.director.getScene()
				rules = require(USER_NEW_VAR_RULE).getCustomWidgetRule(args.url,bindNodeList,rootNode);
			}catch (error) {
				Editor.error('生成自定义绑定规则配置出错(getCustomWidgetRule): ',error)
			}

			event.reply(null,{rules,bindNodeList});
		},

		// 自定义保存的代码文本
		'saveWidgetCodeFile'(event, args, parent){
			try {
				let nodes = []
				for (let i = 0; i < args.rules.length; i++) {
					const rule = args.rules[i];
					if(rule.nodeUuid){
						let node = cc.engine.getInstanceById(rule.nodeUuid);
						nodes.push(node);
					}
				}
				let newCodeText = require(USER_NEW_VAR_RULE).processCode(args.codeText, args.dbUrl, args.rules, null,nodes)
				event.reply(null,newCodeText);
			} catch (error) {
				Editor.error('自定义绑定规则配置出错(saveWidgetCodeFile): ',error)
			}
		},

		// 配置拖拽规则
		'loadWidgetRules'(event, args, parent){
			try {
				let bindNodeList = getCurrEditorFileBindNodes(args.scriptUuid, parent);
				if(require(USER_NEW_VAR_RULE).dragWidgetStart){
					args = require(USER_NEW_VAR_RULE).dragWidgetStart(args.rules, args.isArray,args.isQuick)
				}
				args.bindNodeList = bindNodeList;
				event.reply(null,args);
			} catch (error) {
				Editor.error('自定义绑定规则配置出错(loadWidgetRules): ',error)
			}
		},

		'insertWidgetInfo'(event, args, parent) {
			//1.获取绑定当前脚本的Node
			//2.检测该属性是否存在 getComponent('')
			//3.获取选取的组件信息
			//4.将选取的组件插入到脚本中

			let node = cc.engine.getInstanceById(args.bindNodeList[0].node_uuid)
			let old_comp_uuid = node && node.getComponent(args.bindNodeList[0].comp_name) && node.getComponent(args.bindNodeList[0].comp_name).uuid;

			// 定时检测creator加载新建文件缓存没
			let stop_func;
			let chk_count = 0;
			stop_func = parent.setTimeoutToJS(() => 
			{
				//等场景加载完脚本
				let scriptNode = cc.engine.getInstanceById(args.bindNodeList[0].node_uuid)
				if (scriptNode && !scriptNode._objFlags) 
				{
					let scriptComp = scriptNode.getComponent(args.bindNodeList[0].comp_name)
					if(!scriptComp) return;

					let isUpScene = scriptComp.uuid != old_comp_uuid;
					// *：组件uuid改变了说明场景已经刷新了一遍, scriptComp.uuid != old_comp_uuid 
					// 创建脚本瞬间添加的node组件会丢失,所以需要检测1次组件确定加载了
					chk_count++;// 兼容2.4与1.9版本
					if (isUpScene || chk_count == 1)
					{
						if(isUpScene){
							stop_func();
						}

						// sls_comps 获得选择的组件或资源
						getSelectedComps(args,(sls_comps)=>
						{
							let ruleCode = require(USER_NEW_VAR_RULE)

							for (let i = 0; i < args.bindNodeList.length; i++) {
								const info = args.bindNodeList[i];
								let scriptNode = cc.engine.getInstanceById(info.node_uuid)
								if (!scriptNode) {
									continue
								}
								// 获得当前打开的脚本对象
								let scriptComp = scriptNode.getComponent(info.comp_name);
								if (!scriptComp) {
									chk_count = 0;
									continue;
								}
								// 给脚本的成员变量赋值
								if (scriptComp.hasOwnProperty(args.symbolName) && sls_comps && sls_comps[0] != null) {
									scriptComp[args.symbolName] = args.isArray ? sls_comps : sls_comps[0];
								}
								if(ruleCode.setComponentVar){
									ruleCode.setComponentVar(scriptComp,args.widgetType,args.symbolName,args.isArray,args.insertUuids,args.isAssets,args.rule);
								}
							}
							event.reply(null,true);
						});
					}
				}
			}, 1, { count: 15 })
		},

	}
};
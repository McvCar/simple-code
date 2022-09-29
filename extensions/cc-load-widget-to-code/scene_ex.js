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
const { USER_NEW_VAR_RULE } = require('./panel_ex');
const Editor2D = require('../../tools/editor2D');
const fe = Editor2D.require('packages://simple-code/tools/tools.js');


// 资源对象特殊读取方法
let LoadAssetUuid = 
{
	async tryLoadTexture(uuid,type){
		let meta = await Editor.Message.request("asset-db",'query-asset-meta',uuid)
		if(meta.importer == 'image' && meta.subMetas)
		{
			for (const key in meta.subMetas) {
				const element = meta.subMetas[key];
				if(element.importer == type){
					return element.uuid;
				}
			}
		}else{
			return uuid;
		}
	},

	async 'cc.SpriteFrame'(uuid){
		return await LoadAssetUuid.tryLoadTexture(uuid,'sprite-frame');
	},

	async 'cc.Texture2D'(uuid){
		return await LoadAssetUuid.tryLoadTexture(uuid,'texture');
	},

	async 'cc.TextureCube'(uuid){
		return await LoadAssetUuid.tryLoadTexture(uuid,'erp-texture-cube');
	},
}


/**
 * 加载组件或资源到code
 * @param {import('../../panel/scene-info')} parent 
 * @param {Object} args 
 * @param {Array<string>} args.insertUuids  需要绑定的资源或组件们
 * @param {Array<string>} args.bindNodeList
 * @param {string} args.bindNodeList[].node_uuid
 * @param {string} args.bindNodeList[].comp_name  脚本类名
 * @param {string} args.widgetType
 * @param {string} args.symbolName
 * @param {boolean} args.isArray
 * @param {boolean} args.isAssets
 * @param {Object} args.rule
 * @param {Function} callback 
 * @returns 
 */
let loadSelectedCompsOrAssets = async (parent,args) => 
{
	let uuids = [];
	// 禁止绑定拽变量
	let disableGenerated = args.rule && args.rule.disableGenerated
	if(!disableGenerated){
		// 获得绑定到脚本内的资源uuids
		uuids = await getSelectedCompsOrAssets(parent,args)
	}

	// 将uuids组件或资源绑定到脚本
	for (let i = 0; i < args.bindNodeList.length; i++) {
		const element = args.bindNodeList[i];
		const node = parent.findNode(element.node_uuid)
		if(!node){
			continue;
		}

		// 获得当前打开的脚本对象
		let scriptComp = node.getComponent(element.comp_name);
		if (!scriptComp) {
			continue;
		}

		// 绑定的资源到脚本变量内
		if(uuids.length != 0 && !disableGenerated){
			if(args.isArray){
				let values = []
				for (let i = 0; i < uuids.length; i++) {
					values.push({value:{uuid:uuids[i]}})
				}
				parent.setCompProperty(node, args.symbolName, values, args.widgetType, element.comp_name)
			}else{
				parent.setCompProperty(node, args.symbolName,{uuid:uuids[0]}, args.widgetType, element.comp_name)
			}
		}

		// 调用用户规则
		let ruleCode = require(USER_NEW_VAR_RULE)
		if(ruleCode.setComponentVar){
			ruleCode.setComponentVar(scriptComp,args.widgetType,args.symbolName,args.isArray,args.insertUuids,args.isAssets,args.rule);
		}
	}

	return uuids;
}

let getSelectedCompsOrAssets = async (parent,args)=>{
	const uuids = [];
	// 获得绑定资源
	let slsAssets = args.insertUuids && args.insertUuids.length ? args.insertUuids : Editor2D.Selection.curSelection(args.isAssets ? 'asset' : 'node');
	if (args.isAssets) 
	{
		// 拖进来的资源
		for (let i = 0; i < slsAssets.length; i++) 
		{
			let loadFunc = LoadAssetUuid[args.widgetType];
			let uuid = loadFunc ? await loadFunc(slsAssets[i]) : slsAssets[i];
			if(uuid) uuids.push(uuid);
		}
	}else
	{
		// 拖进来的组件
		for (let i = 0; i < slsAssets.length; i++) 
		{
			if (args.widgetType == 'cc.Node') {
				uuids.push(slsAssets[i]);
			} else {
				let node = parent.findNode(slsAssets[i]);
				let comp = node.getComponent(args.widgetType)
				if (comp) uuids.push(comp.uuid);
			}
		}
	}
	return uuids;
}

module.exports = {


	/*************  事件 *************/
	messages:
	{
		
		'getNodesInfo'(uuids, parent) 
		{

			let nodeInfos = []
			for (let i = 0; i < uuids.length; i++) 
			{
				const uuid = uuids[i];
				let node = parent.findNode(uuid || '');
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
			return nodeInfos
		},

		'getNodeCompNames'(uuid, parent) 
		{
			let node = parent.findNode(uuid || '');
			if(node)
			{
				// 检测该node是否绑定了该脚本
				let compNames = []
				node._components.forEach((code_comp, i) => {
					if (code_comp.__classname__ ) {
						compNames.push(code_comp.__classname__)
					}
				});
				return compNames;
			}else{
				return [];
			}
		},
		
		'getCurrEditorFileBindNodes'(args, parent) {
			let bindNodeList = parent.getEditFileBindNodes(args.code_uuid);
			return bindNodeList
		},

		// 获得自定义加载组件列表
		'getCustomWidgetRule'(args,parent){
			/**
			 * 1. 获得当前脚本所绑定的Node
			 * 2. 解析 node.name 生成规则
			 */
			let bindNodeList = parent.getEditFileBindNodes(args.fileUuid);
			if(!bindNodeList.length) {
				console.error('生成自定义绑定规则配置出错: 当前Node未绑定任何脚本')
				return {rules:[],bindNodeList};
			}

			let rules = []
			try {
				let rootNode = args.rootNodeUuid != null && parent.findNode(args.rootNodeUuid) || cc.director.getScene()
				rules = require(USER_NEW_VAR_RULE).getCustomWidgetRule(args.url,bindNodeList,rootNode);
			}catch (error) {
				console.error('生成自定义绑定规则配置出错: ',error)
			}
			
			return {rules,bindNodeList};
		},
		
		// 自定义保存的代码文本
		'saveWidgetCodeFile'(args, parent){
			try {
				let nodes = []
				for (let i = 0; i < args.rules.length; i++) {
					const rule = args.rules[i];
					if(rule.nodeUuid){
						let node = parent.findNode(rule.nodeUuid);
						nodes.push(node);
					}
				}
				let newCodeText = require(USER_NEW_VAR_RULE).processCode(args.codeText, args.dbUrl, args.rules, null,nodes)
				return newCodeText;
			} catch (error) {
				console.error('自定义绑定规则配置出错(saveWidgetCodeFile): ',error)
				return newCodeText;
			}
		},

		// 配置拖拽规则
		'loadWidgetRules'(args, parent){
			try {
				let bindNodeList = parent.getEditFileBindNodes(args.scriptUuid);
				if(require(USER_NEW_VAR_RULE).dragWidgetStart){
					args = require(USER_NEW_VAR_RULE).dragWidgetStart(args.rules, args.isArray,args.isQuick)
				}
				args.bindNodeList = bindNodeList;
			} catch (error) {
				console.error('自定义绑定规则配置出错(loadWidgetRules): ',error)
			}
			return args;
		},

		'insertWidgetInfo'(args, parent) {
			//1.获取绑定当前脚本的Node
			//2.检测该属性是否存在 getComponent('')
			//3.获取选取的组件信息
			//4.将选取的组件插入到脚本中
			
			let node = parent.findNode(args.bindNodeList[0].node_uuid)
			let old_comp_uuid = node && node.getComponent(args.bindNodeList[0].comp_name) && node.getComponent(args.bindNodeList[0].comp_name).uuid;
			// 定时检测creator加载新建文件缓存没
			let stop_func;
			let chk_count = 0;
			// return new Promise((resolve,reject)=>{
			// });
			
			stop_func = parent.setTimeoutToJS(async () => 
			{
				//等场景加载完脚本
				let scriptNode = parent.findNode(args.bindNodeList[0].node_uuid)
				chk_count++;
				if (scriptNode && !scriptNode._objFlags) 
				{
					let scriptComp = scriptNode.getComponent(args.bindNodeList[0].comp_name)
					if(!scriptComp) return;
					let disableGenerated = args.rule && args.rule.disableGenerated;
					// *：组件uuid改变了说明场景已经刷新了一遍, scriptComp.uuid != old_comp_uuid 
					let isUpScene = disableGenerated || scriptComp.hasOwnProperty(args.symbolName);// scriptComp.uuid != old_comp_uuid;
					// 创建脚本瞬间添加的node组件会丢失,所以需要检测1次组件确定加载了
					if (isUpScene)
					{
						stop_func();
						// 绑定资源关系
						let uuids = await loadSelectedCompsOrAssets(parent,args);
						resolve(uuids);
						return
					}
				}
				if(chk_count == 15){
					reject();
				}
			}, 1, { count: 15 })
		},

	}
};
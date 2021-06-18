/* 
*场景逻辑扩展
*删除选中的节点以及节点所绑定的脚本
*/
'use strict';
var path = require('path');
var fs = require('fs');
var md5 = require('md5');
const fe = Editor.require('packages://simple-code/tools/tools.js');

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
			let code_uuid = args.code_uuid
			var canvas = cc.director.getScene();
			var bindInfos = []
			if (canvas && code_uuid) {
				parent.getNodeChildren(canvas, (node) => {
					// 检测该node是否绑定了该脚本
					let code_comp_list = parent.getJsFileList(node);
					code_comp_list.forEach((code_comp, i) => {
						if (code_comp.__scriptUuid == code_uuid) {
							bindInfos.push({ node_uuid: node.uuid, comp_name: code_comp.__classname__ });
						}
					});
				})
			}
			event.reply(null, bindInfos);
		},


		'insertWidgetInfo'(event, args, parent) {
			//1.获取绑定当前脚本的Node
			//2.检测该属性是否存在 getComponent('')
			//3.获取选取的组件信息
			//4.将选取的组件插入到脚本中

			let node = cc.engine.getInstanceById(args.bindInfos[0].node_uuid)
			let old_comp_uuid = node && node.getComponent(args.bindInfos[0].comp_name) && node.getComponent(args.bindInfos[0].comp_name).uuid;

			// 定时检测creator加载新建文件缓存没
			let stop_func;
			let chk_count = 0;
			stop_func = parent.setTimeoutToJS(() => 
			{
				//等场景加载完脚本
				let node = cc.engine.getInstanceById(args.bindInfos[0].node_uuid)
				if (node && !node._objFlags) 
				{
					let comp = node.getComponent(args.bindInfos[0].comp_name)
					if(!comp) return;

					let is_up_scene = comp.uuid != old_comp_uuid;
					// *：组件uuid改变了说明场景已经刷新了一遍, comp.uuid != old_comp_uuid 
					// 创建脚本瞬间添加的node组件会丢失,所以需要检测1次组件确定加载了
					chk_count++;// 兼容2.4与1.9版本
					if (is_up_scene || chk_count == 1)
					{
						if(is_up_scene){
							stop_func();
						}

						getSelectedComps(args,(sls_comps)=>
						{
							for (let i = 0; i < args.bindInfos.length; i++) {
								const info = args.bindInfos[i];
								let node = cc.engine.getInstanceById(info.node_uuid)
								if (!node) {
									continue
								}
								let comp = node.getComponent(info.comp_name);
								if (!comp) {
									chk_count = 0;
									continue;
								}
								if (comp.hasOwnProperty(args.symbolName)) {
									comp[args.symbolName] = args.isArray ? sls_comps : sls_comps[0];
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
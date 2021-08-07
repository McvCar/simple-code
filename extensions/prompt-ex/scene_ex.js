/* 
*场景逻辑扩展
*对话框功能扩展
*/
'use strict';
var path 	= require('path');
var fs 		= require('fs');
var md5     = require('md5');


module.exports = {
	/*************  事件 *************/  
	messages: 
	{
		// 批量添加组件
		'set-node-comp'(comp_name,parent){
			if(comp_name == null && comp_name == "") return cc.log("未选中绑定的组件");
			let arrNode = parent.getSelectdNodes()
			arrNode.forEach((node)=>
			{
				Editor2D.Ipc.sendToPanel("scene","create-component",{
					"component":comp_name,
					"uuid": node.uuid,
				  });
			});
		},
		
		// 批量插入节点
		'add-prefab'(info,parent){

		 	let arrNode = parent.getSelectdNodes()
		 	arrNode.forEach((parentNode)=>
		 	{
		 		// 插入个预制节点
		 		Editor2D.Ipc.sendToPanel("scene","create-node",{
					"parent": parentNode.uuid,
					"assetUuid": info.uuid,
					"unlinkPrefab": true,
					"name": info.value,
					"type": "cc.Prefab"
				  });
		 	});
		},

		 // 获得组件
		 async 'get-comps'(){
			// 获得组件名
			let list = []
			let comps = await Editor.Message.request('scene','query-components')
			comps.forEach((obj)=>
			{
				if(!obj.path.startsWith("hidden:")){
					let name = obj["name"]
					let item_cfg   = {
						value: name , // 命令
						meta: name, // 描述
						score: 0,//搜索优先级
						matchMask: 0,
						exactMatch: 1,
					};
					list.push(item_cfg)
				}
			}) 
			
			return JSON.stringify(list);
		}
	}
};
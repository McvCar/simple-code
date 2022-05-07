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

	}
};
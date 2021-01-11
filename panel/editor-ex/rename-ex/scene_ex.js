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
		'set-node-comp'(event,comp_name,parent){

			if(comp_name == null && comp_name == "") return cc.log("未选中绑定的组件");
			let arrNode = parent.getSelectdNodes()
			arrNode.forEach((node)=>
			{
				node.addComponent(comp_name)
			})
		},


		// 批量插入组件
		'add-prefab'(event,info,parent){

		 	let arrNode = parent.getSelectdNodes()
		 	arrNode.forEach((parentNode)=>
		 	{
		 		// 插入个预制节点
		 		Editor.Ipc.sendToPanel("scene","scene:create-nodes-by-uuids",[info.uuid],parentNode.uuid,{unlinkPrefab:null});
		 	});
		},

		 // 获得组件
		'get-comps'(event){

			// 获得组件名
			let list = []
			cc._componentMenuItems.forEach((obj)=>
			{
				let name = obj["menuPath"]
				let comp_node = name.substr(name.lastIndexOf("/")+1)

				// 非用户脚本
				if( name.lastIndexOf('component.scripts') == -1){
					comp_node = comp_node.replace("_",".")
					comp_node = comp_node.replace(" ","")
					if(comp_node.indexOf(".") == -1){
						comp_node ="cc."+comp_node
					}
				}

				let item_cfg   = {
					value: comp_node , // 命令
					meta: comp_node, // 描述
					score: 0,//搜索优先级
					matchMask: 0,
					exactMatch: 1,
				};
			    list.push(item_cfg)
			}) 
			
			list = JSON.stringify(list)
			event.reply(null,list);
		}
	}
};
/* 
*场景逻辑扩展
*代码输入提示
*/
'use strict';
var path 	= require('path');
var fs 		= require('fs');
var md5     = require('md5');


// 获得场景下所有节点信息
function getSceneChildrensInfo(parent){
	var canvas      = cc.director.getScene();
	if(!canvas) return [];

	let list = []
	parent.getNodeChildren(canvas,(node)=>{
		list.push({
			name:node.name+"",
			uuid:node.uuid,
			path:node._path_str || node.name+"",
		})
	})

	return list;
}

module.exports = {
	/*************  事件 *************/  
	messages: 
	{
		// 获取场景内所有子节点信息
		'scene-children-info': function (parent) {
			// event.reply(null,JSON.stringify(this.getSceneChildrensInfo()))	
			return getSceneChildrensInfo(parent);
		},


	}
};
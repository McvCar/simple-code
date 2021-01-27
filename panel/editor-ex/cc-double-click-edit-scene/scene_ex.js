/* 
*场景逻辑扩展
*对话框功能扩展
*/
'use strict';
var path 	= require('path');
var fs 		= require('fs');
var md5     = require('md5');


let setValue = (comp_uuid,key,value)=>{
	Editor.Ipc.sendToPanel('scene', 'scene:set-property',{
		id: comp_uuid,
		path: key,//要修改的属性
		type: "String",
		value: value,
		isSubProp: false,
	});
}

let SetInfoFuncs = {
	
	'cc.Label'(node,args){
		let comp = node.getComponent('cc.Label')
		if(comp){
			setValue(comp.uuid,'string',args.string)
		}
	},
	'cc.RichText'(node,args){
		let comp = node.getComponent('cc.RichText')
		if(comp){
			setValue(comp.uuid,'string',args.string)
		}
	},
	'cc.EditBox'(node,args){
		let comp = node.getComponent('cc.EditBox')
		if(comp){
			setValue(comp.uuid,args.isPlaceholder ? 'placeholder' : 'string',args.string)
		}
	},
}

let GetInfoFuncs = {
	'cc.Label'(node){
		let comp = node.getComponent('cc.Label')
		if(comp){
			return {string : comp.string};
		}
	},
	'cc.RichText'(node){
		let comp = node.getComponent('cc.RichText')
		if(comp){
			return {string : comp.string};
		}
	},
	'cc.EditBox'(node){
		let comp = node.getComponent('cc.EditBox')
		if(comp){
			return {string : comp.string || comp.placeholder , isPlaceholder : comp.string == '' };
		}
	},
}


module.exports = {
	/*************  事件 *************/  
	messages: 
	{
		// 当前Node的Label组件信息
		'getCurrNodeLabelInfo'(event)
		{
			let uuids = Editor.Selection.curSelection('node');
			let args;
			if(uuids && uuids[0])
			{
				let node = cc.engine.getInstanceById(uuids[0])
				for (const key in GetInfoFuncs) 
				{
					const func = GetInfoFuncs[key];
					args = func(node);
					if(args){
						args.type = key;
						args.uuid = node.uuid;
						break;
					}
				}
			}
			event.reply(null,args);
		},

		// 当前Node的Label组件信息
		'setCurrNodeLabelInfo'(event,args)
		{
			let node = cc.engine.getInstanceById(args.uuid)
			if(node){
				let func = SetInfoFuncs[args.type];
				if(func) func(node,args)
			}
		},
	}
};
/* 
*场景逻辑扩展
*对话框功能扩展
*/
'use strict';
var path 	= require('path');
var fs 		= require('fs');
var md5     = require('md5');


let setValue = (comp_uuid,key,value)=>{
	Editor.Message.send('scene', 'set-property',{
		uuid: comp_uuid,
		path: key,//要修改的属性
		dump: {
			type: "String",
			value: value
		}
	});
}

let getComponentIndex = (node,name)=>{
	for (let i = 0; i < node._components.length; i++) {
		const comp = node._components[i];
		if(comp.__classname__ == name){
			return i;
		}
	}
}

let SetInfoFuncs = {
	
	'cc.Label'(node,args){
		let ind = getComponentIndex(node,'cc.Label');
		if(ind != null){
			let path = `__comps__.${ind}.string`;
			setValue(node.uuid,path,args.string);
		}
	},
	'cc.RichText'(node,args){
		let ind = getComponentIndex(node,'cc.RichText');
		if(ind != null){
			let path = `__comps__.${ind}.string`;
			setValue(node.uuid,path,args.string)
		}
	},
	'cc.EditBox'(node,args){
		let ind = getComponentIndex(node,'cc.EditBox');
		if(ind != null){
			let path = `__comps__.${ind}.${args.isPlaceholder ? 'placeholder' : 'string'}`;
			setValue(node.uuid,path,args.string)
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
		'getCurrNodeLabelInfo'(args,parent)
		{
			let uuids = Editor2D.Selection.curSelection('node');
			if(uuids && uuids[0])
			{
				let node = parent.findNode(uuids[0])
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
			return args;
		},

		// 当前Node的Label组件信息
		'setCurrNodeLabelInfo'(args,parent)
		{
			let node = parent.findNode(args.uuid)
			if(node){
				let func = SetInfoFuncs[args.type];
				if(func) func(node,args)
			}
		},
	}
};
/* 
*主线程扩展
*creator菜单事件管理
*/

'use strict';
var path 	= require('path');
var fs 		= require('fs');
var md5     = require('md5');

const MENU_PANEL_TYPE = {"创建节点":"layerMenu","Create":"layerMenu","新建":"assetMenu","New":"assetMenu"};

module.exports = {

	// 初始化
	onLoad(parent)
	{
		// 主线程对象: main.js
		this.parent = parent; 
		this.menuCfgs = {}
		// hook 菜单
        if (!Editor.Menu["__simple-code-hooked__"]) {
			this.old_menu = Editor.Menu;
        	Editor.Menu = this.hookMenu(Editor.Menu, this.hookMenuFunc.bind(this));
            Editor.Menu["__simple-code-hooked__"] = true;
        }
	},

	hookMenu(orginMenu, hookFunc) {
		const menu = function () {
			hookFunc(...arguments);
			return new orginMenu(...arguments);
		};
		let menuProps = Object.getOwnPropertyNames(orginMenu);
		for (let prop of menuProps) {
			const object = Object.getOwnPropertyDescriptor(orginMenu, prop);
			if (object.writable) {
				menu[prop] = orginMenu[prop];
			}
		}
		menu.prototype = orginMenu.prototype;
		return menu;
	},

	applyItem(item,parnetPaths,args){
		if(item.submenu)
		{
			for (let n = 0; n < item.submenu.length; n++) 
			{
				let sub_item = item.submenu[n];
				let paths = JSON.parse( JSON.stringify(parnetPaths) )
				paths.push(sub_item.label)
				this.applyItem(sub_item,paths)
			}
		}else {
			if(item.message == null){
				let paths = JSON.parse( JSON.stringify(parnetPaths) )
				let toArgs = item.params || {label:item.label,paths,args:args||{}}
				item.click = ()=>{
					Editor.Ipc.sendToPanel('simple-code', item.cmd,toArgs);
				};
			}else{
				let paths = JSON.parse( JSON.stringify(parnetPaths) )
				item.params = item.params || {label:item.label,paths,args:args||{}}
			}
		}
	},

	hookMenuFunc(template) 
	{
		for (let i = 0; i < template.length; i++) {
			const item = template[i];
			if(item.label == '点击来为属性赋值'){
				template.splice(i,1);
				break
			}
		}
		
        const firstMenu = template[0];
		let menuType = MENU_PANEL_TYPE[firstMenu.label];
		for (const id in this.menuCfgs) 
		{
			let menuCfg = this.menuCfgs[id];
			if(!menuCfg) continue;
			let list = menuCfg[menuType];
			if(!list) continue;
			for (let i = 0; i < list.length; i++) 
			{
				const item = list[i];
				if(item.type != 'separator'){
					this.applyItem(item,[item.label],firstMenu.params);
				}
				template.push(item);
			}
		}
        
	},
	
	// 窗口销毁
	onDestroy()
	{
		if(this.old_menu){
			Editor.Menu = this.old_menu;
			delete this.old_menu;
		}
	},
	/*************  事件 *************/  

	messages:
	{
		// 设置右击菜单选项
		'setMenuConfig'(e,args){
			this.menuCfgs[args.id] = args.menuCfg;
		},
		// 清除所有自定义的菜单
		'cleanMenuConfigAll'(){
			this.menuCfgs = {};
		},
	}
};
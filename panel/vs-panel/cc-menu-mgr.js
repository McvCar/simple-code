/* 
面板扩展
功能: 
*/
'use strict';
const path 			= require('path');
const fs 			= require('fs');
const md5			= require('md5');
const prsPath 		= Editor.Project && Editor.Project.path ? Editor.Project.path : Editor.remote.projectPath;
const MENU_PANEL_TYPE = {"create-node":"layerMenu","create-node":"layerMenu","文件夹":"assetMenu","Folder":"assetMenu"};

let is_lock			= false;
class ccMenuMgr {
	
	// 初始化
	constructor(parent)
	{
		/** @type import('../../panel/vs-panel/vs-panel-base') */
		this.parent = parent; 
		this.menuCfgs = {}
		if(!Editor.Menu || !Editor.Menu.popup){
			Editor.warn("快闪编辑器:右击菜单不存在")
			return;
		}
		// 还原
		if(Editor.Menu.popup["__original_func__"]){
			Editor.Menu.popup = Editor.Menu.popup["__original_func__"]
		}

		// hook 菜单
		Editor.Menu.popup["__original_func__"] = Editor.Menu.popup;
		Editor.Menu.popup = this.hookMenu(Editor.Menu.popup, this.hookMenuFunc.bind(this));
	}

	hookMenu(orginPopup, hookFunc) {
		const popup = function () {
			hookFunc(...arguments);
			return orginPopup(...arguments);
		};
		let menuProps = Object.getOwnPropertyNames(orginPopup);
		for (let prop of menuProps) {
			const object = Object.getOwnPropertyDescriptor(orginPopup, prop);
			if (object.writable) {
				popup[prop] = orginPopup[prop];
			}
		}
		popup.prototype = orginPopup.prototype;
		return popup;
	}

	applyItem(item,parnetPaths){
		if(item.submenu){
			//子菜单
			for (let n = 0; n < item.submenu.length; n++) 
			{
				let sub_item = item.submenu[n];
				let paths = JSON.parse( JSON.stringify(parnetPaths) )
				paths.push(sub_item.label)
				this.applyItem(sub_item,paths)
			}
		}else {
			if(item.message == null){
				// let paths = JSON.parse( JSON.stringify(parnetPaths) )
				// let toArgs = item.params || {label:item.label,paths,args:args||{}}
				// item.click = ()=>{
				// 	Editor.Ipc.sendToPanel('simple-code', item.cmd,toArgs);
				// };
			}else{
				let paths = JSON.parse( JSON.stringify(parnetPaths) )
				item.params = item.params || {label:item.label,paths}
			}
		}
	}

	// 处理菜单
	hookMenuFunc(template) 
	{
		if(!template.menu){
			return;
		}
        const firstMenu = template.menu[0];
		if(!firstMenu || !firstMenu.submenu || !firstMenu.submenu.length){
			return
		}
		let menuType = MENU_PANEL_TYPE[firstMenu.submenu[0].label || firstMenu.submenu[0].template] || MENU_PANEL_TYPE[firstMenu.submenu[0].message];
		this.parent.onCCMenuPopup(menuType);
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
					this.applyItem(item,[item.label]);
				}
				template.menu.push(item);
			}
		}
        
	}
	
	// 窗口销毁
	onDestroy()
	{
		if(Editor && Editor.Menu && Editor.Menu.popup["__original_func__"]){
			Editor.Menu.popup = Editor.Menu.popup["__original_func__"]
			delete Editor.Menu.popup["__original_func__"];
		}
	}
	
	// 设置右击菜单选项
	setMenuConfig(args){
		this.menuCfgs[args.id] = args.menuCfg;
	}

	// 清除所有自定义的菜单
	cleanMenuConfigAll(){
		this.menuCfgs = {};
	}
}

module.exports = ccMenuMgr;
/* 
*主线程扩展
*creator菜单事件
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
        if (!Editor.Menu["__hooked__"]) {
            Editor.Menu["__hooked__"] = true;
        	Editor.Menu = this.hookMenu(Editor.Menu, this.hookMenuFunc.bind(this));
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
        const firstMenu = template[0];
		let menuType = MENU_PANEL_TYPE[firstMenu.label];
		for (const id in this.menuCfgs) 
		{
			let menuCfg = this.menuCfgs[id];
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
        // const subMenu = firstMenu.submenu;
        // if (subMenu && firstMenu.label === filterData[0] && subMenu[0].label === filterData[1]) {
            // const parentId = subMenu[0].params[2];
            // const injectMenu = {
            //     label: Editor.T("game-helper.createcomp"),
            //     submenu: [{
            //         label: "test",
            //         click: () => {
			// 			Editor.log('test to:',parentId);
            //         },
            //     }],
            // };
            template.push({
				label: "test",
				// enabled: true,
				message: 'custom-cmd',
				panel: 'simple-code',
				params:firstMenu.params,
				// click: () => {
				// 	Editor.log('test to:',parentId);
				// },
			});
        // }
	},
	
	// 窗口销毁
	onDestroy()
	{

	},
	/*************  事件 *************/  

	messages:
	{
		'setMenuConfig'(e,args){
			this.menuCfgs[args.id] = args.menuCfg;
		},
	}
};
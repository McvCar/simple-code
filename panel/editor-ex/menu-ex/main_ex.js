/* 
*主线程扩展
*绑定快捷键事件
*/

'use strict';
var path 	= require('path');
var fs 		= require('fs');
var md5     = require('md5');


module.exports = {

	// 初始化
	onLoad(parent)
	{
		// 主线程对象: main.js
		this.parent = parent; 
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

    hookMenuFunc(template) {
        const firstMenu = template[0];
		Editor.log(template);
		Editor.log(firstMenu.params);
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

	}
};
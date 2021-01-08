/* 
面板扩展
功能: 绑定快捷键事件
*/
'use strict';
const path 			= require('path');
const fs 			= require('fs');
const md5			= require('md5');
const fe 			= Editor.require('packages://simple-code/tools/FileTools.js');
const prsPath 		= Editor.Project && Editor.Project.path ? Editor.Project.path : Editor.remote.projectPath;

let is_lock			= false;

module.exports = {

	// 面板初始化
	onLoad(parent){
		// index.js 对象
		this.parent = parent; 

        // hook 菜单
        if (!Editor.remote.Menu["__hooked__"]) {
            Editor.remote.Menu["__hooked__"] = true;
            // const func = Editor.Ipc.sendToPanel;
            // Editor.Ipc.sendToPanel = (n, r, ...i) => { Editor.log(n, r, ...i); return func(n, r, ...i) };
            Editor.remote.Menu = this.hookMenu(Editor.remote.Menu, this.hookMenuFunc.bind(this));
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
        const subMenu = firstMenu.submenu;
        if (subMenu && firstMenu.label === filterData[0] && subMenu[0].label === filterData[1]) {
            const parentId = subMenu[0].params[2];
            const injectMenu = {
                label: Editor.remote.T("game-helper.createcomp"),
                submenu: [],
            };
            this.localPrefabCfgs.forEach((o) => {
                injectMenu.submenu.push({
                    label: o.name,
                    click: () => {
                        this.createCompNode(o.uuid, o.name, parentId);
                    },
                });
            });
            subMenu.splice(1, 0, injectMenu);
        }
	},
	
	// 面板销毁
	onDestroy(){

	},


	messages:{

		'cleanFile'()
		{
		},
	},
	
};
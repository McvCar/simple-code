/* 
面板扩展
功能: 绑定快捷键事件
*/
'use strict';
const path = require('path');
const fs = require('fs');
const md5 = require('md5');
const fe = Editor2D.require('packages://simple-code/tools/tools.js');
const AssetCleaner = Editor2D.require('packages://simple-code/extensions/cc-asset-clean/AssetCleanerForCocosCreator/AssetCleaner');
const prsPath = Editor.Project && Editor.Project.path ? Editor.Project.path : Editor.remote.projectPath;

let is_lock = false;

module.exports = {
	/** @type import('../../panel/vs-panel/vs-panel-base') */
	parent: null,

	// 面板初始化
	onLoad(parent) {
		// index.js 对象
		this.parent = parent;
	},


	// 面板销毁
	onDestroy() {

	},

	async loadList(outMap, color) {
		let not_select_list = []
		let is_swi_mode = true
		for (let [type, files] of outMap.entries()) {
			if (files.length <= 0) {
				continue;
			}

			for (let i = 0, len = files.length; i < len; i++) {
				let info = files[i];
				if (!info.uuid) {
					info.uuid = await Editor2D.assetdb.fspathToUuid(info.path);
				}

				if (info.uuid) {
					let item = document.getElementById(info.uuid)
					if (item) {
						if (is_lock) {
							item.style.backgroundColor = color; // 紫色高亮
						} else {
							item.style.backgroundColor = null; // 取消高亮
						}
						is_swi_mode = false
					} else if (await Editor.assetdb.existsByUuid(info.uuid)) {
						//新版不支持,切换模式
						not_select_list.push(info.uuid)
						// Editor.log("未发现item",info.path);
						// Editor.Selection.select('asset', uuid)
						// Editor.Ipc.sendToAll('assets:hint', uuid)
					}
				}
			}

			// 新版高亮
			if (not_select_list.length && is_swi_mode) {
				Editor2D.Selection.select('asset', not_select_list)
			}
		}

	},

	search() {
		if (!this.noBindMap) {
			let { noBindMap, noLoadMap, outStr } = AssetCleaner.start(prsPath + path.sep + "assets");
			this.noBindMap = noBindMap
			this.noLoadMap = noLoadMap
			Editor.log("搜索完成,请点开资源管理查看");
			Editor.log(outStr);
		}
		this.loadList(this.noBindMap, 'rgba(114, 0, 218, 0.57)');
		this.loadList(this.noLoadMap, 'rgba(14, 0, 218, 0.57)');
	},


	// /** 需要刷新creator右键菜单
	// 	* @param type = node | asset 
	// 	* */
	// onRefreshCreatorMenu(type, uuid) {
	// 	this.updateMenu(type, uuid)
	// },

	// updateMenu(type, uuid) {

	// 	// 当前选中的对象
	// 	this.currSelectInfo = { type, uuid };

	// 	if (type == 'asset') {
	// 		// 资源菜单
	// 		if (!uuid) {
	// 			// 清除菜单
	// 			Editor2D.Ipc.sendToMain('simple-code:setMenuConfig', { id: "cc-assets-clean", menuCfg: undefined })
	// 		} else {
	// 			// 菜单内容
	// 			let menuCfg = {
	// 				assetMenu: [
	// 					{ type: 'separator' },
	// 					{ label: '搜索未使用的资源', enabled: true, cmd: "cleanFileByDir" }, // 快速生成拖拽资源
	// 				],
	// 			}
	// 			Editor2D.Ipc.sendToMain('simple-code:setMenuConfig', { id: "cc-assets-clean", menuCfg: menuCfg })
	// 		}
	// 	} else if (type == 'node') {

	// 	}
	// },


	// findViaUuid(uuid) {
	// 	// 是否为有效 uuid
	// 	if (!Editor2D.Utils.UuidUtils.isUuid(uuid)) {
	// 		Editor2D.log('[🔎]', '该 uuid 无效', uuid);
	// 		return;
	// 	}
	// 	// 获取资源信息
	// 	const assetInfo = Editor2.assetdb.assetInfoByUuid(uuid);
	// 	if (assetInfo) {
	// 		// 暂不查找文件夹
	// 		if (assetInfo.type === 'folder') {
	// 			Editor.log('[🔎]', '暂不支持查找文件夹', assetInfo.url);
	// 			return;
	// 		}
	// 		// 处理文件路径 & 打印头部日志
	// 		const urlItems = assetInfo.url.replace('db://', '').split('/');
	// 		if (!urlItems[urlItems.length - 1].includes('.')) {
	// 			urlItems.splice(urlItems.length - 1);
	// 		}

	// 		// 记录子资源 uuid
	// 		const subUuids = assetInfo ? [] : null;
	// 		// 资源类型检查
	// 		if (assetInfo.type === 'texture') {
	// 			// 纹理子资源
	// 			const subAssetInfos = Editor.assetdb.subAssetInfosByUuid(uuid);
	// 			if (subAssetInfos) {
	// 				for (let i = 0; i < subAssetInfos.length; i++) {
	// 					subUuids.push(subAssetInfos[i].uuid);
	// 				}
	// 				uuid = null;
	// 			}
	// 		} else if (assetInfo.type === 'typescript' || assetInfo.type === 'javascript') {
	// 			// 脚本
	// 			uuid = Editor.Utils.UuidUtils.compressUuid(uuid);
	// 		}
	// 		// 查找
	// 		const results = uuid ? this.findReferences(uuid) : [];
	// 		if (subUuids && subUuids.length > 0) {
	// 			for (let i = 0; i < subUuids.length; i++) {
	// 				const subResults = this.findReferences(subUuids[i]);
	// 				if (subResults.length > 0) {
	// 					results.push(...subResults);
	// 				}
	// 			}
	// 		}

	// 		if (results.length === 0) {
	// 			Editor.assetdb.delete(['db://' + urlItems.join('/')], function (err, results) {
	// 				results.forEach(function (result) {
	// 					if (err) {
	// 						Editor.log("删除文件失败!!!");
	// 						return;
	// 					}
	// 					Editor.log("删除文件成功!!!");
	// 					Editor.log(urlItems.join('/'))
	// 					Editor.log(`${'----'.repeat(36)}`);
	// 				});
	// 			});


	// 			// Editor.log(ProjectPath+"/"+urlItems.join('/'))
	// 			// Editor.assetdb.delete(ProjectPath+"/"+urlItems.join('/'))
	// 			// Editor.assetdb.delete(ProjectPath+"/"+urlItems.join('/')+".meta")
	// 			Editor.log('[🔎]', '没有找到可引用资源的图片', urlItems.join('/'));
	// 			Editor.log(`${'----'.repeat(36)}`);
	// 		}

	// 	}
	// },


	messages: {
		// 'cleanFileByDir'() {
		// 	Editor.log('点击菜单后调用', this.currSelectInfo);
		// 	this.findViaUuid(this.currSelectInfo.uuid)
		// },
		'cleanFile'() {
			if (!this.noBindMap) Editor.log("初次搜索未使用的资源,期间会卡顿几秒,请稍等...");
			setTimeout(() => {
				is_lock = !is_lock;
				this.search();

				// 锁定选中状态
				if (this.sch_id) clearInterval(this.sch_id)
				if (is_lock) {
					this.sch_id = setInterval(this.search.bind(this), 2000);
					Editor.log("已锁定选中状态，若取消锁定 请再次按下'高亮未使用资源'快捷键");
				}
			}, this.noBindMap ? 1 : 500);
		},
	},

};
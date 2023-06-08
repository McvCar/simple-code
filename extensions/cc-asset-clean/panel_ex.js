/* 
面板扩展
功能: 绑定快捷键事件
*/
'use strict';
const path = require('path');
const fs = require('fs');
const Editor2D = require('../../tools/editor2D');
const tools = require('../../tools/tools');

// 包含引用信息的文件类型
const referenceTypes = {
	"cc.SceneAsset":1, "cc.Prefab":1, "cc.Material":1, "cc.AnimationClip":1
}

// 搜索类型
const searchTypes = {
	"cc.ImageAsset":1, "cc.Prefab":1, "cc.Material":1, "cc.AnimationClip":1," cc.PhysicsMaterial":1,"cc.SpriteAtlas":1,
}


module.exports = {
	/** @type import('../../panel/vs-panel/vs-panel').EditorPanel */
	parent: null,

	// 面板初始化
	onLoad(parent) {
		// index.js 对象
		this.parent = parent;
		this.fileBuffs = {}
	},


	// 面板销毁
	onDestroy() {
		
	},

	// 选中资源
	selectAsset(assetUuid){
		Editor2D.Ipc.sendToAll('assets:hint', assetUuid)
		Editor.Selection.select('asset', assetUuid);
	},

	cleanSelect(){
		 Editor.Selection.clear('asset');
	},

	async findAssets(uuid) {
		if(this._isRuning){
			return console.log("正在搜索引用...")
		}
		this.fileBuffs = {}
		let selectFileInfo = await Editor.Message.request("asset-db",'query-asset-info',uuid);
		if(!selectFileInfo){
			return;
		}
		this._isRuning = true

		this.cleanSelect()
		let assets = await Editor.Message.request("asset-db",'query-assets');
		// 1.检测当前uuid是否文件夹
		if(selectFileInfo.importer == 'directory'){
			let searchDir = selectFileInfo.url;
			for (let i = 0; i < assets.length; i++) 
			{
				const fileInfo = assets[i];
				// 2.遍历文件夹下的文件信息
				if(searchTypes[fileInfo.type] && fileInfo.url.startsWith(searchDir)){
					// 3.查找指定类型使用状态
					let results = await this.findReferences(fileInfo,assets);
					if(results.length == 0){
						// 7.未使用的资源标记上
						this.selectAsset(fileInfo.uuid);
					}
				}
			}
		}else if(searchTypes[selectFileInfo.type])
		{
			// 2.查找选定文件使用状态
			let results = await this.findReferences(selectFileInfo,assets);
			if(results.length == 0){
				// 7.未使用的资源标记上
				this.selectAsset(selectFileInfo.uuid);
				console.log(`[🔎 搜索:]${selectFileInfo.url}, 该文件未被引用`);
			}
		}else{
			console.log(`[🔎 不支持搜索类型:] ${selectFileInfo.type}`);
		}
		this._isRuning = false
	},

	/**
	 * 查找引用
	 * @param {object} searchFileInfo 
	 * @param {Array} assets 
	 * @returns 
	 */
	 async findReferences(searchFileInfo,assets) {
		const results = [];
		// 4.遍历所有能绑定资源的配置信息，检测是否存在uuid
		for (let i = 0; i < assets.length; i++){
			const fileInfo = assets[i];
			// 5. 过滤无效文件
			if(!referenceTypes[fileInfo.type] || fileInfo.uuid == searchFileInfo.uuid){
				continue;
			}

			let text = this.fileBuffs[fileInfo.uuid] || '';
			if(text == ''){
				text = await this.readFile(fileInfo.file)
				this.fileBuffs[fileInfo.uuid] = text;
			}

			if(text.includes(searchFileInfo.uuid)){
				// 6.记录下引用的资源
				results.push(fileInfo);
			}
			
		}
		this.printResult(searchFileInfo,results)
		return results;
	},

	readFile(fsPath){
		return new Promise((resolve)=>{
			fs.readFile(fsPath,(err,data)=>{
				if(err) return resolve('');
				resolve(data.toString());
			});
		}) 
	},

	/**
	 * 打印结果至控制台
	 * @param {object} searchFileInfo 
	 * @param {object[]} results 
	 */
	printResult(searchFileInfo,results) {
		if (results.length === 0) {
			return;
		}
		let desc = `[🔎 搜索:]${searchFileInfo.url}，引用数量:${results.length}, ,引用详情:\n`
		let list = []
		for (let i = 0; i < results.length; i++) {
			list.push(results[i].url);
		}
		console.log(desc,list.join('\n'));
	},

	/** 需要刷新creator右键菜单
	 * @param type = node | asset 
	 * */
	onRefreshCreatorMenu(type, uuid) {
		this.updateMenu(type, uuid)
	},

	updateMenu(type, uuid) {

		// 当前选中的对象
		this.currSelectInfo = { type, uuid };

		if (type != 'asset' || !uuid) {
			// 清除菜单
			this.parent.ccMenuMgr.setMenuConfig({ id: "cc-assets-clean", menuCfg: undefined })
		} else {
			// 菜单内容
			let menuCfg = {
				assetMenu: [
					{ type: 'separator' },
					{ label: '搜索 未使用的资源 🔎 ', enabled: true, click:this.messages["findCleanFileByDir"].bind(this) }, // 快速生成拖拽资源
				],
			}
			this.parent.ccMenuMgr.setMenuConfig({ id: "cc-assets-clean", menuCfg: menuCfg })
		}
	},
	messages: {
		'findCleanFileByDir'() {
			if(this.currSelectInfo && this.currSelectInfo.uuid){
				this.findAssets(this.currSelectInfo.uuid)
			}
		},
	},

};
/* 
*场景逻辑扩展
*删除选中的节点以及节点所绑定的脚本
*/
'use strict';
var path = require('path');
var fs = require('fs');
const config = require('../../config');
const USER_NEW_FILE_RULE = require('./panel_ex').USER_NEW_FILE_RULE;
const Editor2D = require('../../tools/editor2D');

let onComplete = (saveUrl,data,node,jsFileName)=>{
	
	if(require(USER_NEW_FILE_RULE).onComplete){
		setTimeout(()=>{
			require(USER_NEW_FILE_RULE).onComplete(saveUrl,data,node,jsFileName);
		},100)
	}
}

module.exports = {



	/*************  事件 *************/
	messages:
	{
		'get-curr-scene-url-and-node':async function (args,parent) 
		{
			let node = args.uuid && parent.findNode(args.uuid);
			if (!node || args.type != "node") {
				Editor.log("该功能需要您选中一个节点后再执行才能创建脚本与绑定节点")
				return
			}
			let name = node.name;
			let url = await parent.getCurrSceneUrl()
			return {currNodeName:name,url}
		},


		'new-js-file': async function (args,parent) {

			let node = args.uuid && parent.findNode(args.uuid);

			if (!node || args.type != "node") {
				Editor.log("该功能需要您选中一个节点后再执行才能创建脚本与绑定节点")
				onComplete(args.saveUrl,data,node,scriptName);
				return {}
			}

			let data = '';
			// 1.检测原文件是否存在
			let fileUuid = await Editor2D.assetdb.urlToUuid(args.saveUrl);
			let uuid 	 = node.uuid;
			let scriptName = ''
			if(fileUuid){
				data = fs.readFileSync(args.saveFspath).toString();
				// 2.检测类名
				scriptName = await Editor.Message.request('scene','query-script-name',fileUuid);
				// 3.检测组件类名是否存在
				let comp = node.getComponent(scriptName);
				if (comp) {
					return {};
				}else{
					// 4.不存在添加组件
					await Editor.Message.request('scene','create-component',{
						uuid: uuid,
						component: scriptName,
					});
					onComplete(args.saveUrl,data,node,scriptName);
					return {}
				}
			}



			// 5.不存在保存模块文件
			data = fs.readFileSync(args.templePath).toString();
			if(require(USER_NEW_FILE_RULE).getSaveText){
				data = require(USER_NEW_FILE_RULE).getSaveText(data,args.saveUrl,node)
			}

			return new Promise((resolve, reject )=>{
				// 创建文件
				Editor2D.assetdb.create(args.saveUrl, data, (err, results) => {
					if (err) return resolve({});
					
					// 6. 定时检测creator加载新建文件缓存没
					let stop_func;
					
					stop_func = parent.setTimeoutToJS(async() => {
						// 7.检测脚本编译完
						let fileUuid = await Editor2D.assetdb.urlToUuid(args.saveUrl);
						if(!fileUuid) {
							return;
						}else{
							let scriptName = await Editor.Message.request('scene','query-script-name',fileUuid);
							//等场景加载完脚本
							node = parent.findNode(uuid);
							if(!node || !scriptName){
								return;
							}
							// 8.添加组件
							await Editor.Message.request('scene','create-component',{
								uuid: uuid,
								component: scriptName,
							});
							let comp = node.getComponent(scriptName)
							if (comp) {
								stop_func();
								Editor2D.Selection.select('asset',fileUuid);
								onComplete(args.saveUrl,data,node,scriptName);
								console.log("保存成功")
								resolve({ data: "", node_uuid: uuid, scipt_uuid: comp.__scriptUuid })
							}
						}
					}, 0.5, { count: 30 })
				}, 500)
			})
		}

	}
};
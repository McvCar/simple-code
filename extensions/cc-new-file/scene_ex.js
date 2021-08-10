/* 
*场景逻辑扩展
*删除选中的节点以及节点所绑定的脚本
*/
'use strict';
var path = require('path');
var fs = require('fs');
const config = require('../../config');
const USER_NEW_FILE_RULE = require('./panel_ex').USER_NEW_FILE_RULE;

let cc_require = (fileName)=>{
	// 阻止报错提示
	let func = Editor.failed;
	let comp;
	Editor.failed = () => { }
	try {
		comp = cc.require(fileName)
	} catch (t) { }

	Editor.failed = func;

	return comp;
}

let onComplete = (saveUrl,data,node,jsFileName)=>{
	
	if(require(USER_NEW_FILE_RULE).onComplete){
		setTimeout(()=>{
			try{
				data = data || fs.readFileSync( Editor.remote.assetdb.urlToFspath(saveUrl)).toString();
			}catch(err){
			}
			require(USER_NEW_FILE_RULE).onComplete(saveUrl,data,node,jsFileName);
		},100)
	}
}

module.exports = {



	/*************  事件 *************/
	messages:
	{
		'get-curr-scene-url-and-node': function (event,args,parent) 
		{
			let node = args.uuid && parent.findNode(args.uuid);
			if (!node || args.type != "node") {
				Editor.info("该功能需要您选中一个节点后再执行才能创建脚本与绑定节点")
				event.reply(null);
				return
			}
			let name = node.name;
			parent.getCurrSceneUrl((url)=>{
				event.reply(null,{currNodeName:name,url,name})
			})
		},


		'new-js-file': function (event, args,parent) {

			let node = args.uuid && parent.findNode(args.uuid);

			if (!node || args.type != "node") {
				Editor.info("该功能需要您选中一个节点后再执行才能创建脚本与绑定节点")
				event.reply(null, {});
				return
			}

			let uuid = node.uuid;
			let jsFileName = path.basename(args.saveUrl,path.extname(args.saveUrl));

			// 判断文件是否存在
			let comp = node.getComponent(jsFileName);
			if (comp) {
				onComplete(args.saveUrl,null,node,jsFileName)
				event.reply(null, {});// 回调通知结果
				return;
			}else{
				comp = cc_require(jsFileName);
				if (comp) {
					onComplete(args.saveUrl,null,node,jsFileName)
					node.addComponent(jsFileName);
					event.reply(null, {});// 回调通知结果
					return;
				}
			}

			let data = fs.readFileSync(args.templePath).toString();
			if(require(USER_NEW_FILE_RULE).getSaveText){
				data = require(USER_NEW_FILE_RULE).getSaveText(data,args.saveUrl,node)
			}
			// 创建文件
			Editor.assetdb.create(args.saveUrl, data, (err, results) => {
				if (err) return event.reply(null, {});

				// 定时检测creator加载新建文件缓存没
				let stop_func;
				let chk_count = 0
				let old_uuid ;
				stop_func = parent.setTimeoutToJS(() => {
					//等场景加载完脚本
					node = parent.findNode(uuid)
					if (node && !node._objFlags) {
						let comp = node.getComponent(jsFileName)
						if (comp) {
							// 创建脚本瞬间添加的node组件会丢失,所以需要检测3次组件确定加载了
							// *：组件uuid改变了说明场景已经刷新了一遍, comp.uuid != old_uuid 
							if (chk_count++ == 3 || (old_uuid && old_uuid != comp.uuid) ) {
								stop_func();
								event.reply(null, { data: "", node_uuid: uuid, scipt_uuid: comp.__scriptUuid });
								Editor.Ipc.sendToPanel('simple-code', 'custom-cmd', { cmd: "openFile" });
								parent['scene-need-save']()
								onComplete(args.saveUrl,data,node,jsFileName)
							}
						} else {
							// 阻止报错提示
							let func = Editor.failed;
							Editor.failed = () => { }
							try {
								comp = cc.require(jsFileName)
							} catch (t) { }

							Editor.failed = func;

							// 添加组件
							if (comp) {
								// Editor.Ipc.sendToPanel('scene', 'scene:add-component', uuid, jsFileName); //添加不了脚本
								comp = node.addComponent(jsFileName);
								if(!old_uuid) old_uuid = comp.uuid;
							}
						}
					}
				}, 0.5, { count: 30 })
			}, 500)
		}

	}
};
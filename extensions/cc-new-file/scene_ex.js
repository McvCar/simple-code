/* 
*场景逻辑扩展
*删除选中的节点以及节点所绑定的脚本
*/
'use strict';
var path = require('path');
var fs = require('fs');
const config = require('../../config');

// 新建js模板路径
let getJsTemplatePath = (node_uuid, file_type) => {
	return path.join(config.cacheDir, 'define.' + file_type)
}

module.exports = {



	/*************  事件 *************/
	messages:
	{
		'get-curr-scene-url-and-node': function (event,args,parent) {
			let head_node = Editor.Selection.curSelection('node')[0];
			let activeInfo = Editor.Selection.curGlobalActivate();
			let node = parent.findNode(head_node);
			if (!node || activeInfo.type != "node") {
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
			let head_node = Editor.Selection.curSelection('node')[0];
			let node = parent.findNode(head_node);
			let activeInfo = Editor.Selection.curGlobalActivate();

			if (!node || activeInfo.type != "node") {
				Editor.info("该功能需要您选中一个节点后再执行才能创建脚本与绑定节点")
				event.reply(null, {});
				return
			}

			let uuid = node.uuid;
			let jsFileName = path.basename(args.saveUrl,path.extname(args.saveUrl));
			let data = fs.readFileSync(args.templePath);
			// 创建文件
			Editor.assetdb.create(args.saveUrl, data, (err, results) => {
				if (err) return event.reply(null, {});

				// 定时检测creator加载新建文件缓存没
				let stop_func;
				let chk_count = 0
				stop_func = parent.setTimeoutToJS(() => {
					//等场景加载完脚本
					node = parent.findNode(uuid)
					if (node && !node._objFlags) {
						let comp = node.getComponent(jsFileName)
						if (comp) {
							// 创建脚本瞬间添加的node组件会丢失,所以需要检测3次组件确定加载了
							if (chk_count++ == 3) {
								stop_func();
								event.reply(null, { data: "", node_uuid: uuid, scipt_uuid: comp.__scriptUuid });
								Editor.Ipc.sendToPanel('simple-code', 'custom-cmd', { cmd: "openFile" });
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
								node.addComponent(jsFileName);
							}
						}
					}
				}, 0.5, { count: 30 })
			}, 500)
		}

	}
};
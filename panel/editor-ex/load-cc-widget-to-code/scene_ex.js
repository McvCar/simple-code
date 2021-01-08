/* 
*场景逻辑扩展
*删除选中的节点以及节点所绑定的脚本
*/
'use strict';
var path = require('path');
var fs = require('fs');
var md5 = require('md5');
const fe = Editor.require('packages://simple-code/tools/FileTools.js');


let getSelectedComps = (args) => {
	let activeInfo = Editor.Selection.curGlobalActivate();
	if (activeInfo == null) return [];
	let rets = []
	if (activeInfo.type == "node") {
		let slsNodes = Editor.Selection.curSelection('node');
		for (let i = 0; i < slsNodes.length; i++) {
			let node = cc.engine.getInstanceById(slsNodes[i]);
			if (args.widgetType == 'cc.Node') {
				rets.push(node)
			} else {
				let comp = node.getComponent(args.widgetType)
				if (comp) rets.push(comp)
			}
		}
	}

	return rets;
}

module.exports = {


	/*************  事件 *************/
	messages:
	{
		'getCurrEditorFileBindNodes'(event, args, parent) {
			let code_uuid = args.code_uuid
			var canvas = cc.director.getScene();
			var bindInfos = []
			if (canvas && code_uuid) {
				parent.getNodeChildren(canvas, (node) => {
					// 检测该node是否绑定了该脚本
					let code_comp_list = parent.getJsFileList(node);
					code_comp_list.forEach((code_comp, i) => {
						if (code_comp.__scriptUuid == code_uuid) {
							bindInfos.push({ node_uuid: node.uuid, comp_name: code_comp.__classname__ });
						}
					});
				})
			}
			event.reply(null, bindInfos);
		},


		'insertWidgetInfo'(event, args, parent) {
			//1.获取绑定当前脚本的Node
			//2.检测该属性是否存在 getComponent('')
			//3.获取选取的组件信息
			//4.将选取的组件插入到脚本中

			// 定时检测creator加载新建文件缓存没
			let stop_func;
			let chk_count = 0
			stop_func = parent.setTimeoutToJS(() => {
				//等场景加载完脚本
				let node = cc.engine.getInstanceById(args.bindInfos[0].node_uuid)
				if (node && !node._objFlags) {
					let comp = node.getComponent(args.bindInfos[0].comp_name)
					if (comp) {
						// 创建脚本瞬间添加的node组件会丢失,所以需要检测3次组件确定加载了
						if (chk_count++ == 3) {
							stop_func();

							let sls_comps = getSelectedComps(args);
							for (let i = 0; i < args.bindInfos.length; i++) {
								const info = args.bindInfos[i];
								let node = cc.engine.getInstanceById(info.node_uuid)
								if (!node) {
									continue
								}
								let comp = node.getComponent(info.comp_name);
								if (!comp) {
									continue;
								}
								if (comp.hasOwnProperty(args.symbolName)) {
									comp[args.symbolName] = args.isArray ? sls_comps : sls_comps[0];
								}
							}
						}
						event.reply(null,true);
					}
				}
			}, 0.5, { count: 30 })


		},
	}
};
/* 
*场景逻辑扩展
*删除选中的节点以及节点所绑定的脚本
*/
'use strict';
var path 	= require('path');
var fs 		= require('fs');
var md5     = require('md5');
var config     = require('../../config');
const Editor2D = require('../../tools/editor2D');
const fe 	= Editor2D.require('packages://simple-code/tools/tools.js');



module.exports = {
	/*************  事件 *************/  
	messages: 
	{
		// 删除选中的节点以及节点所绑定的脚本
		async 'removeNodeAndScript'(args,parent)
		{

			let hitnText = ""
			let chidlren = parent.getSelectdNodes()
			let nodeUuids = []
			let jsInfos   = []
			for (let i = 0; i < chidlren.length; i++) {
				const node = chidlren[i];
				let jsComp 		= parent.isHasJsFile(node)
				if (jsComp) 	{
					let info 	= await Editor2D.assetdb.assetInfoByUuid(jsComp.__scriptUuid)
					if (info){
						jsInfos.push(info)
						hitnText += info.url+"\n"
					}
					// 移除组件绑定
					// Editor2D.Ipc.sendToPanel('scene', 'scene:remove-component', node.uuid,jsComp.uuid);//移除不了脚本
				}
				nodeUuids.push(node.uuid)
				// node.removeFromParent(true)
			}

			if (!confirm("确定删除选中的节点以及节点所绑定的脚本? 该删除操作不可撤销或重做!删除的脚本将备份到:"+ Editor.Project.tmpDir+"\n将删除以下脚本:\n"+hitnText)){
				return	
			}
			
			Editor.Message.send('scene','remove-node',{
				"uuid": nodeUuids,
			})

			// 备份文件
			let files = []
			for (let i = 0; i < jsInfos.length; i++) {
				const info = jsInfos[i];
				
				let pathB 		 = info.url.replace("db:/","")
				let move_to_path = Editor.Project.tmpDir+pathB.replace(/\//g,path.sep)
				files.push(info.url)

				// 备份
				fe.createDir(move_to_path)
				fe.copyFile(info.file,move_to_path+"_"+(new Date).getTime());
				Editor.log("移除文件到备份目录:",info.file,move_to_path)
			}

			// 删除文件
			Editor2D.assetdb.delete(files);
		},

		'active-curr-node'(args,parent){
			let nodes = Editor2D.Selection.curSelection('node');
		    if (nodes && nodes.length != 0)
		    {
				let node = parent.findNode(nodes[0]);
				let active = node.active;
				parent.setCompProperty(node,'active',!active);
				// for (let i = 0; i < nodes.length; i++) 
				// {
				// 	const id = nodes[i];
				// 	let node = parent.findNode(id)
					
				// }
			}
		}
	}
};
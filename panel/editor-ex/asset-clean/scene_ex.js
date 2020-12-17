/* 
*场景逻辑扩展
*删除选中的节点以及节点所绑定的脚本
*/
'use strict';
var path 	= require('path');
var fs 		= require('fs');
var md5     = require('md5');
const fe 	= Editor.require('packages://simple-code/tools/FileTools.js');


module.exports = {
	/*************  事件 *************/  
	messages: 
	{
		// 删除选中的节点以及节点所绑定的脚本
		'removeNodeAndScript'(event,args,parent)
		{

			let hitnText = ""
			let chidlren = parent.getSelectdNodes()
			let nodeUuids = []
			let jsInfos   = []
			chidlren.forEach((node)=>
			{
				let jsComp 		= parent.isHasJsFile(node)
				if (jsComp) 	{
					let info 	= Editor.remote.assetdb.assetInfoByUuid(jsComp.__scriptUuid)
					if (info){
						jsInfos.push(info)
						hitnText += info.url+"\n"
					}
					// 移除组件绑定
					// Editor.Ipc.sendToPanel('scene', 'scene:remove-component', node.uuid,jsComp.uuid);//移除不了脚本
				}
				nodeUuids.push(node.uuid)
				// node.removeFromParent(true)
			})

			if (!confirm("确定删除选中的节点以及节点所绑定的脚本? 该删除操作不可撤销或重做!删除的脚本将备份到:"+ Editor.remote.assetdb.assetBackupPath+"\n将删除以下脚本:\n"+hitnText)){
				return	
			}
			// 删除节点s
			Editor.Ipc.sendToPanel('scene', 'scene:delete-nodes', nodeUuids);

			// 备份文件
			let files = []
			jsInfos.forEach((info)=>{
				let pathB 		 = info.url.replace("db:/","")
				let move_to_path = Editor.remote.assetdb.assetBackupPath+pathB.replace(/\//g,path.sep)
				files.push(info.url)

				// 备份
				fe.createDir(move_to_path)
				fe.copyFile(info.path,move_to_path+"_"+(new Date).getTime());
				Editor.log("移除文件到备份目录:",info.path,move_to_path)
			});

			// 删除文件
			Editor.remote.assetdb.delete(files);
		},

		'get-active-uuid'(event,args,parent){
			// Editor.log("scene test")
		}
	}
};
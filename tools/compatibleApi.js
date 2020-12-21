'use strict';
/** 
 * 3d插件api映射,兼容2d插件
 * */ 

let fs = require("fs");
let path = require("path");
let baseDir = '';
const prsPath = (Editor.Project && Editor.Project.path ? Editor.Project.path : Editor.remote.projectPath).replace(/\\/g,'/');

// 2D 映射到 3D编辑器的命令
let MAP_CMD = {
	'scene:enter-prefab-edit-mode'	:'scene:open-scene',
	'scene:open-by-uuid'			:'scene:open-scene',
	'assets:hint' 					: "twinkle", // 3d里高亮资源命令是 ‘twinkle’
	'hint' 							: "hint" 		   // 高亮选中的节点，未找到映射关系
}

// 模拟creator2d插件的API实现
let Editor2D = 
{
	isWin32 : path.sep == '\\',
	appPath : Editor.App.path,
	
	error : console.error,
	log : console.log,
	warn : console.warn,
	info : console.info,
	
	_getUrlLast(url_path,head){
		let p_i = url_path.indexOf(head);
		if(p_i!=-1){
			return url_path.substr(head.length+2);
		}
	},

	url(url_path){
		let absPath = Editor._getUrlLast(url_path,'packages:');
		if(absPath){
			return path.join(baseDir,absPath)
		}

		absPath = Editor._getUrlLast(url_path,'db:');
		if(absPath ) {
			return path.join(prsPath,absPath)
		}
		return url_path;
	},

	require(url){
		url = Editor2D.url(url);
		return require(url);
	},

	Ipc : {

		sendToPanel: (head,cmd,...args)=>Editor2D.Ipc._send(head,cmd,...args),

		sendToAll:(cmd,...args)=>Editor2D.Ipc.sendToMain(cmd,...args),

		sendToMain:(cmd,...args)=>
		{
			cmd = MAP_CMD[cmd] || cmd;
			let temp = cmd.split(':')
			if(temp[1]){
				Editor2D.Ipc._send(temp[0],temp[1] || "",...args);
			}else{
				Editor.Message.send(cmd,...args);
			}
		},

		_send(head,cmd,...args)
		{
			let callback = arguments[arguments.length-1]
			Editor.Message.request(head,cmd,...args).then((v)=>{
				if(typeof callback == 'function'){
					callback(null,v);
					callback = null;
				}
			},()=>{
				if(typeof callback == 'function'){
					callback('run _send error');
					callback = null;
				}
			})
		}
	},

	Scene :{
		callSceneScript:(head,cmd,...args)=>{
			let info = {
				name: 'scene',
				method: cmd,
				args:args,
			}
			let callback = arguments[arguments.length-1]
			Editor2D.Ipc._send('scene','execute-scene-script',info,(callback instanceof Function) ? callback : null);
		},
	},
	
	assetdb:{
		assetBackupPath : path.join(prsPath,'temp','BackupAssets'),

		async urlToUuid(url){
			return await Editor.Message.request("asset-db",'query-uuid',url);
		},

		async uuidToUrl(uuid){
			return await Editor.Message.request("asset-db",'query-url',uuid);
		},

		async urlToFspath(uuidOrUrl){
			return await Editor.Message.request("asset-db",'query-path',uuidOrUrl);
		},

		async uuidToFspath(uuidOrUrl){
			return await Editor.Message.request("asset-db",'query-path',uuidOrUrl);
		},

		async fspathToUuid(fsPath){
			let url = "db://" + fsPath.replace(/\\/g,'/').replace(prsPath,'').substr(6);
			return await Editor.Message.request("asset-db",'query-uuid',url);
		},

		async existsByUuid(urlOrUUID){
			return await Editor.Message.request("asset-db",'query-asset-info',urlOrUUID);
		},
		
		async existsByUrl(urlOrUUID){
			return await Editor.Message.request("asset-db",'query-asset-info',urlOrUUID);
		},

		async assetInfoByUuid(urlOrUUID){
			return await Editor.Message.request("asset-db",'query-asset-info',urlOrUUID); // 注意3d返回字段与2d不太一样!
		},

		async assetInfoByUrl(urlOrUUID){
			return await Editor.Message.request("asset-db",'query-asset-info',urlOrUUID); // 注意3d返回字段与2d不太一样!
		},

		deepQuery(callback){
			if(!callback){
				return
			}
			Editor.Message.request("asset-db",'query-assets',{pattern:"db://**"}).then((list)=>{
				// 注意3d返回字段与2d不太一样!
				callback(null,list)
			},()=>{
				callback("run deepQuery error")
			});
		},

		queryInfoByUrl(...args){Editor2D.assetdb.queryInfoByUuid(...args)},
		queryInfoByUuid(urlOrUUID,callback){
			Editor.Message.request("asset-db",'query-asset-info',urlOrUUID).then((list)=>{
				// 注意3d返回字段与2d不太一样!
				callback(null,list)
			},()=>{
				callback("run queryInfoByUuid error")
			});
		},


		saveExists(url,text,callback){
			let promise = Editor.Message.request("asset-db",'save-asset',url,text).then(()=>{
				if(callback) callback()
			},()=>{
				if(callback) callback('save error')
			});
		},

		create(url,text,callback){
			let promise = Editor.Message.request("asset-db",'create-asset',url,text,{}).then((info)=>{
				if(callback) callback(null,info)
			},()=>{
				if(callback) callback('save error')
			});
		},

		delete(urls){
			for (let i = 0; i < urls.length; i++) {
				const url = urls[i];
				Editor.Message.request("asset-db",'delete-asset',url)
			}
		},
		
		move(source,target){
			Editor.Message.request("asset-db",'move-asset',source,target)
		},
	},

	
	Selection:{
		curGlobalActivate(){
			let type = Editor.Selection.getLastSelectedType();
			let ids = Editor.Selection.getSelected(type);
			return {type,id:ids[0]};
		},

		curSelection(type){
			return Editor.Selection.getSelected(type);
		},
	}
}

module.exports.analogApi = ()=>
{
	let packageRoot = __dirname.replace(/\\/g,'/')
	packageRoot = packageRoot.substr(0,packageRoot.lastIndexOf('simple-code/')-1)
	baseDir = packageRoot;

	// 插入api
	let copyFunc = (s_obj,t_obj)=>
	{
		for (const key in s_obj) 
		{
			const v = s_obj[key];
			if(t_obj[key] == null){
				t_obj[key] = v;
			}else if(t_obj[key] instanceof Object){
				copyFunc(v,t_obj[key]);
			}
		}
	}

	copyFunc(Editor2D,Editor);
}

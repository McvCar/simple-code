'use strict';
/** 
 * 3d插件api映射,兼容2d插件
 * */ 

let packageCfg = require('../package.json')
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
		let absPath = Editor2D._getUrlLast(url_path,'packages:');
		if(absPath){
			absPath = absPath.replace(/simple-code\//,'');
			return path.join(baseDir,absPath)
		}

		absPath = Editor2D._getUrlLast(url_path,'db:');
		if(absPath ) {
			return path.join(prsPath,absPath)
		}
		return url_path;
	},

	require(url){
		url = Editor2D.url(url);
		return require(url);
	},

	T(...args){
		Editor.I18n.t(...args)
	},

	Panel :{
		open:Editor.Panel.open,

		find:(name)=>{
			for (let i = 0; i < Editor2D.Panel.panels.length; i++) {
				const element = Editor2D.Panel.panels[i];
				if(element.name == name){
					return element;
				}
			}
		},
		
		getFocusedPanel:()=>{
			if(!global.document || !document.hasFocus()) return null;
			
			let dock = document.getElementById('dock')
			if(!dock) return null;
			return dock.shadowRoot.activeElement;
		},
		/**@type Array<Element> */
		panels:[],
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
				Editor.Message.broadcast(cmd,...args);
			}
		},

		_send(head,cmd,...args)
		{
			let callback = args[args.length-1]
			if(typeof callback == 'function'){
				args.length --;
			}else{
				callback = null;
			}

			Editor.Message.request(head,cmd,...args).then((v)=>{
				if(callback){
					callback(null,v);
					callback = null;
				}
			},()=>{
				if(callback){
					callback('exec Editor2D._send error');
					callback = null;
				}
			})
		}
	},

	Scene :{
		callSceneScript:(head,cmd,...args)=>{
			let callback = args[args.length-1]
			if(typeof callback == 'function'){
				args.length --;
			}else if(typeof args[args.length-2] == 'function'){
				callback = args[args.length-2];
				args.length -=2;
			}else{
				callback = null;
			}
			let info = {
				name: head,
				method: cmd,
				args:args,
			}
			Editor2D.Ipc._send('scene','execute-scene-script',info,callback ? callback : undefined);
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

		async fspathToUrl(fsPath){
			return await Editor.Message.request("asset-db",'query-url',fsPath);
		},

		async fspathToUuid(fsPath){
			return await Editor.Message.request("asset-db",'query-uuid',fsPath);
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

		loadMetaByUuid(uuidOrUrl,callback){
			let promise = Editor.Message.request("asset-db",'query-asset-meta',uuidOrUrl).then((info)=>{
				if(callback) callback(null,info)
			},()=>{
				if(callback) callback('query-asset-meta error')
			});
		},

		loadMetaByUrl(uuidOrUrl,callback){
			let promise = Editor.Message.request("asset-db",'query-asset-meta',uuidOrUrl).then((info)=>{
				if(callback) callback(null,info)
			},()=>{
				if(callback) callback('query-asset-meta error')
			});
		},

		refresh(urlOrlUuid,callback){
			Editor.Message.request("asset-db",'refresh-asset',urlOrlUuid).then((list)=>{
				if(callback) callback(null,list)
			},()=>{
				if(callback) callback("run refresh error")
			});
		},

		reimport(urlOrlUuid,callback){
			Editor.Message.request("asset-db",'reimport-asset',urlOrlUuid).then((list)=>{
				if(callback) callback(null,list)
			},()=>{
				if(callback) callback("run refresh error")
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
		
		select(type,uuidOrArray){
			Editor.Selection.clear(type);
			Editor.Selection.select(type,uuidOrArray)
		},
		clear:Editor.Selection.clear,
	},

	analogApi(){
		let packageRoot = __dirname.replace(/\\/g,'/')
		packageRoot = packageRoot.substr(0,packageRoot.lastIndexOf('/'));
		baseDir = packageRoot;

		// 插入api
		// let copyFunc = (s_obj,t_obj)=>
		// {
		// 	for (const key in s_obj) 
		// 	{
		// 		const v = s_obj[key];
		// 		if(t_obj[key] == null){
		// 			t_obj[key] = v;
		// 		}else if(t_obj[key] instanceof Object){
		// 			copyFunc(v,t_obj[key]);
		// 		}
		// 	}
		// }

		// copyFunc(Editor2D,Editor);

		Editor.error = console.error,
		Editor.log = console.log,
		Editor.warn = console.warn,
		Editor.info = console.info,
		
		Editor2D.Panel.panels = getPanels();
		global.Editor2D = Editor2D;
	}
}

function getPanels(){
	if(!global.document){
		return [];
	}
	let dock = document.getElementById('dock')
	if(!dock) return [];
	
	for (let i = 0; i < dock.shadowRoot.children.length; i++) {
		const dom = dock.shadowRoot.children[i];
		const list = dom.getElementsByTagName('panel-frame')
		if(list.length){
			return list;
		}
	}
	return [];
}
Editor2D = global.Editor2D || Editor2D;
module.exports = Editor2D;

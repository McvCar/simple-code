'use strict';
/** 
 * 3d插件api映射,兼容2d插件
 * */ 

require("./tools/runtime");
let fs = require("fs");
let path = require("path");
let baseDir = '';

// 2D 映射到 3D编辑器的命令
let MAP_CMD = {
	'assets:hint' : "twinkle", // 3d里高亮资源命令是 ‘twinkle’
}

// 模拟creator2d插件的API实现
let Editor2D = 
{
	isWin32 : navigator.userAgent.indexOf("Mac OS") == -1,
	appPath : Editor.App.path,

	error : console.error,
	log : console.log,
	warn : console.warn,
	info : console.info,

	url(url_path){
		let head = 'packages:'
		let p_i = url_path.indexOf(head);
		if(p_i!=-1){
			let file_path = path.join(baseDir,url_path.substr(head.length+2))
			return file_path;
		}
		return url_path
	},

	require(url){
		url = this.url(url);
		return require(url);
	},

	Ipc : {
		sendToPanel: (...args)=>Editor.Message.send(args),
		sendToMain:(...args)=>Editor.Message.send(args),
		sendToAll:(cmd,...args)=>Editor.Message.broadcast(MAP_CMD[cmd] || cmd,args),
	},

	assetdb:{
		uuidToUrl:function(uuid){
			let v = await Editor.Message.request("asset-db",'query-url',uuid);
			return v;
		},
		urlToFspath:function(uuidOrUrl){
			return await Editor.Message.request("asset-db",'query-path',uuidOrUrl);
		},
		uuidToFspath:function(uuidOrUrl){
			return await Editor.Message.request("asset-db",'query-path',uuidOrUrl);
		},
		deepQuery:function(callback){
			if(!callback){
				return
			}
			Editor.Message.request("asset-db",'query-assets',{pattern:"db://**"}).then((list)=>{
				// 注意3d返回字段与2d不太一样!
				callback(list)
			});
		},
		saveExists:function(url,text,callback){
			let promise = Editor.Message.request("asset-db",'save-asset',url,text).then(()=>{
				if(callback) callback()
			},()=>{
				if(callback) callback('save error')
			});
		},
	},
}

// module.exports.analogApi = ()=>
// {
// 	let packageRoot = __dirname.replace(/\\/g,'/')
// 	packageRoot = packageRoot.substr(0,packageRoot.lastIndexOf('simple-code/')-1)
// 	this.setBaseDir(packageRoot);

// 	// 插入api
// 	for (const key in Editor2D) {
// 		const v = Editor2D[key];
// 		Editor[key] = v;
// 	}
// }

// // 兼容creator2d api
// module.exports.setBaseDir = (dir)=>
// {
// 	baseDir = dir;
// }
/* 
面板扩展
功能: 监听 creator项目下 node_modules 目录与加载
*/
'use strict';
var path 	= require('path');
var fs 		= require('fs');
var fe 	= Editor.require('packages://simple-code/tools/FileTools.js');
var chokidar = Editor.require('packages://simple-code/node_modules/chokidar');

const prsPath 			= Editor.Project && Editor.Project.path ? Editor.Project.path : Editor.remote.projectPath;
const node_modules_path = path.join(prsPath,'node_modules');


module.exports = {

	// 面板初始化
	onLoad(parent){
		// index.js 对象
		this.parent = parent; 

	},

	
	// 设置选项
	setOptions(cfg,isInit) 
	{	
		if(cfg.enabledNpmDir && isInit){
			
			this.loadModuleDir()
			this.watcher = chokidar.watch(prsPath, {
				ignored: /[\/\\]\./, persistent: true
			});
			
			// 监听文件夹改动
			this.watcher
			.on('add', this.addNodeModuleFile.bind(this))
			.on('change', this.changeNodeModuleFile.bind(this))
			.on('unlink', this.unlinkNodeModuleFile.bind(this))

			.on('error', (error)=> {  console.log('Error happened', error); })
			// .on('addDir', (path)=> { log('Directory', path, 'has been added'); })
			// .on('unlinkDir', (path)=> { log('Directory', path, 'has been removed'); })
			// .on('ready', ()=> { log('Initial scan complete. Ready for changes.'); })
			// .on('raw', (event, path, details)=> { log('Raw event info:', event, path, details); })
		}else if(this.watcher)
		{
			this.watcher.close();
			delete this.watcher;
		}
	},

	loadModuleDir(){
		if(!fe.isDirectory(node_modules_path)){
			return
		}
		let files = fe.getDirAllFiles(node_modules_path,[]);
		let c_files = []
		for (let i = 0; i < files.length; i++) 
		{
			let path = files[i];
			if(path.indexOf('.DS_Store') != -1){
				continue;
			}
			path = path.replace(/\\/g,'/');
			c_files.push({
				url : path,
				uuid: 'outside'
			})
		}

		console.log(c_files)
		this.parent.messages['asset-db:assets-created'].bind(this.parent)(0,c_files)
	},
	
	isNodeModuleDir(path){
		return path && path.indexOf(node_modules_path) != -1;
	},

	// 新增文件
	addNodeModuleFile(path){
		if(!this.isNodeModuleDir(path)) return;
		path = path.replace(/\\/g,'/');

		let info = [{
			url : path,
			uuid: 'outside'
		}];

		for (let i = 0; i < this.parent.file_list_buffer.length; i++) {
			let item = this.parent.file_list_buffer[i];
			if (path == item.meta ) {
				return; // 已经存在文件
			}
		}
		this.parent.messages['asset-db:assets-created'].bind(this.parent)(0,info)
	},

	// 改变文件
	changeNodeModuleFile(path){
		if(!this.isNodeModuleDir(path)) return;
		path = path.replace(/\\/g,'/');

		let info = {
			url : path,
			uuid: 'outside'
		};
		this.parent.messages['asset-db:asset-changed'].bind(this.parent)(0,info)
	},

	// 移除文件
	unlinkNodeModuleFile(path){
		if(!this.isNodeModuleDir(path)) return;
		path = path.replace(/\\/g,'/');

		let info = [{
			url : path,
			path : path,
			uuid: 'outside'
		}];
		this.parent.messages['asset-db:assets-deleted'].bind(this.parent)(0,info)
	},

	// 面板销毁
	onDestroy(){
		if(this.watcher){
			this.watcher.close();
			delete this.watcher;
		}
	},
	/*************  事件 *************/  

	messages:{
		'scene:saved'(){
			// Editor.log("事件 save")
		}
	},
	
};
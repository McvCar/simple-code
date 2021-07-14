/* 
面板扩展
功能: 监听 creator项目下 node_modules 目录与加载
*/
'use strict';
var path 	= require('path');
var fs 		= require('fs');
var fe 	= Editor.require('packages://simple-code/tools/tools.js');
var watch = Editor.require('packages://simple-code/node_modules/watch');

const prsPath 			= Editor.Project && Editor.Project.path ? Editor.Project.path : Editor.remote.projectPath;
const node_modules_path = path.join(prsPath,'node_modules');
const REG_EXP_MULTILAYER = /node_modules/g

module.exports = {

	// 面板初始化
	onLoad(parent){
		// index.js 对象
		this.parent = parent; 

	},
	
	// 设置选项
	setOptions(cfg,isInit) 
	{	if(cfg.enabledNpmDir == null) return;
		
		if(cfg.enabledNpmDir){
			if(!isInit){
				return Editor.log("加载node_modules设置 重启creator后生效")
			}
			this.initWatch()
		}else if(!cfg.enabledNpmDir && this._isInit)
		{
			this.stop()
			this.unlinkNodeModuleDir(node_modules_path)
		}
	},

	// 初始化文件夹监听
	initWatch(){
		if(!fe.isDirectory(node_modules_path)){
			// 监听npm目录的创建
			this.check_timeout = setTimeout(this.initWatch.bind(this),5000);
			return;
		}
		delete this.check_timeout;

		this._isInit = true
		// this.loadModuleDir()
		watch.watchTree(node_modules_path, (f, curr, prev)=> 
		{
			if (typeof f == "object" && prev === null && curr === null) 
			{
				// Finished walking the tree
				let c_files = []
				for (let filePath in f) {
					const state = f[filePath];
					if(state.isFile() && !this.isMultilayerNodeModuleDir(filePath)){
						
						filePath = filePath.replace(/\\/g,'/');
						c_files.push({
							url : filePath,
							uuid: 'outside'
						})
					}
				}
				this.parent.messages['asset-db:assets-created'].bind(this.parent)(0,c_files)
			}else
			{
				// if(!this.isNodeModuleDir(f)) return;

				if (prev === null) {
					// f is a new file
					if(curr.isDirectory()){
						this.addNodeModuleDir(f)
					}else{
						this.addNodeModuleFile(f)
					}
				} else if (curr.nlink === 0) {
					// f was removed
					if(prev.isDirectory()){
						this.unlinkNodeModuleDir(f)
					}else{
						this.unlinkNodeModuleFile(f)
					}
				} else {
					// f was changed
					if(curr.isFile()){
						this.changeNodeModuleFile(f)
					}
				}
			}
			
		})
	},
	
	// 多层 node_modules 目录
	isMultilayerNodeModuleDir(filePath){
		return filePath.match(REG_EXP_MULTILAYER).length>1;
	},

	isNodeModuleDir(path){
		return path && path.indexOf(node_modules_path) != -1;
	},

	addNodeModuleDir(dirPath){
		if(!fe.isDirectory(dirPath) || this.isMultilayerNodeModuleDir(dirPath)){
			return
		}
		let files = fe.getDirAllFiles(dirPath,[]);
		let c_files = []
		for (let i = 0; i < files.length; i++) 
		{
			let filePath = files[i];
			if(filePath.indexOf('.DS_Store') != -1){
				continue;
			}
			filePath = filePath.replace(/\\/g,'/');
			c_files.push({
				url : filePath,
				uuid: 'outside'
			})
		}

		// console.log('添加文件夹：',c_files)
		this.parent.messages['asset-db:assets-created'].bind(this.parent)(0,c_files)
	},
	
	// 新增文件
	addNodeModuleFile(filePath){
		if(this.isMultilayerNodeModuleDir(filePath)){
			return;
		}
		// if(!this.isNodeModuleDir(filePath)) return;
		filePath = filePath.replace(/\\/g,'/');

		let info = [{
			url : filePath,
			uuid: 'outside'
		}];

		for (let i = 0; i < this.parent.file_list_buffer.length; i++) {
			let item = this.parent.file_list_buffer[i];
			if (filePath == item.meta ) {
				return; // 已经存在文件
			}
		}
		this.parent.messages['asset-db:assets-created'].bind(this.parent)(0,info)
	},

	// 改变文件
	changeNodeModuleFile(filePath){
		if(this.isMultilayerNodeModuleDir(filePath)){
			return;
		}
		// if(!this.isNodeModuleDir(filePath)) return;
		filePath = filePath.replace(/\\/g,'/');

		let info = {
			url : filePath,
			uuid: 'outside'
		};
		this.parent.messages['asset-db:asset-changed'].bind(this.parent)(0,info)
	},

	// 移除文件
	unlinkNodeModuleDir(path){
		if(this.isMultilayerNodeModuleDir(filePath)){
			return;
		}
		// if(!this.isNodeModuleDir(path)) return;
		path = path.replace(/\\/g,'/');
		let removeFiles = []
		for (const filePath in this.parent.file_list_map) 
		{
			const item = this.parent.file_list_map[filePath];
			if(item.uuid.length == 7 && filePath.indexOf(path) != -1){ // 8 == 'outside'
				removeFiles.push({
					url : filePath,
					path : filePath,
					uuid: 'outside'
				});
			}
		}

		// console.log('移除文件夹：',removeFiles)
		this.parent.messages['asset-db:assets-deleted'].bind(this.parent)(0,removeFiles)
	},

	// 移除文件
	unlinkNodeModuleFile(filePath){
		if(this.isMultilayerNodeModuleDir(filePath)){
			return;
		}
		// if(!this.isNodeModuleDir(path)) return;
		path = path.replace(/\\/g,'/');

		let info = [{
			url : path,
			path : path,
			uuid: 'outside'
		}];
		this.parent.messages['asset-db:assets-deleted'].bind(this.parent)(0,info)
	},

	stop(){
		if(this._isInit){
			watch.unwatchTree(node_modules_path);
			delete this._isInit;
		}
		if(this.check_timeout){
			clearTimeout(this.check_timeout);
			delete this.check_timeout;
		}
	},

	// 面板销毁
	onDestroy(){
		this.stop()
	},
	/*************  事件 *************/  

	messages:{
		'scene:saved'(){
		}
	},
	
};
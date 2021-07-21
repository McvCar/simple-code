/* 
面板扩展
功能: 扩展移动脚本文件时检测 import from 'xxx' 路径并修改
*/
'use strict';
var path 	= require('path');
var fs 		= require('fs');
const tools = require('../../../tools/tools');

// const electron = require("electron");



module.exports = {
	/** @type import('../../index') */
	parent : null,


	// 
	ready(parent){
	},

	// 编辑器启动完成
	onLoad(parent){
		// index.js 对象
		this.parent = parent; 
		this.move_files = [];
		this.oldSelect = false;
	},

	// 文件被移动
	onAssetsMovedEvent(files){
		// if(!this.parent.cfg.renameConverImportPath){
		// 	return;
		// }

		files.forEach((v, i) => 
		{
			let extname = path.extname(v.url)
			// 重命名后检测引用路径
			if(extname == '.js' || extname == '.ts')
			{
				this.move_files.push(v); // 200毫秒内记录下被移动的文件
			}
		});

		
		// 多次调用200毫秒内只执行一次
		if(this.move_files.length){
			this.parent.setTimeoutById((dt)=>{
				// console.log("执行间隔:",dt)
				if(dt>=590){
					this.onAssetsMovedEvent([])
				}else{
					this.tryLoadRenameFile()
				}
			},500,'renameCheck');
		}
	},

	// 开始修改import路径
	async tryLoadRenameFile()
	{
		// console.log('移动的文件数量:',this.move_files.length)
		if(!this.move_files.length){
			return
		}
		// 1.加载所有被移动的文件
		// 2.加载所有import引用被移动文件的脚本
		let usedPaths    = {}
		let usedList 	 = {}
		let moduleCheckReg = ''
		for (let i = 0; i < this.move_files.length; i++) 
		{
			const file = this.move_files[i];
			let moduleName = '/'+tools.getFileName(file.srcPath);
			if(!usedList[moduleName]) moduleCheckReg += moduleName + "[\"\']|"

			let list =  usedList[file.destPath] = usedList[moduleName] = usedList[file.srcPath] = {}; // 新路径、模块、旧路径，映射关系
			list.old_path = file.srcPath;
			list.new_path = file.destPath;

			let model = this.parent.getModelByFsPath(file.destPath)  
			if(model == null){
				// 加载路径的代码文件到缓存
				model = await this.parent.loadVsModel(file.url,path.extname(file.url),true);
			}
			usedPaths[file.destPath] = model;
		}
		moduleCheckReg = RegExp(moduleCheckReg.substr(0,moduleCheckReg.length-1).replace(/\./g,'\\.'),'g');

		
		// 尝试找出files被那些脚本内部import了，并加载
		for (const i in this.parent.file_list_buffer) 
		{
			let item = this.parent.file_list_buffer[i];
			let fsPath = item.fsPath;
			// 该文件引用的模块列表 
			let importList = !usedList[fsPath] || usedList[fsPath].old_path != fsPath && usedList[fsPath].new_path != fsPath ? item.data && item.data.match(moduleCheckReg) : undefined;
			if(importList)// js,ts文件数据
			{ 
				// 2，import被移动路径的文件
				let model = this.parent.getModelByFsPath(fsPath); 
				if(!model){
					// 加载旧路径的代码文件到缓存
					model = await this.parent.loadVsModel(item.meta,item.extname,true,false);
					model.setValue(item.data)
				}
				usedPaths[fsPath] = model;
				let list =  usedList[fsPath] = usedList[fsPath] || {}; // 模块、旧路径、新路径，映射关系
				list.new_path = fsPath;
			}
		}
		this.move_files = []

		let out_userList = {}
		let out_usedPaths = {}
		for (const key in usedList) {
			const element = usedList[key];
			if(element.old_path) element.old_path = tools.normPath(element.old_path)
			if(element.new_path) element.new_path = tools.normPath(element.new_path)
			out_userList[tools.normPath(key)] = element;
		}

		for (const key in usedPaths) {
			const element = usedPaths[key];
			out_usedPaths[tools.normPath(key)] = element;
		}

		// console.log("rename列表:",usedPaths)
		this.updatedImports(out_usedPaths,out_userList);
	},

	// 应用修改import路径
	updatedImports(usedPaths,usedList)
	{
		let saveList = []
		let hintText = '是否修正以下脚本文件的 import、require路径并保存:\n';
		let logText  = '修正import路径完成,如果组件丢失脚本请重启creator,修改如下:'
		for (const m_path in usedPaths) 
		{
			const model = usedPaths[m_path];
			const info  =  usedList[m_path];

			let text = model.getValue()
			let imports = tools.getImportStringPaths(text); // 代码内import列表
			let hasUpdate = false
			for (let i = imports.length-1; i >= 0 ; i--) 
			{
				let importItem = imports[i];
				if(importItem.path.indexOf('/') == -1 || importItem.path[0] != '.'){
					continue;
				}

				// 转换相对路径
				let importFspath = tools.relativePathTofsPath(info.old_path || info.new_path,importItem.path);
				let extname = path.extname(importFspath);
				let importPathInfo = extname == '' ? usedList[importFspath+'.js'] || usedList[importFspath+'.ts'] : usedList[importFspath];
				let newImportPath = importItem.path;
				if(importPathInfo){
					newImportPath = tools.fsPathToRelativePath(info.new_path,importPathInfo.new_path);
					let s_i = path.extname(newImportPath) != '' ? newImportPath.lastIndexOf('.') : -1;
					if(extname == '' && importFspath.lastIndexOf('.') == -1 && s_i != -1) newImportPath = newImportPath.substr(0,s_i);
				}else{
					newImportPath = tools.fsPathToRelativePath(info.new_path,importFspath);
				}
				if(importItem.path != newImportPath){
					hasUpdate = true;
					// console.log('转换import:',info.new_path,importItem.path,'to',newImportPath);
					logText += '\n'+(model.dbUrl || "") + ":旧路径 "+ importItem.path + " 改为" + newImportPath;
					// console.log('new file:',newImportPath)
					text = text.substr(0,importItem.start) + newImportPath + text.substr(importItem.start+importItem.length)
				}
			}
			if(hasUpdate){
				saveList.push({model,text})
				hintText+=model.dbUrl+"\n";
			}
		}
		if(saveList.length == 0){
			return;
		}
		// console.log(logText)

		// 应用提示
		let startTime = new Date().getTime()
		let isApply = confirm(hintText); // electron.remote.dialog.showMessageBoxSync({message:hintText,buttons:['Cancel',"Ok"]})// 
		let endTime = new Date().getTime()
		if(endTime - startTime < 100){
			// 没有进过用户判断，默认使用上次选择结果
			isApply = this.oldSelect;
		}
		this.oldSelect = isApply;
		if(isApply){
			for (let i = 0; i < saveList.length; i++) 
			{
				let info = saveList[i];
				info.model.setValue(info.text);
				let id = this.parent.getTabIdByModel(info.model);

				let isFileExit = true
				try {fs.accessSync(info.model.fsPath)} catch (error) { isFileExit = false }
				if(isFileExit){
					if(id == null)
					{
						// 没有打开的文件则自动保存
						this.parent.saveFileByUrl(info.model.dbUrl,info.text); 
					}else{
						// 已经打开的文件等用户手动保存
						// this.parent.onVsDidChangeContent({},info.model)
						this.parent.saveFile(true,id); 
					}
				}
			}
			setTimeout(()=>Editor.log(logText),10)
		}
	},

	// 面板销毁
	onDestroy(){

	},
	/*************  事件 *************/  


	messages:{

		// 快捷键打开当前选中文件/节点进入编辑
		'custom-cmd' (event,info) {
		},

		'scene:saved'(){
			// Editor.log("事件 save")
		}
	},
	
};
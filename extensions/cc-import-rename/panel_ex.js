/* 
面板扩展
功能: 扩展移动脚本文件时检测 import from 'xxx' 路径并修改
*/
'use strict';
var path 	= require('path');
var fs 		= require('fs');
const tools = require('../../tools/tools');



module.exports = {
	/** @type import('../../panel/vs-panel/vs-panel').EditorPanel */
	parent : null,

	// 
	ready(parent){
		// index.js 对象
		this.parent = parent; 
	},

	// 编辑器启动完成
	onLoad(parent){
		this.move_files = []
		this.oldSelect = false;
	},


	/**
	 *  移动资源文件
	 * @param {Object} file
	 * @param {String} file.url
	 * @param {String} file.uuid
	 * @param {String} file.file
	 * @param {String} file.srcPath
	 * @param {String} file.destPath
	 */ 
	onAssetsMovedEvent(file){
		if(!this.parent.cfg.renameConverImportPath){
			return;
		}

		let extname = path.extname(file.url)
		// 重命名后检测引用路径
		if(extname == '.js' || extname == '.ts')
		{
			this.move_files.push(file); // 500毫秒内记录下被移动的文件
		}

		// 多次调用500毫秒内只执行一次
		if(this.move_files.length){
			this.parent.setTimeoutById(this.tryLoadRenameFile.bind(this),500,'renameCheck');
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

			let model = this.parent.fileMgr.getModelByFsPath(file.destPath)  
			if(model == null){
				// 加载路径的代码文件到缓存
				model = this.parent.loadVsModelWorker(file.url,file.destPath,path.extname(file.url),true);
			}
			usedPaths[file.destPath] = model;
		}
		moduleCheckReg = RegExp(moduleCheckReg.substr(0,moduleCheckReg.length-1).replace(/\./g,'\\.'),'g');

		
		// 尝试找出files被那些脚本内部import了，并加载
		for (const fsPath in this.parent.file_list_map) 
		{
			let item = this.parent.file_list_map[fsPath];
			// 该文件引用的模块列表 
			let importList = !usedList[fsPath] || usedList[fsPath].old_path != fsPath && usedList[fsPath].new_path != fsPath ? item.data && item.data.match(moduleCheckReg) : undefined;
			if(importList)// js,ts文件数据
			{ 
				// 2，import被移动路径的文件
				let model = this.parent.fileMgr.getModelByFsPath(fsPath); 
				if(!model){
					// 加载旧路径的代码文件到缓存
					model = this.parent.loadVsModelWorker(item.url,item.fsPath,item.extname,true,false);
					model.setValue(item.data);
				}
				usedPaths[fsPath] = model;
				let list =  usedList[fsPath] = usedList[fsPath] || {}; // 模块、旧路径、新路径，映射关系
				list.new_path = fsPath;
			}
		}

		// console.log("rename列表:",this.move_files.length,usedPaths)
		this.move_files = []
		this.updatedImports(usedPaths,usedList);
	},

	// 应用修改import路径
	updatedImports(usedPaths,usedList)
	{
		let saveList = []
		let hintText = '是否同步以下脚本文件的 import、require路径:\n';
		let logText  = '修正import路径完成,如果组件丢失脚本请重启creator刷新缓存。修改详情:'
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
				if(importItem.path.indexOf('/') == -1){
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
					// console.log('转换import:',info.new_path,importItem.path,'to',newImportPath)
					logText += '\n'+(model.dbUrl || "") + ":旧路径 "+ importItem.path + " 改为" + newImportPath;
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
		// console.log('修正,',logText)
		// 应用提示
		let startTime = new Date().getTime()
		let isApply = confirm(hintText); // electron.remote.dialog.showMessageBoxSync({message:hintText,buttons:['Cancel',"Ok"]})// 
		let endTime = new Date().getTime()
		if(endTime - startTime < 100){
			// 没有经过用户判断，默认使用上次选择结果
			isApply = this.oldSelect;
		}
		this.oldSelect = isApply;
		if(isApply){
			for (let i = 0; i < saveList.length; i++) 
			{
				let info = saveList[i];
				info.model.setValue(info.text);

				let isFileExit = true
				try {fs.accessSync(info.model.fsPath)} catch (error) { isFileExit = false }
				if(isFileExit){
					let id = this.parent.getTabIdByModel(info.model);
					if(id == null){
						// 没有打开的文件则自动保存
						this.parent.saveFileByUrl(info.model.dbUrl,info.text); 
					}else{
						// 已经打开的文件等用户手动保存
						// this.parent.onVsDidChangeContent({},info.model)
						this.parent.saveFile(true,false,id); 
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
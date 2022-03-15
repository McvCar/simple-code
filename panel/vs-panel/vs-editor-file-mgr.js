/**
 * 1.管理文件资源逻辑部分
 */
const fe 	= Editor.require('packages://simple-code/tools/tools.js');
const fs 	= require('fs');
const config = Editor.require('packages://simple-code/config.js');
const path 	= require("path");
const tools = require('../../tools/tools');
const { WatchMgr, WatchFile } = require('../../tools/watchFile');

const prsPath = Editor.Project && Editor.Project.path ? Editor.Project.path : Editor.remote.projectPath;

class FileMgr{
	constructor(parent){
		/** @type import('./vs-panel-base') */
		this.parent = parent;
		this.watchMgr = new WatchMgr()
		this.importPathBuffer = {};
		this.waitReadModels = {};
    }

	// 更新游戏项目文件列表缓存
	initFileListBuffer(callback) {
		if (this.parent.file_list_buffer && this.parent.file_list_buffer.length != 0) {
			if(callback) callback();
			return ;
		};

		Editor.assetdb.queryAssets('db://**/*', '', (err, results)=> {
			if(this.parent.file_list_buffer && this.parent.file_list_buffer.length >0) return;
			
			for (let i = 0; i < results.length; i++) 
			{
				let result = results[i];
				let info = this.getUriInfo(result.url);
				if (info.extname != "" && this.parent.SEARCH_BOX_IGNORE[info.extname] == null) 
				{
					let name = info.name;
					result.extname = info.extname
					let item_cfg = this.newFileInfo(result.extname, name, result.url, result.uuid,result.path)
					this.parent.file_list_buffer.push(item_cfg);
					this.parent.file_list_map[fe.normPath( result.path )] = item_cfg;
					this.parent.file_counts[result.extname] = (this.parent.file_counts[result.extname] || 0) + 1
				}
			}

			this.sortFileBuffer();
			if(callback && this.parent.file_list_buffer.length > 0) 
			{
				let temp = callback;
				callback = null;
				// schId()
				// schId = null;
				temp();
			}
	   });
	}

	// 排序:设置搜索优先级
	sortFileBuffer() {
		let getScore = (extname) => {
			return this.parent.SEARCH_SCORES[extname] || (this.parent.FILE_OPEN_TYPES[extname] && 80) || (this.parent.SEARCH_BOX_IGNORE[extname] && 1) || 2;
		}
		this.parent.file_list_buffer.sort((a, b) => getScore(b.extname) - getScore(a.extname));
	}
	
	newFileInfo(extname, name, url, uuid,fsPath) {
		let item_cfg = {
			extname: extname,//格式
			value: name == "" ? url : name,
			meta: url,
			url: url,
			score: 0,//搜索优先级
			fsPath:tools.normPath(fsPath),
			// matchMask: i,
			// exactMatch: 0,
			uuid: uuid,
			data:undefined,// 文件数据
		};
		return item_cfg;
	}
	
	getUriInfo(url) {
		let s_i = url.lastIndexOf('/');
		if(s_i == -1) s_i = url.lastIndexOf('\\');
		
		let name = ""
		if (s_i != -1) name = url.substr(s_i + 1)

		s_i = name.lastIndexOf('.');
		let extname = ""
		if (s_i != -1) {
			extname = name.substr(s_i).toLowerCase()
		}
		return { name, extname,url }
	}
	
	getFileUrlInfoByUuid(uuid) {
		let url = Editor.remote.assetdb.uuidToUrl(uuid);
		let fs_path = Editor.remote.assetdb.urlToFspath(url);
		if(url == null || fs_path == null) return;
		fs_path = fs_path.replace(/\\/g,'/');

		let name = url.substr(url.lastIndexOf('/') + 1);
		let file_type = name.substr(name.lastIndexOf('.') + 1)
		if (!fe.isFileExit(fs_path) || fs.statSync(fs_path).isDirectory() || this.parent.IGNORE_FILE.indexOf(file_type) != -1) {
			return
		}

		let text = fs.readFileSync(fs_path).toString();
		return { data: text, uuid: uuid, path: url, name: name, file_type: file_type ,fs_path:fs_path};
	}

	getFileUrlInfoByFsPath(fs_path) 
	{
		fs_path = fs_path.replace(/\\/g,'/');
		let uuid = Editor.remote.assetdb.fspathToUuid(fs_path) || "outside";
		let url = uuid == "outside" ? fs_path.replace(/\\/g,'/') : Editor.remote.assetdb.uuidToUrl(uuid);

		let name = url.substr(url.lastIndexOf('/') + 1);
		let file_type = name.substr(name.lastIndexOf('.') + 1)
		if (!fe.isFileExit(fs_path) || fs.statSync(fs_path).isDirectory() || this.parent.IGNORE_FILE.indexOf(file_type) != -1) {
			return
		}

		let text = fs.readFileSync(fs_path).toString();
		return { data: text, uuid: uuid, path: url, name: name, file_type: file_type ,fs_path:fs_path};
	}
	
	getModelByFsPath(fsPath){
		return this.parent.monaco.editor.getModel(this.fsPathToModelUrl(fsPath))
	}
	
	getModelByUrl(url){
		return this.getModelByFsPath(Editor.remote.assetdb.urlToFspath(url))
	}

	fsPathToModelUrl(fsPath){
		let str_uri = Editor.isWin32 ? fsPath.replace(/ /g,'').replace(/\\/g,'/') : fsPath;
		return this.parent.monaco.Uri.parse(str_uri).toString();
	}
	
	// fsPathToUrl(fsPath){
	// 	fsPath = fsPath.replace(/\\/g,'/')
	// 	let ind = fsPath.indexOf(fe.normPath( prsPath)+"/assets");
	// 	let str_uri;
	// 	if(ind != -1){
	// 		ind = prsPath.length;
	// 		let _path = fsPath.substr(ind+1);
	// 		str_uri   = 'db://' + _path ;
	// 	}
	// 	return str_uri;
	// }
	
	checkCurrFileChange(editInfo) {
		// 正在编辑的文件被删
		if (editInfo && editInfo.uuid) {
			let file_path = editInfo.uuid == "outside" ? editInfo.path : unescape(Editor.url(editInfo.path));
			let text = ""
			try {
				text = fs.readFileSync(file_path).toString();
			} catch (e) {
				Editor.info("正在编辑的文件被删除:", file_path)
				return;
			}

			if (text != '' && text != editInfo.data) {
				if (editInfo.data != editInfo.new_data) 
				{
					if (confirm(editInfo.name + " 文件在外边被修改是否刷新?")) 
					{
						editInfo.data = editInfo.new_data = text;
						editInfo.is_need_save = false;
						editInfo.vs_model.setValue(text); 
					}
					this.parent.upTitle(editInfo.id);
				} else {
					// 编辑器内文件未修改
					editInfo.data = editInfo.new_data = text;
					if (this.parent.edit_id == editInfo.id) {
						editInfo.vs_model.setValue(text); 
					}
				}
			} else {

				this.parent.upTitle(editInfo.id);
			}
			return text;
		}
	}

	// 检查当前文件在外边是否被改变
	checkAllCurrFileChange() {
		// 编辑信息
		this.parent.edit_list.forEach((editInfo) => {
			this.checkCurrFileChange(editInfo)
		})
	}
	
	/**
	 * 
	 * @param {sting} pathName 
	 * @param {import('../../tools/watchFile').WatchEventCallback} eventCallback 
	 * @returns {WatchFile} 
	 */
	addWatchPath(pathName,eventCallback){
		return this.watchMgr.addWatchPath(pathName,eventCallback);
	}

	checkWatch(){
		this.watchMgr.checkAll();
	}

	// 加载import引用路径上的文件
	async loadNeedImportPathsAsync(needImportPaths,isTs)
	{
		let importCompletePath
		let loadFunc = async (tryPath,isCompareName,isFromSystemRead)=>
		{
			tryPath = tryPath.substr(0,7) == 'file://' ? tryPath.substr(7) : tryPath; // 去掉前缀

			let fileItem 
			if(isCompareName)
			{
				// 2.cocos专用只对比文件名的方式加载
				let _tryPath = tryPath;
				let index = _tryPath.lastIndexOf('/');
				if(index != -1){
					_tryPath = _tryPath.substr(index+1);
				}
				for (const fsPath in this.parent.file_list_map) 
				{
					let fileName = fsPath;
					let _fileItem = this.parent.file_list_map[fsPath];
					if(_fileItem.extname == '.ts' || _fileItem.extname == '.js' || _fileItem.extname == '.json')
					{
						index = fileName.lastIndexOf('/');
						if(index != -1){
							fileName = fileName.substr(index+1);
						}
						index = fileName.lastIndexOf('.');
						if(index != -1){
							fileName = fileName.substr(0,index);
						}
						if(_tryPath == fileName){
							fileItem = _fileItem;
							break;
						}
					}
				}
			}else{
				// 1.正常node路径加载
				fileItem = this.parent.file_list_map[tryPath];
			}

			if(!fileItem){
				// console.log("尝试import失败:",tryPath)
				if(isFromSystemRead && await fe.isFileExitAsync(tryPath))
				{
					// 3.最后尝试从系统api读取
					fileItem = {
						uuid : "outside",
						meta : tryPath,
					}
				}else{
					return 1
				}
				// console.warn("测试失败import:",importPath,tryPath)
			}

			let isOutside = fileItem.uuid == "outside";
			let filePath = fileItem.meta;
			let vs_model = isOutside ? this.getModelByFsPath(filePath) : this.getModelByUrl(filePath);
			importCompletePath = filePath;
			if(this.waitReadModels[filePath] || vs_model && vs_model.getValue() != ''){
				return 0; // 已经存在缓存，不再继续读取
			}

			this.waitReadModels[filePath] = true;
			// 性能优化: 关闭刷新代码缓存，等需要加载的文件都加载完后再刷新
			this.parent.setEnableUpdateTs(false)
			// 2.加载文件
			this.parent.loadVsModeAsyn(filePath, path.extname(filePath) , !isOutside,false,(model)=>{
				delete this.waitReadModels[filePath]; // 读取完成
			})
			// console.log("加载import:",filePath);
			return 0;
		}

		for (const importPath in needImportPaths) 
		{
			// 告诉解析器已经处理此路径
			this.parent.tsWr.removeNeedImportPath(importPath)
			// console.log('尝试加载:',importPath,tryPaths.length)
			if(this.importPathBuffer[importPath]){
				continue ;// 已经尝试加载过
			}

			this.importPathBuffer[importPath] = true;
			let tryPaths = needImportPaths[importPath];
			let isImport = false;
			for (let i = 0; i < tryPaths.length; i++) 
			{
				// 1.从缓存找出路径文件是否存在
				let tryPath = tryPaths[i];
				let retState = await loadFunc(tryPath);
				if(retState == 1){
					continue;
				}else if(retState == 0){
					isImport = true;
					break;
				}
			}

			if(isImport){
				continue; // 已经加载成功
			}

			// 2.正常路径方式找不到文件时切换为只对比文件名的方式加载
			if( tryPaths.length ){
				let retState = await loadFunc(tryPaths[0],true)
				if(retState == 0){
					isImport = true;
					continue;
				}
			}

			// 3.从系统加载
			for (let i = 1; i < tryPaths.length; i++) 
			{
				// 1.从硬盘上找出路径文件是否存在
				let tryPath = tryPaths[i];
				let retState = await loadFunc(tryPath,false,true);
				if(retState == 1){
					continue;
				}else if(retState == 0){
					isImport = true;
					break;
				}
			}
		}

		// 被加载的路径
		return importCompletePath;
	}

	// 项目资源文件发生改变
	assetsChangedEvent(info)
	{	
		this.checkAllCurrFileChange();
		let isOutside = info.uuid == 'outside';// 内部修改
		let url = isOutside ? info.url : Editor.remote.assetdb.uuidToUrl(info.uuid); // outside额外做处理
		if(!url) return;

		let edit_id = this.parent.getTabIdByPath(url);
		if(edit_id == null || !this.parent.edit_list[edit_id] || !this.parent.edit_list[edit_id].is_need_save)
		{
			// 刷新文件/代码提示,只有未被编辑情况下才刷新
			let urlI = this.getUriInfo(url);
			let model = isOutside ? this.getModelByFsPath(url) : this.getModelByUrl(url) 
			if(model){
				this.parent.loadVsModel(url, urlI.extname, !isOutside);
				if(this.parent.file_list_map[model.fsPath]){
					this.parent.file_list_map[model.fsPath].data = model.getValue();
				}
			}
		}
	}

	// 项目资源创建
	assetsCreatedEvent(files)
	{
		files.forEach((v, i) => {
			let urlI = this.getUriInfo(v.url)
			if (urlI.extname != "" && this.parent.SEARCH_BOX_IGNORE[urlI.extname] == null) 
			{
				let isOutside = v.uuid == 'outside';// 内部修改
				let fsPath = fe.normPath( isOutside ? v.url : Editor.remote.assetdb.urlToFspath(v.url) );
				let item = this.newFileInfo(urlI.extname, urlI.name, v.url, v.uuid,fsPath);
				this.parent.file_list_buffer.push(item);
				this.parent.file_list_map[fsPath] = item;
				let edit_id = this.parent.getTabIdByPath(fsPath);
				if(edit_id != null){
					this.parent.closeTab(edit_id); // 被删的文件重新添加
				}
				this.parent.loadAssetAndCompleter(item.meta, item.extname,!isOutside);
			}
		})
		
		// 刷新编译
		this.parent.setTimeoutById(()=>{
			this.importPathBuffer = {};
			this.parent.upCompCodeFile()
		},500,'loadNeedImportPaths');
	}

	// 项目文件被删除
	assetsDeletedEvent(files)
	{
		files.forEach((v) => 
		{
			let isOutside = v.uuid == 'outside';
			// 删除缓存
			let fsPath = fe.normPath(v.path);
			delete this.parent.file_list_map[fsPath];
			for (let i = this.parent.file_list_buffer.length-1; i >= 0 ; i--) {
				let item = this.parent.file_list_buffer[i];
				if ( !isOutside && item.uuid == v.uuid || isOutside && v.url == item.meta ) {
					this.parent.file_list_buffer.splice(i, 1);
					break;
				}
			}

			let is_remove = false
			
			// 刷新编辑信息
			let old_url = isOutside ? fsPath : Editor.remote.assetdb.fspathToUrl(v.path) ;
			let id = this.parent.getTabIdByPath(old_url);
			// 正在编辑的tab
			if(id != null)
			{
				// 正在编辑的文件被删
				let editInfo = this.parent.edit_list[id] 
				if (editInfo && ( !isOutside && v.uuid == editInfo.uuid || isOutside && fsPath == editInfo.path)) {
					editInfo.uuid = "outside";
					editInfo.path = isOutside ? fsPath : fe.normPath(unescape(Editor.url(editInfo.path)));
					editInfo.can_remove_model = 1;
					if(editInfo.vs_model)
					{
						// 刷新 model 信息，不然函数转跳不正确
						let text  = editInfo.vs_model.getValue();
						editInfo.vs_model.dispose()
						let model = this.parent.loadVsModel(editInfo.path,this.getUriInfo(editInfo.path).extname,false,false)
						if(model)
						{
							let is_show = this.parent.vs_editor.getModel() == null;
							model.setValue(text)
							editInfo.vs_model = model;
							if(is_show){
								this.parent.setTabPage(id);
							}
							editInfo.data = ' ';
							editInfo.is_need_save = true;
							this.parent.upTitle(id);
						}
					}

					this.checkCurrFileChange(editInfo);
					is_remove = true
				}
			}else{
				// 清缓存
				let vs_model = this.parent.monaco.editor.getModel(this.parent.monaco.Uri.parse(this.fsPathToModelUrl(fsPath)))
				if(vs_model) vs_model.dispose()
			}

		})

		// 刷新编译
		this.parent.setTimeoutById(()=>{
			this.importPathBuffer = {};
			this.parent.upCompCodeFile();
		},500,'loadNeedImportPaths');
	}

	assetsMovedEvent(files)
	{
		files.forEach((v, i) => 
		{
			let urlI = this.getUriInfo(v.url)
			v.extname = urlI.extname;
			v.srcPath = fe.normPath(v.srcPath);
			v.destPath = fe.normPath(v.destPath);
			
			// 更新文件缓存
			delete this.parent.file_list_map[v.srcPath];
			for (let i = 0; i < this.parent.file_list_buffer.length; i++) {
				let item = this.parent.file_list_buffer[i];
				if (item.uuid == v.uuid) 
				{
					let s_i = this.parent.refresh_file_list.indexOf(item.meta)
					if(s_i != -1) this.parent.refresh_file_list[s_i] = v.url; // 需要手动编译的文件
					item.extname = urlI.extname
					item.value = urlI.name
					item.meta = v.url
					item.url = v.url
					item.fsPath = v.destPath;
					this.parent.file_list_map[item.fsPath] = item;
					break;
				}
			}
			this.onMoveFile(v);
		});

	}

	// 移动 ts/js代码文件
	onMoveFile(v)
	{
		// 刷新编辑信息
		let urlI = this.getUriInfo(v.url)
		let id = this.parent.getTabIdByPath(Editor.remote.assetdb.fspathToUrl(v.srcPath));
		let hasMoveCodeFile = false;
		// 正在编辑的tab
		if (id != null)
		{
			let editInfo = this.parent.edit_list[id] 
			if (editInfo && editInfo.uuid == v.uuid) {
				editInfo.path = v.url;
				editInfo.name = urlI.name;
				if(editInfo.vs_model)
				{
					// 刷新 model 信息，不然函数转跳不正确
					let text  = editInfo.vs_model.getValue();
					editInfo.vs_model.dispose()
					let model = this.parent.loadVsModel(editInfo.path,urlI.extname,true,false)
					if(model)
					{
						let is_show = this.parent.vs_editor.getModel() == null;
						model.setValue(text)
						editInfo.vs_model = model;
						if(is_show){
							this.parent.vs_editor.setModel(editInfo.vs_model);
							this.parent.setTabPage(id);
						}
					}
				}
				this.parent.upTitle(editInfo.id)
				hasMoveCodeFile = true;
			}
		}else{
			// 修改缓存
			let vs_model = this.parent.monaco.editor.getModel(this.fsPathToModelUrl(v.srcPath))
			if(vs_model) {
				let text = vs_model.getValue();
				vs_model.dispose()
				let model = this.parent.loadVsModel(v.url,urlI.extname,true,false)
				model.setValue(text);
				hasMoveCodeFile = true;
			}
		}

		if(hasMoveCodeFile){
			// 刷新编译
			this.parent.setTimeoutById(()=>{
				this.importPathBuffer = {};
				this.parent.upCompCodeFile();
			},500,'loadNeedImportPaths');
		}
	}

}

module.exports = FileMgr;
/**
 * 1.管理文件资源逻辑部分
 */

const tools = Editor.require('packages://simple-code/tools/tools.js');
const fe 	= Editor.require('packages://simple-code/tools/FileTools.js');
const fs 	= require('fs');
const config = Editor.require('packages://simple-code/config.js');
const path 	= require("fire-path");
const eventMgr = require('../../tools/eventMgr');

const prsPath = Editor.Project && Editor.Project.path ? Editor.Project.path : Editor.remote.projectPath;

class FileMgr{
	constructor(parent){
		this.parent = parent;
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
			fsPath:fsPath,
			// matchMask: i,
			// exactMatch: 0,
			uuid: uuid,
		};
		return item_cfg;
	}
	
	getUriInfo(url) {
		let s_i = url.lastIndexOf('/');
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

		let name = url.substr(url.lastIndexOf('/') + 1);
		let file_type = name.substr(name.lastIndexOf('.') + 1)
		if (!fe.isFileExit(fs_path) || fs.statSync(fs_path).isDirectory() || this.IGNORE_FILE.indexOf(file_type) != -1) {
			return
		}

		let text = fs.readFileSync(fs_path).toString();
		return { data: text, uuid: uuid, path: url, name: name, file_type: file_type ,fs_path:fs_path};
	}

	getFileUrlInfoByFsPath(fs_path) 
	{
		let uuid = Editor.remote.assetdb.fspathToUuid(fs_path) || "outside";
		let url = uuid == "outside" ? fs_path.replace(/\\/g,'/') : Editor.remote.assetdb.uuidToUrl(uuid);

		let name = url.substr(url.lastIndexOf('/') + 1);
		let file_type = name.substr(name.lastIndexOf('.') + 1)
		if (!fe.isFileExit(fs_path) || fs.statSync(fs_path).isDirectory() || this.IGNORE_FILE.indexOf(file_type) != -1) {
			return
		}

		let text = fs.readFileSync(fs_path).toString();
		return { data: text, uuid: uuid, path: url, name: name, file_type: file_type ,fs_path:fs_path};
	}
	
	getModelByFsPath(fsPath){
		return this.monaco.editor.getModel(this.fsPathToModelUrl(fsPath))
	}
	
	getModelByUrl(url){
		return this.getModelByFsPath(Editor.remote.assetdb.urlToFspath(url))
	}

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

			if (text != editInfo.data) {
				if (editInfo.data != editInfo.new_data) 
				{
					if (confirm(editInfo.name + " 文件在外边被修改是否刷新?")) 
					{
						editInfo.data = editInfo.new_data = text;
						editInfo.is_need_save = false;
						editInfo.vs_model.setValue(text); 
					}
					this.upTitle(editInfo.id);
				} else {
					// 编辑器内文件未修改
					editInfo.data = editInfo.new_data = text;
					if (this.edit_id == editInfo.id) {
						editInfo.vs_model.setValue(text); 
					}
				}
			} else {

				this.upTitle(editInfo.id);
			}
			return text;
		}
	}

	// 检查当前文件在外边是否被改变
	checkAllCurrFileChange() {

		// 编辑信息
		this.edit_list.forEach((editInfo) => {
			this.checkCurrFileChange(editInfo)
		})
	}

	// 加载import引用路径上的文件
	loadNeedImportPaths(needImportPaths,isTs)
	{
		// console.log(needImportPaths);
		let isHasImport = false
		let loadFunc = (tryPath,isCompareName)=>
		{
			tryPath = fe.normPath(tryPath)
			tryPath = tryPath.substr(0,7) == 'file://' ? tryPath.substr(7) : tryPath; // 去掉前缀

			let fileItem 
			if(isCompareName)
			{
				// cocos专用只对比文件名的方式加载
				let _tryPath = tryPath;
				let index = _tryPath.lastIndexOf('/');
				if(index != -1){
					_tryPath = _tryPath.substr(index+1);
				}
				for (const fsPath in this.file_list_map) 
				{
					let fileName = fsPath;
					let _fileItem = this.file_list_map[fsPath];
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
				// 正常node路径加载
				fileItem = this.file_list_map[tryPath];
			}

			if(!fileItem){
				// console.warn("测试失败import:",importPath,tryPath)
				return 1;
			}

			let isOutside = fileItem.uuid == "outside";
			let filePath = fileItem.meta;
			let vs_model = isOutside ? this.getModelByFsPath(filePath) : this.getModelByUrl(filePath);
			if(vs_model && vs_model.getValue() != ''){
				return 0; // 已经存在缓存，不再继续读取
			}

			// 2.加载文件
			this.loadVsModel(filePath, this.getUriInfo(filePath).extname , !isOutside)
			console.log("加载import:",filePath);
			isHasImport = true;
			return 0;
		}

		for (const importPath in needImportPaths) 
		{
			let tryPaths = needImportPaths[importPath];
			let isImport = false;
			for (let i = 0; i < tryPaths.length; i++) 
			{
				// 1.从缓存找出路径文件是否存在
				let tryPath = tryPaths[i];
				let retState = loadFunc(tryPath);
				if(retState == 1){
					continue;
				}else if(retState == 0){
					isImport = true;
					break;
				}
			}
			// 2.正常路径方式找不到文件时切换为只对比文件名的方式加载
			if( tryPaths.length && !isImport ){
				loadFunc(tryPaths[0],true)
			}
			// 告诉解析器这边已经处理此路径了
			// isTs ? this.tsWr.removeNeedImportPath(importPath) : this.jsWr.removeNeedImportPath(importPath) 
			this.tsWr.removeNeedImportPath(importPath)
		}
		if(isHasImport){
			// 刷新编译
			this.setTimeoutById(()=>this.upCompCodeFile(),3000,'loadNeedImportPaths')
		}
	}

	// 编译编辑中的代码
	upCompCodeFile(){
		// let edits = [{
		// 	range:{startLineNumber:0,startColumn:0,endLineNumber:0,endColumn:0,},
		// 	text:' ',
		// 	forceMoveMarkers:false,
		// }]
		this.edit_list.forEach((editInfo, id) => {
			if(editInfo && editInfo.vs_model)
			{
				// Editor.monaco.sendEvent('upCompCodeFile',editInfo.vs_model);0
				// 只是为了触发解析格式事件，防止import后没有及时刷新
				let language = editInfo.vs_model.getLanguageIdentifier().language;
				this.monaco.editor.setModelLanguage(editInfo.vs_model,"markdown");
				this.monaco.editor.setModelLanguage(editInfo.vs_model,language);
			}
		});
	}

	// 移动 ts/js代码文件
	onMoveFile(v)
	{
		// 刷新编辑信息
		let urlI = this.getUriInfo(v.url)
		let id = this.getTabIdByPath(this.fsPathToUrl(v.srcPath));
		// 正在编辑的tab
		if (id != null)
		{
			let editInfo = this.edit_list[id] 
			if (editInfo && editInfo.uuid == v.uuid) {
				editInfo.path = v.url;
				editInfo.name = urlI.name;
				if(editInfo.vs_model)
				{
					// 刷新 model 信息，不然函数转跳不正确
					let text  = editInfo.vs_model.getValue();
					editInfo.vs_model.dispose()
					let model = this.loadVsModel(editInfo.path,urlI.extname,true,false)
					if(model)
					{
						let is_show = this.vs_editor.getModel() == null;
						model.setValue(text)
						editInfo.vs_model = model;
						if(is_show){
							this.vs_editor.setModel(editInfo.vs_model);
							this.setTabPage(id);
						}
					}
				}
				this.upTitle(editInfo.id)
			}
		}else{
			// 修改缓存
			let vs_model = this.monaco.editor.getModel(this.fsPathToModelUrl(v.srcPath))
			if(vs_model) {
				let text = vs_model.getValue();
				vs_model.dispose()
				let model = this.loadVsModel(v.url,urlI.extname,true,false)
				model.setValue(text);
			}
		}
	}
	
	upCodeFileRename()
	{
		if(this.code_file_rename_buf.is_use){
			return
		}
		let assets_info = this.code_file_rename_buf.move_files[this.code_file_rename_buf.cur_count];
		if(!assets_info)
		{
			// 重命名完成，收尾工作
			if(this.code_file_rename_buf.cur_count > 0 && this.code_file_rename_buf.cur_count == this.code_file_rename_buf.move_files.length)
			{
				this.onCodeFileRenameEnd()
			}
			return;
		};
		let oldUrl = this.fsPathToModelUrl(assets_info.srcPath);
		let newUrl = this.fsPathToModelUrl(assets_info.destPath);
		
		this.code_file_rename_buf.is_use = 1;
		this.code_file_rename_buf.cur_count++;
		this.code_file_rename_buf.rename_path_map[oldUrl] = newUrl;
		
		// 异步等待读取重命名信息
		this.setWaitIconActive(true);
		this.loadCodeFileRenameInfo(oldUrl,newUrl,(edit_files,wrObj)=>
		{
			if(edit_files.length>0)
			{
				// 缓存路径修改了1
				if(this.code_file_rename_buf.rename_files_map[oldUrl]){
					this.code_file_rename_buf.rename_files_map[newUrl] = this.code_file_rename_buf.rename_files_map[oldUrl];
					delete this.code_file_rename_buf.rename_files_map[oldUrl];
				}

				for (let i = 0; i < edit_files.length; i++){
					const edits = edit_files[i];
					// 修改model选项
					const convert_info 	=  this.setCodeFileModelRename(edits);
					// 记录修改引用路径前的文本信息，用于回撤
					if(convert_info){
						this.code_file_rename_buf.rename_files_map[convert_info.url] = this.code_file_rename_buf.rename_files_map[convert_info.url] || convert_info.old_text;
					}
				}

				// 缓存路径修改了2
				if(this.code_file_rename_buf.rename_files_map[oldUrl]){
					this.code_file_rename_buf.rename_files_map[newUrl] = this.code_file_rename_buf.rename_files_map[oldUrl];
					delete this.code_file_rename_buf.rename_files_map[oldUrl];
				}
				
				// 重新生成vs_model
				this.onMoveFile(assets_info);
				// 检测wr线程读取vs_model完成没有
				let isLoadModel = ()=>{
					wrObj._getModel(newUrl).then((model)=>
					{
						if(model == null) {
							isLoadModel(); // 没加载，继续检测
						}else{
							this.code_file_rename_buf.is_use = 0;
							this.upCodeFileRename(); // 加载，继续读取下个文件
						}
					});
				}
				isLoadModel()
			}else{
				this.code_file_rename_buf.is_use = 0;
				// 重新生成vs_model
				this.onMoveFile(assets_info);
				this.upCodeFileRename(); // 继续读取下个文件
			}
		});
	}

	onCodeFileRenameEnd(){
		let hint_text = '是否同步以下脚本文件的 import、require路径:\n';
		let has_hint = 0
		let new_text_map = {}
		for (const url in this.code_file_rename_buf.rename_files_map) {
			let old_text = this.code_file_rename_buf.rename_files_map[url]; // 
			let vs_model = this.monaco.editor.getModel(url);
			if(!vs_model){
				continue;
			}
			new_text_map[url] = vs_model.getValue();
			vs_model.setValue(old_text);
			has_hint = 1
			hint_text+=vs_model.dbUrl+"\n";
		}

		this.setWaitIconActive(false);
		setTimeout(()=>{
			if(has_hint)
			{
				let is_apply = confirm(hint_text);
				for (const model_url in this.code_file_rename_buf.rename_files_map) {
					let old_text = this.code_file_rename_buf.rename_files_map[model_url]; // 
					// let new_url = this.code_file_rename_buf.rename_path_map[model_url]; // 移动后的路径
					
					let vs_model = this.monaco.editor.getModel(model_url);
					if(!vs_model){
						continue;
					}
	
					if(is_apply){
						vs_model.setValue(new_text_map[model_url])
						let id = this.getTabIdByModel(vs_model);
						if(id == null)
						{
							this.saveFileByUrl(vs_model.dbUrl,vs_model.getValue()); // 没有打开的文件则自动保存
						}else{} // 已经打开的文件等用户手动保存
					}else{
						if(old_text){
							vs_model.setValue(old_text)
						}else{
							Editor.warn("错误:引用路径重命名回撤失败;")
						}
					}
				}
			}
	
			this.code_file_rename_buf = {
				move_files : [],
				cur_count:0,
				is_use :0,
				rename_files_map : {},
				rename_path_map : {},
			}
			this.upCompCodeFile()
		},100)
	}
	
	// 重命名文件引用路径
	loadCodeFileRenameInfo(oldFileName,newFileName,callback)
	{
		// 检测需要修改的文件
		oldFileName = monaco.Uri.parse(oldFileName).toString()
		newFileName = monaco.Uri.parse(newFileName).toString()
		this.tsWr.getEditsForFileRename(oldFileName,newFileName).then((edit_files)=>{
			callback(edit_files,this.tsWr)
		},()=>{
			console.warn("代码编辑器:读取重命名文件引用路径失败:"+oldFileName+" to " +newFileName);
			callback([],this.tsWr);
		})
	}

	setCodeFileModelRename(edits)
	{
		const url = edits.fileName;
		const vs_model = this.monaco.editor.getModel(url)
		if(!vs_model) return ;
		
		let text = vs_model.getValue()
		let old_text = text;
		let has_set = 0;
		edits.textChanges.sort((a,b)=>{
			return b.span.start - a.span.start;
		})
		
		for (let n = 0; n < edits.textChanges.length; n++) 
		{
			const edit = edits.textChanges[n];
			// 不修改没有路径的引用位置 import test from 'test';
			let old_import_path = text.substr(edit.span.start,edit.span.length)
			if(old_import_path.indexOf('/') != -1){
				has_set = 1
				text = text.substr(0,edit.span.start) + edit.newText + text.substr(edit.span.start+edit.span.length)
			}
		}
		
		if(has_set){
			vs_model.setValue(text);
			// 保存修改
			let id = this.getTabIdByModel(vs_model);
			if(id != null)
			{
				this.onVsDidChangeContent({},vs_model)
			}else{
				// this.saveFileByUrl(url,text);
			}
			return {url,old_text};
		}
	}

	// 项目资源文件发生改变
	assetsCreatedEvent(files)
	{	
		this.checkAllCurrFileChange();
		let isOutside = info.uuid == 'outside';// 内部修改
		let url = isOutside ? info.url : Editor.remote.assetdb.uuidToUrl(info.uuid); // outside额外做处理
		if(!url) return;

		let edit_id = this.getTabIdByPath(url);
		if(edit_id == null || !this.edit_list[edit_id] || !this.edit_list[edit_id].is_need_save)
		{
			// 刷新文件/代码提示,只有未被编辑情况下才刷新
			let urlI = this.getUriInfo(url);
			let model = isOutside ? this.getModelByFsPath(url) : this.getModelByUrl(url) 
			if(model){
				this.loadVsModel(url, urlI.extname, !isOutside);
			}
		}
	}

	// 项目资源创建
	assetsCreatedEvent(files)
	{
		files.forEach((v, i) => {
			let urlI = this.getUriInfo(v.url)
			if (urlI.extname != "" && this.SEARCH_BOX_IGNORE[urlI.extname] == null) 
			{
				let isOutside = v.uuid == 'outside';// 内部修改
				let item = this.newFileInfo(urlI.extname, urlI.name, v.url, v.uuid);
				let fsPath = isOutside ? v.url : Editor.remote.assetdb.urlToFspath(v.url);
				this.file_list_buffer.push(item);
				this.file_list_map[fe.normPath(fsPath)] = item;
				this.loadCompleterLib(item.meta, item.extname,!isOutside);
			}
		})
		this.upCompCodeFile();
		this.upAllSymSuggests()
	}

	assetsDeletedEvent(files)
	{
		files.forEach((v) => 
		{
			let isOutside = v.uuid == 'outside';
			// 删除缓存
			delete this.file_list_map[fe.normPath(v.path)];
			for (let i = this.file_list_buffer.length-1; i >= 0 ; i--) {
				let item = this.file_list_buffer[i];
				if ( !isOutside && item.uuid == v.uuid || isOutside && v.url == item.meta ) {
					this.file_list_buffer.splice(i, 1);
					break;
				}
			}

			let is_remove = false
			
			// 刷新编辑信息
			let old_url = isOutside ? v.path : this.fsPathToUrl(v.path) ;
			let id = this.getTabIdByPath(old_url);
			// 正在编辑的tab
			if(id != null)
			{
				// 正在编辑的文件被删
				let editInfo = this.edit_list[id] 
				if (editInfo && ( !isOutside && v.uuid == editInfo.uuid || isOutside && v.path == editInfo.path)) {
					editInfo.uuid = "outside";
					editInfo.path = isOutside ? v.path : unescape(Editor.url(editInfo.path));
					editInfo.can_remove_model = 1;
					if(editInfo.vs_model)
					{
						// 刷新 model 信息，不然函数转跳不正确
						let text  = editInfo.vs_model.getValue();
						editInfo.vs_model.dispose()
						let model = this.loadVsModel(editInfo.path,this.getUriInfo(editInfo.path).extname,false,false)
						if(model)
						{
							let is_show = this.vs_editor.getModel() == null;
							model.setValue(text)
							editInfo.vs_model = model;
							if(is_show){
								this.setTabPage(id);
							}
						}
					}

					this.checkCurrFileChange(editInfo);
					is_remove = true
				}
			}else{
				// 清缓存
				let vs_model = this.monaco.editor.getModel(this.monaco.Uri.parse(isOutside ? v.path : this.fsPathToModelUrl(v.path)))
				if(vs_model) vs_model.dispose()
			}

		})

		this.upCompCodeFile();
	}

	assetsMovedEvent(files)
	{
		files.forEach((v, i) => 
		{
			let urlI = this.getUriInfo(v.url)
			v.extname = urlI.extname;
			
			// 更新文件缓存
			delete this.file_list_map[v.srcPath];
			for (let i = 0; i < this.file_list_buffer.length; i++) {
				let item = this.file_list_buffer[i];
				if (item.uuid == v.uuid) {
					item.extname = urlI.extname
					item.value = urlI.name
					item.meta = v.url
					this.file_list_map[fe.normPath(v.destPath)] = item;
					break;
				}
			}
			
			// 重命名后检测引用路径
			if(this.cfg.renameConverImportPath && ( urlI.extname == '.js' || urlI.extname == '.ts'))
			{
				let model = this.getModelByFsPath(v.srcPath)  
				if(model == null){
					// 加载旧路径的代码文件到缓存
					model = this.loadVsModel(v.srcPath,v.extname,false,false);
					let jsText = fs.readFileSync(v.destPath).toString() ;
					model.setValue(jsText);
				}
				
				this.upNeedImportListWorker((isIdle)=>
				{
					if(isIdle)
					{	
						// 解析器进程处于空闲状态
						this.code_file_rename_buf.move_files.push(v);
						this.upCodeFileRename();
						// console.log("检测·")
					}else{
						// 解析器进程非常繁忙,不执行自动修改文件引用路径。一般是项目刚打开的时候
						this.onMoveFile(v);
						// console.log("停止检测·")
					}
				},3000)
			}else{
				// 不需要检测引用路径的文件
				this.onMoveFile(v);
			}
		})
	}

}

module.exports = FileMgr;
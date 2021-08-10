/* 
面板扩展
功能: 下拉框转跳文件,转跳场景,重命名,打开项目到外部编辑器...
*/
'use strict';
const path 		= require('path');
const md5     	= require('md5');
const fs 		= require('fs');
const fe 		= Editor.require('packages://simple-code/tools/tools.js');
const cfg 		= Editor.require('packages://simple-code/config.js');
const exec 		= require('child_process').exec
const inputType = {"text":1,"password":1,"number":1,"date":1,"color":1,"range":1,"month":1,"week":1,"time":1,"email":1,"search":1,"url":1,"textarea":1}
module.exports = {
	/** @type import('../../panel/vs-panel/vs-panel-base') */
	parent : null,


		// 面板初始化
	onLoad(parent){
		// index.js 对象
		this.parent = parent; 

		// 0代表只有非编辑状态时可用，1代表仅在在文本编辑状态使用，2全局不受影响
		// 键盘事件：添加节点组件
		this.parent.addKeybodyEventByName('addCompToScene',(e)=>
		{
			if ( Editor.Selection.curSelection("node").length> 0){
				this.openodeCompList();
				e.preventDefault();// 吞噬捕获事件
			}
		},0)

		// 键盘事件：全局搜索文本
		this.parent.addKeybodyEventByName('openGlobalSearch',(e)=>
		{	
			this.openGlobalSearch()
			e.preventDefault();// 吞噬捕获事件
		},1)


		// 键盘事件：批量插入预制节点
		this.parent.addKeybodyEventByName('insertPrefab',(e)=>
		{
			if ( !this.inputTypeChk(e) && Editor.Selection.curSelection("node").length> 0){
				this.openPrefabList();
				e.preventDefault();// 吞噬捕获事件
			}
		},0)


		// 键盘事件：切换场景
		this.parent.addKeybodyEventByName('gotoAnything',(e)=>
		{
			if ( !this.inputTypeChk(e)){
				this.searchCmd("findFileAndOpen");
				e.preventDefault();// 吞噬捕获事件
			}
		},0)

		// 绑定页面全局快捷键事件,注意: 区分大小写 Control = ctrl
		this.parent.addKeybodyEventByName('gotoScriptFile',(e)=>
		{
			// 搜索转跳
			this.searchCmd("findJsFileAndOpen");
			e.preventDefault();// 吞噬捕获事件
			return false;
		},2)

		// 绑定页面全局快捷键事件,注意: 区分大小写 Control = ctrl
		this.parent.addKeybodyEventByName('findFileGoto',(e)=>
		{
			// 搜索转跳
			this.searchCmd("findFileGoto");
			e.preventDefault();// 吞噬捕获事件
			return false;
		},0)

		// 键盘事件：搜索节点
		this.parent.addKeybodyEventByName('findNodes',(e)=>
		{
			if ( !this.inputTypeChk(e)){
				setTimeout(()=>{
					this.openFindNode()
				},1)
			}
		},0);
	},

	// 不是输入状态是时
	inputTypeChk(e){
		if (e.path[0] ){
			let type = e.path[0].type ;
			if ( inputType[type]){
				return true
			}
		}
	},

	// 打开下拉搜索框
	searchCmd(cmd)
	{
		// 下拉框选中后操作事件
		let onSearchAccept = (cmd,data)=>
		{
			if (cmd == "findFileGoto")
			{
				// 高亮资源管理器
				Editor.Ipc.sendToAll('assets:hint', data.item.uuid)
				Editor.Selection.select('asset', data.item.uuid)
				this.parent.openActiveFile()
			}else //if(cmd == "findFileAndOpen")
			{
				if (data.item.extname == ".prefab") {
					Editor.Ipc.sendToAll('scene:enter-prefab-edit-mode', data.item.uuid);
				}
				if (data.item.extname == ".fire") {
					Editor.Ipc.sendToAll('scene:open-by-uuid', data.item.uuid);
				}else{
					if(data.item.uuid == 'outside'){
						this.parent.openOutSideFile(data.item.meta,true)
					}else{
						Editor.Selection.select('asset', data.item.uuid)
						setTimeout(()=>this.parent.openActiveFile(true),50) 
					}
				}
			}
		}


		if (cmd == "findFileGoto")
		{
			// 打开搜索框: 文件定位转跳
			let fileList = []
			this.parent.file_list_buffer.forEach((v)=>
			{
				if (v.uuid != 'outside'){
					fileList.push(v)
				}
			});
			this.parent.ace.openSearchBox("",fileList,(data)=>onSearchAccept(cmd,data),null,null,'findFileGoto');
		}else if (cmd == "findFileAndOpen")
		{
			// 打开场景转跳
			let fileList = []
			this.parent.file_list_buffer.forEach((v)=>
			{
				// 过滤文件: 特定的文件才能打开
				let extname = v.extname.substr(1);
				if (extname == "prefab" || extname == "fire" || this.parent.FILE_OPEN_TYPES[extname]){
					fileList.push(v)
				}
			});
			// 打开搜索框
			this.parent.ace.openSearchBox("",fileList,(data)=>onSearchAccept(cmd,data),null,null,'findFileAndOpen');
		}else if (cmd == "findJsFileAndOpen")
		{
			// 打开场景转跳
			let fileList = []
			this.parent.file_list_buffer.forEach((v)=>
			{
				// 过滤文件: 特定的文件才能打开
				let extname = v.extname.substr(1);
				if (this.parent.FILE_OPEN_TYPES[extname]){
					fileList.push(v)
				}
			});
			// 打开搜索框
			this.parent.ace.openSearchBox("",fileList,(data)=>onSearchAccept(cmd,data),null,null,'findJsFileAndOpen');
		}
	},


	// 搜索选中节点
	openFindNode(){

		let uuid_list = Editor.Selection.curSelection('node');
		if(uuid_list.length == 0) return Editor.info("请选中节点后再继续操作");
		let node_uuid = uuid_list[0];

		let sch_id ;
		// 修改搜索框时，通过该函数读取显示的实时显示下拉列表内容, cmdLine为输入文本框对象
		let onCompletionsFunc = (cmdLine)=>{
			let name = cmdLine.getValue();
			if (sch_id) {
				clearTimeout(sch_id);
			}

			sch_id = setTimeout(()=>
			{
				if(name != "")
				{
					sch_id = null;
					Editor.Scene.callSceneScript('simple-code', 'select-node-by-name',{name:name,parent_uuid:node_uuid});
				}
			},400);
			return ["请输入需要批量选中的node名字"];
		}

		// 选中后处理
		let onAccept = (data,cmdLine)=>{
		}

		// 显示下拉框 
		this.parent.ace.openSearchBox("",[],onAccept,onCompletionsFunc)
	},

	getFileName(path){
		let s_i  = path.lastIndexOf("/")+1
		let e_i  = path.lastIndexOf(".")
		e_i = e_i < s_i ? -1 :e_i
		let name 	= path.substr(s_i, e_i == -1 ? undefined : e_i - s_i )
		let suffix 	=  e_i == -1 ? "" : path.substr(e_i)
		return {name,suffix,dir_path:path.substr(0,s_i)}
	},

	// 面板销毁
	onDestroy(){

	},


	// 打开组件列表
	openodeCompList(){
		// 下拉框选中后操作事件
		let onSearchAccept = (data)=>
		{
			// 获得选中的节点
			Editor.Scene.callSceneScript('simple-code', 'set-node-comp' ,data.item.value, (err, args)=>
			{
			});
		}

		Editor.Scene.callSceneScript('simple-code', 'get-comps' ,"", (err, args)=>
		{
			// 打开搜索框: 文件定位转跳
			let list = JSON.parse(args)
			this.parent.ace.openSearchBox("",list,(data)=>onSearchAccept(data),null,null,'openodeCompList');
		});
	},


	// 打开预制节点列表
	openPrefabList(){
		// 下拉框选中后操作事件
		let onSearchAccept = (data)=>
		{
			// 获得选中的节点
			Editor.Scene.callSceneScript('simple-code', 'add-prefab' ,data.item, (err, args)=>
			{
			});
		}

		let list = []
		this.parent.file_list_buffer.forEach((v,i)=>{
			if (v.extname == ".prefab"){
				//  v   = {
				// 	extname: result.extname,//格式
				// 	value: name == "" ? url : name ,
				// 	meta:  url,
				// 	score: 0,//搜索优先级
				// 	matchMask: 0,
				// 	exactMatch: 1,
				// 	uuid:result.uuid,
				// };
				list.push( v );
			}
		})

		// 打开搜索框
		this.parent.ace.openSearchBox("",list,(data)=>onSearchAccept(data),null,null,'openPrefabList');
	},


	// 全局搜索的数据	
	findAllMatches (searchText) {
		let result = []
		if (!searchText) {
			return result;
		}
		//注意如果你一个model都没有注册的话，这里什么都拿不到
		//举个例子啊，下面将一个路径为filePath，语言为lang，文件内容为fileContent的本地文件注册为model
		//monaco.editor.createModel(fileContent, lang, monaco.Uri.file(filePath))
		let find_model = this.parent.monaco.editor.getModel('inmemory://model/1')
		if(!find_model) find_model = this.parent.monaco.editor.createModel('','markdown',this.parent.monaco.Uri.parse('inmemory://model/1'))
		
		for (const fsPath in this.parent.file_list_map) 
		{
			const item = this.parent.file_list_map[fsPath];
			if(item.data == null){
				continue;
			}
			let file_name  =  fsPath.substr(fsPath.lastIndexOf('/'))
			if(file_name.indexOf('.d.ts') != -1) continue;
			
			let uri = Editor.monaco.Uri.parse(this.parent.fileMgr.fsPathToModelUrl(fsPath))
			let model = Editor.monaco.editor.getModel(uri);
			let codeText = item.data;
			if(model){
				codeText = model.getValue();
			}
			
			find_model.setValueNotUndo(codeText)

			for (let match of find_model.findMatches(searchText)) 
			{
				let text = find_model.getLineContent(match.range.startLineNumber);

				for (let i = 0; i < text.length; i++) 
				{
					const c = text[i];
					if(c!=" " && c!="	"){
						text = text.substr(i);		
						break;
					}
				}
				result.push({
					meta : text,
					uri : uri,
					fsPath:fsPath,
					value: file_name,
					range: match.range,
					score:0,
				})
			}
		}
		return result
	},
	
	// 全局搜索
	openGlobalSearch(){
		this.parent.ace.openSearchBox("",[],(data,cmdLine)=>
		{
			let searchText = cmdLine.getValue();
			this.showGlobalSearchListView(searchText)
		},()=>{
			return [fe.translate("global-search-hint")] // 请输入全局搜索内容
		});
	},

	showGlobalSearchListView(searchText){

		let result = this.findAllMatches(searchText);
		let is_has = result.length;
		result = is_has ? result : [fe.translate("no-relevant-content-found")] // '未找到相关内容'
		// 下拉框选中后操作事件
		let onSearchAccept = (data,cmdLine)=>
		{
			if(is_has && data.item) Editor.monaco.sendEvent('vs-open-file-tab',{fsPath:data.item.fsPath,uri:data.item.uri,selection:data.item.range});
			else this.openGlobalSearch()
		}
		// 修改搜索框时，通过该函数读取显示的实时显示下拉列表内容, cmdLine为输入文本框对象
		let onCompletionsFunc = (cmdLine)=>{
			return result;
		}
		
		this.parent.ace.openSearchBox(searchText,[],(data,cmdLine)=>onSearchAccept(data,cmdLine),(cmdLine)=>onCompletionsFunc(cmdLine))
	},

	/*************  事件 *************/  

	messages:{

		// 添加组件
		'addNodeComp'()
		{
			this.openodeCompList();
		},

		// 批量插入预制节点
		'addPrefab'(){
			this.openPrefabList();
		},


		// 通过项目目录打开新项目
		'openProject'(event,type){

			// 下拉框选中后操作事件
			let onSearchAccept = (data)=>
			{
				let dir_path = data.item.meta
				if (type == "dir")
				{
					// 打开目录
					exec( (Editor.isWin32 ? "start " : "open ")+dir_path )
				}else if (type == "editor")
				{
					// 打开项目到外部代码编辑器
					exec( (Editor.isWin32 ? '"'+cfg.editorPath.win+'"' :'"'+ cfg.editorPath.mac+'"')+" "+dir_path)

					// 打开项目从新creator
					if (Editor.isWin32){ 
						exec('"'+cfg.editorPath.win+'" '+dir_path)
					}else{
						// Mac
						exec("\""+cfg.editorPath.mac+"\" "+dir_path+"");
					}
				}else if (type == "creator")
				{
					// 打开项目从新creator
					if (Editor.isWin32){
						let appPath = Editor.appPath.substr(0,Editor.appPath.lastIndexOf(path.sep)) 
						appPath = appPath.substr(0,appPath.lastIndexOf(path.sep))
						appPath = '"'+ appPath + path.sep+'CocosCreator.exe"'+ ' --path '
						exec( appPath+dir_path)
					}else{
						// Mac
						let appPath = Editor.appPath.substr(0,Editor.appPath.lastIndexOf(path.sep)) 
						appPath.substr(0,appPath.lastIndexOf(path.sep))
						exec("nohup "+appPath+" "+dir_path+" >/dev/null 2>&1 &")
					}
				}
				Editor.log("正在执行打开操作:"+dir_path)
			}

			// 获得总项目目录位置: 当前项目上级目录
			let root_path 	= Editor.url("db://assets/")
			root_path 		= root_path.substr(0,root_path.lastIndexOf(path.sep))
			root_path 		= root_path.substr(0,root_path.lastIndexOf(path.sep))


			// 所有项目的列表
			let dirList 	= fe.getDirList(root_path,[]);
			let list 		= []
			dirList.forEach((dir_path)=>
			{
				list.push( this.parent.getItem( dir_path.substr(dir_path.lastIndexOf(path.sep)+1) ,dir_path,0) )
			})
			// 打开搜索框: 文件定位转跳
			this.parent.ace.openSearchBox("",list,(data)=>onSearchAccept(data));
		},


		// 快捷键打开当前选中文件/节点进入编辑
		'custom-cmd' (event,info) {
			if(info.cmd == "findFileAndOpen")
			{
				// 下拉框打开场景或预制节点
				this.searchCmd(info.cmd)
			}else if(info.cmd == "findFileGoto")
			{
				// 下拉框转跳资源管理器
				this.searchCmd(info.cmd)
			}else if(info.cmd == "findJsFileAndOpen")
			{
				// 下拉框转跳资源管理器
				this.searchCmd(info.cmd)
			}
		},

		'scene:saved'(){
			// Editor.log("事件 save")
		}
	},
	
};
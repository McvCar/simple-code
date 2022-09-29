/* 
面板扩展
功能: 下拉框转跳文件,转跳场景,重命名,打开项目到外部编辑器...
*/
'use strict';
const path 		= require('path');
const fs 		= require('fs');
const fe 		= Editor2D.require('packages://simple-code/tools/tools.js');
const cfg 		= Editor2D.require('packages://simple-code/config.js');
const plist 	= require("plist");
const child_process 		= require('child_process')
const exec 		= child_process.exec
const inputType = {"text":1,"password":1,"number":1,"date":1,"color":1,"range":1,"month":1,"week":1,"time":1,"email":1,"search":1,"url":1,"textarea":1}
module.exports = {
	/** @type import('../../panel/vs-panel/vs-panel').EditorPanel */
	parent : null,

		// 面板初始化
	onLoad(parent){
		// index.js 对象
		this.parent = parent; 
		
		// 0代表只有非编辑状态时可用，1代表仅在在文本编辑状态使用，2全局不受影响
		// 键盘事件：添加节点组件
		this.parent.addKeybodyEventByName('addCompToScene',(e)=>
		{
			if (!this.parent.is_mouse_down && Editor2D.Selection.curSelection("node").length> 0){
				this.openodeCompList();
				e.preventDefault();// 吞噬捕获事件
			}
		},0)

		// 键盘事件：批量插入预制节点
		this.parent.addKeybodyEventByName('insertPrefab',(e)=>
		{
			if(this.parent.is_mouse_down) return;
			if ( !this.inputTypeChk(e) && Editor2D.Selection.curSelection("node").length> 0){
				this.openPrefabList();
				e.preventDefault();// 吞噬捕获事件
			}
		},0)

		// 键盘事件：全局搜索文本
		this.parent.addKeybodyEventByName('openGlobalSearch',(e)=>
		{	
			this.openGlobalSearch()
			e.preventDefault();// 吞噬捕获事件
		},2)

		// 键盘事件：切换场景
		this.parent.addKeybodyEventByName('gotoAnything',(e)=>
		{
			if(this.parent.is_mouse_down) return;
			if ( !this.inputTypeChk(e)){
				this.searchCmd("findFileAndOpen");
				e.preventDefault();// 吞噬捕获事件
			}
		},0)

		// 绑定页面全局快捷键事件：ctrl+p
		this.parent.addKeybodyEventByName('gotoScriptFile',(e)=>
		{
			if(this.parent.is_mouse_down) return;
			// 搜索转跳
			this.searchCmd("findJsFileAndOpen");
			e.preventDefault();// 吞噬捕获事件
			e.stopPropagation();// 停止冒泡
			return false;
		},2)

		// 绑定页面全局快捷键事件,注意: 区分大小写 Control = ctrl
		this.parent.addKeybodyEventByName('findFileGoto',(e)=>
		{
			if(this.parent.is_mouse_down) return;
			// 搜索转跳
			this.searchCmd("findFileGoto");
			e.preventDefault();// 吞噬捕获事件
			return false;
		},0)

		// 键盘事件：搜索节点
		this.parent.addKeybodyEventByName('findNodes',(e)=>
		{
			if(this.parent.is_mouse_down) return;
			if ( !this.inputTypeChk(e)){
				this.parent.setTimeout(()=>{
					this.openFindNode()
				},1)
			}
		},0);
	},

	isScenePanelFocus(){
		let panel = Editor2D.Panel.getFocusedPanel()
		return panel && panel.name == 'scene';
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
				Editor2D.Ipc.sendToAll('assets:hint', data.item.uuid)
				Editor2D.Selection.select('asset', data.item.uuid)
				this.parent.openActiveFile()
			}else //if(cmd == "findFileAndOpen")
			{
				if (data.item.extname == ".prefab") {
					Editor2D.Ipc.sendToAll('scene:enter-prefab-edit-mode', data.item.uuid);
				}
				if (data.item.extname == ".scene") {
					Editor2D.Ipc.sendToAll('scene:open-by-uuid', data.item.uuid);
				}else{
					if(data.item.uuid == 'outside'){
						this.parent.openOutSideFile(data.item.meta,true)
					}else{
						Editor2D.Selection.select('asset', data.item.uuid)
						this.parent.setTimeout(()=>this.parent.openActiveFile(true,false),50) 
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
				if (extname == "prefab" || extname == "scene" || this.parent.FILE_OPEN_TYPES[extname]){
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

		let uuid_list = Editor2D.Selection.curSelection('node');
		if(uuid_list.length == 0) return Editor2D.log("请选中节点后再继续操作");
		let node_uuid = uuid_list[0];

		let sch_id ;
		// 修改搜索框时，通过该函数读取显示的实时显示下拉列表内容, cmdLine为输入文本框对象
		let onCompletionsFunc = (cmdLine)=>{
			let name = cmdLine.getValue();
			if (sch_id) {
				clearTimeout(sch_id);
			}

			sch_id = this.parent.setTimeout(()=>
			{
				if(name != "")
				{
					sch_id = null;
					Editor2D.Scene.callSceneScript('simple-code', 'select-node-by-name',{name:name,parent_uuid:node_uuid});
				}
			},400);
			return ["请输入需要批量选中的node名字"];
		}

		// 选中后处理
		let onAccept = (data,cmdLine)=>{
		}

		// 显示下拉框 
		this.parent.ace.openSearchBox("",[],onAccept,onCompletionsFunc,null,'findNode')
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
	async openodeCompList(){
		// 下拉框选中后操作事件
		let onSearchAccept = (data)=>
		{
			// 获得选中的节点
			Editor2D.Scene.callSceneScript('simple-code', 'set-node-comp' ,data.item.meta || data.item.value);
		}

		let list = []
		let comps = await Editor.Message.request('scene','query-components')
		comps.forEach((obj)=>
		{
			if(!obj.path.startsWith("hidden:")){
				let name = obj["name"]
				let item_cfg   = {
					value: name , // 命令
					meta: obj['cid'] || name, // 描述
					score: 0,//搜索优先级
					matchMask: 0,
					exactMatch: 1,
				};
				list.push(item_cfg)
			}
		})
		this.parent.ace.openSearchBox("",list,(data)=>onSearchAccept(data),null,null,'openNodeComp');
	},


	// 打开预制节点列表
	openPrefabList(){
		// 下拉框选中后操作事件
		let onSearchAccept = (data)=>
		{
			// 获得选中的节点
			Editor2D.Scene.callSceneScript('simple-code', 'add-prefab' ,data.item);
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
			let codeText = item.data;
			if(codeText == null){
				if(this.parent.FILE_OPEN_TYPES[item.extname.substr(1)] && item.url.startsWith('db:')){
					try {
						codeText = fs.readFileSync(item.fsPath).toString()
					} catch(err){
						continue;
					}
				}else{
					continue;
				}
			}
			let file_name  =  fsPath.substr(fsPath.lastIndexOf('/'))
			if(file_name.indexOf('.d.ts') != -1) continue;
			
			let uri = Editor.monaco.Uri.parse(this.parent.fileMgr.fsPathToModelUrl(fsPath))
			let model = Editor.monaco.editor.getModel(uri);
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
		},null,'openGlobalSearch');
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
		
		this.parent.ace.openSearchBox(searchText,[],(data,cmdLine)=>onSearchAccept(data,cmdLine),(cmdLine)=>onCompletionsFunc(cmdLine),null,'showGlobalSearchListView')
	},

	async getCodeEditor() {
		let e = "";
		e = "darwin" === process.platform ? "/Applications/Visual Studio Code.app" : "C:\\Program Files (x86)\\Microsoft VS Code\\Code.exe";
		const r = await Editor.Profile.getConfig("program", "script_editor");
		return r && (e = r), e;
	},


	// 通过项目目录打开新项目
	openProject(type){

		// 下拉框选中后操作事件
		let onSearchAccept =async (data)=>
		{
			let dir_path = data.item.meta
			if (type == "dir")
			{
				// 打开目录
				exec( (Editor2D.isWin32 ? "start " : "open ")+dir_path )
			}else if (type == "editor")
			{
				let editorPath = await this.getCodeEditor();
				
				let openDirs = [dir_path];
				let cmdHead = "";
				let cmd = editorPath
				if ("darwin" === process.platform) {
					if (cmd.endsWith(".app")) {
						cmd = path.join(cmd, "/Contents/MacOS/");
						const e = plist.parse(fs.readFileSync(path.join(cmd, "../Info.plist"), "utf8"));
						cmd = path.join(cmd, e.CFBundleExecutable);
					}
					cmdHead = "open";
					openDirs.splice(0, 0, cmd)
					openDirs.splice(0, 0, "-a")
				} else{
					cmdHead = cmd
				}
				child_process.spawn(cmdHead, openDirs, { detached: !0, stdio: "ignore" }).unref();
			}else if (type == "creator")
			{
				// 打开项目从新creator
				// if (Editor2D.isWin32){
				// 	let appPath = Editor.appPath.substr(0,Editor.appPath.lastIndexOf(path.sep)) 
				// 	appPath = appPath.substr(0,appPath.lastIndexOf(path.sep))
				// 	appPath = '"'+ appPath + path.sep+'CocosCreator.exe"'+ ' --path '
				// 	exec( appPath+dir_path)
				// 	Editor.Project.open(dir_path);
				// }else{
				// 	// Mac
				// 	let appPath = Editor.appPath.substr(0,Editor.appPath.lastIndexOf(path.sep)) 
				// 	appPath.substr(0,appPath.lastIndexOf(path.sep))
				// 	exec("nohup "+appPath+" "+dir_path+" >/dev/null 2>&1 &")
				// }
				Editor.Project.open(dir_path);
			}
			Editor.log("正在执行打开操作:"+dir_path)
		}

		// 获得总项目目录位置: 当前项目上级目录
		let root_path 	= cfg.prsPath;
		root_path 		= root_path.substr(0,root_path.lastIndexOf(path.sep))


		// 所有项目的列表
		let dirList 	= fe.getDirList(root_path,[]);
		let list 		= []
		dirList.forEach((dir_path)=>
		{
			list.push( this.parent.getItem( dir_path.substr(dir_path.lastIndexOf(path.sep)+1) ,dir_path,0) )
		})
		// 打开搜索框: 文件定位转跳
		this.parent.ace.openSearchBox("",list,(data)=>onSearchAccept(data),null,null,'openPrs');
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

		'openProjectDir'(){
			this.openProject('dir')
		},
		
		'openProjectEditor'(){
			this.openProject('editor')
		},
		
		'openProjectCreator'(){
			this.openProject('creator')
		},

		'findFileAndOpen'(){
			// 下拉框打开场景或预制节点
			this.searchCmd('findFileAndOpen')
		},
		'findFileGoto'(){
			// 下拉框转跳资源管理器
			this.searchCmd('findFileGoto')
		},
		'findJsFileAndOpen'(){
			// 下拉框转跳资源管理器
			this.searchCmd('findJsFileAndOpen')
		},
		// 'scene:saved'(){
		// 	// Editor.log("事件 save")
		// }
	},
	
};
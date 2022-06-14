/// <reference path="./monaco-editor/monaco.d.ts"/>
/**
 * 1.管理vscode编辑器对象
 * 2.管理文件资源
 */
const electron 		= require('electron')
const fe 			= require('../../tools/tools');
const config 		= Editor.require('packages://simple-code/config.js');
const packageCfg 	= Editor.require('packages://simple-code/package.json');
const fs 	= require('fs');
const path 	= require("path");
const exec 	= require('child_process').exec;
const md5 	= require('md5');
const { isArray } 	= require('./monaco-editor/dev/vs/editor/editor.main');
const eventMgr 		= require('../../tools/eventMgr');
const fileMgr 		= require('./vs-editor-file-mgr');

const prsPath = Editor.Project && Editor.Project.path ? Editor.Project.path : Editor.remote.projectPath;

let layer = 
{
	SEARCH_SCORES : { ".fire": 100, ".prefab": 90 },
	// 主题文件位置
	THEME_DIR 	   : Editor.url("packages://simple-code/panel/vs-panel/monaco-editor/custom_thems"),
	// .d.ts 通用代码提示文件引入位置
	TS_API_LIB_PATHS : [prsPath,Editor.url('packages://simple-code/template/api_doc')],
	// 备忘录位置
	MEMO_FILE_PATH : prsPath + path.sep + "temp" + path.sep + (fe.getLanguage() == 'zh' ? "备忘录.md" : "Memo.md"),
	CMD_FILE_PATH : prsPath + path.sep + "temp" + path.sep + "commandLine.js",
	// 下拉框 过滤文件类型 
	SEARCH_BOX_IGNORE: {},//{".png":1,".jpg":1}
	// 忽略文件
	IGNORE_FILE: ["png", "jpg", "zip", "labelatlas", "ttf", "mp3", "mp4", "wav", "ogg", "rar", 'fire', 'prefab', 'plist'],
	// 打开文件格式对应的类型
	FILE_OPEN_TYPES: { md: "markdown", js: "typescript", ts: "typescript", effect: "yaml", coffee: "coffeescript", lua: "lua", sql: "mysql", php: "php", xml: "xml", html: "html", css: "css", json: "json", manifest: "typescript", plist: "xml", gitignore: "gitignore", glsl: "glsl",text:"markdown",txt:"markdown",c:"c",cpp:"cpp",h:"cpp" },
	// 须加载配置文件
	REG_EXP_DTS : /(\.d\.ts)/,
	REG_EXP_JSON_CONFIG : /(tsconfig.*\.json|jsconfig.*\.json|package\.json)/,

	// 导入代码提示
	/** @type monaco */
	monaco:null,
	/** @type fileMgr */
	fileMgr:null,

	// 启动事件
	initVsEditor(callback) 
	{
		this.is_init_finish;
		this.timer_map 			= {};
		this.file_list_buffer  	= this.file_list_buffer || [];
		this.file_list_map 	  	= this.file_list_map || {};
		this.window_event_listener = []
		this.fileMgr 			= new fileMgr(this);
		this.enableUpdateTs 	= false;
		this.isInitEditorScene	= false; // 检测creator场景是否初始化完成
		this.menu  = null;
		this.initVsCode(() => {
			this.initEditorData();
			this.fileMgr.initFileListBuffer(()=>{
				this.onLoadEvent()
				this.initEditorEvent();
				this.initCustomCompleter();
				this.initSceneData(callback);
				this.initContextMenu();
			});
		});
	},

	// 初始化事件
	onLoadEvent(){
		this.runExtendFunc('onLoadEvent',this);
	},

	initVsCode(callback) {
		if(Promise.prototype.finally == null){
			// Editor.require('packages://simple-code/node_modules/promise.prototype.finally').shim();
			Promise.prototype.finally = function (callback) {
				let P = this.constructor;
				return this.then(
					value => P.resolve(callback()).then(() => value),
					reason => P.resolve(callback()).then(() => { throw reason })
				);
			};
		}

		const vsLoader = Editor.require('packages://simple-code/panel/vs-panel/monaco-editor/dev/vs/loader.js');
		// vs代码路径
		vsLoader.require.config({ 'vs/nls': { availableLanguages: { '*': fe.getLanguage() == 'zh' ? 'zh-cn' : '' } }, paths: { 'vs': Editor.url('packages://simple-code/panel/vs-panel/monaco-editor/dev/vs', 'utf8') } });
		// 创建vs编辑器，api参考 monaco.d.ts文件
		vsLoader.require(['vs/editor/editor.main'], (monaco) => 
		{
			this.monaco = Editor.monaco = Editor.monaco || monaco;
			let vsEditorConfig = config.getUserEditorConfig();
			vsEditorConfig.language = 'javascript';  // 预热 typescript模块。json、javascript脚本统一交给typescript解析器一起解析，方便混合编码
			vsEditorConfig.value = ``
			var editor = monaco.editor.create(this.$editorB,vsEditorConfig);

			this.defind_model = monaco.editor.createModel('',"plaintext",monaco.Uri.parse('defind_model'));
			Editor.monaco.vs_editor = this.vs_editor = editor;
			eventMgr.merge(this.monaco); // 添加事件分发函数

			let compilerOptions = config.compilerOptions;
			for (const key in compilerOptions) {
				const v = compilerOptions[key];
				monaco.languages.typescript.typescriptDefaults._compilerOptions[key] = v;
			}
			monaco.languages.typescript.typescriptDefaults.setCompilerOptions(monaco.languages.typescript.typescriptDefaults._compilerOptions);
			monaco.editor.setTheme("vs-dark-ex")
			setTimeout(()=>
			{
				monaco.editor.setModelLanguage(this.vs_editor.getModel(), "typescript"); // 预热 typescript模块
				monaco.languages.typescript.getTypeScriptWorker().then((func)=>{func().then((tsWr)=>{
					monaco.tsWr = this.tsWr = tsWr;// ts文件静态解析器
					
					this.tsWr.getEditsForFileRename('inmemory://model/1','inmemory://model/2');// 预热模块
					this.setEnableUpdateTs(false); // 优化性能: 关闭刷新代码缓存,等所有文件加载完成后再刷新
					if(this.tsWr && this.jsWr){
						callback();
					}
				})})
				monaco.languages.typescript.getJavaScriptWorker().then((func)=>{func().then((jsWr)=>{
					this.jsWr = jsWr;// js文件静态解析器
					this.jsWr.setEnableUpdate(false);
					this.jsWr.setEnableUpdateScript(false);
					if(this.tsWr && this.jsWr){
						callback();
					}
				})})
			},100)
		})
	},

	// 右键菜单初始化
	initContextMenu(){
		this.menu = electron.remote.Menu.buildFromTemplate([
			// 关闭
			{label:fe.translate('close'),click:()=>
			{
				if(this.menu.currTabId == null) return;
				this.closeTab(this.menu.currTabId)
			}},

			// 关闭其它
			{label:fe.translate('close-others'),click:()=>
			{
				for (let i = this.edit_list.length-1; i >= 0 ; i--) {
					const file_info = this.edit_list[i];
					if(!file_info || file_info.id == this.menu.currTabId) continue;
					this.closeTab(file_info.id)
				}
			}},

			// 关闭All
			{label:fe.translate('close-all'),click:()=>
			{
				for (let i = this.edit_list.length-1; i >= 0 ; i--) {
					const file_info = this.edit_list[i];
					if(!file_info) continue;
					this.closeTab(file_info.id)
				}
			}},

			// 线条
			{ type: 'separator' },
			// 复制路径
			{label:fe.translate('copy-path'),click:()=>
			{
				if(this.menu.currTabId == null || this.edit_list[this.menu.currTabId] == null) return;
				let file_info = this.edit_list[this.menu.currTabId];
				require('electron').clipboard.writeText(file_info.vs_model.fsPath);
			}},

			// 线条
			{ type: 'separator' },
			// 在文件夹中显示
			{label:fe.translate('reveal-in-finder'),click:()=>
			{
				if(this.menu.currTabId == null || this.edit_list[this.menu.currTabId] == null) return;
				let file_info = this.edit_list[this.menu.currTabId];
				let url =  (file_info.uuid == "outside" ? file_info.path.replace(new RegExp('/','g'),path.sep) : Editor.remote.assetdb.urlToFspath(file_info.path));
				exec(Editor.isWin32 ? 'Explorer /select,"'+url+'"' : "open -R " + url)
			}},
			// 跳到资源管理器
			{label:fe.translate('reveal-in-side-bar'),click:()=>
			{
				if(this.menu.currTabId == null || this.edit_list[this.menu.currTabId] == null) return;
				let file_info = this.edit_list[this.menu.currTabId];
				Editor.Ipc.sendToAll('assets:hint', file_info.uuid);
			}},
		]);

		// monaco 右击菜单,在文件夹中显示
		this.vs_editor.addAction({
			id: 'reveal-in-finder', // 菜单项 id
			label: fe.translate('reveal-in-finder'), // 菜单项名称
			// keybindings: [this.monaco.KeyMod.CtrlCmd | this.monaco.KeyCode.KEY_J], // 绑定快捷键
			contextMenuGroupId: '9_cutcopypaste', // 所属菜单的分组
			contextMenuOrder: 9,
			run: () => {
				// 点击后执行的操作
				if (this.file_info.uuid == null) return;
				let url =  (this.file_info.uuid == "outside" ? this.file_info.path.replace(new RegExp('/','g'),path.sep) : Editor.remote.assetdb.urlToFspath(this.file_info.path));
				exec(Editor.isWin32 ? 'Explorer /select,"'+url+'"' : "open -R " + url)
			}, 
		})
	},

	// 排序:设置搜索优先级
	sortFileBuffer() {
		let getScore = (extname) => {
			return this.SEARCH_SCORES[extname] || (this.FILE_OPEN_TYPES[extname] && 80) || (this.SEARCH_BOX_IGNORE[extname] && 1) || 2;
		}
		this.file_list_buffer.sort((a, b) => getScore(b.extname) - getScore(a.extname));
	},
	
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
	},


	setTheme(name) {
		let filePath = path.join(this.THEME_DIR , name + ".json")
		if (fe.isFileExit(filePath)) {
			let data = fs.readFileSync(filePath).toString();
			this.monaco.editor.defineTheme(name, JSON.parse(data));
		}
		this.monaco.editor.setTheme(name);
	},

	// 设置选项
	setOptions(cfg,isInit) 
	{	
		if(cfg.minimapSide != null){
			cfg.minimap = cfg.minimap || {};
			cfg.minimap.side = cfg.minimapSide;
		}

		if(cfg.minimapStyle != null){
			cfg.minimap = cfg.minimap || {};
			cfg.minimap.enabled = cfg.minimapStyle != 'hide';
			cfg.minimap.maxColumn = cfg.minimapStyle == 'default' ? 120 : 35;
			cfg.minimap.scale = cfg.minimapStyle == 'default' ? 1 : 3;
		}


		if (cfg["language"]) {
			this.monaco.editor.setModelLanguage(this.vs_editor.getModel(), cfg['language']);
		}

		if(cfg.theme != null){
			this.setTheme(cfg.theme);
		}
		
		if(cfg.readCodeMode == 'all' && !isInit){
			this.loadAllScript(); 
		}
		
		this.vs_editor.updateOptions(cfg);
	},

	// 加载数据
	initEditorData() 
	{
		// tab页面id
		this.edit_id = 0;
		this.old_edit_id = null;
		// 编辑的js文件信息
		this.file_info = {};
		// 编辑tab列表
		this.edit_list = [];
		// 全局快捷键配置
		this.key_cfg = [];
		// 文件数量统计
		this.file_counts = {
			'.js':0,
			'.ts':0,
		}

		// 全局配置信息
		this.cfg = config.getLocalStorage();
		// 项目配置信息
		this.pro_cfg = config.getProjectLocalStorage()
		this.cfg.language = null;
		this.file_cfg = this.pro_cfg.file_cfg = this.pro_cfg.file_cfg || {}
		// 待刷新的文件url
		this.refresh_file_list = this.pro_cfg.refresh_file_list = this.pro_cfg.refresh_file_list || []
		this.currTabDiv = null;

		this.loadDefineMeunCfg(this.cfg)
		this.loadThemeList();
		this.loadLanguageList();
		this.loadSysFonts()
	},

	// 读取系统字体列表
	loadSysFonts()
	{
		let fontList = Editor.require('packages://simple-code/node_modules/node-font-list-master/index.js');
		fontList.getFonts()
		.then(fonts => {
			for (let i = 0; i < fonts.length; i++) 
			{
				let fontName = fonts[i];
				config.optionGroups.Main["fontFamily"].items.push({ caption: fontName, value: fontName });
			}
		})
		.catch(err => {
			// console.log(err)
		})
	},

	loadLanguageList()
	{
		let list = this.monaco.languages.getLanguages()
		for (let i = 0; i < list.length; i++) 
		{
			let language = list[i];
			for (let n = 0; n < language.extensions.length; n++) {
				const ext = language.extensions[n];
				if(this.FILE_OPEN_TYPES[ext.substr(1)] == null){
					this.FILE_OPEN_TYPES[ext.substr(1)] = language.id;
				}
			}
			config.optionGroups.Main["language"].items.push({ caption: language.id, value: language.id });
		}
	},

	loadThemeList()
	{
		let list = fe.getFileList(this.THEME_DIR,[])
		for (let i = 0; i < list.length; i++) 
		{
			let file = list[i].replace(/\\/g,'/');
			let name = this.fileMgr.getUriInfo(file).name;
			name = name.substr(0,name.lastIndexOf('.'))
			config.optionGroups.Main["theme"].items.push({ caption: name, value: name });
		}
	},

	// 检测Creator场景编辑器窗口是否初始化了
	clickCreatorSceneInitState(){
		if(this.isInitEditorScene){
			return;
		}
		
		Editor.Ipc.sendToPanel('scene', 'scene:query-hierarchy', (error, sceneID, hierarchy) => {
			if(hierarchy && hierarchy.length > 0){
				this.isInitEditorScene = true;
				this.openActiveFile()
				Editor.log(fe.T(`${fe.translate('name')}: 所有功能初始化成功`, `${fe.translate('name')}: Init editor success`));
			}{
				this.setTimeoutById(this.clickCreatorSceneInitState.bind(this),1000,'clickCreatorSceneInitState');
			}
		});
	},


	initSceneData(callback) {
		setTimeout(()=>
		{
			this.oepnDefindFile();
			// 打开历史文件tab列表
			let showId;
			for (const key in this.file_cfg) {
				let info = this.file_cfg[key];
				if (key.indexOf("db://") != -1) {
					let uuid = Editor.remote.assetdb.urlToUuid(key);
					if (!uuid) continue;
					let temp = this.fileMgr.getFileUrlInfoByUuid(uuid);
					let file_info = this.openFile(temp, true);
					if (file_info) {
						this.setLockEdit(true,file_info.id);
					}
					if(info.is_show){
						showId = file_info.id;
					}
				}
			}
			// this.openActiveFile();
			this.clickCreatorSceneInitState();
			if(showId){
				this.setTabPage(showId)
			}
			if(callback) callback()
		},2);
	},

	// 綁定事件
	initEditorEvent() {
		let stopCamds = { "scene:undo": 1, "scene:redo": 1, };

		// 窗口进入前台
		this.addWindowEventListener("focus",()=>{
			this.setTimeoutById(this.onFocus.bind(this),100,'windowfocus'); // 阻止短时间重复调用
		},true);

		// 窗口进入后台
		// this.addWindowEventListener("blur",()=>{
		// 	this.setTimeoutById(this.onBlur.bind(this),100,'windowfocus');
		// },true);

		//获得焦点
		this.vs_editor.onDidFocusEditorText((e) => {
			// if (!this.isWindowMode){
			// creator上层按键事件无法吞噬掉, 只能把撤销重置命令截取了
			this._sendToPanel = this._sendToPanel || Editor.Ipc.sendToPanel;
			Editor.Ipc.sendToPanel = (n, r, ...i) => {
				if (!stopCamds[r]) {
					return this._sendToPanel(n, r, ...i);
				}
			}
			// (document.getElementById("tools") || this).transformTool = "move";
			// 关闭cocosCreator 默认的tab键盘事件,不然会冲突
			require(Editor.appPath + "/editor-framework/lib/renderer/ui/utils/focus-mgr.js").disabled = true;
		});

		// 失去焦点
		this.vs_editor.onDidBlurEditorText((e) => {
			Editor.Ipc.sendToPanel = this._sendToPanel || Editor.Ipc.sendToPanel;
			require(Editor.appPath + "/editor-framework/lib/renderer/ui/utils/focus-mgr.js").disabled = false;
		});

		// 记录光标位置
		this.vs_editor.onDidChangeCursorPosition((e)=>{
			if(this.file_info && this.file_info.vs_model){
				this.file_info.position = e.position;
			}
		});

		// 记录光标选择位置
		this.vs_editor.onDidChangeCursorSelection((e)=>{
			if(this.file_info && this.file_info.vs_model){
				this.file_info.selection = e.selection;
			}
		});

		// 编译开始
		this.vs_editor.onDidCompositionStart((e)=>{
			this.setWaitIconActive(true);
		});

		// 切换 tab、model
		// this.vs_editor.onDidChangeModel((e)=>{
		// });
		
		
		// 创建view缓存model事件
		this.monaco.editor.onDidCreateModel((model)=>
		{
			// 编辑事件
			model.onDidChangeContent(()=>{
				this.tsWr.setEnableUpdateScript(true);
			});
			this.tsWr.setEnableUpdateScript(true);
			this.upNeedImportListWorker()
		});

		// 删除代码文件 view缓存model
		this.monaco.editor.onWillDisposeModel((model)=>{
			let url = model.uri.toString();
			this.tsWr.deleteFunctionDefindsBuffer(url);
			this.tsWr.setEnableUpdateScript(true);
			this.upNeedImportListWorker()
		});

		// typescript 配置发生改变
		this.monaco.languages.typescript.typescriptDefaults.onDidChange(()=>{
			this.tsWr.setEnableUpdateScript(true);
		});

		// typescript es5 xx库文件发生改变
		this.monaco.languages.typescript.typescriptDefaults.onDidExtraLibsChange(()=>{
			this.tsWr.setEnableUpdateScript(true);
		});
		
		// vs功能:在文件夹打开文件
		// this.monaco.listenEvent('vs-reveal-in-finder',(event)=> 
		// {
		// })

		// vs功能:打开网页
		this.monaco.listenEvent('vs-open-url',(url) =>
		{
			// let uri = this.monaco.Uri.parse(url)
			// if (uri.scheme == "file"){
			// 	url = "http://"+uri.path;
			// }
			// exec(Editor.isWin32 ? "cmd /c start "+url : "open "+url); 
		})

		// vs功能:焦点
		this.monaco.listenEvent('vs-editor-focus',(url) =>
		{
			if(Editor.Panel.getFocusedPanel() == this){
				this.vs_editor.focus();
			}
		})
		
		// vs功能: 
		this.monaco.listenEvent('vs-up-code-file',(_) =>
		{
			this.upCompCodeFile();
		})
		
		// vs功能:打开文件、转跳到实现、定义
		this.monaco.listenEvent('vs-open-file-tab',(info) =>
		{
			let uuid;
			let url_info ;
			let vs_model = info.uri._formatted && this.monaco.editor.getModel(info.uri._formatted);
			if(vs_model == null){
				if(info.uri.scheme == 'http' || info.uri.scheme == 'https'){
					exec(Editor.isWin32 ? "cmd /c start "+info.uri._formatted : "open "+info.uri._formatted); 
					return 
				}else if(info.fsPath){
					let url = Editor.remote.assetdb.fspathToUrl(info.fsPath);
					vs_model = this.loadVsModel(url || info.fsPath,path.extname(url || info.fsPath),url != null)
				}else{
					Editor.warn('未找到文件,vs_model == null:',info.uri && info.uri._formatted);
					return 
				}
			}
			
			for (let i = 0; i < this.file_list_buffer.length; i++) 
			{
				const _file_info = this.file_list_buffer[i];
				if(_file_info.meta == vs_model.dbUrl){
					uuid  = _file_info.uuid;
					break;
				}
			}
			
			if(uuid){
				url_info = this.fileMgr.getFileUrlInfoByUuid(uuid) 
			}else{
				// 项目根目录的代码提示文件
				if(fe.isFileExit(vs_model.fsPath)){
					url_info = this.fileMgr.getFileUrlInfoByFsPath(vs_model.fsPath);
				}
			}

			if(url_info){
				let file_info = this.openFile(url_info,true);
				if(file_info && info.selection && this.vs_editor.getModel() == file_info.vs_model) 
				{
					if(uuid == null){
						delete file_info.new_data;
						this.setTabPage(file_info.id);
					}
					//把选中的位置放到中间显示
					if(!Editor.monaco.Range.isIRange(info.selection) && !Editor.monaco.Selection.isISelection(info.selection)){
						info.selection = new Editor.monaco.Range(info.selection.startLineNumber,info.selection.startColumn,info.selection.startLineNumber,info.selection.startColumn)
					}
					this.vs_editor.setSelection(info.selection)
					this.vs_editor.revealRangeInCenter(info.selection)
				};
			}
		})

		// 转跳定义
		this.monaco.languages.registerDefinitionProvider("typescript", {
			provideDefinition:  (model, position, token)=> 
			{
				// 高亮场景node
				let wordInfo = model.getWordAtPosition(position);
				// if(wordInfo)
				// {
				// 	this.is_not_select_active = 1;
				// 	this.setTimeoutById(()=>{
				// 		this.is_not_select_active = 0;
				// 	},1000,'defindToNode')
				// 	Editor.Scene.callSceneScript('simple-code', 'hint-node', wordInfo.word);
				// }
				
				let isJs = 	this.fileMgr.getUriInfo(model.uri.toString()).extname == '.js'
				let enable = isJs && this.cfg.enabledJsGlobalSugges;

				// 异步等待返回
				var p = new Promise( (resolve, reject )=>
				{
					if(!wordInfo || !enable){
						return resolve([]);
					}
					this.tsWr.getFunctionDefinds(wordInfo.word).then((hitnMap)=>
					{
						let list = []
						for (const url in hitnMap) 
						{
							const synObjs = hitnMap[url];
							const modelB  = this.monaco.editor.getModel(this.monaco.Uri.parse(url))
							let text = modelB && modelB.getValue();
							if(text)
							{
								let re_syns = {}
								for (let i = 0; i < synObjs.length; i++) 
								{
									const synObj = synObjs[i];
									if(synObj.spans && synObj.spans[0] && re_syns[synObj.spans[0].start] == null)
									{
										re_syns[synObj.spans[0].start] = 1;
										let range = this.convertPosition(text,synObj.spans[0].start)
										list.push({
											uri: this.monaco.Uri.parse(url),
											range: range,
										})
									}
								}
							}
						}
						resolve(list);
					})
					
				} )
				return p;
			}
		})

		// 鼠标悬停提示
		this.monaco.languages.registerHoverProvider("typescript", {
			provideHover:  (model, position, token)=> {
				let wordInfo = model.getWordAtPosition(position);
				
				let isJs = 	this.fileMgr.getUriInfo(model.uri.toString()).extname == '.js'
				let enable = isJs && this.cfg.enabledJsGlobalSugges ||  !isJs && this.cfg.enabledTsGlobalSugges

				var p = new Promise( (resolve, reject )=>{
					if(wordInfo && enable){
						this.tsWr.getFunctionDefindHover(wordInfo.word,model.uri._formatted).then((text)=>
						{
							text = text || '';
							let toInd = text.indexOf('\n');
							if(toInd != -1){
								text = text.substr(0,toInd);
							}

							let language = model.getLanguageIdentifier().language
							resolve({
								contents: [{ 
									isTrusted: false,
									supportThemeIcons:true,
									value: text == '' ? '' : `\`\`\`${language}\n* ${text}\n\`\`\``,
								}],
								// range: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 }
							});
						})
					}else{
						resolve({});
					}
				} )
				return p;
			}
		})

		// 跳转到实现
		// this.monaco.languages.registerImplementationProvider("typescript",{provideImplementation: function (model,position, token) {
		// 	return Promise.resolve([{
		// 		// contents: [ {isTrusted:true, value: 'hello world' } ],
		// 		range: { startLineNumber:1, startColumn:1, endLineNumber: 1, endColumn: 1 },
		// 		uri: monaco.Uri.parse('file://model/fn.js'),
		// 	}]);
		// }})

		// 编辑器内部链接操作
		// this.monaco.languages.registerLinkProvider("typescript",{provideLinks: function (model, token) {
		// 	return Promise.resolve([{
		// 		links: [{range:null,tooltip:"",url:""}],
		// 	}]);
		// }})


	},

	convertPosition(text,start){
		let LineNumber = 1
		let lastLine = 0
		for (let i = 0; i < start; i++) {
			const char = text[i];
			if(char == '\n') {
				LineNumber ++;
				lastLine = i;
			}
		}
		let startColumn = start - lastLine;
		return { startLineNumber: LineNumber, startColumn: startColumn, endLineNumber: LineNumber, endColumn: startColumn }
	},


	// 自定义代码輸入提示
	initCustomCompleter()
	{
		this.setEnableUpdateTs(false);
		this.loadAllScript()
		
		// 项目根目录的代码提示文件 x.d.ts
		let load_file_map = {}
		for (var n = 0; n < this.TS_API_LIB_PATHS.length; n++) 
		{
			let s_path = this.TS_API_LIB_PATHS[n];
			let list = fe.getFileList(s_path, []);
			for (let i = 0; i < list.length; i++)
			{
				let file_path = list[i];
				file_path = file_path.replace(/\\/g,'/')
				let file_name = file_path.substr(file_path.lastIndexOf('/'));
				let extname = file_path.substr(file_path.lastIndexOf('.'));
				// creator.d.ts 文件
				if (extname == '.ts' && !load_file_map[file_name]) {
					load_file_map[file_name] = 1;
					this.loadVsModeAsyn(file_path, extname, false, false);
				}
			}
		}
	},

	loadAllScript()
	{
		// 加载所有脚本文件到缓存
		let script_num = 0;
		let read_num = 0;
		for (let i = 0; i < this.file_list_buffer.length; i++) 
		{
			let file_info = this.file_list_buffer[i];
			if(file_info.uuid.length < 9) continue; // outside < 9
			
			let isScript = this.loadAssetAndCompleter(file_info.meta, file_info.extname, true, false, true, ()=>{
				read_num ++;
				if(read_num == script_num){
					//所有脚本加载完成,刷新下已显示的代码页面
					this.upCompCodeFile();
				}
			});
			if(isScript){
				script_num ++;
			}
		}
	},

	addWindowEventListener(eventName,callback,option){
		this.window_event_listener.push({eventName,callback,option});
		window.addEventListener(eventName,callback,option);
	},


	// 初始化时代码文件加载方式
	isReadCode(){
		return this.cfg.readCodeMode == 'all' || // 加载全部文件方式
			this.cfg.readCodeMode == 'auto' && 
			(
				this.file_counts['.js'] > this.file_counts['.ts'] && // js文件多则加载全部文件方式，否则按import需求加载
				this.file_counts['.js'] < 500 ||
				(this.file_counts['.js'] + this.file_counts['.ts']) < 100
			)
	},

	onVsDidChangeContent(e,model) {
		let file_info ;
		if(model == this.file_info.vs_model ){
			file_info = this.file_info  
		}else{
			file_info = this.edit_list[this.getTabIdByModel(model)];
		}
		if (file_info && file_info.uuid) {
			file_info.new_data = model.getValue();
			file_info.is_need_save = file_info.data != file_info.new_data;//撤销到没修改的状态不需要保存了
			this.upTitle(file_info.id);

			if (this.file_info == file_info && file_info.uuid != "outside" && file_info.is_need_save) {
				//修改后 锁定编辑
				this.setLockEdit(true);
			}
		}
		
		(document.getElementById("tools") || this).transformTool = "move";//因为键盘事件吞噬不了,需要锁定场景操作为移动模式

		let model_url = model.uri._formatted;
		this.setTimeoutById(()=>{
			// this.jsWr.deleteFunctionDefindsBuffer(model_url);
			this.tsWr.deleteFunctionDefindsBuffer(model_url);
		},1000,'removeModelBuffer');
	},
	
	// 系统文件保存修改内容
	onAssetsChangedEvent(file){
	},

	onLoadAssetAndCompleter(filePath, extname, isUrlType,isScript){
		this.runExtendFunc('onLoadAssetAndCompleter',filePath, extname, isUrlType,isScript)
	},
	
	// 读取资源文件,只在文件初始化时调用该函数
	loadAssetAndCompleter(filePath, extname, isUrlType = false, isCover=true, isSasync = true, finishCallback)
	{
		let isScript = extname == ".js" || extname == ".ts" || extname == ".json";
		if(isScript)
		{
			let fsPath = fe.normPath(  isUrlType ? Editor.remote.assetdb.urlToFspath(filePath)  : filePath );
			if (!fe.isFileExit(fsPath)) return;
			
			let isRead = this.cfg.readCodeMode == 'all' || 
				this.cfg.readCodeMode == 'auto'	&& ( isUrlType || filePath.match(this.REG_EXP_JSON_CONFIG) ) ||		// package.json等配置必加载
				this.cfg.readCodeMode == 'atImportTo' && filePath.match(this.REG_EXP_JSON_CONFIG)  // 加载本地方式

			// console.log("loadAssetAndCompleter: ",filePath,isRead)
			if(isUrlType || isRead)
			{
				let loadFunc = (err,code)=>
				{
					if(err) return Editor.info('读取文件失败:',err);
					if(this._is_destroy) return;
					code = code.toString()
					
					// 更新文件数据用于重命名时修改import路径
					if(this.file_list_map[fsPath]){
						this.file_list_map[fsPath].data = code;
					}
					if(isRead){
						// js的 d.ts提示文件
						// this.monaco.languages.typescript.javascriptDefaults.addExtraLib(code,'lib://model/' + file_name); 
						let vs_model = this.loadVsModel(filePath,extname,isUrlType,false);
						if(isCover || vs_model.getValue() == ''){
							vs_model.setValue(code)
						}
					}
					if(finishCallback) finishCallback();
				}
				
				if(isSasync){
					fe.readFileAsyn(fsPath,loadFunc);
				}else{
					let code = fs.readFileSync(fsPath);
					loadFunc(0,code);
				}
			}else{
				if(finishCallback) finishCallback();
			}
			return true
		}
		this.onLoadAssetAndCompleter(filePath, extname, isUrlType,isScript)
	},

	// 异步加载 vs_model
	loadVsModeAsyn(filePath, extname, isUrlType,isCover,callback){
		let file_type = this.FILE_OPEN_TYPES[extname.substr(1).toLowerCase()];
		if(!file_type) {
			return;
		}
		let fsPath = fe.normPath(  isUrlType ? Editor.remote.assetdb.urlToFspath(filePath)  : filePath );
		if (!fe.isFileExit(fsPath)) {
			return;
		}
		fe.readFileAsyn(fsPath,(err,code)=>{
			if(err) {
				if(callback) callback();
				return Editor.info('读取文件失败:',err);
			}
			if(this._is_destroy ) {
				if(callback) callback();
				return
			};

			code = code.toString()
			
			// 更新文件数据用于重命名时修改import路径
			if(this.file_list_map[fsPath]){
				this.file_list_map[fsPath].data = code;
			}
			let vs_model = this.loadVsModel(filePath,extname,isUrlType,false);
			if(isCover || vs_model.getValue() == ''){
				vs_model.setValue(code)
			}
			if(callback) callback(vs_model);
		});
	},

	// *.d.ts文件里读取自定义代码輸入提示，提供精准代码提示;
	loadVsModel(filePath, extname, isUrlType,isReadText=true) {
		let file_type = this.FILE_OPEN_TYPES[extname.substr(1).toLowerCase()];
		if(file_type)
		{
			let fsPath = fe.normPath(  isUrlType ? Editor.remote.assetdb.urlToFspath(filePath) : filePath );
			if (isReadText && !fe.isFileExit(fsPath)) return;
			let js_text = isReadText ? fs.readFileSync(fsPath).toString() : "";
			let str_uri   = this.fileMgr.fsPathToModelUrl(fsPath)

			// 生成vs model缓存
			let model = this.monaco.editor.getModel(this.monaco.Uri.parse(str_uri)) ;
			if(!model){
				this.tsWr.setEnableUpdateScript(true);
				model = this.monaco.editor.createModel('',file_type,this.monaco.Uri.parse(str_uri))
				model.onDidChangeContent((e) => this.onVsDidChangeContent(e,model));
				model.fsPath = fsPath;
				model.dbUrl  = isUrlType ? filePath : undefined;
			}
			if(isReadText) model.setValue(js_text);
			return model
		}
	},

	

	// tab页左移
	tabToLeft() {
		let ls = this.getTabList();
		let id_ind = -1;

		for (var i = ls.length - 1; i >= 0; i--) {
			let obj = ls[i];
			if (obj._id == this.edit_id) {
				id_ind = i;
				id_ind--;
				if (id_ind < 0) id_ind = ls.length - 1
				let to_id = ls[id_ind]._id;
				this.setTabPage(to_id);
				break;
			}
		}
	},

	// tab页右移
	tabToRight() {
		let ls = this.getTabList();
		let id_ind = -1;

		for (var i = 0; i < ls.length; i++) {
			let obj = ls[i];
			if (obj._id == this.edit_id) {
				id_ind = i;
				id_ind++;
				if (id_ind == ls.length) id_ind = 0;
				let to_id = ls[id_ind]._id;
				this.setTabPage(to_id);
				break;
			}
		}
	},
	
	onSaveFile(fileInfo){
		this.runExtendFunc("onSaveFile",fileInfo);
	},
	
	// 延迟保存修改
	saveFileFromDelayTime(isMandatorySaving = false, isMustCompile = false, id = -1, formatOnSaveFile = true) {
		id = id == -1 ? this.edit_id : id;
		if(this.waitSaveIntervals[id]){
			// 重复保存忽略
			return false;
		}

		// 同个文件0.6s只能保存一次
		this.waitSaveIntervals[id] = true
		this.setTimeoutById(()=>{
			this.waitSaveIntervals[id] = false
		},500,'isWaitSaveCodeInterval'+id);

		// 保存后格式化文档
		if(formatOnSaveFile && this.cfg.formatOnSaveFile){
			this.vs_editor.trigger('anything','editor.action.formatDocument')
			setTimeout(()=>{
				this.saveFile(isMandatorySaving,isMustCompile,id);
			},100)
		}else{
			this.saveFile(isMandatorySaving,isMustCompile,id);
		}

		return true;
	},

	// 保存修改
	saveFile(isMandatorySaving = false, isMustCompile = false, id = -1) {
		id = id == -1 ? this.edit_id : id;
		let file_info = this.edit_list[id];
		if (file_info && file_info.uuid && (file_info.is_need_save || isMandatorySaving)) {
			let edit_text = id == this.edit_id ? this.vs_editor.getValue() : file_info.new_data;
			if (edit_text == null) {
				Editor.error("保存文件失败:", file_info)
				return;
			}

			let is_save = true
			if (file_info.uuid == "outside") {
				fs.writeFileSync(file_info.path , edit_text); //外部文件
			} else {
				if(this.cfg.codeCompileMode == 'save' || isMustCompile){
					is_save = this.saveFileByUrl(file_info.path,edit_text);
				}else{
					fs.writeFileSync(Editor.remote.assetdb.urlToFspath(file_info.path), edit_text);
					// 用于脱离编辑状态后刷新creator
					if(this.refresh_file_list.indexOf(file_info.path) == -1){ 
						this.refresh_file_list.push(file_info.path);
					}
				}
			}
			if(is_save)
			{
				this.is_need_refresh = true;
				file_info.is_need_save = false;
				file_info.data = edit_text;
				file_info.new_data = edit_text;
				this.upTitle(id);
				if(id != 0) this.setLockEdit(true,id);
				this.onSaveFile(file_info);
			}
		}
	},

	saveFileByUrl(url,text)
	{
		Editor.assetdb.saveExists(url, text, (err, meta)=> {
			if (err) {
				fs.writeFileSync(Editor.remote.assetdb.urlToFspath(url), text); //外部文件
				Editor.warn("保存的脚本存在语法错误或是只读文件:",url,err,meta);
			}else{
				// 刚刚保存了，creator还没刷新
				this.is_save_wait_up = 1;
				this.setTimeoutById(()=>{
					this.is_save_wait_up = 0;
				},3000)
			}
		});

		return true;
	},

	// 刷新保存后未编译的脚本
	refreshSaveFild(isRefreshApi = false)
	{
		// 用于脱离编辑状态后刷新creator
		if(this.refresh_file_list.length){
			// Editor.assetdb.refresh(this.refresh_file_list);// 导入保存的代码状态，连续保存会引起报错
			for (let i = 0; i < this.refresh_file_list.length; i++) 
			{
				let url = this.refresh_file_list[i];
				if(isRefreshApi){
					Editor.assetdb.refresh(url);// 导入保存的代码状态，连续保存会引起报错
				}else{
					let text = fs.readFileSync(Editor.remote.assetdb.urlToFspath(url)).toString();
					Editor.assetdb.saveExists(url, text, (err, meta)=> {
						if (err) {
							Editor.warn("保存的脚本存在语法错误:",url,err,meta);
						}
					});
				}
			} 
			this.refresh_file_list.length = 0;
		}
	},

	// 读取文件到编辑器渲染
	readFile(info) {
		let is_lock = info.is_lock;
		let old_file_info = this.file_info;
		this.old_edit_id = this.edit_id;
		this.file_info = info;
		this.edit_id = info.id;
		let text = info.new_data || info.data || "";

		// 初始化载入代码编辑
		this.vs_editor.setModel(info.vs_model);
		if (info.vs_model.getValue() != text) {
			this.vs_editor.setValue(text);
		}

		if (info.selection) {
			this.vs_editor.setSelection(info.selection);
		}else if (info.position) {
			this.vs_editor.setPosition(info.position);
		}
		if (info.scroll_top != null) {
			this.vs_editor.setScrollTop(info.scroll_top)
		}

		// 为了应用 tsconfig.json、package.json 文件配置退出编辑器后需要将其转换成typescript语言进入ts解析器一起参与代码解析功能
		// if(old_file_info.vs_model && old_file_info.file_type == 'json'){
		// 	this.monaco.editor.setModelLanguage(old_file_info.vs_model,"typescript");
		// }
		// // 处于编辑状态下需要切换json文件到json解析器进行json语法解析
		// if(info.vs_model && info.file_type == 'json'){
		// 	this.monaco.editor.setModelLanguage(info.vs_model,"json"); 
		// }

		// 两次切换是为了解决个别时候import路径没刷新报错bug，触发更新编译
		this.monaco.editor.setModelLanguage(this.vs_editor.getModel(),"markdown");
		this.monaco.editor.setModelLanguage(this.vs_editor.getModel(),this.FILE_OPEN_TYPES[info.file_type || ""] || "markdown");

		// 自适应缩进格式
		if(this.cfg.detectIndentation) this.setOptions({detectIndentation:true});

		this.setLockEdit(is_lock);
		this.upTitle();
	},

	// 设置文件标题
	upTitle(id) {
		id = id != null ? id : this.edit_id;
		if (id == null) return Editor.warn("没有标题id");
		let info = this.edit_list[id] || {};

		let tabBg = this.getTabDiv(id);
		if (tabBg) {
			let title = tabBg.getElementsByClassName("tabTitle")[0];
			title.textContent = (info.is_need_save ? info.name + "* " : info.name || "无文件");
			title.setAttribute('style',info.is_lock || id == 0 ? 'font-style:normal;' : 'font-style:italic;');
			title.title = info.path;
		} else {
			Editor.warn(id)
		}
	},

	// 获得新页面可用的页码
	getNewPageInd(isIncludesInitPage = false, isIncludesInitNeedSave = true) {
		for (var i = isIncludesInitPage ? 0 : 1; i < 100; i++) {
			let tabBg = this.getTabDiv(i);
			if (!tabBg || !this.edit_list[i] || (!this.edit_list[i].is_need_save && isIncludesInitNeedSave)) {
				return i;
			}
		}
	},

	getTabDiv(id) {
		if (id == null) return;
		for (var i = 0; i < this.$tabList.children.length; i++) {
			let obj = this.$tabList.children[i]
			if (obj._id == id) {
				return obj;
			}
		}
	},

	getTabList() {
		let list = [];
		for (var i = 0; i < this.$tabList.children.length; i++) {
			let obj = this.$tabList.children[i]
			if (obj._id != null) {
				list.push(obj);
			}
		}
		return list;
	},

	// 获得页面id
	getTabIdByUuid(uuid) {
		for (var i = 0; i < this.edit_list.length; i++) {
			let v = this.edit_list[i];
			if (v && v.uuid == uuid) {
				return i;
			}
		}
	},

	// 获得页面id
	getTabIdByPath(url_path) {
		for (var i = 0; i < this.edit_list.length; i++) {
			let v = this.edit_list[i];
			if (v && v.path == url_path) {
				return i;
			}
		}
	},

	// 获得页面id
	getTabIdByModel(vs_model) {
		for (var i = 0; i < this.edit_list.length; i++) {
			let v = this.edit_list[i];
			if (v && v.vs_model == vs_model) {
				return i;
			}
		}
	},

	// 设置编辑页面信息
	newPageInfo(id, uuid, path, name, file_type, data, is_not_draw = false, is_need_save = false, is_lock = false) {
		let file_info = this.edit_list[id] = this.edit_list[id] || {};
		
		this.defind_model.setValueNotUndo(data);
		data = this.defind_model.getValue(); // model内部会转换掉特特殊换行符号，导致与原先本文不匹配
		path = path.replace(/\\/g,'/');
		file_info.uuid = uuid;
		file_info.path = path;
		file_info.data = data;
		file_info.new_data = data;;
		file_info.name = name;
		file_info.file_type = file_type;
		file_info.is_need_save = is_need_save;
		file_info.is_lock = is_lock;
		file_info.enabled_close = true;
		file_info.scroll_top = this.file_cfg[path] && this.file_cfg[path].scroll_top;
		file_info.id = id;
		file_info.can_remove_model = 0;
		file_info.position = undefined;
		file_info.selection = undefined;
		if (!file_info.vs_model) 
		{
			let vs_model = this.loadVsModel(path, this.fileMgr.getUriInfo(path).extname , uuid != "outside",is_not_draw);
			if(!vs_model) {
				delete this.edit_list[id];
				Editor.warn("<代码编辑>读取文件失败:",path);
				return;
			};
			file_info.vs_model = vs_model; // vs tab标签数据
		}

		this.newTabDiv(id)
		this.upTitle(id)
		if (!is_not_draw) this.setTabPage(id, true);

		return file_info
	},

	// 新页面tab
	newTabDiv(id) {
		let tabBg = this.getTabDiv(id);
		if (tabBg) return tabBg;

		tabBg = this.$title0.cloneNode(true);
		tabBg.id = "title" + id;
		tabBg.hidden = false;
		tabBg.style.display = 'block'
		this.$tabList.appendChild(tabBg);

		// 切换标题
		tabBg._id = id;
		tabBg.addEventListener('click', (e) => {
			e.preventDefault();
			this.setTabPage(tabBg._id);
			setTimeout(()=> this.vs_editor.focus(),1)
		})
		
		// 鼠标右键事件
		tabBg.addEventListener('contextmenu', (e) => {
			if(!this.menu) return;
			e.preventDefault();
			this.menu.currTabId = tabBg._id;
			// 处于焦点时才能调用
			if(electron.remote.BrowserWindow.getFocusedWindow()){ 
				this.menu.popup()
			}
		})

		// 移动tab事件
		tabBg.addEventListener('mousedown', (e) => {
			this.currTabDiv = tabBg;
		});

		// 移动tab事件
		tabBg.addEventListener('mouseup', (e) => {
			// console.log("moveup:",id,e)
			if(!this.currTabDiv || this.currTabDiv == tabBg) return;

			let rectB = tabBg.getBoundingClientRect()
			if(e.clientX>rectB.left && e.clientX<rectB.right){
				let rectA = this.currTabDiv.getBoundingClientRect()
				rectA.left > rectB.left ? this.$tabList.insertBefore(this.currTabDiv,tabBg) : this.$tabList.insertBefore(this.currTabDiv,tabBg.nextSibling)
			}
			delete this.currTabDiv;
		})
		
		
		// 关闭页面
		tabBg.getElementsByClassName("closeBtn")[0].addEventListener('click', () => {
			this.closeTab(tabBg._id);
		});

		return tabBg;
	},

	setWaitIconActive(isActive){
		if(this.$waitIco){
			
			this.$waitIco.className = isActive ? 'turnAnim' : '';
		}
	},

	// 关闭页面tab
	closeTab(id) {

		let tabBg = this.getTabDiv(id);
		let file_info = this.edit_list[id];
		if (tabBg == null || !file_info.enabled_close) return;//Editor.info("不存在页面:"+id);

		if (!file_info.can_remove_model && file_info.is_need_save && !confirm(file_info.path + " 文件被修改是否丢弃修改?")) return;

		// 记录本次打开位置
		let file_name = this.edit_list[id].path
		let file_log = this.file_cfg[file_name] = this.file_cfg[file_name] || {}
		file_log.scroll_top = this.edit_list[id].vs_model == this.vs_editor.getModel() ? this.vs_editor.getScrollTop() : this.edit_list[id].scroll_top;

		// 清除页面
		if(file_info.vs_model) {
			file_info.vs_model._commandManager.clear();// 清除撤销记录
			if(file_info.is_need_save){ 
				file_info.vs_model.setValue(file_info.data)// 撤销到修改前
			}
			if(file_info.can_remove_model){
				file_info.vs_model.dispose();
			}
		}
		delete this.edit_list[id];
		tabBg.parentNode.removeChild(tabBg);

		if (id == this.edit_id) {
			if(this.old_edit_id != null && this.getTabDiv(this.old_edit_id)){
				// 切换到上次打开的tab
				this.setTabPage(this.old_edit_id);
			}else{
				// 切换到最后存在的页面
				for (var i = id - 1; i >= 0; i--) {
					if (this.edit_list[i]) {
						this.setTabPage(i);
						break;
					}
				}
			}
		}
	},

	// 关闭未修改的标签
	closeUnmodifiedTabs() {
		// 高亮选中
		let list = this.getTabList()
		for (let i = 0; i < list.length; i++) {
			let tabBg = list[i]
			let file_info = this.edit_list[tabBg._id];
			if (!file_info.is_need_save && file_info.enabled_close && !file_info.is_lock) this.closeTab(tabBg._id)
		}
	},

	// 切换编辑tab页面
	setTabPage(id, is_new_page = false) {
		if (!this.getTabDiv(id)) return;
		let old_id = this.edit_id;

		// 高亮选中
		let list = this.getTabList()
		for (var i = 0; i < list.length; i++) {
			let tabBg = list[i];
			tabBg.className = id == tabBg._id ? "openTab" : "closeTab";
		}

		if (this.edit_id != 0 && this.edit_list[this.edit_id]) {
			// 记录切换页面前编辑的数据
			this.edit_list[this.edit_id].new_data = this.vs_editor.getValue();
			this.edit_list[this.edit_id].scroll_top = this.vs_editor.getScrollTop()
		}

		this.upTitle(id)
		this.readFile(this.edit_list[id]);
		this.vs_editor.updateOptions({ lineNumbers: this.cfg.is_cmd_mode || this.edit_id != 0 ? "on" : 'off' });
		if(this.is_init_finish) {
			this.onSwitchTab(old_id,id);
		}
		return this.edit_list[id];
	},

	// 打开外部文件
	openOutSideFile(filePath, isShow = false) {
		return this.openFile(this.fileMgr.getFileUrlInfoByFsPath(filePath),isShow);
		// this.setLockEdit(is_lock);
	},

	// 打开文件到编辑器
	openFileByUrl(url, isShow) {
		let uuid = Editor.remote.assetdb.urlToUuid(url);
		if(uuid){
			return this.openFile(this.fileMgr.getFileUrlInfoByUuid(uuid),isShow);
		}
	},


	// 打开文件到编辑器
	openFile(info, isShow) {
		if (info == null || !this.FILE_OPEN_TYPES[info.file_type]) {
			return false
		}

		// 初始化载入代码编辑
		let id = info.uuid == "outside" ? this.getTabIdByPath(info.path) : this.getTabIdByUuid(info.uuid);
		if (id == null) {
			let file_info = this.newPageInfo(this.getNewPageInd(false, false), info.uuid, info.path, info.name, info.file_type, info.data, this.file_info.is_lock && !isShow);
			return file_info;
		} else if (!this.file_info.is_lock || isShow) {
			return this.setTabPage(id)
		}
	},

	// 打开node上的文件到编辑器
	openActiveFile(isShow,isCloseUnmodifiedTabs = true) {
		if(!this.isInitEditorScene){
			return ;
		}
		
		// 获得当前焦点uuid的信息
		Editor.Scene.callSceneScript('simple-code', 'get-active-uuid', "", (err, event) => {
			if (!event) {
				return
			};

			if(!isShow)
			{
				// 删除已经显示uuid
				for (var i = event.uuids.length - 1; i >= 0; i--) {
					let uuid = event.uuids[i]
					if (err || event && this.getTabIdByUuid(uuid)) { // 已经打开同个文件
						event.uuids.splice(i, 1);
						continue;
					}
				}
			}

			// 打开文件tab
			let ld_list = [];
			let act = Editor.Selection.curGlobalActivate()
			for (let i = 0; i < event.uuids.length; i++) 
			{
				const uuid = event.uuids[i];
				const info = this.fileMgr.getFileUrlInfoByUuid(uuid);
				if(act.type != 'node' || !config.vsEditorConfig.ignoreAutoOpenFile || !path.basename(info.path).match(new RegExp(config.vsEditorConfig.ignoreAutoOpenFile)))
				{
					let file_info = this.openFile(info, isShow);
					if (file_info) {
						file_info._is_lock = file_info.is_lock;
						file_info.is_lock = true
						ld_list.push(file_info);
					}
				}
			}
			
			// 关闭未锁定的文件
			if(act && act.id && (isCloseUnmodifiedTabs || ld_list.length == 0)) this.closeUnmodifiedTabs();

			for (let i = 0; i < ld_list.length; i++){
				ld_list[i].is_lock = ld_list[i]._is_lock;
				delete ld_list[i]._is_lock;
			}
			// // 打开备忘录
			// if (ld_list.length == 0 == null && !isShow) {
			// 	this.oepnDefindFile();
			// }

		}, -1)
	},


	// 打开默认的备忘录、命令行文本
	oepnDefindFile() {

		// 没有备忘录就先复制一个
		let filePath = this.MEMO_FILE_PATH;
		if (!fe.isFileExit(filePath)) {
			let template = ''
			if(fe.getLanguage() == 'zh'){
				template =  "packages://simple-code/template/readme-zh.md"
			}else{
				template =  "packages://simple-code/template/readme-en.md"
			}
			fe.copyFile(Editor.url(template), filePath);
		}

		// 已经打开过了
		if (this.file_info.path == filePath) {
			return;
		}

		// 切换模式前先保存备忘录
		if(this.edit_list[0] && this.edit_list[0].path != filePath) {
			this.saveFile(false,false,0); 
		}

		let info = this.fileMgr.getFileUrlInfoByFsPath(filePath)
		if(!this.edit_list[0] || this.edit_list[0].name != info.name)
		{
			this.newPageInfo(0, 
				info.uuid,
				info.path,
				info.name,
				info.file_type, 
				info.data, 
				this.file_info.is_lock);

			// x不显示
			this.edit_list[0].enabled_close = false
			this.getTabDiv(0).getElementsByClassName("closeBtn")[0].hidden = true;
		}else{
			this.openOutSideFile(filePath, !this.file_info.is_lock);
		}

		// 清除撤销记录
		this.edit_list[0].vs_model._commandManager.clear();
	},

	// 检测是否存在需要import的路径，以及检查js/ts解析器进程是否处于空闲状态
	upNeedImportListWorker(callback,timeOut=500)
	{
		// let isIdleJs = false;
		let isTimeOut = false;
		let timeoutId ; 
		// 超时检查
		timeoutId = setTimeout(()=>{
			isTimeOut = true;
			if(callback) callback(false); 
		},timeOut);
		
		// 转圈圈动画
		let timeoutAnimId ; 
		timeoutAnimId = setTimeout(()=>{
			timeoutAnimId = null;
			this.setWaitIconActive(true);
		},50);

		let loadImportPath ;
		loadImportPath = async (needImportPaths)=>
		{
			let isEmpty = fe.isEmptyObject(needImportPaths)
			if(isEmpty)
			{
				// 性能优化: 允许继续刷新代码缓存
				this.setEnableUpdateTs(true)
				// 转圈圈动画
				this.setWaitIconActive(false);
				if(timeoutAnimId) clearTimeout(timeoutAnimId);
				timeoutAnimId = null

				if(isTimeOut || timeoutId==null){
					return; // 已超时的回调
				}else{
					clearTimeout(timeoutId);
					timeoutId = null
					if(callback) callback(true);// 准时回调
				}
			}else
			{
				await this.fileMgr.loadNeedImportPathsAsync(needImportPaths);
				if(!isTimeOut){
					setTimeout(50,()=>{
						this.tsWr.getNeedImportPaths().then(loadImportPath);
					})
				}
			}
		}

		// 调用进程,检测是否空闲
		this.tsWr.getNeedImportPaths().then(loadImportPath);
	},

	// 自动刷新代码缓存开关
	setEnableUpdateTs(enable){
		if(!enable){
			this.tsWr.setEnableUpdate(enable);
			this.stopTimeoutById('enableUpdateTs')
		}else if(this.enableUpdateTs != enable)
		{
			this.setTimeoutById(async ()=>{
				let enab = await this.tsWr.isEnableUpdate()
				if(!enab){
					// 空闲时刷新代码缓存信息
					this.tsWr.setEnableUpdate(enable);
					this.upCompCodeFile();
				}
			},1000,'enableUpdateTs')
		}
		this.enableUpdateTs = enable;
	},

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
	},


	isFocused(){
		return Editor.Panel.getFocusedPanel() == Editor.Panel.find('simple-code');
	},

	isHasOpenSceneWindow(){
		return this.isInitEditorScene;
	},

	// 调用原生JS的定时器,统一管理定时器,统一释放
	setTimeoutById(func,time,id='com') 
	{
		// 之前有定时器先停掉
		if(this.timer_map[id]){
			this.timer_map[id]()
		}
		let headler = setTimeout(()=>{
			if(this.timer_map[id]) this.timer_map[id]()
			this.timer_map[id] = undefined;
			func()
		}, time);
		this.timer_map[id] = ()=>clearTimeout(headler);
		return this.timer_map[id];
	},

	stopTimeoutById(id='com'){
		if(this.timer_map[id]){
			this.timer_map[id]()
			this.timer_map[id] = undefined;
		}
	},

	// 调用原生JS的定时器
	setTimeoutToJS(func, time = 1, { count = -1, dt = time } = {}) {
		// 执行多少次
		if (count === 0) {
			let headler = setTimeout(func, time * 1000);
			return () => clearTimeout(headler);
		} else {
			// 小于0就永久执行
			if (count < 0) { count = -1; };//cc.macro.REPEAT_FOREVER
			let headler1, headler2;
			headler1 = setTimeout(() => {
				let i = 0;
				let funcGo = function () {
					i++;
					if (i === count) { clearInterval(headler2); }
					func();
				}
				// 小于0就永久执行
				if (count < 0) { funcGo = function () { func() } }
				headler2 = setInterval(funcGo, time * 1000);
				funcGo();
			}, dt * 1000);
			return () => {
				clearTimeout(headler1);
				clearInterval(headler2);
			}
		}
	},

	
	// 窗口获得焦点
	onFocus(){
		// 回调前台刷新需要监听的文件状态
		this.fileMgr.checkWatch();
	},

	// 窗口失去焦点
	onBlur(){

	},

	// 正在切换页面标签栏
	onSwitchTab(oldEditId = -1,newEditId){

	},

	// 页面关闭
	onDestroy() {

	},

	messages: {
	}
};
module.exports = layer;
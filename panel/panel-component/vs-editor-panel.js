/**
 * 1.管理vscode编辑器对象
 * 2.管理文件资源
 */

const tools = Editor.require('packages://simple-code/tools/tools.js');
const fe 	= Editor.require('packages://simple-code/tools/FileTools.js');
const fs 	= require('fs');
const config = Editor.require('packages://simple-code/config.js');
const path 	= require("fire-path");
const exec 	= require('child_process').exec;
const md5 	= require('md5');
const { isArray } = require('../../monaco-editor/dev/vs/editor/editor.main');
const eventMgr 	= require('../../tools/eventMgr');
const fileMgr 	= require('./vs-editor-file-mgr');

const prsPath = Editor.Project && Editor.Project.path ? Editor.Project.path : Editor.remote.projectPath;

let layer = 
{
	SEARCH_SCORES : { ".fire": 100, ".prefab": 90 },
	// 主题文件位置
	THEME_DIR 	   : Editor.url("packages://simple-code/monaco-editor/custom_thems/"),
	// .d.ts 通用代码提示文件引入位置
	TS_API_LIB_PATHS : [prsPath,Editor.url('packages://simple-code/template/api_doc')],
	// 备忘录位置
	MEMO_FILE_PATH : prsPath + path.sep + "temp" + path.sep + "备忘录.md",
	CMD_FILE_PATH : prsPath + path.sep + "temp" + path.sep + "commandLine.js",
	// 下拉框 过滤文件类型 
	SEARCH_BOX_IGNORE: {},//{".png":1,".jpg":1}
	// 忽略文件
	IGNORE_FILE: ["png", "jpg", "zip", "labelatlas", "ttf", "mp3", "mp4", "wav", "ogg", "rar", 'fire', 'prefab', 'plist'],
	// 打开文件格式对应的类型
	FILE_OPEN_TYPES: { md: "markdown", js: "typescript", ts: "typescript", effect: "yaml", coffee: "coffeescript", lua: "lua", sql: "mysql", php: "php", xml: "xml", html: "html", css: "css", json: "json", manifest: "typescript", plist: "xml", gitignore: "gitignore", glsl: "glsl",text:"markdown",txt:"markdown",c:"c",cpp:"cpp",h:"cpp" },

	// 启动事件
	initVsEditor(callback) 
	{
		this.timer_map 			= {};
		this.file_list_buffer  	= this.file_list_buffer || [];
		this.file_list_map 	  	= this.file_list_map || {};
		this.fileMgr 			= new fileMgr(this);

		this.initVsCode(() => {
			this.initEditorData();
			this.fileMgr.initFileListBuffer(()=>{
				this.initEditorEvent();
				this.initCustomCompleter();
				this.initSceneData(callback);
			});
		});
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

		const vsLoader = Editor.require('packages://simple-code/monaco-editor/dev/vs/loader.js');
		// vs代码路径
		vsLoader.require.config({ 'vs/nls': { availableLanguages: { '*': 'zh-cn' } }, paths: { 'vs': Editor.url('packages://simple-code/monaco-editor/dev/vs', 'utf8') } });
		// 创建vs编辑器，api参考 monaco.d.ts文件
		vsLoader.require(['vs/editor/editor.main'], () => 
		{
			this.monaco = Editor.monaco = Editor.monaco || monaco;
			config.vsEditorConfig.language = 'javascript';  // 预热 typescript模块。json、javascript脚本统一交给typescript解析器一起解析，方便混合编码
			config.vsEditorConfig.value = ``
			var editor = monaco.editor.create(this.$editorB,config.vsEditorConfig);

			Editor.monaco.vs_editor = this.vs_editor = editor;
			eventMgr.merge(this.monaco); // 添加事件分发函数

			for (const key in config.compilerOptions) {
				const v = config.compilerOptions[key];
				monaco.languages.typescript.typescriptDefaults._compilerOptions[key] = v;
			}
			monaco.languages.typescript.typescriptDefaults.setCompilerOptions(monaco.languages.typescript.typescriptDefaults._compilerOptions);
			monaco.editor.setTheme("vs-dark-ex")
			setTimeout(()=>
			{
				monaco.editor.setModelLanguage(this.vs_editor.getModel(), "typescript"); // 预热 typescript模块
				monaco.languages.typescript.getTypeScriptWorker().then((func)=>{func().then((tsWr)=>{
					this.tsWr = tsWr;// ts文件静态解析器
					this.tsWr.getEditsForFileRename('inmemory://model/1','inmemory://model/2');// 预热模块
					// if(this.tsWr && this.jsWr){
						callback();
					// }
				})})
				// monaco.languages.typescript.getJavaScriptWorker().then((func)=>{func().then((jsWr)=>{
				// 	this.jsWr = jsWr;// js文件静态解析器
				// 	this.jsWr.getEditsForFileRename('inmemory://model/1','inmemory://model/2')// 预热模块
				// 	if(this.tsWr && this.jsWr){
				// 		callback();
				// 	}
				// })})
			},100)
		})
	},

	// 更新游戏项目文件列表缓存
	initFileListBuffer(callback) {
		if (this.file_list_buffer && this.file_list_buffer.length != 0) {
			if(callback) callback();
			return ;
		};

		// 重复检测直到资源读取成功
		// let schId = this.setTimeoutToJS(() => this.initFileListBuffer(()=>{
		// 	// if(callback) 
		// 	// {
		// 	// 	let temp = callback;
		// 	// 	callback = null;
		// 	// 	temp();
		// 	// }
		// }), 1.5, { count: 0 });
		Editor.assetdb.queryAssets('db://**/*', '', (err, results)=> {
			if(this.file_list_buffer && this.file_list_buffer.length >0) return;
			
			for (let i = 0; i < results.length; i++) 
			{
				let result = results[i];
				let info = this.getUriInfo(result.url);
				if (info.extname != "" && this.SEARCH_BOX_IGNORE[info.extname] == null) 
				{
					let name = info.name;
					result.extname = info.extname
					let item_cfg = this.newFileInfo(result.extname, name, result.url, result.uuid,result.path)
					this.file_list_buffer.push(item_cfg);
					this.file_list_map[fe.normPath( result.path )] = item_cfg;
					this.file_counts[result.extname] = (this.file_counts[result.extname] || 0) + 1
				}
			}

			this.sortFileBuffer();
			if(callback && this.file_list_buffer.length > 0) 
			{
				let temp = callback;
				callback = null;
				// schId()
				// schId = null;
				temp();
			}
	   });
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
		let filePath = this.THEME_DIR + name + ".json"
		if (fe.isFileExit(filePath)) {
			let data = fs.readFileSync(filePath).toString();
			this.monaco.editor.defineTheme(name, JSON.parse(data));
		}
		this.monaco.editor.setTheme(name);
	},

	// 设置选项
	setOptions(cfg,isInit) 
	{	
		if(cfg.enabledMinimap != null){
			cfg.minimap = {enabled :cfg.enabledMinimap}
		}
		if (cfg["language"]) {
			this.monaco.editor.setModelLanguage(this.vs_editor.getModel(), cfg['language']);
		}
		if(cfg.theme != null){
			this.setTheme(cfg.theme);
		}
		
		this.vs_editor.updateOptions(cfg);
	},

	// 加载数据
	initEditorData() 
	{
		// tab页面id
		this.edit_id = 0;
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
		// 重命名缓存
		this.code_file_rename_buf = {
			move_files : [],
			cur_count:0,
			is_use :0,
			rename_files_map : {},
			rename_path_map : {},
		}
		// 待刷新的文件url
		this.refresh_file_list = [];
		// 编辑代码提示 配置
		this._comp_cfg_map = {};
		this._comp_cfg = [
		// {
		// 	label: "forEach", //显示的名称，‘奖金’
		// 	insertText: "forEach((v,k)=>{})", //插入的值，‘100’
		// 	kind: 0, //提示的图标
		// 	detail: "遍历" //描述，‘我的常量
		// }
		];

		// 全局配置信息
		this.cfg = config.getLocalStorage();
		// 项目配置信息
		this.pro_cfg = config.getProjectLocalStorage()
		this.cfg.language = null;
		this.file_cfg = this.pro_cfg.file_cfg = this.pro_cfg.file_cfg || {}

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
				config.optionGroups.Main["字体"].items.push({ caption: fontName, value: fontName });
			}
		})
		.catch(err => {
			// console.log(err)
		})
	},

	loadLanguageList()
	{
		let list = monaco.languages.getLanguages()
		for (let i = 0; i < list.length; i++) 
		{
			let language = list[i];
			for (let n = 0; n < language.extensions.length; n++) {
				const ext = language.extensions[n];
				if(this.FILE_OPEN_TYPES[ext.substr(1)] == null){
					this.FILE_OPEN_TYPES[ext.substr(1)] = language.id;
				}
			}
			config.optionGroups.Main["语言"].items.push({ caption: language.id, value: language.id });
		}
	},

	loadThemeList()
	{
		let list = fe.getFileList(this.THEME_DIR,[])
		for (let i = 0; i < list.length; i++) 
		{
			let file = list[i].replace(/\\/g,'/');
			let name = this.getUriInfo(file).name;
			name = name.substr(0,name.lastIndexOf('.'))
			config.optionGroups.Main["主题"].items.push({ caption: name, value: name });
		}
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
					let temp = this.getFileUrlInfoByUuid(uuid);
					let file_info = this.openFile(temp, true);
					if (file_info) {
						this.setLockEdit(true,file_info.id);
					}
					if(info.is_show){
						showId = file_info.id;
					}
				}
			}
			this.openActiveFile();
			if(showId){
				this.setTabPage(showId)
			}
			if(callback) callback()
		},2);
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

	// 綁定事件
	initEditorEvent() {
		let stopCamds = { "scene:undo": 1, "scene:redo": 1, };

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
			(document.getElementById("tools") || this).transformTool = "move";
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

		this.vs_editor.onDidChangeCursorSelection((e)=>{
			if(this.file_info && this.file_info.vs_model){
				this.file_info.selection = e.selection;
			}
		});

		// 编译开始
		this.vs_editor.onDidCompositionStart((e)=>{
			this.setWaitIconActive(true);
		});
		
		// 创建view缓存model事件
		this.monaco.editor.onDidCreateModel((model)=>{
			this.upNeedImportListWorker()
		});

		// 删除代码文件 view缓存model
		this.monaco.editor.onWillDisposeModel((model)=>{
			// this.jsWr.deleteFunctionDefindsBuffer(model.uri._formatted);
			this.tsWr.deleteFunctionDefindsBuffer(model.uri._formatted);
			this.upNeedImportListWorker()
		});

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
				
				let isJs = 	this.getUriInfo(model.uri.toString()).extname == '.js'
				let enable = isJs && this.cfg.enabledJsGlobalSugges ||  !isJs && this.cfg.enabledTsGlobalSugges

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
				
				let isJs = 	this.getUriInfo(model.uri.toString()).extname == '.js'
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

		// let getTabNum = (text)=>{
		// 	let tabNum = 0;
		// 	if(text[0] == ' '){
		// 		let findObj = text.match(/[ ]+/);
		// 		tabNum = Math.round(findObj[0].length / options.tabSize)
		// 	}else if (text[0] == '	'){
		// 		let findObj = text.match(/[ ]+/);
		// 		tabNum = findObj[0].length;
		// 	}
		// 	return tabNum;
		// };
		
		// 代码格式化
		// this.monaco.languages.registerDocumentRangeFormattingEditProvider("typescript", {
		// 	provideDocumentRangeFormattingEdits(model , range , options , token){
		// 		// let text = model.getValueInRange(range);
		// 		setTimeout(()=>
		// 		{
		// 			// 1.检测存在同级代码块
		// 			// 2.获得最上级等号位置
		// 			// 3.上级等号位置比变量长则执行对齐，否则以自身为上级等号
		// 			// 4.每一行重复以上步骤
		// 			let getLineInfo = (i)=>
		// 			{
		// 				let text = model.getLineContent(i);
		// 				// 1.检测是否空行
		// 				if(text.match(/\S/) == null){
		// 					return {}
		// 				}
		// 				// 2.检测当前缩进位置
		// 				let _tabNum = this.getTabNum(text);

		// 				// 3.检测是否有等号以及位置
		// 				let findObj = text.match(/([ ]{1,})([:=])/);
		// 				if(findObj){
		// 					let info = {
		// 						tabNum:_tabNum,
		// 						startPos: findObj.index+1,
		// 						charPos: findObj.index+findObj[0].length+1
		// 					}

		// 					return info;
		// 				}
		// 				return {tabNum:_tabNum}
		// 			}

		// 			let up_info = {};
		// 			for (let i = range.startLineNumber-1; i > Math.max(range.startLineNumber-10,0); i--) {
		// 				up_info = getLineInfo(i);
		// 				if(up_info.tabNum != null){
		// 					// 检测不是否空行
		// 					break;
		// 				}
		// 			}

		// 			for (let i = range.startLineNumber; i <= range.endLineNumber; i++) {
		// 				let curr_info = getLineInfo(i);
		// 				if(curr_info.charPos != null)
		// 				{
		// 					// 跟上面某行不是同个缩进级别
		// 					if(curr_info.tabNum != up_info.tabNum || up_info.charPos == null){
		// 						up_info = curr_info
		// 						continue;
		// 					}
		// 					// 检测等号缩进长度
		// 				}
		// 			}

		// 		},50)
		// 		return [];
		// 		// return [{
		// 		// 	text: YourFormatter(model.getValue()) // put formatted text here
		// 		// 	range: model.getFullModelRange()
		// 		// }];
		// 	}
		// })
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
		// 定义的提示功能 getAllSuggests
		let obj   = 
		{provideCompletionItems:  (model, position ,context, token)=> {
			if(model != this.vs_editor.getModel()){
				return {suggestions:[]};
			}
			var p = new Promise( (resolve, reject )=> 
			{
				let offset = model.getOffsetAt(position);
				// 检测是否存在精准的内置代码提示
				this.tsWr.hasCompletionsAtPosition(model.uri.toString(),offset).then((isHasSym)=>
				{	
					let suggestions = []
					let text = model.getLineContent(position.lineNumber);
					let is_has_string = text.indexOf('"') != -1 || text.indexOf("'") !=-1;
					for (let i = 0; i < this._comp_cfg.length; i++) 
					{
						const v = this._comp_cfg[i];
						if(!is_has_string && v.kind == this.monaco.languages.CompletionItemKind.Folder || // 只在字符串中提示文件路径
							isHasSym && v.kind == this.monaco.languages.CompletionItemKind.Reference ){ // 精准提示时不使用模块名提示 
							continue;
						}
						suggestions.push(v)
					}
					
					let retSuggesFunc = ()=>
					{
						for (let i = 0; i < suggestions.length; i++) {
							const v = suggestions[i];
							delete v.range;
							delete v.sortText;
							delete v.preselect;
						}
						resolve( {suggestions,incomplete:false});
					}

					// 全部代码文件的代码提示合集
					let isJs = 	this.getUriInfo(model.uri.toString()).extname == '.js'
					let enable = isJs && this.cfg.enabledJsGlobalSugges ||  !isJs && this.cfg.enabledTsGlobalSugges
					if(enable && this.all_sym_sugges && this.all_sym_sugges.length > 0)
					{
						if(text.match(/[a-zA-Z_$][\w$]{1,30}/) == null)
						{
							// 使用全文件模糊代码提示
							suggestions.push.apply(suggestions,this.all_sym_sugges)
							retSuggesFunc();
						}else{
							if(isHasSym)
							{
								// 存在精准的内置代码提示，不使用模糊代码提示
								retSuggesFunc();
							}else{
								suggestions.push.apply(suggestions,this.all_sym_sugges)
								retSuggesFunc();
							}
						}
					}else{
						if(isJs) this.upAllSymSuggests();
						retSuggesFunc();
					}
				})
				
			})
			return p;
		},
		// 光标选中当前自动补全item时触发动作，一般情况下无需处理
		// resolveCompletionItem(item, token) {
		// 	return null;
		// }
		}
		//Register the custom completion function into Monaco Editor    
		this.monaco.languages.registerCompletionItemProvider('typescript',obj );
		this.monaco.languages.registerCompletionItemProvider('plaintext',obj );

		// 加载所有脚本文件到缓存
		let script_num = 0;
		let read_num = 0;
		for (let i = 0; i < this.file_list_buffer.length; i++) 
		{
			let file_info = this.file_list_buffer[i];
			let isScript = this.loadCompleterLib(file_info.meta, file_info.extname, true, false, true, ()=>{
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
					this.loadCompleterLib(file_path, extname, false, false, false);
				}
			}
		}
	},

	upAllSymSuggests()
	{
		if(!this.cfg.enabledJsGlobalSugges && !this.cfg.enabledTsGlobalSugges){
			return;
		}
		// 防止短时间内大量重复调用
		this.setTimeoutById(()=>
		{
			this.tsWr.getAllSuggests().then((suggeList)=>
			{
				this.all_sym_sugges = suggeList;
			});
		},50,'upAllSymSuggests')
	},

	// 添加自定义代码输入提示, 例子: this.addCustomCompleters(["words","cc.Label"])
	addCustomCompleters(words) {
		words.forEach((v) => {
			this.addCustomCompleter(v);
		});
	},

	// 添加自定义代码提示,例子: this.addCustomCompleter("forEach","forEach((v,k)=>{})","遍历数组")
	addCustomCompleter(word, value, meta, kind, isCover = false) {
		if(word.length <2 || !isNaN(Number(word[0])) ) return;

		// 覆盖信息
		if (isCover && this._comp_cfg_map[word]) {
			let list = this._comp_cfg_map[word];
			list.label = word;
			list.insertText = (value || word);
			list.detail = meta;
			list.kind = kind != null ? kind : this.monaco.languages.CompletionItemKind.Text;
			return list;
		}else{
			if (!this._comp_cfg_map[word] || isCover) {
				this._comp_cfg_map[word] = {
					label: word,
					insertText: (value || word),
					kind: kind != null ? kind : this.monaco.languages.CompletionItemKind.Text,
					insertTextRules: this.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
					// preselect:true,
					detail: meta || ''
				};
				this._comp_cfg.push(this._comp_cfg_map[word]);
				return this._comp_cfg_map[word];
			}
		}
	},

	// 读取vs默认文件代码提示功能,异步读取文件,只在初始化时调用该函数
	loadCompleterLib(filePath, extname, isUrlType = false, isCover=true, isSasync = true, finishCallback){
		let isJs = extname == ".js";
		let isTs = extname == ".ts";
		let file_name = filePath.substr(filePath.lastIndexOf('/') + 1)
		if(isJs || isTs)
		{
			let fsPath = isUrlType ? Editor.remote.assetdb.urlToFspath(filePath) : filePath;
			if (!fe.isFileExit(fsPath)) return;
			// 插入模块名字提示
			let word = file_name.substr(0,file_name.lastIndexOf('.'))
			this.addCustomCompleter(word,word,file_name,this.monaco.languages.CompletionItemKind.Reference);
			
			let isRead = 
				file_name.indexOf('.d.ts') != -1 || // ts提示文件必加载
				this.cfg.readCodeMode == 'all' && isUrlType || // 加载全部文件方式
				this.cfg.readCodeMode == 'auto' && isUrlType && this.file_counts['.js'] > this.file_counts['.ts']  // js文件多则加载全部文件方式，否则按import需求加载
			
			console.log("lib: ",filePath)
			if(isRead)
			{
				let loadFunc = (err,code)=>
				{
					if(err){
						return Editor.info('读取文件失败:',err);
					}
					code = code.toString()
					// js的 d.ts提示文件
					// this.monaco.languages.typescript.javascriptDefaults.addExtraLib(code,'lib://model/' + file_name); 
					let vs_model = this.loadVsModel(filePath,extname,isUrlType,false);
					if(isCover || vs_model.getValue() == ''){
						vs_model.setValue(code)
					}
					if(finishCallback) finishCallback();
				}
				
				if(isSasync){
					fs.readFile(fsPath,loadFunc);
				}else{
					let code = fs.readFileSync(fsPath);
					loadFunc(0,code);
				}
			}else{
				if(finishCallback) finishCallback();
			}
			return true
		}else if(isUrlType){
			// 插入模块文件名提示
			let word = filePath.substr(12,filePath.lastIndexOf('.')-12)
			this.addCustomCompleter(word,word,'',this.monaco.languages.CompletionItemKind.Folder);
		}
	},

	// 项目函数转为全局提示，用于模糊提示;
	loadGlobalFunctionCompleter(file_path,extname,isUrlType){
		let isJs = extname == ".js";
		let isTs = extname == ".ts";
		if(isJs || isTs)
		{
			let fsPath = isUrlType ? Editor.remote.assetdb.urlToFspath(file_path) : file_path;
			let file_name = file_path.substr(file_path.lastIndexOf('/') + 1)
			let model = this.monaco.editor.getModel(this.fsPathToModelUrl(fsPath));
			let js_text = ""
			if(model) js_text = model.getValue();
			else js_text = fs.readFileSync(fsPath).toString();
			
			// 解析出函数列表
			let name_list = tools.getScriptFuncEntrys(js_text);
			for (let i = 0; i < name_list.length; i++) {
				const word = name_list[i];
				if(word.length>2){
					this.addCustomCompleter(word,word,file_name+'内的函数',this.monaco.languages.CompletionItemKind.Function);
				}
			}
			return true;
		}
	},

	// *.d.ts文件里读取自定义代码輸入提示，提供精准代码提示;
	loadVsModel(file_path, extname, isUrlType,isReadText=true) {
		let file_type = this.FILE_OPEN_TYPES[extname.substr(1).toLowerCase()];
		if(file_type)
		{
			let fsPath = isUrlType ? Editor.remote.assetdb.urlToFspath(file_path) : file_path;
			if (isReadText && !fe.isFileExit(fsPath)) return;
			let js_text = isReadText ? fs.readFileSync(fsPath).toString() : "";
			let str_uri   = this.fsPathToModelUrl(fsPath)

			// 生成vs model缓存
			let model = this.monaco.editor.getModel(this.monaco.Uri.parse(str_uri)) ;
			if(!model){
				model = this.monaco.editor.createModel('',file_type,this.monaco.Uri.parse(str_uri))
				model.onDidChangeContent((e) => this.onVsDidChangeContent(e,model));
				model.fsPath = fsPath;
				model.dbUrl  = isUrlType ? file_path : undefined;
			}
			if(isReadText) model.setValue(js_text);
			return model
		}
	},

	fsPathToModelUrl(fsPath){
		let str_uri = Editor.isWin32 ? fsPath.replace(/ /g,'').replace(/\\/g,'/') : fsPath;
		return this.monaco.Uri.parse(str_uri).toString();
	},
	
	fsPathToUrl(fsPath){
		let ind = fsPath.indexOf(prsPath+ path.sep + "assets");
		let str_uri;
		if(ind != -1){
			ind = prsPath.length;
			let _path = fsPath.substr(ind+1);
			str_uri   = 'db://' + (Editor.isWin32 ? _path.replace(/ /g,'').replace(/\\/g,'/') : _path );
		}
		return str_uri;
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
			}
		}
	},

	saveFileByUrl(url,text)
	{
		if(this.code_file_rename_buf && this.code_file_rename_buf.move_files){
			for (let i = 0; i < this.code_file_rename_buf.move_files.length; i++) {
				const assets_info = this.code_file_rename_buf.move_files[i];
				if(url == this.fsPathToUrl(assets_info.srcPath)){
					Editor.info("当前脚本文件路径被移动了,处于同步修改import路径状态中..,完成后才能保存。如果不需要该功能请在设置关闭");
					return false;
				}
			}
		}
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

		// 保存后刷新下
		if(!this.is_save_wait_up){
			this.upAllSymSuggests();
		}
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
			this.refresh_file_list = [];
		}
	},

	// 读取文件到编辑器渲染
	readFile(info) {
		let is_lock = info.is_lock;
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

		// 两次切换是为了解决个别时候import路径没刷新报错bug，触发更新编译
		this.monaco.editor.setModelLanguage(this.vs_editor.getModel(),"markdown");
		this.monaco.editor.setModelLanguage(this.vs_editor.getModel(), this.FILE_OPEN_TYPES[info.file_type || ""] || "markdown");

		// 自适应缩进格式
		if(this.cfg.detectIndentation) this.setOptions({detectIndentation:true});
		// this.editor.selection.clearSelection();

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
		} else {
			Editor.warn(id)
		}
	},

	// 获得新页面可用的页码
	getNewPageInd(isIncludesInitPage = false, isIncludesInitNeedSave = true) {
		for (var i = isIncludesInitPage ? 0 : 1; i < 50; i++) {
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
			let vs_model = this.loadVsModel(path, this.getUriInfo(path).extname , uuid != "outside",is_not_draw);
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
		this.$tabList.appendChild(tabBg);

		// 切换标题
		tabBg._id = id;
		tabBg.addEventListener('click', (e) => {
			this.setTabPage(tabBg._id);
			setTimeout(()=> this.vs_editor.focus(),1)
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

		if (file_info.is_need_save && !confirm(file_info.path + " 文件被修改是否丢弃修改?")) return;

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

		// 切换到最后存在的页面
		if (id == this.edit_id) {
			for (var i = id - 1; i >= 0; i--) {
				if (this.edit_list[i]) {
					this.setTabPage(i);
					break;
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

		// 高亮选中
		let list = this.getTabList()
		for (var i = 0; i < list.length; i++) {
			let tabBg = list[i];
			tabBg.className = id == tabBg._id ? "openTab" : "closeTab";
		}

		if (this.edit_list[this.edit_id]) {
			// 记录切换页面前编辑的数据
			this.edit_list[this.edit_id].new_data = this.vs_editor.getValue();
			this.edit_list[this.edit_id].scroll_top = this.vs_editor.getScrollTop()
		}

		this.upTitle(id)
		this.readFile(this.edit_list[id]);
		this.vs_editor.updateOptions({ lineNumbers: this.cfg.is_cmd_mode || this.edit_id != 0 ? "on" : 'off' });
		return this.edit_list[id];
	},

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
	},

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
	},

	// 打开外部文件
	openOutSideFile(filePath, isShow = false) {
		return this.openFile(this.getFileUrlInfoByFsPath(filePath),isShow);
		// this.setLockEdit(is_lock);
	},

	// 打开文件到编辑器
	openFileByUrl(url, isShow) {
		let uuid = Editor.remote.assetdb.urlToUuid(url);
		if(uuid){
			return this.openFile(this.getFileUrlInfoByUuid(uuid),isShow);
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

	getModelByFsPath(fsPath){
		return this.monaco.editor.getModel(this.fsPathToModelUrl(fsPath))
	},

	
	getModelByUrl(url){
		return this.getModelByFsPath(Editor.remote.assetdb.urlToFspath(url))
	},

	// 打开node上的文件到编辑器
	openActiveFile(isShow,isCloseUnmodifiedTabs = true) {
		// 获得当前焦点uuid的信息
		Editor.Scene.callSceneScript('simple-code', 'get-active-uuid', "", (err, event) => {
			if (!event) {
				return
			};

			if(!isShow)
			{
				for (var i = event.uuids.length - 1; i >= 0; i--) {
					let uuid = event.uuids[i]
					if (err || event && this.getTabIdByUuid(uuid)) { // 已经打开同个文件
						event.uuids.splice(i, 1);
						continue;
					}
				}
			}

			let is_load = null;
			let ld_list = [];
			for (let i = 0; i < event.uuids.length; i++) {
				const uuid = event.uuids[i];
				const info = this.getFileUrlInfoByUuid(uuid);
				let file_info = this.openFile(info, isShow);
				if (file_info) {
					file_info._is_lock = file_info.is_lock;
					file_info.is_lock = true
					ld_list.push(file_info);
				}
			}
			let act = Editor.Selection.curGlobalActivate()
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
		let filePath = this.cfg.is_cmd_mode ? this.CMD_FILE_PATH : this.MEMO_FILE_PATH;
		if (!fe.isFileExit(filePath)) {
			let template = this.cfg.is_cmd_mode ? "packages://simple-code/template/commandLine.md" : "packages://simple-code/template/readme.md";
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

		let info = this.getFileUrlInfoByFsPath(filePath)
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
	},

	// 检查当前文件在外边是否被改变
	checkAllCurrFileChange() {

		// 编辑信息
		this.edit_list.forEach((editInfo) => {
			this.checkCurrFileChange(editInfo)
		})
	},

	// 检测是否存在需要import的路径，以及检查js/ts解析器进程是否处于空闲状态
	upNeedImportListWorker(callback,timeOut=500)
	{
		let isIdleTs = false;
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

		let check = ()=>
		{
			if(!isIdleTs ){
				return; //
			}

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
		}

		let loadImportPath = (needImportPaths)=>{
			let isNull = true
			for(var key in needImportPaths) {isNull = false ; break;}
			if(isNull){
				isIdleTs = true;
				check()
			}else{
				this.loadNeedImportPaths(needImportPaths)
			}
		}

		// 调用进程,检测是否空闲
		this.tsWr.getNeedImportPaths().then((needImportPaths)=>loadImportPath(needImportPaths) );
	},

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
	},
	
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
	},

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
	},
	
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
	},

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
	},

	// 调用原生JS的定时器
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

	// 页面关闭
	onDestroy() {

	},

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
	},

	messages: {
	}
};
module.exports = layer;
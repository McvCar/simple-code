// 代码编辑器窗口
// 编辑功能由 ace Editor 完成,地址: https://github.com/ajaxorg/ace
// 本插件的ace.js文件已做少量改动,升级替换可能会引起问题

const ace = Editor.require('packages://simple-code/ace/ace.js');
const settings_menu = Editor.require('packages://simple-code/ace/ext-settings_menu.js');
const prompt_ex = Editor.require('packages://simple-code/ace/ext-prompt.js');

const tools = Editor.require('packages://simple-code/tools/tools.js');
const fe 	= Editor.require('packages://simple-code/tools/FileTools.js');
const fs 	= require('fs');
const config = Editor.require('packages://simple-code/config.js');
const path 	= require("fire-path");
const exec 	= require('child_process').exec;
const md5 	= require('md5');

const prsPath = Editor.Project && Editor.Project.path ? Editor.Project.path : Editor.remote.projectPath;
const MEMO_FILE_PATH = prsPath + path.sep + "temp" + path.sep + "备忘录.md";
const CMD_FILE_PATH = prsPath + path.sep + "temp" + path.sep + "commandLine.js";
const SCORES = { ".fire": 100, ".prefab": 90 };
// .d.ts 通用代码提示文件引入位置
const TS_API_LIB_PATHS = [prsPath,Editor.url('packages://simple-code/template/api_doc')];
const THEME_DIR 	   = Editor.url("packages://simple-code/monaco-editor/custom_thems/")

let _scripts = [];
let is_hint = false;
let layer = {
	// 下拉框 过滤文件类型 
	SEARCH_BOX_IGNORE: {},//{".png":1,".jpg":1}
	// 忽略文件
	IGNORE_FILE: ["png", "jpg", "zip", "labelatlas", "ttf", "mp3", "mp4", "wav", "ogg", "rar", 'fire', 'prefab', 'plist'],
	// 打开文件格式对应的类型
	FILE_OPEN_TYPES: { md: "markdown", js: "javascript", ts: "typescript", effect: "yaml", coffee: "coffeescript", lua: "lua", sql: "mysql", php: "php", xml: "xml", html: "html", css: "css", json: "json", manifest: "json", plist: "xml", gitignore: "gitignore", glsl: "glsl",text:"markdown",txt:"markdown",c:"c",cpp:"cpp",h:"cpp" },

	style:
		// ace.editorCss +
		fs.readFileSync(Editor.url("packages://simple-code/monaco-editor/dev/vs/editor/editor.main.css"), "utf-8") +
		`

		.turn{
			animation:turn 1s linear infinite;      
		  }
		@keyframes turn{
		0%{-webkit-transform:rotate(0deg);}
		25%{-webkit-transform:rotate(90deg);}
		50%{-webkit-transform:rotate(180deg);}
		75%{-webkit-transform:rotate(270deg);}
		100%{-webkit-transform:rotate(360deg);}
		}

		#gotoFileBtn{height: 15px;width:40;}
		#settingBtn {height: 15px;width:40;}
		#resetBtn {height: 15px;width:40;}
		#editorA {width: 0%;height: 0%;}
		#editorB {overflow:hidden;flex: 1 1 auto;}
		#title {line-height: 15px;}
		#tabList {overflow: hidden;-webkit-transition:all 0.1s;}
		#layoutTab {-webkit-transition:all 0.1s;}
		
		#box {
			display: flex;
			flex-direction: column-reverse;
			width: 100%;
			height: 100%;
		}

		.openTab {
			border-style: inset;
			padding: 0px 1px 0px 1px;
			border-width: 0px 1px 0px 0px;
			background-color : rgb(212, 212, 212);
			color:#1e1e1e;
			float:left;
			display:block;
			user-select:none;
			-webkit-transition:all 0.1s;
		}

		.closeTab {
			border-style: outset;
			padding: 0px 3px 0px 3px;
			border-width: .0px 1px .0px 0px;
			text-align:center ;
			float:left;
			user-select:none;
			cursor:pointer;
			overflow: hidden;
			text-overflow: ellipsis;
			-webkit-transition:all 0.1s;
		}

		.closeBtn {
			color:#FF0000;
			display:inline;
			cursor:crosshair;
			flex: 1;
		}
		.tabTitle {
			display:inline;           
            word-break:keep-all;      /* 不换行 */
            white-space:nowrap;       /* 不换行 */
            overflow:hidden;          /* 内容超出宽度时隐藏超出部分的内容 */
            text-overflow:ellipsis;   /* 当对象内文本溢出时显示省略标记(...) ；需与overflow:hidden;一起使用。*/
			-webkit-transition:all 0.1s;
		}
		.overlay {
			width: 9999px;
			height: 9999px;
			position: absolute;
			top: 0px;
			left: 0px;
			z-index: 10001;
			display:none;
			filter:alpha(opacity=10);
			background-color: #777;
			opacity: 0.1;
			-moz-opacity: 0.1;
		}
	`,

	template: `
			<div id="box">
				<div id="editorA"></div>
				<div id="editorB"></div>
				<div id="layoutTab" class="layout horizontal justified">
					<div id="tabList" class="layout horizontal">
						<i class="icon-doc-text"></i> <span></span> <span></span>
						<div id="waitIco" class="turn">=</div>

						<div id="title0" class="closeTab">
							<div class="tabTitle"><nobr>无文件<nobr></div>
							<div class="closeBtn"><nobr> x <nobr></div>
						</div>

					</div>
					<div id="toolsPanel" class="layout horizontal">
						<ui-checkbox id="lockChk">锁标签</ui-checkbox>
						<ui-checkbox id="lockWindowChk">锁窗</ui-checkbox>
						<ui-checkbox id="cmdMode">调试</ui-checkbox>
						<ui-button id="gotoFileBtn" class="blue">定位</ui-button>
						<ui-button id="settingBtn" class="green">设置</ui-button>
						<ui-button id="resetBtn" class="red">重置</ui-button>
					</div>
				</div>
				<div id="overlay" class="overlay"></div>
			</div>
	`,

	$: {
		lockChk: '#lockChk',
		lockWindowChk: '#lockWindowChk',
		layoutTab: '#layoutTab',
		cmdMode: '#cmdMode',
		settingBtn: '#settingBtn',
		resetBtn: '#resetBtn',
		gotoFileBtn: '#gotoFileBtn',
		editorA: '#editorA',
		editorB: '#editorB',
		title0: '#title0',
		tabList: '#tabList',
		box: '#box',
		waitIco: '#waitIco',
		overlay: '#overlay',
		toolsPanel: '#toolsPanel',
	},

	initAce() {
		ace.config.set("basePath", Editor.url('packages://simple-code/ace/', 'utf8'));
		var editor = ace.edit(this.$editorA);
		editor.setOptions({
			// 默认:false
			wrap: true, // 换行
			autoScrollEditorIntoView: false, // 自动滚动编辑器视图
			enableLiveAutocompletion: true, // 智能补全
			enableSnippets: true, // 启用代码段
			enableBasicAutocompletion: false, // 启用基本完成 不推荐使用
		});

		// 设置主题
		editor.setTheme("ace/theme/monokai");
		// 设置编辑语言
		editor.getSession().setMode("ace/mode/javascript");
		// 设置快捷键模式
		editor.setKeyboardHandler('ace/keyboard/sublime');
		editor.setReadOnly(false);
		editor.getSession().setTabSize(4);
		editor.setShowPrintMargin(false);
		this.editor = editor;
		(this.$editorA).fontSize = '10px';
	},


	initVsCode(callback) {
		// Editor.require('packages://simple-code/tools/promise.prototype.finally').shim();
		if(Promise.prototype.finally == null){
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
			config.vsEditorConfig.language = 'javascript';  // 预热 javascript模块
			config.vsEditorConfig.value = ``
			var editor = monaco.editor.create(this.$editorB,config.vsEditorConfig);

			Editor.monaco.vs_editor = this.vs_editor = editor;
			
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
					if(this.tsWr && this.jsWr){
						callback();
					}
				})})
				monaco.languages.typescript.getJavaScriptWorker().then((func)=>{func().then((jsWr)=>{
					this.jsWr = jsWr;// js文件静态解析器
					this.jsWr.getEditsForFileRename('inmemory://model/1','inmemory://model/2')// 预热模块
					if(this.tsWr && this.jsWr){
						callback();
					}
				})})
			},100)
		})
	},

	// 启动事件
	ready() {
		this.initStart()
		this.initAce();
		this.initVsCode(() => {
			this.initData();
			this.initBindEvent();
			this.initKeybodyCut();
			this.initCustomCompleter();
			this.runExtendFunc("onLoad", this);
			this.initSceneData();
			this.setAutoLayout(Editor.Panel.getFocusedPanel() == this);
			window._panel = this;
		});
	},

	initStart(){
		// 读取配置文件
		this.$title0.hidden 	= true;
		// 读取自动布局信息
		this.parent_dom 		= this; //Editor.Panel.find('simple-code');
		this.layout_dom_flex 	= this.getLayoutDomFlex()
		this.self_flex_per 		= this.getSelfFlexPercent();
		this.timer_map 			= {};
	},

	// 设置选项
	setOptions(cfg,isInit) 
	{
		
		if(!isInit)
		{
			if (cfg.autoLayoutMin != null) {
				this.setAutoLayout(true);
				this.setAutoLayout(false);
			}
			if (cfg.autoLayoutMax != null) {
				this.setAutoLayout(false);
				this.setAutoLayout(true);
			}
		}
		
		if (cfg.newFileType != null) {
			localStorage.setItem("newFileType", cfg.newFileType || "ts");
		}
		if(cfg.tabBarPos != null){
			this.setTabBarPos(cfg.tabBarPos);
		}
		if(cfg.hideToolsBar != null){
			this.$toolsPanel.hidden = cfg.hideToolsBar;
		}
		if(cfg.enabledMinimap != null){
			cfg.minimap = {enabled :cfg.enabledMinimap}
		}
		if (cfg["language"]) {
			this.monaco.editor.setModelLanguage(this.vs_editor.getModel(), vs_cfg['language']);
		}
		if(cfg.theme != null){
			this.setTheme(cfg.theme);
		}
		// vim
		if(cfg.enabledVim != null){
			cfg.enabledVim ? this.initVimMode() : this.destoryVim();
		}
		
		this.vs_editor.updateOptions(cfg);
	},

	destoryVim(){
		if(!this.vim_mode) {
			return
		}
		this.vim_mode.dispose();
		this.vimStatusBar.remove()
		
		delete Editor.monaco.vim_mode;
		delete this.vimStatusBar;
		delete this.vim_mode;
	},

	// 加载vim
	initVimMode(){
		if(this.vim_mode){
			return;
		}
		const VsVim 	= Editor.require('packages://simple-code/monaco-editor/vim/lib/index.js');
		this.vimStatusBar = document.getElementById('vimStatusBar');
		if(this.vimStatusBar) this.vimStatusBar.remove()

		this.vimStatusBar = document.createElement('div')
		this.vimStatusBar.id = 'vimStatusBar'
		const parent 	= document.getElementsByClassName('group console flex-1  style-scope app-status-bar')[0] || document.getElementsByClassName('content')[0] || this.$box; // 确定插入位置
		parent != this.$box && parent.children[0] ?  parent.insertBefore(this.vimStatusBar,parent.children[0]) : parent.appendChild(this.vimStatusBar);


		const vim_mode = VsVim.initVimMode(this.vs_editor, this.vimStatusBar);
		this.VsVim   	= VsVim;
		window.vim_mode = Editor.monaco.vim_mode = this.vim_mode = vim_mode;
	},

 	// 补充缺失的配置，升级版本导致的
	loadDefineMeunCfg(cfg){
		for (const key in config.optionGroups) {
			const groups = config.optionGroups[key];
			for (const k in groups) {
				const option = groups[k];
				if(cfg[option.path] == null && option.defaultValue != null){
					cfg[option.path] = option.defaultValue; // 补充缺失的配置，升级版本导致的
				}
			}
		}
		return cfg;
	},

	// 加载数据
	initData() {
		this.mouse_pos;
		this.mouse_event_closeFunc;
		this.is_init_finish = false;
		// tab页面id
		this.edit_id = 0;
		// 编辑的js文件信息
		this.file_info = {};
		// 编辑tab列表
		this.edit_list = [];
		// 全局快捷键配置
		this.key_cfg = [];
		// 游戏资源路径缓存
		this.file_list_buffer = [];
		// 当前场景所有子节点信息缓存
		this.currSceneChildrenInfo = [];
		// 重命名缓存
		this.code_file_rename_buf = {
			move_files : [],
			cur_count:0,
			is_use :0,
			rename_files_map : {},
			rename_path_map : {},
		}
		// 待刷新的文件url
		// this.refresh_file_list = [];
		// 编辑代码提示 配置
		this._comp_cfg_map = {};
		this._comp_cfg = [{
			label: "forEach", //显示的名称，‘奖金’
			insertText: "forEach((v,k)=>{})", //插入的值，‘100’
			kind: 0, //提示的图标
			detail: "遍历" //描述，‘我的常量
		}];

		// 读取ace配置
		this.cfg = localStorage.getItem("simple-code-config");
		this.cfg = this.cfg ? JSON.parse(this.cfg) : {}; //ace配置
		this.cfg.language = null;
		this.custom_cfg = this.cfg.custom_cfg || {};//自定义配置
		this.custom_cfg.file_cfg_list = this.custom_cfg.file_cfg_list || {}
		this.file_cfg = this.custom_cfg.file_cfg_list[md5(prsPath)] = this.custom_cfg.file_cfg_list[md5(prsPath)] || { 'db://xx': { scroll_top: 0, is_show: 0 } };
		this.self_flex_per = this.cfg.self_flex_per || this.self_flex_per;

		// 搜索历史
		this.search_history = localStorage.getItem("simple-code-search_history");
		this.search_history = this.search_history ? JSON.parse(this.search_history) : []

		this.$cmdMode.checked = this.custom_cfg.is_cmd_mode || false;
		this.loadDefineMeunCfg(this.cfg)
		this.loadThemeList();
		this.loadLanguageList();
		this.loadSysFonts()
		this.setOptions(this.cfg,true);
		this.setLockWindow(this.cfg.is_lock_window);
	},

	// 读取系统字体列表
	loadSysFonts()
	{
		
		let fontList = Editor.require('packages://simple-code/tools/node-font-list-master/index.js');
		fontList.getFonts()
		.then(fonts => {
			for (let i = 0; i < fonts.length; i++) 
			{
				let fontName = fonts[i];
				config.optionGroups.Main["字体"].items.push({ caption: fontName, value: fontName });
			}
			console.log(fonts)
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
				this.FILE_OPEN_TYPES[ext.substr(1)] = language.id;
			}
			config.optionGroups.Main["语言"].items.push({ caption: language.id, value: language.id });
		}
	},

	loadThemeList()
	{
		let list = fe.getFileList(THEME_DIR,[])
		for (let i = 0; i < list.length; i++) 
		{
			let file = list[i].replace(/\\/g,'/');
			let name = this.getUriInfo(file).name;
			name = name.substr(0,name.lastIndexOf('.'))
			config.optionGroups.Main["主题"].items.push({ caption: name, value: name });
		}
	},


	initSceneData() {
		if (!this.file_list_buffer || this.file_list_buffer.length == 0) {
			// 可以读取到文件缓存再初始化
			this.upFileListBuffer();
			return this.setTimeoutToJS(() => this.initSceneData(), 1.5, { count: 0 });
		}

		setTimeout(()=>
		{
			this.oepnDefindFile();
			this.upCurrSceneChildrenInfo();
	
			// 打开历史文件tab列表
			for (const key in this.file_cfg) {
				let info = this.file_cfg[key];
				if (key.indexOf("db://") != -1) {
					let uuid = Editor.remote.assetdb.urlToUuid(key);
					if (!uuid) continue;
					let temp = this.getFileUrlInfoByUuid(uuid);
					let file_info = this.openFile(temp, info.is_show);
					if (file_info) {
						this.setLockEdit(true,file_info.id);
					}
				}
			}
			this.is_init_finish = true;
			this.openActiveFile();
			this.runExtendFunc("initSceneData");
			this.setWaitIconHide(true);
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
			this.jsWr.deleteFunctionDefindsBuffer(model_url);
			this.tsWr.deleteFunctionDefindsBuffer(model_url);
		},1000,'removeModelBuffer');
	},

	// 綁定事件
	initBindEvent() {
		let stopCamds = { "scene:undo": 1, "scene:redo": 1, };

		// 编辑之后
		// this.vs_editor.getModel().onDidChangeContent((e)=> 
		// {  
		// });
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

			// 用于脱离编辑状态后刷新creator
			// if(this.refresh_file_list.length){
			// 	for (let i = 0; i < this.refresh_file_list.length; i++) {
			// 		let url = this.refresh_file_list[i];
			// 		Editor.assetdb.refresh(url);// 导入保存的代码状态
			// 	}
			// 	this.refresh_file_list = [];
			// }
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
			this.setWaitIconHide(false);
		});
		
		// 删除代码文件 view缓存model
		this.monaco.editor.onWillDisposeModel((model)=>{
			this.jsWr.deleteFunctionDefindsBuffer(model.uri._formatted);
			this.tsWr.deleteFunctionDefindsBuffer(model.uri._formatted);
		});

		
		
		let focusPanels = [this.$editorB,this.$tabList];
		for (let i = 0; i < focusPanels.length; i++) {
			const dom = focusPanels[i];
			dom.addEventListener('focus',(e)=>{
				this.setAutoLayout(true)
			},true);
		}

		this.addEventListener('blur',(e)=>{
			setTimeout(()=>{
				let panel = Editor.Panel.getFocusedPanel()
				let is_need_close = this.isSameGroupPanel(panel);
				if(is_need_close){
					this.setAutoLayout(panel == this)
				}
			},10)
		},false);

		// 保存
		this.$settingBtn.addEventListener('confirm', () => {
			// if (this.file_info) this.saveFile(true);
			this.openMenu()
		});

		// 重置
		this.$resetBtn.addEventListener('confirm', () => {
			if (this.file_info) {
				let text = this.checkCurrFileChange(this.file_info);
				if (this.file_info.data != this.vs_editor.getValue()) {
					if (text) {
						this.vs_editor.setValue(text);
						this.file_info.is_need_save = false;
						this.file_info.data = text;
						this.upTitle();
					}
				}
				if (!text) {
					this.file_info.uuid = null; // 文件已被删除
					this.file_info.is_need_save = false;
					this.oepnDefindFile();
				}
			}
		});

		// 定位文件
		this.$gotoFileBtn.addEventListener('confirm', () => {
			if (this.file_info) {
				Editor.Ipc.sendToAll('assets:hint', this.file_info.uuid);
			}
		});

		// 锁定编辑
		this.$lockChk.addEventListener('change', () => {
			this.setLockEdit(this.$lockChk.checked ? true : false);
		});

		// 锁定窗口
		this.$lockWindowChk.addEventListener('change', () => {
			this.setLockWindow(this.$lockWindowChk.checked ? true : false);
		});
		
		// 命令模式
		this.$cmdMode.addEventListener('change', () => {
			this.custom_cfg.is_cmd_mode = this.$cmdMode.checked ? true : false;
			this.setCmdMode(this.custom_cfg.is_cmd_mode);
		});

		// 设置面板改变的时候
		this.editor.on("setOption", (e) => {
			this.setOptions({ [e.name]: e.value });
		});


		// 读取拖入的文件
		this.$editorB.ondragover = function(e){
			e.preventDefault();
		}
		this.$editorB.addEventListener('dragover',(e)=>{
			// if(e.dataTransfer.files[0]){
				e.preventDefault();
				e.stopPropagation();
			// }
		},false)
		
		
		let mousemove = (e)=>{
			this.mouse_pos = {y:e.clientY,x:e.clientX}
		}
		document.addEventListener('mousemove',mousemove,true)
		this.mouse_event_closeFunc = ()=>{
			document.removeEventListener('mousemove',mousemove,true)
		}

		// 读取拖入的文件
		this.$editorB.addEventListener('drop',(e)=>{
			var fileObj = e.dataTransfer.files[0];
			if(fileObj && this.openOutSideFile(fileObj.path,true))
			{
				e.preventDefault();
			}else{
				Editor.log('暂不支持该文本类型');
			}
		},false)

		// 关闭页面提示
		let _this = this
		window.addEventListener("beforeunload", function (e) {
			_this.onDestroy(e);
		}, false);

		// 检测窗口改变大小调整
		this.schFunc = this.setTimeoutToJS(() => {
			// 本窗口已被删除
			if(this.parentElement == null)
			{
				_this.onDestroy();
				return;
			}
			
			// 正在播放中过渡特效中
			if(this.layout_dom_flex && this.layout_dom_flex.style['-webkit-transition']){
				return;
			}
			
			if (this.is_init_finish && this.upLayout()){
				let rate = this.getSelfFlexPercent();
				if(Math.abs(rate*100-this.cfg.autoLayoutMin) > 3){
					this.self_flex_per = rate;
				}
			}

			let panel = Editor.Panel.getFocusedPanel() 
			let is_self = panel == this && !this.comparisonParentDom(this.$toolsPanel,this._focusedElement);
			let is_need_close = this.isSameGroupPanel(panel);
			if(is_self || is_need_close){
				this.setAutoLayout(is_self)
			}
		}, 0.5);

		// 转跳定义
		this.monaco.languages.registerDefinitionProvider("javascript", {
			provideDefinition:  (model, position, token)=> 
			{
				let wordInfo = model.getWordAtPosition(position);
				if(wordInfo)
				{
					this.is_not_select_active = 1;
					this.setTimeoutById(()=>{
						this.is_not_select_active = 0;
					},1000,'defindToNode')
					Editor.Scene.callSceneScript('simple-code', 'hint-node', wordInfo.word);
				}
				// 可以使用 ajax 去取数据，然后 return new Promise(function (resolve, reject) { ... })
				var p = new Promise( (resolve, reject )=>
				{
					if(!wordInfo){
						return resolve([]);
					}
					this.jsWr.getFunctionDefinds(wordInfo.word).then((hitnMap)=>
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
		this.monaco.languages.registerHoverProvider("javascript", {
			provideHover:  (model, position, token)=> {
				let wordInfo = model.getWordAtPosition(position);
				
				var p = new Promise( (resolve, reject )=>{
					if(wordInfo){
						this.jsWr.getFunctionDefindHover(wordInfo.word,model.uri._formatted).then((text)=>
						{
							text = text || '';
							let toInd = text.indexOf('\n');
							if(toInd != -1){
								text = text.substr(0,toInd);
							}
							resolve({
								contents: [{ 
									isTrusted: false,
									supportThemeIcons:true,
									value: text,
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
		// this.monaco.languages.registerImplementationProvider("javascript",{provideImplementation: function (model,position, token) {
		// 	return Promise.resolve([{
		// 		// contents: [ {isTrusted:true, value: 'hello world' } ],
		// 		range: { startLineNumber:1, startColumn:1, endLineNumber: 1, endColumn: 1 },
		// 		uri: monaco.Uri.parse('file://model/fn.js'),
		// 	}]);
		// }})

		// 编辑器内部链接操作
		// this.monaco.languages.registerLinkProvider("javascript",{provideLinks: function (model, token) {
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

	comparisonParentDom(parentDom,domNode){
		if (domNode == null) return false;

		if(parentDom == domNode)
			return true
		else if(domNode.parentElement)
			return this.comparisonParentDom(parentDom,domNode.parentElement)
		else
			return false;
	},

	// 是同一组垂直的面板
	isSameGroupPanel(panel)
	{
		if(panel == null) return false;

		let flexs = this.getFlexs();
		for (const i in flexs) {
			const flexInfo = flexs[i];
			if(flexInfo.dom != this.layout_dom_flex){
				let isHas = this.comparisonParentDom(flexInfo.dom,panel);
				if(isHas){
					return true;
				}
			}	
		}
		return false;
	},

	// 设置展开面板或收起来
	setAutoLayout(is_focused)
	{
		if(this.cfg.is_lock_window) 
			return;
		this.getLayoutDomFlex();
		let now_flex = this.layout_dom_flex && this.layout_dom_flex.style.flex;
		if(!this.cfg.autoLayoutMin || now_flex == null || (this.old_focused_state != null && this.old_focused_state == is_focused)){
			return;
		}
		this.old_focused_state = is_focused;

		// 焦点改变时修改布局
		let my_per = is_focused ? (this.cfg.autoLayoutMax ? this.cfg.autoLayoutMax * 0.01 : this.self_flex_per) : this.cfg.autoLayoutMin*0.01; // 调整窗口缩放比例
		let max_per = 1
		let sub_per = max_per-my_per;
		let ohter_height = 0
		let flexs = this.getFlexs();
		
		for (const i in flexs) {
			const flexInfo = flexs[i];
			if(flexInfo.dom != this.layout_dom_flex){
				ohter_height += Number(flexInfo.flex[0])
			}
		}

		for (const i in flexs) 
		{
			const flexInfo = flexs[i];
			if(this.cfg.autoLayoutDt){
				
				flexInfo.dom.style['-webkit-transition']='flex '+this.cfg.autoLayoutDt+"s ease "+(this.cfg.autoLayoutDelay || '0')+'s'
			}
			if(flexInfo.dom != this.layout_dom_flex)
			{
				let per = Number(flexInfo.flex[0])/ohter_height;//占用空间百分比
				let oth_per = per*sub_per;
				flexInfo.dom.style.flex = oth_per+' '+ oth_per+' '+' 0px'
			}else{
				flexInfo.dom.style.flex = my_per+' '+ my_per+' '+' 0px'
			}
		}
		
		let actEnd = ()=>
		{
			this.layout_dom_flex.removeEventListener("transitionend", actEnd);
			for (const i in flexs) 
			{
				const flexInfo = flexs[i];
				flexInfo.dom.style['-webkit-transition'] = '';//清除过渡动画
			}
			this.$overlay.style.display = "none";
			this.upLayout();
			// 场景刷新下，有时会出黑边
			for (let i = 0; i < Editor.Panel.panels.length; i++) {
				const panel = Editor.Panel.panels[i];
				if(panel && panel._onPanelResize) panel._onPanelResize()
			}
		}
		
		if(this.cfg.autoLayoutDt)
		{
			this.$overlay.style.display = this.layout_dom_flex.parentElement.children[0] == this.layout_dom_flex ? "" : "inline"; // 自己在最顶层就不必显示蒙版
			this.layout_dom_flex.addEventListener('transitionend',actEnd,false);
		}else{
			actEnd();
		}
	},

	// 其它窗口总高度
	getFlexs()
	{
		let list = {}
		if(this.layout_dom_flex && this.layout_dom_flex.parentElement){
			for (let i = 0; i < this.layout_dom_flex.parentElement.children.length; i++) {
				let dom = this.layout_dom_flex.parentElement.children[i];
				if(dom.style.flex){
					list[i] = {flex:dom.style.flex.split(' '),dom};
				}
			}
		}
		return list;
	},

	// 本窗口当前占用空间百分比
	getSelfFlexPercent()
	{
		this.getLayoutDomFlex();
		let flexs = this.getFlexs();
		let max_height = 0
		let self_flex 

		for (const i in flexs) {
			const flexInfo = flexs[i];
			max_height += Number(flexInfo.flex[0])
			if(flexInfo.dom == this.layout_dom_flex){
				self_flex = flexInfo.flex;
			}
		}
		if(self_flex){
			return self_flex[0]/max_height;
		}
		return 0
	},

	getLayoutDomFlex(){
		if(this.parent_dom && this.parent_dom.parentElement)
		{
			this.layout_dom_flex = this.parent_dom.parentElement;
			let isHorizontal = true;
			for (let i = 0; i < this.layout_dom_flex.parentElement.children.length; i++) {
				const dom = this.layout_dom_flex.parentElement.children[i];
				if(dom.scrollHeight != this.layout_dom_flex.scrollHeight){
					isHorizontal = false;
				}
			}
			// 这里水平布局了两排以上
			if(isHorizontal){
				this.layout_dom_flex = this.layout_dom_flex.parentElement || this.layout_dom_flex; //再找一层
			}
		}else{
			this.layout_dom_flex = undefined;
		}
		return this.layout_dom_flex;
	},


	upLayout(){
		if (this.old_width == null || Math.abs(this.$box.scrollWidth - this.old_width) >3 || this.old_height == null || Math.abs(this.$box.scrollHeight - this.old_height) >3) {
			this.old_width = this.$box.scrollWidth;
			this.old_height = this.$box.scrollHeight;
			this.vs_editor.layout();
			return true;
		}
	},


	// 快捷键/修复creator ctrl+x 不能使用问题
	initKeybodyCut() {
		let pressedKeys = {};
		let _this = this;
		let ret_type;

		let onApplyEvent = (e, type) => {
			let ret_type = true;
			let count = 0;
			let removeKey;
			for (let n in pressedKeys) if(pressedKeys[n]) count++;
			// let removeList = []	

			_this.key_cfg.forEach((cfg, i) => {
				if (type == cfg.touch_type && cfg.keys.length == count) {
					if (cfg.mode == 2 || _this.vs_editor.hasTextFocus() == cfg.mode) {
						let isHas = true;
						cfg.keys.forEach((key) => {
							if (!pressedKeys[key] && !pressedKeys["Key"+key.toLocaleUpperCase()]) {
								isHas = false;
							}
						});

						if (isHas) {
							if (cfg.callback) {
								removeKey = e.key;
								// Array.prototype.push.apply(removeList,cfg.keys)
								ret_type = ret_type && cfg.callback(e);
							}
						}
					}
				}

			});

			// removeList.forEach((key)=> delete pressedKeys[key]);
			if (removeKey) delete pressedKeys[removeKey];

			return ret_type;
		}

		document.addEventListener("keydown", function (e) {
			pressedKeys = {
				[config.keyMap[e.keyCode] ? config.keyMap[e.keyCode] : e.key] : 1,
				['Alt'] : e.altKey,
				['Ctrl'] : e.ctrlKey,
				['Meta'] : e.metaKey,
				['Shift'] : e.shiftKey,
			}
			ret_type = onApplyEvent(e, 'keydown');
			_this.runExtendFunc("onKeyDown", e);
			return ret_type;
		}, true);

		document.addEventListener("keypress", function (e) {
			
			pressedKeys = {
				[config.keyMap[e.keyCode] ? config.keyMap[e.keyCode] : e.key] : 1,
				['Alt'] : e.altKey,
				['Ctrl'] : e.ctrlKey,
				['Meta'] : e.metaKey,
				['Shift'] : e.shiftKey,
			}
			ret_type = onApplyEvent(e, 'keypress');
			// _this.runExtendFunc("onKeypRess",e);
			// console.log("B",e.key,pressedKeys)
			return ret_type;
		}, true);

		document.addEventListener("keyup", function (e) {
			// pressedKeys = {};
			pressedKeys = {
				[config.keyMap[e.keyCode] ? config.keyMap[e.keyCode] : e.key] : 1,
				['Alt'] : e.altKey,
				['Ctrl'] : e.ctrlKey,
				['Meta'] : e.metaKey,
				['Shift'] : e.shiftKey,
			}
			// console.log("C",e.key,pressedKeys)
			_this.runExtendFunc("onKeyUp", e);
		}, true);

		// 重置key
		document.addEventListener("focus", () => pressedKeys = {});
		
		// 阻挡冒泡creator的快捷键
		this.$box.addEventListener("keydown", function (e) {
			if (_this.vs_editor.hasTextFocus() && (e.key == "w" || e.key == "e" || e.key == "r" || e.key == "t")) e.preventDefault()
			// console.log("key_1")
		}, false);

		// 关闭页面
		this.addKeybodyEvent([[Editor.isWin32 ? "Ctrl" : "Meta", "w"]], (e) => {
			this.closeTab(this.edit_id);
			e.preventDefault();// 吞噬捕获事件
			return false;
		}, 1, "keydown");

		// this.addKeybodyEvent([["Meta","x"]],(e)=>{
		// 	document.execCommand('copy')
		// 	this.editor.onCut();
		// 	e.preventDefault();// 吞噬捕获事件
		// 	return false;
		// },1,"keydown");

		this.addKeybodyEvent([["Ctrl", "s"], ["Meta", "s"]], (e) => {
			this.saveFile(true);
			e.preventDefault();// 吞噬捕获事件
			return false;
		}, 1, "keydown");

		// tab 左移
		this.addKeybodyEvent([["Meta", "Alt", "j"], [Editor.isWin32 ? "Ctrl" : "Meta", "Alt", "ArrowLeft"], ["Alt", "Shift", "Tab"]], (e) => {
			this.tabToLeft(true);
			e.preventDefault();// 吞噬捕获事件
			return false;
		}, 1, "keydown");

		// tab 右移
		this.addKeybodyEvent([["Meta", "Alt", "l"], [Editor.isWin32 ? "Ctrl" : "Meta", "Alt", "ArrowRight"], ["Alt", "Tab"]], (e) => {
			this.tabToRight(true);
			e.preventDefault();// 吞噬捕获事件
			return false;
		}, 1, "keydown");
	},

	// 自定义代码輸入提示
	initCustomCompleter() {
		if (!this.file_list_buffer || this.file_list_buffer.length == 0) {
			// 可以读取到文件缓存再初始化
			return this.setTimeoutToJS(() => this.initCustomCompleter(), 1.5, { count: 0 });
		}

		// 定义的提示功能
		let _this = this;
		let obj   = 
		{provideCompletionItems: function (model, position ,context, token) {
			let suggestions = []
			let text = model.getLineContent(position.lineNumber);
			let is_has_string = text.indexOf('"') != -1 || text.indexOf("'") !=-1;
			
			for (let i = 0; i < _this._comp_cfg.length; i++) {
				const v = _this._comp_cfg[i];
				delete v.range;
				// 只在字符串中提示文件路径
				if(!is_has_string && v.kind == _this.monaco.languages.CompletionItemKind.Folder){
					continue;
				}
				suggestions.push(v)
			}
			return {suggestions};
		},
		// 光标选中当前自动补全item时触发动作，一般情况下无需处理
		// resolveCompletionItem(item, token) {
		// 	return null;
		// }
		}
		//Register the custom completion function into Monaco Editor    
		this.monaco.languages.registerCompletionItemProvider('javascript',obj );
		this.monaco.languages.registerCompletionItemProvider('typescript',obj );
		this.monaco.languages.registerCompletionItemProvider('plaintext',obj );
		
		// 一帧读一个项目代码文件，用于代码提示、函数转跳
		let _asynloadModel = (i,call) => 
		{
			if (!this || !this.file_list_buffer) return;
			let is_load = false;
			let load_count = 0;
			for (; i < this.file_list_buffer.length; i++) 
			{
				let file_info = this.file_list_buffer[i];
				if(file_info.extname == ".js" || file_info.extname == '.ts'){
					is_load = call(file_info) || is_load;
					load_count ++ ;
					if(load_count == 80) break;
				}else{
					call(file_info);
				}
			}
			
			if (is_load) setTimeout(() => _asynloadModel(i + 1,call), 1)
			else call();
		}

		// 异步读取文件
		_asynloadModel(0,(file_info)=> {
			if(file_info) return this.loadCompleterLib(file_info.meta, file_info.extname, true)
			else _asynloadModel(0,(file_info)=>{if(file_info) return this.loadGlobalFunctionCompleter(file_info.meta, file_info.extname, true)})
		});

		// 项目根目录的代码提示文件
		let load_file_map = {}
		for (var n = 0; n < TS_API_LIB_PATHS.length; n++) 
		{
			let s_path = TS_API_LIB_PATHS[n];
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
					this.loadCompleterLib(file_path, extname, false);
				}
				
				
			}
		}
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
					detail: meta || ''
				};
				this._comp_cfg.push(this._comp_cfg_map[word]);
				return this._comp_cfg_map[word];
			}
		}
	},

	// 读取vs默认文件代码提示功能
	loadCompleterLib(file_path, extname, is_url_type){
		let isJs = extname == ".js";
		let isTs = extname == ".ts";
		let file_name = file_path.substr(file_path.lastIndexOf('/') + 1)
		if(isJs || isTs)
		{
			let fsPath = is_url_type ? Editor.remote.assetdb.urlToFspath(file_path) : file_path;
			let js_text = fs.readFileSync(fsPath).toString();
			if (!fe.isFileExit(fsPath)) return;

			if (isTs && !is_url_type) 
			{
				// 解析项目生成api提示字符串
				// if (is_url_type) {
				// 	js_text = tools.parseJavaScript(js_text, file_name.substr(0, file_name.lastIndexOf('.')));
				// }
				if (js_text) {
					// this.monaco.languages.typescript.javascriptDefaults.addExtraLib(js_text,this.fsPathToModelUrl(fsPath));
					this.monaco.languages.typescript.javascriptDefaults.addExtraLib(js_text,'lib://model/' + file_name);
				}
			}

			// if (isTs) {
				this.loadVsModel(file_path,extname,is_url_type);
			// }else{
			// 	// this.monaco.languages.typescript.typescriptDefaults.addExtraLib(js_text, 'lib://model/' + file_name);
			// }
			// 插入模块名字提示
			let word = file_name.substr(0,file_name.lastIndexOf('.'))
			this.addCustomCompleter(word,word,file_name,this.monaco.languages.CompletionItemKind.Reference);
			return true
		}else if(is_url_type){
			// 插入模块文件名提示
			let word = file_path.substr(12,file_path.lastIndexOf('.')-12)
			this.addCustomCompleter(word,word,'',this.monaco.languages.CompletionItemKind.Folder);
		}
	},

	// 项目函数转为全局提示，用于模糊提示；
	loadGlobalFunctionCompleter(file_path,extname,is_url_type){
		let isJs = extname == ".js";
		let isTs = extname == ".ts";
		if(isJs || isTs)
		{
			let fsPath = is_url_type ? Editor.remote.assetdb.urlToFspath(file_path) : file_path;
			let file_name = file_path.substr(file_path.lastIndexOf('/') + 1)
			let model = this.monaco.editor.getModel(this.monaco.Uri.parse(this.fsPathToModelUrl(fsPath)));
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
	loadVsModel(file_path, extname, is_url_type,isReadText=true) {
		let file_type = this.FILE_OPEN_TYPES[extname.substr(1).toLowerCase()];
		if(file_type)
		{
			let isJs = extname == ".js";
			let isTs = extname == ".ts";
			let fsPath = is_url_type ? Editor.remote.assetdb.urlToFspath(file_path) : file_path;
			if (isReadText && !fe.isFileExit(fsPath)) return;
			let js_text = isReadText ? fs.readFileSync(fsPath).toString() : "";
			let str_uri   = this.fsPathToModelUrl(fsPath)

			// 生成vs model缓存
			let model = this.monaco.editor.getModel(this.monaco.Uri.parse(str_uri)) ;
			if(!model){
				model = this.monaco.editor.createModel('',file_type,this.monaco.Uri.parse(str_uri))
				model.onDidChangeContent((e) => this.onVsDidChangeContent(e,model));
				model.fsPath = fsPath;
				model.dbUrl  = is_url_type ? file_path : undefined;
			}
			if(isReadText) model.setValue(js_text);
			return model
		}
	},

	fsPathToModelUrl(fsPath){
		// let ind = fsPath.indexOf(prsPath+ path.sep + "assets");
		let str_uri = Editor.isWin32 ? fsPath.replace(/ /g,'').replace(/\\/g,'/') : "X:/"+fsPath.substr(1)
		// if(ind == -1){
			// str_uri   = 'file://model/' + (Editor.isWin32 ? fsPath.substr(3).replace(/ /g,'').replace(/\\/g,'/') : fsPath.substr(1) );
		// }else{
		// 	ind = prsPath.length;
		// 	if(ind == -1) Editor.warn("代码编辑器：转换路径异常");
		// 	let _path = fsPath.substr(ind+1);
		// 	str_uri   = 'db://' + (Editor.isWin32 ? _path.replace(/ /g,'').replace(/\\/g,'/') : _path );
		// }
		return str_uri;
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
	
	setTheme(name) {
		let filePath = THEME_DIR + name + ".json"
		if (fe.isFileExit(filePath)) {
			let data = fs.readFileSync(filePath).toString();
			this.monaco.editor.defineTheme(name, JSON.parse(data));
		}
		this.monaco.editor.setTheme(name);
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

	// 获得下拉条列表目数据
	getItem(value, meta, score, args) {
		let item_cfg = {
			value: value, // 命令
			meta: meta, // 描述
			score: score,//搜索优先级
			args: args, // 自定义数据
			matchMask: 0,
			exactMatch: 1,
		};
		return item_cfg;
	},

	setTabBarPos(str){
		this.$box.style.flexDirection = str ? 'column' : 'column-reverse';
	},
	
	// 锁定编辑
	setLockEdit(is_lock,id) 
	{
		id = id == null ? this.edit_id : id;
		let info = this.edit_list[id] || {};
		// 打开文件解除锁定编辑
		if (id == this.edit_id) this.$lockChk.checked = is_lock;
		info.is_lock = is_lock;
		this.vs_editor.updateOptions({ lineNumbers: info.is_cmd_mode || id != 0 ? "on" : 'off' });
		this.vs_editor.updateOptions({ lineNumbers: info.is_cmd_mode || id != 0 ? "on" : 'off' });
		this.upTitle(id);
	},

	// 锁定窗口
	setLockWindow(is_lock) 
	{
		this.cfg.is_lock_window = is_lock;
		this.$lockWindowChk.checked = is_lock ? true : false;
	},

	// 命令模式
	setCmdMode(isCmdMode) {
		this.custom_cfg.is_cmd_mode = isCmdMode ? true : false;
		// this.editor.setOption("showGutter",this.custom_cfg.is_cmd_mode || this.edit_id != 0);
		this.vs_editor.updateOptions({ lineNumbers: this.custom_cfg.is_cmd_mode || this.edit_id != 0 ? "on" : 'off' });
		if (this.edit_id == 0) {
			this.setLockEdit(false);
		}
		this.oepnDefindFile();
		// 获得选中的节点
		this.$cmdMode.checked = this.custom_cfg.is_cmd_mode;
		Editor.Scene.callSceneScript('simple-code', 'cc-engine-animatin-mode', this.custom_cfg.is_cmd_mode, (err, args) => { });
	},

	// 添加快捷键, 例子: this.addKeybodyEvent([ ["Ctrl","x"] ],()=>{})
	addKeybodyEvent(arrKeys, callback, isOnEditorRun, touchType = "keydown") {
		arrKeys.forEach((keys) => {
			keys.forEach((v, i) => {
				keys[i] = v == "Control" ? "Ctrl" : keys[i];
			})
			this.key_cfg.push({ keys, callback, mode: isOnEditorRun, touch_type: touchType });
		})
	},

	setMiniSearchBoxToTouchPos(width)
	{
		this.setMiniSearchBox(this.mouse_pos,width)
	},

	setMiniSearchBox(pos,width=150)
	{
		if(pos == null) return;
		let box = document.getElementById('mini_prompt_box');
		let input = document.getElementById('mini_prompt_input');
		let popup = document.getElementById('mini_prompt_popup');
		
		if(!box || !input || !popup)
		{
			return;
		}

		let max_x = window.screen.availWidth - width;
		let x = pos.x>max_x ? max_x : pos.x

		box.style.margin = `${pos.y}px auto auto ${x}px`
		box.style['max-width'] = width+'px'
		popup.style['max-width'] = width+'px'
	},
	/* 
		打开下拉框, 例子: this.openSearchBox("",fileList,(data)=>{console.log(data.item)});
		onAccept:处理完成调
		onCompletionsFunc:修改搜索框时，通过该函数读取显示的实时显示的列表
	*/
	openSearchBox(msg = "", itemList, onAccept, onCompletionsFunc) {
		let _this = this
		// 打开个自定义 下拉 选项 
		this.editor.prompt(msg, {
			// 名字
			name: "searchFile",
			selection: [0, Number.MAX_VALUE],
			maxHistoryCount: 20,

			onAccept: function (data, label) {
				if (data.item && !onCompletionsFunc) this.addToHistory(data.item);
				onAccept(data, label);
			},

			addToHistory: function (item) {
				var history = this.history();
				history.unshift(item);
				delete item.message;
				for (var i = 1; i < history.length; i++) {
					if (history[i]["value"] == item.value) {
						history.splice(i, 1);
						break;
					}
				}
				if (this.maxHistoryCount > 0 && history.length > this.maxHistoryCount) {
					history.splice(history.length - 1, 1);
				}
				_this.search_history = history;
			},

			// 搜索文字蓝色高亮
			getPrefix: function (cmdLine) {
				var currentPos = cmdLine.getCursorPosition();
				var filterValue = cmdLine.getValue();
				return filterValue.substring(0, currentPos.column);
			},

			// 历史使用记录
			history: function () {
				let commands = JSON.parse(JSON.stringify(_this.search_history || []));
				for (let i = commands.length - 1; i >= 0; i--) {

					let isNot = true
					for (let n = 0; n < itemList.length; n++) {
						let now_item = itemList[n];
						if (commands[i].value == now_item.value) {
							isNot = false
							break;
						}
					}

					if (isNot) {
						commands = commands.slice(0, i);
					}
				}
				return commands
			},


			sortCompletions(completions, prefix) {
				if (prefix == "") return completions;
				prefix = prefix.toLowerCase();

				for (let i = 0; i < completions.length; i++) {
					let info = completions[i];
					let text = info.value.toLowerCase();
					let similar_count = 0;
					let start_pos = 999;
					let end_pos = 999;
					let break_tag = false;
					for (let n = 0; n < prefix.length; n++) {
						let char = prefix[n];
						let isFind = false;
						for (let n2 = n; n2 < text.length; n2++) {
							if (char == text[n2]) {
								if (start_pos == 999)
									start_pos = n2
								else if (!break_tag) end_pos = n2
								n = n2;
								similar_count++;
								isFind = true;
								break;
							} else {
								if (end_pos != 999) {
									break_tag = true;
								} else if (!break_tag) {
									start_pos = 999
								}
							}
						}

						if (!isFind) {
							break;
						}
					}
					if (end_pos == 999) start_pos = 999;
					let head_count = end_pos - start_pos;
					info.score = (SCORES[info.extname] || 70) + head_count * 10 + (start_pos != 999 ? start_pos * -10 : 0) + parseInt(similar_count / text.length * 30);
				}

				completions.sort((a, b) => b.score - a.score);
				return completions;
			},

			// 返回下拉列表命令
			getCompletions: onCompletionsFunc || function (cmdLine) {
				function getFilteredCompletions(commands, prefix) {
					var resultCommands = JSON.parse(JSON.stringify(commands));

					var filtered;
					ace.config.loadModule("ace/autocomplete", function (module) {
						filtered = new module.FilteredList(resultCommands);
					});
					return filtered.filterCompletions(resultCommands, prefix);
				}

				function getUniqueCommandList(commands, usedCommands) {
					if (!usedCommands || !usedCommands.length) {
						return commands;
					}
					var excludeCommands = [];
					usedCommands.forEach(function (item) {
						excludeCommands.push(item.value);
					});

					var resultCommands = [];

					commands.forEach(function (item) {
						if (excludeCommands.indexOf(item.value) === -1) {
							resultCommands.push(item);
						}
					});

					return resultCommands;
				}

				var prefix = this.getPrefix(cmdLine);

				var recentlyUsedCommands = getFilteredCompletions(this.history(), prefix);
				var otherCommands = getUniqueCommandList(itemList, recentlyUsedCommands);
				otherCommands = getFilteredCompletions(otherCommands, prefix);

				if (recentlyUsedCommands.length && otherCommands.length) {
					recentlyUsedCommands[0]["message"] = " Recently used";
					otherCommands[0]["message"] = " Other commands";
				}

				var completions = this.sortCompletions(recentlyUsedCommands.concat(otherCommands), prefix);
				return completions.length > 0 ? completions : [{
					value: "找不到命令...",
					error: 1
				}];
			}
		});
	},

	newFileInfo(extname, name, url, uuid) {
		let item_cfg = {
			extname: extname,//格式
			value: name == "" ? url : name,
			meta: url,
			score: 0,//搜索优先级
			// matchMask: i,
			// exactMatch: 0,
			uuid: uuid,
		};
		return item_cfg;
	},

	// 更新游戏项目文件列表缓存
	upFileListBuffer(isCoerce = false) {
		if (!isCoerce && this.file_list_buffer && this.file_list_buffer.length != 0) return;

		Editor.assetdb.deepQuery((err, results) => {
			let fileList = []; // 文件列表
			for (let i = 0; i < results.length; i++) {
				let result = results[i];
				if (result.extname != "" && this.SEARCH_BOX_IGNORE[result.extname] == null) {
					let url = Editor.remote.assetdb.uuidToUrl(result.uuid);//Editor.assetdb.uuidToUrl(result.uuid)
					if (url) {
						let name = url.substr(url.lastIndexOf('/') + 1);
						let item_cfg = this.newFileInfo(result.extname, name, url, result.uuid)
						fileList.push(item_cfg);
					}
				}
			}

			this.file_list_buffer = fileList;
			this.sortFileBuffer()
		});
	},

	// 排序:设置搜索优先级
	sortFileBuffer() {
		let getScore = (extname) => {
			return SCORES[extname] || (this.FILE_OPEN_TYPES[extname] && 80) || (this.SEARCH_BOX_IGNORE[extname] && 1) || 2;
		}
		this.file_list_buffer.sort((a, b) => getScore(b.extname) - getScore(a.extname));
	},


	// 保存修改
	saveFile(isMandatorySaving = false, id = -1) {
		id = id == -1 ? this.edit_id : id;
		let file_info = this.edit_list[id];
		if (file_info && file_info.uuid && (file_info.is_need_save || isMandatorySaving)) {
			let edit_text = id == this.edit_id ? this.vs_editor.getValue() : file_info.new_data;
			if (edit_text == null) {
				Editor.error("保存文件失败:", file_info)
				return;
			}

			if (file_info.uuid == "outside") {
				fs.writeFileSync(file_info.path , edit_text); //外部文件
			} else {
				// fs.writeFileSync(Editor.remote.assetdb.urlToFspath(file_info.path), edit_text);
				// // 用于脱离编辑状态后刷新creator
				// if(this.refresh_file_list.indexOf(file_info.path) == -1){ 
				// 	this.refresh_file_list.push(file_info.path);
				// }
				this.saveFileByUrl(file_info.path,edit_text);
			}
			this.is_need_refresh = true;
			file_info.is_need_save = false;
			file_info.data = edit_text;
			file_info.new_data = edit_text;
			this.upTitle(id);
			if(id != 0) this.setLockEdit(true,id);
		}
	},

	saveFileByUrl(url,text)
	{
		Editor.assetdb.saveExists(url, text, (err, meta)=> {
			if (err) {
				fs.writeFileSync(Editor.remote.assetdb.urlToFspath(url), text); //外部文件
				Editor.error("保存代码出错:", err,meta);
			}else{
				// 刚刚保存了，creator还没刷新
				this.is_save_wait_up = 1;
				this.setTimeoutById(()=>{
					this.is_save_wait_up = 0;
				},3000)
			}
		});
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

		this.monaco.editor.setModelLanguage(this.vs_editor.getModel(), this.FILE_OPEN_TYPES[info.file_type || ""] || "markdown");
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
		// if (file_info && file_info.is_need_save)
		// {
		// 	if (id != 0){
		// 		// Editor.info("当前文件存文件有所改动,请保存或重置后再切换文件");
		// 		// return; 
		// 	}else{
		// 		this.saveFile(false,id);
		// 	}
		// }
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
			let vs_model = this.loadVsModel(path, this.getUriInfo(path).extname , uuid != "outside",false);
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

	setWaitIconHide(isHide){
		this.$waitIco.hidden = isHide;
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

		if (this.edit_list[this.edit_id] && !is_new_page) {
			// 记录切换页面前编辑的数据
			this.edit_list[this.edit_id].new_data = this.vs_editor.getValue();
			this.edit_list[this.edit_id].scroll_top = this.vs_editor.getScrollTop()
		}

		this.upTitle(id)
		this.readFile(this.edit_list[id]);
		this.vs_editor.updateOptions({ lineNumbers: this.custom_cfg.is_cmd_mode || this.edit_id != 0 ? "on" : 'off' });
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
		let filePath = this.custom_cfg.is_cmd_mode ? CMD_FILE_PATH : MEMO_FILE_PATH;
		if (!fe.isFileExit(filePath)) {
			let template = this.custom_cfg.is_cmd_mode ? "packages://simple-code/template/commandLine.md" : "packages://simple-code/template/readme.md";
			fe.copyFile(Editor.url(template), filePath);
		}

		// 已经打开过了
		if (this.file_info.path == filePath) {
			return;
		}

		// 切换模式前先保存备忘录
		if(this.edit_list[0] && this.edit_list[0].path != filePath) {
			this.saveFile(false,0); 
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

	// 刷新场景所有的子节点信息缓存
	upCurrSceneChildrenInfo() {
		// 从场景获得代码数据
		Editor.Scene.callSceneScript('simple-code', 'scene-children-info', "", (err, data) => {
			if (!data || data == "") return;

			this.currSceneChildrenInfo = JSON.parse(data);
			this.onCurrSceneChildrenInfo(this.currSceneChildrenInfo);
			this.runExtendFunc("onCurrSceneChildrenInfo", this.currSceneChildrenInfo);
		}, -1)
	},

	// 编译编辑中的代码
	upCompCodeFile(){
		let edits = [{
			range:{startLineNumber:0,startColumn:0,endLineNumber:0,endColumn:0,},
			text:' ',
			forceMoveMarkers:false,
		}]
		this.edit_list.forEach((editInfo, id) => {
			if(editInfo && editInfo.vs_model)
			{
				editInfo.vs_model.pushStackElement();
				editInfo.vs_model.pushEditOperations([], edits);
				editInfo.vs_model.undo()
			}
		});
	},

	onCurrSceneChildrenInfo(currSceneChildrenInfo) { },

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
			let vs_model = this.monaco.editor.getModel(this.monaco.Uri.parse(this.fsPathToModelUrl(v.srcPath)))
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
		this.setWaitIconHide(false);
		this.loadCodeFileRenameInfo(oldUrl,newUrl,assets_info.extname,(edit_files,wrObj)=>
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
				let try_count = 0;
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

		this.setWaitIconHide(true);
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
	loadCodeFileRenameInfo(oldFileName,newFileName,extname,callback)
	{
		// 检测需要修改的文件
		let wr = extname == ".js" ? this.jsWr : this.tsWr;
		wr.getEditsForFileRename(oldFileName,newFileName).then((edit_files)=>{
			callback(edit_files,wr)
		},()=>{
			console.warn("代码编辑器:读取重命名文件引用路径失败:"+oldFileName+" to " +newFileName);
			callback([],wr);
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

	// 打开设置菜单
	openMenu() {
		// 打开配置面板
		if (!this.editor.showSettingsMenu) {
			Editor.require('packages://simple-code/ace/ext-settings_menu.js').init();
		}
		this.editor.showSettingsMenu(this.cfg);
	},

	// onclose(){
	// 	this.onDestroy()
	// },

	// 页面关闭
	onDestroy() {
		if(this._is_destroy || this.edit_list == null) return;
		this._is_destroy = true;
		if (this.schFunc) this.schFunc();
		if(this.mouse_event_closeFunc) this.mouse_event_closeFunc()
		this.setAutoLayout(false);

		// 保存编辑信息
		let temp_path_map = {}
		this.edit_list.forEach((editInfo, id) => {
			if (editInfo) {
				if (editInfo.uuid && editInfo.is_need_save) {
					let time = new Date().getTime();
					if (editInfo.uuid != "outside" && confirm("窗口即将关闭!" + editInfo.path + " 文件被修改是否保存?")) {
						this.saveFile();
					} else {
						let dff_time = (new Date().getTime()) - time;
						if (dff_time < 10) {
							this.saveFile();
						} else {
							Editor.log("丢弃修改:", editInfo.new_data);
						}
					}
				}
				
				temp_path_map[editInfo.path] = editInfo.is_lock;
				this.file_cfg[editInfo.path] = this.file_cfg[editInfo.path] = {}
				this.file_cfg[editInfo.path].is_open = editInfo.is_lock;
				this.file_cfg[editInfo.path].is_show = editInfo.vs_model == this.vs_editor.getModel() ? 1 : 0;
			}
		});

		for (let key in this.file_cfg) {
			if (!temp_path_map[key]) delete this.file_cfg[key];
		}

		this.edit_list.forEach((_,id) => {
			this.closeTab(id);
		});
		
		for (const key in this.monaco.editor.getModels()) {
			const model = this.monaco.editor.getModels[key];
			if(model) model.dispose();
		}

		//  写入配置
		// this.cfg = this.editor.getOptions();
		this.cfg.custom_cfg = this.custom_cfg;
		this.cfg.fontSize = this.vs_editor.getRawOptions().fontSize;
		this.cfg.self_flex_per = this.self_flex_per;
		delete this.cfg.language;
		localStorage.setItem("simple-code-config", JSON.stringify(this.cfg));
		localStorage.setItem("simple-code-search_history", JSON.stringify(this.search_history));

		this.destoryVim();
		this.runExtendFunc("onDestroy");
	},


	initExtend() {
		// 合并事件函数,分发
		let info = Editor.require("packages://simple-code/panel/event-merge").eventvMerge(this.messages, "panel_ex.js");
		_scripts = info.scripts;
		this.messages = info.messages;
	},

	runExtendFunc(funcName, ...args) {
		_scripts.forEach((obj) => {
			if (obj[funcName]) {
				obj[funcName](...args);
			}
		})
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

		// 场景保存
		'scene:saved'(event) {
			if(!this.is_init_finish) return;
			this.saveFile();
			this.upCurrSceneChildrenInfo();
		},

		// 场景加载完
		'scene:ready'(event) {
			if(!this.is_init_finish) return;
			// this.upFileListBuffer();
			this.upCurrSceneChildrenInfo();
		},

		// 预制节点加载完
		'scene:enter-prefab-edit-mode'(event) {
			if(!this.is_init_finish) return;
			this.upCurrSceneChildrenInfo();
		},

		// 选择改变
		'selection:activated'(event) {
			if(!this.is_init_finish || this.code_file_rename_buf.is_use || this.is_not_select_active) return;
			// 阻止保存时tab乱切换
			this.openActiveFile(!this.is_save_wait_up,!this.is_save_wait_up);
		},

		// 项目资源文件uuid发生改变
		'asset-db:asset-uuid-changed'(event) {
		},

		// 项目资源文件发生改变
		'asset-db:asset-changed'(event, info) {
			if(!this.is_init_finish  || this.code_file_rename_buf.is_use || this.is_not_select_active) return;

			this.checkAllCurrFileChange();
			let url = Editor.remote.assetdb.uuidToUrl(info.uuid);
			let edit_id = this.getTabIdByPath(url);
			if(edit_id == null || !this.edit_list[edit_id] || !this.edit_list[edit_id].is_need_save)
			{
				// 刷新文件/代码提示,只有未被编辑情况下才刷新
				let urlI = this.getUriInfo(url)
				this.loadCompleterLib(url, urlI.extname, true);
				this.loadGlobalFunctionCompleter(url, urlI.extname, true);
			}
			// this.openActiveFile();
		},

		// 项目资源创建
		'asset-db:assets-created'(event, info) {
			if(!this.is_init_finish) return;
			if (!info && this.file_list_buffer) return;

			info.forEach((v, i) => {
				let urlI = this.getUriInfo(v.url)
				if (urlI.extname != "" && this.SEARCH_BOX_IGNORE[urlI.extname] == null) 
				{
					let item = this.newFileInfo(urlI.extname, urlI.name, v.url, v.uuid)
					this.file_list_buffer.push(item)
					this.loadCompleterLib(item.meta, item.extname, true);
					this.loadGlobalFunctionCompleter(item.meta, item.extname, true);
					this.upCompCodeFile();
				}
			})
		},

		// 项目文件被删除
		'asset-db:assets-deleted'(event, info) {
			if(!this.is_init_finish) return;
			if (!info && this.file_list_buffer) return;

			info.forEach((v) => {
				for (let i = 0; i < this.file_list_buffer.length; i++) {
					let item = this.file_list_buffer[i];
					if (item.uuid == v.uuid) {
						this.file_list_buffer.splice(i, 1)
						break;
					}
				}

				let is_remove = false
				
				// 刷新编辑信息
				let old_url = this.fsPathToUrl(v.path);
				let id = this.getTabIdByPath(old_url);
				// 正在编辑的tab
				if(id != null)
				{
					// 正在编辑的文件被删
					let editInfo = this.edit_list[id] 
					if (editInfo && v.uuid == editInfo.uuid) {
						editInfo.uuid = "outside";
						editInfo.path = unescape(Editor.url(editInfo.path));
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
					let vs_model = this.monaco.editor.getModel(this.monaco.Uri.parse(this.fsPathToModelUrl(v.path)))
					if(vs_model) vs_model.dispose()
				}

			})

			this.upCompCodeFile();
		},

		// 项目文件被移动了
		'asset-db:assets-moved'(event, list) 
		{
			if(!this.is_init_finish) return;
			if (!list) return;

			list.forEach((v, i) => 
			{
				let urlI = this.getUriInfo(v.url)
				v.extname = urlI.extname;
				
				// 更新文件缓存
				for (let i = 0; i < this.file_list_buffer.length; i++) {
					let item = this.file_list_buffer[i];
					if (item.uuid == v.uuid) {
						item.extname = urlI.extname
						item.value = urlI.name
						item.meta = v.url
						break;
					}
				}
				
				// 重命名后检测引用路径
				if(urlI.extname == '.js' || urlI.extname == '.ts'){
					this.code_file_rename_buf.move_files.push(v);
					this.upCodeFileRename();
				}else{
					// 不需要检测引用路径的文件
					this.onMoveFile(v);
				}
			})
		},

		// vs功能:在文件夹打开文件
		'vs-reveal-in-finder'(event) 
		{
			if (this.file_info.uuid == null) return;
			let url =  (this.file_info.uuid == "outside" ? this.file_info.path.replace(new RegExp('/','g'),path.sep) : Editor.remote.assetdb.urlToFspath(this.file_info.path));
			exec(Editor.isWin32 ? 'Explorer /select,"'+url+'"' : "open -R " + url)
		},

		// vs功能:打开网页
		'vs-open-url'(event,url) 
		{
			let uri = this.monaco.Uri.parse(url)
			if (uri.scheme == "file"){
				url = "http://"+uri.path;
			}
			exec(Editor.isWin32 ? "cmd /c start "+url : "open "+url); 
		},

		// vs功能:焦点
		'vs-editor-focus'(event,url) 
		{
			if(Editor.Panel.getFocusedPanel() == this){
				this.vs_editor.focus();
			}
		},
		
		// vs功能: 
		'vs-up-code-file'(event) 
		{
			this.upCompCodeFile();
		},
		
		// vs功能:打开文件、转跳到实现、定义
		'vs-open-file-tab'(event,info) 
		{
			let uuid;
			let url_info ;
			let vs_model = this.monaco.editor.getModel(info.uri._formatted);
			if(vs_model == null){
				if(info.uri.scheme == 'http' || info.uri.scheme == 'https'){
					exec(Editor.isWin32 ? "cmd /c start "+info.uri._formatted : "open "+info.uri._formatted); 
				}else{
					Editor.warn('vs_model == null');
				}
				return 
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
				url_info = this.getFileUrlInfoByUuid(uuid) 
			}else{
				// 项目根目录的代码提示文件
				if(fe.isFileExit(vs_model.fsPath)){
					url_info = this.getFileUrlInfoByFsPath(vs_model.fsPath);
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
					this.vs_editor.setSelection(info.selection)
					this.vs_editor.revealRangeInCenter(info.selection)
				};
			}
		},
		
		
		'run-command-code'(event, type) {
			if (this.file_info.uuid == null || !this.custom_cfg.is_cmd_mode) return Editor.log("只能在命令模式执行代码预览");

			let args;
			if (type == "cmd") {
				if (this.edit_id == 0 || this.file_info.uuid == "outside") {
					args = { type, data: this.vs_editor.getValue() };
				} else {
					args = { type, uuid: this.file_info.uuid, data: fs.readFileSync(CMD_FILE_PATH).toString() };// 运行节点的脚本
				}
			} else {
				args = { type: type, data: fs.readFileSync(CMD_FILE_PATH).toString() };
			}

			if (type != "cmd") {
				if (is_hint || confirm("模拟运行环境模式:即将切换到测试场景进行模拟运行,请确定当前场景已经保存.该功能于测试中,运行过程中报错可能会导致编辑器崩溃！是否执行?")) {
					is_hint = true;
					Editor.Scene.callSceneScript('simple-code', 'run-command-code', args);
				}
			} else {
				if (args.uuid) {
					if (this.file_info.is_need_save) return Editor.info("请保存修改后再执行命令");
					if (is_hint || confirm("1.该脚本将通过绑定的Node执行代码，执行后可能会删改场景内容，请注意保存场景！\n2.执行的入口函数为‘onLoad’、‘start’、’update‘。\n3.首次使用建议在命令行文件‘commandLine.js’里配置你的代码运行环境,每次执行代码文件前都会先执行命令文件里代码;\n4.请保存代码后再执行;\n是否执行?")) {
						is_hint = true;
						Editor.Scene.callSceneScript('simple-code', 'run-command-code', args);
					}
				} else {
					Editor.Scene.callSceneScript('simple-code', 'run-command-code', args);
				}
			}
		},

		// 快捷键打开当前选中文件/节点进入编辑
		'custom-cmd'(event, info) {
			if(!this.is_init_finish) return;

			if (info.cmd == "openFile") {
				this.openActiveFile(true,false);
			} else if (info.cmd == "setting") {
				this.openMenu();
			}
		}
	}
};

layer.initExtend();
Editor.Panel.extend(layer);
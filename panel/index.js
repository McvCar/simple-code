// 代码编辑器窗口
// 编辑功能由 ace Editor 完成,地址: https://github.com/ajaxorg/ace
// 本插件的ace.js文件已做少量改动,升级替换可能会引起问题

const ace = Editor.require('packages://simple-code/ace/ace.js');
const settings_menu = Editor.require('packages://simple-code/ace/ext-settings_menu.js');
const prompt_ex = Editor.require('packages://simple-code/ace/ext-prompt.js');

const vsEditorPanel = Editor.require('packages://simple-code/panel/panel-component/vs-editor-panel.js');
const tools = Editor.require('packages://simple-code/tools/tools.js');
const fe 	= Editor.require('packages://simple-code/tools/FileTools.js');
const fs 	= require('fs');
const config = Editor.require('packages://simple-code/config.js');
const path 	= require("fire-path");
const exec 	= require('child_process').exec;
const md5 	= require('md5');

const prsPath = Editor.Project && Editor.Project.path ? Editor.Project.path : Editor.remote.projectPath;

let _scripts = [];
let is_hint = false;
let layer = {
	
	style:
		// ace.editorCss +
		fs.readFileSync(Editor.url("packages://simple-code/monaco-editor/dev/vs/editor/editor.main.css"), "utf-8") +
		`
		.turnAnim{
			animation:turn 2s linear infinite;      
		  }
		@keyframes turn{
		0%{-webkit-transform:rotate(0deg);}
		25%{-webkit-transform:rotate(90deg);}
		50%{-webkit-transform:rotate(180deg);}
		75%{-webkit-transform:rotate(270deg);}
		100%{-webkit-transform:rotate(360deg);}
		}
		
		#manualCompile{height: 15px;width:40;}
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

		#waitIco {
			width: 15px;
			height: 15px;
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
			text-align:center;
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
			text-align:center;
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
						<img src=file://${Editor.url("packages://simple-code/panel/images/settingIco.png")} id="waitIco" class="turnAnim"></img> <span></span> <span></span>
						<div id="title0" class="closeTab">
							<div class="tabTitle"><nobr>无文件<nobr></div>
							<div class="closeBtn"><nobr> x <nobr></div>
						</div>

					</div>
					<div id="toolsPanel" class="layout horizontal">
						<ui-checkbox id="lockChk">锁标签</ui-checkbox>
						<ui-checkbox id="lockWindowChk">锁窗</ui-checkbox>
						<ui-checkbox id="cmdMode">调试</ui-checkbox>
						<ui-button id="manualCompile" class="">编译</ui-button>
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
		manualCompile: '#manualCompile',
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
		// 副级编辑器
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

	// 启动事件
	ready() 
	{
		this.initStartData()
		this.initAce();
		this.runExtendFunc("ready",this);
		this.initVsEditor(()=>{
			this.initData();
			this.initBindEvent();
			this.initKeybodyCut();
			this.setWaitIconActive(false);
			this.upCurrSceneChildrenInfo();
			this.is_init_finish = true;
			this.runExtendFunc("onLoad",this);
			this.setOptions(this.cfg,true);
			window._panel = this;
		});
	},

	initStartData(){
		// 游戏资源路径缓存
		this.file_list_buffer = [];
		// 读取配置文件
		this.$title0.hidden 	= true;
		this.timer_map 			= {};
		this.cfg 				= config.getLocalStorage();
		this.pro_cfg 			= config.getProjectLocalStorage()
	},

	// 设置选项
	setOptions(cfg,isInit) 
	{	
		// 基类
		this._super(cfg,isInit);

		if (cfg.newFileType != null) {
			localStorage.setItem("newFileType", cfg.newFileType || "ts");
		}
		if(cfg.tabBarPos != null){
			this.setTabBarPos(cfg.tabBarPos);
		}
		if(cfg.hideToolsBar != null){
			this.$toolsPanel.hidden = cfg.hideToolsBar;
		}
		if(cfg.is_cmd_mode != null || isInit){
			this.$cmdMode.checked = cfg.is_cmd_mode || false;
		}
		if(cfg.codeCompileMode != null || isInit){
			this.$manualCompile.hidden = cfg.codeCompileMode != 'manual';
			this.$gotoFileBtn.hidden = cfg.codeCompileMode == 'manual';
		}
		this.runExtendFunc("setOptions", cfg,isInit);
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
		this.mouse_move_event_closeFunc;
		this.mouse_start_event_closeFunc;
		this.is_init_finish = false;
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

		// 搜索历史
		this.search_history = this.pro_cfg.search_history  = this.pro_cfg.search_history || [];

		this.setLockWindow(this.cfg.is_lock_window);
	},

	onVsDidChangeContent(e,model) {
		this._super(e,model);
	},

	// 綁定事件
	initBindEvent() {

		// 失去焦点，编译代码
		this.addEventListener('blur', () => {
			if(this.cfg.codeCompileMode == 'blur'){
				this.refreshSaveFild(false)
			}
		},false);

		// 手动编译
		this.$manualCompile.addEventListener('confirm', () => {
			// if (this.file_info) this.saveFile(true);
			this.refreshSaveFild(true)
		},false);

		// 保存
		this.$settingBtn.addEventListener('confirm', () => {
			// if (this.file_info) this.saveFile(true);
			this.openMenu()
		},false);

		

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
			this.cfg.is_cmd_mode = this.$cmdMode.checked ? true : false;
			this.setCmdMode(this.cfg.is_cmd_mode);
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
		
		// 记录鼠标位置，用于菜单位置
		let mousemove = (e)=>{
			this.mouse_pos = {y:e.clientY,x:e.clientX}
		}
		document.addEventListener('mousemove',mousemove,true)
		this.mouse_move_event_closeFunc = ()=>{
			document.removeEventListener('mousemove',mousemove,true)
		}

		// 用于触发双击事件
		let mousedown = (e)=>{
			let now_time =  new Date().getTime();
			if(this._mousedown_time == null || now_time - this._mousedown_time>300){
				this._mousedown_time = new Date().getTime()
			}else{
				// 双击事件分发
				let mouse_pos = {y:e.clientY,x:e.clientX}
				this.onMouseDoubleClick(mouse_pos);
			}
			this._isMoveDown = true
			this.setTimeoutById(()=>this._isMoveDown = false,3000,'mousedow')
		}
		document.addEventListener('mousedown',mousedown,true)
		this.mouse_start_event_closeFunc = ()=>{
			document.removeEventListener('mousedown',mousedown,true)
		}

		// 关闭页面提示
		this.onDestroy = this.onDestroy.bind(this)
		window.addEventListener("beforeunload", this.onDestroy, false);

		// 检测窗口改变大小调整
		this.schFunc = this.setTimeoutToJS(() => 
		{
			if(this.parentElement == null){
				// 本窗口已被删除
				this.onDestroy();
				return;
			}
			let is_up_layout = this.is_init_finish && this.upLayout()
			this.isIdleTsWorker()
			this.onCheckLayout(is_up_layout)
		}, 0.5);
	},

	upLayout(){
		if (this.old_width == null || Math.abs(this.$box.scrollWidth - this.old_width) >3 || this.old_height == null || Math.abs(this.$box.scrollHeight - this.old_height) >3) {
			this.old_width = this.$box.scrollWidth;
			this.old_height = this.$box.scrollHeight;
			this.vs_editor.layout();
			return true;
		}
	},

	isFocused(){
		return Editor.Panel.getFocusedPanel() == Editor.Panel.find('simple-code');
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
		this.$box.addEventListener("keydown", (e)=> {
			let className = e.path[0] && e.path[0].className || ''
			if (className.indexOf('monaco') != -1 && (e.key == "w" || e.key == "e" || e.key == "r" || e.key == "t")) e.preventDefault()
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
		this.cfg.is_cmd_mode = isCmdMode ? true : false;
		// this.editor.setOption("showGutter",this.cfg.is_cmd_mode || this.edit_id != 0);
		this.vs_editor.updateOptions({ lineNumbers: this.cfg.is_cmd_mode || this.edit_id != 0 ? "on" : 'off' });
		if (this.edit_id == 0) {
			this.setLockEdit(false);
		}
		this.oepnDefindFile();
		// 获得选中的节点
		this.$cmdMode.checked = this.cfg.is_cmd_mode;
		Editor.Scene.callSceneScript('simple-code', 'cc-engine-animatin-mode', this.cfg.is_cmd_mode, (err, args) => { });
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

	setMiniSearchBoxToTouchPos(width=150,isAutoHeight=0,isTextEditMode=0,isHidePopup=false)
	{
		this.setMiniSearchBox(this.mouse_pos,width,isAutoHeight,isTextEditMode,isHidePopup)
	},

	// 设置迷你输入框大小
	setMiniSearchBox(pos,width=150,isAutoHeight=0,isTextEditMode=0,isHidePopup=false)
	{
		let box = document.getElementById('mini_prompt_box');
		let input = document.getElementById('mini_prompt_input');
		let popup = document.getElementById('mini_prompt_popup');
		
		if(!box || !input || !popup)
		{
			return;
		}
		
		if(pos) {
			let max_x = document.body.clientWidth - width-100;
			let x = pos.x>max_x ? max_x : pos.x - width*0.5;
			box.style.margin = `${pos.y-10}px auto auto ${x}px`
		};

		box.style['max-width'] = width+'px'
		popup.style['max-width'] = width+'px'
		if(isHidePopup) popup.style['display'] = 'none';
		if(isAutoHeight) {
			input.cmdLine.setOption("wrap", "free") // ace 编辑器选项
			input.cmdLine.setOption('maxLines',35)
			input.cmdLine.isEditorMode = true;
		}
		if(isTextEditMode) {
			input.cmdLine.setOption("wrap", "off") // ace 编辑器选项
			input.cmdLine.setOption('maxLines',35)
			input.cmdLine.setHighlightActiveLine(true);
			input.cmdLine.setShowPrintMargin(false);
			input.cmdLine.renderer.setShowGutter(true);
			input.cmdLine.renderer.setHighlightGutterLine(true);
			// input.cmdLine.setTheme("ace/theme/monokai");
			input.cmdLine.isEditorMode = true;
		}else{
			input.cmdLine.setShowPrintMargin(false);
			input.cmdLine.renderer.setShowGutter(false);
			input.cmdLine.renderer.setHighlightGutterLine(false);
		}
		input.cmdLine.resize()
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
					info.score = (_this.SEARCH_SCORES[info.extname] || 70) + head_count * 10 + (start_pos != 999 ? start_pos * -10 : 0) + parseInt(similar_count / text.length * 30);
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


	setWaitIconActive(isActive){
		if(this.$waitIco){
			
			this.$waitIco.className = isActive ? 'turnAnim' : '';
		}
	},

	// 刷新场景所有的子节点信息缓存
	upCurrSceneChildrenInfo() {
		// 从场景获得代码数据
		Editor.Scene.callSceneScript('simple-code', 'scene-children-info', "", (err, data) => {
			if (!data || data == "") return;

			this.currSceneChildrenInfo = JSON.parse(data);
			this.onCurrSceneChildrenInfo(this.currSceneChildrenInfo);
		}, -1)
	},

	onCheckLayout(isUpLayout){
		this.runExtendFunc("onCheckLayout", isUpLayout);
	},

	onCurrSceneChildrenInfo(currSceneChildrenInfo) {
		this.runExtendFunc("onCurrSceneChildrenInfo", currSceneChildrenInfo);
	},

	onMouseDoubleClick(mousePos){
		this.runExtendFunc("onMouseDoubleClick",mousePos);
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
	onDestroy() 
	{
		document.removeEventListener('beforeunload',this.onDestroy,false);
		if(this._is_destroy || this.edit_list == null) return;
		this._is_destroy = true;
		this._super();
		this.runExtendFunc("onDestroy");
		this.refreshSaveFild();

		if (this.schFunc) this.schFunc();
		if(this.mouse_move_event_closeFunc) this.mouse_move_event_closeFunc()
		if(this.mouse_start_event_closeFunc) this.mouse_start_event_closeFunc()
		

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
		this.cfg.fontSize = this.vs_editor.getRawOptions().fontSize;
		this.cfg.search_history = this.search_history;
		this.cfg.self_flex_per = this.self_flex_per;
		delete this.cfg.language;
		config.saveStorage();
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
			if(this._isMoveDown){
				this.openActiveFile(!this.is_save_wait_up,!this.is_save_wait_up);
			}
		},

		// 项目资源文件uuid发生改变
		'asset-db:asset-uuid-changed'(event) {
		},

		// 项目资源文件发生改变
		'asset-db:asset-changed'(event, info) {
			if(!this.is_init_finish  || this.code_file_rename_buf.is_use || this.is_not_select_active) return;

			this.checkAllCurrFileChange();
			let url = Editor.remote.assetdb.uuidToUrl(info.uuid);
			if(url) return;

			let edit_id = this.getTabIdByPath(url);
			if(edit_id == null || !this.edit_list[edit_id] || !this.edit_list[edit_id].is_need_save)
			{
				// 刷新文件/代码提示,只有未被编辑情况下才刷新
				let urlI = this.getUriInfo(url)
				this.loadCompleterLib(url, urlI.extname, true);
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
					this.upCompCodeFile();
				}
			})
			this.upAllSymSuggests()
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
				if(this.cfg.renameConverImportPath && ( urlI.extname == '.js' || urlI.extname == '.ts'))
				{
					this.isIdleTsWorker((isIdle)=>
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
					})
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
					Editor.warn('未找到文件,vs_model == null:',info.uri && info.uri._formatted);
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
			if (this.file_info.uuid == null || !this.cfg.is_cmd_mode) return Editor.log("只能在命令模式执行代码预览");

			let args;
			if (type == "cmd") {
				if (this.edit_id == 0 || this.file_info.uuid == "outside") {
					args = { type, data: this.vs_editor.getValue() };
				} else {
					args = { type, uuid: this.file_info.uuid, data: fs.readFileSync(this.CMD_FILE_PATH).toString() };// 运行节点的脚本
				}
			} else {
				args = { type: type, data: fs.readFileSync(this.CMD_FILE_PATH).toString() };
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
tools.extendTo(layer,vsEditorPanel);
Editor.Panel.extend(layer);
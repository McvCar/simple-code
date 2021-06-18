// 代码编辑器窗口
// 编辑功能 MonaocEditor 编辑器面板

Editor.require('packages://simple-code/panel/vs-panel/ace/ace.js');

const vsEditorPanel = Editor.require('packages://simple-code/panel/vs-panel/vs-panel-base.js');
const acePanel = Editor.require('packages://simple-code/panel/vs-panel/ace-panel.js');
const tools = Editor.require('packages://simple-code/tools/tools.js');
const config = Editor.require('packages://simple-code/config.js');
const keyMap = Editor.require('packages://simple-code/keyMap.js');
const fs 	= require('fs');
const path 	= require("path");

const eventMerge 	= Editor.require('packages://simple-code/tools/eventMerge');


const prsPath = Editor.Project && Editor.Project.path ? Editor.Project.path : Editor.remote.projectPath;

let _scripts = [];
let is_hint = false;
let layer = {
	
	style:'',

	template: `
			<div id="box">
				<div id="editorA"></div>
				<div id="editorB"></div>
				<div id="layoutTab" class="layout horizontal justified titleBarFontSize">
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
				<div id="dropBg" class="dropBg"></div>
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
		dropBg:'#dropBg',
		toolsPanel: '#toolsPanel',
	},

	// 启动事件
	ready() 
	{
		this.initStartData()
		this.initCSS()
		this.runExtendFunc("ready",this);
		this.initVsEditor(()=>{
			this.initData();
			this.initBindEvent();
			this.initKeybody();
			this.setWaitIconActive(false);
			this.upCurrSceneChildrenInfo();
			this.is_init_finish = true;
			this.runExtendFunc("onLoad",this);
			this.setOptions(this.cfg,true);
			window._panel = this;
		});
	},
	
	initCSS()
	{
		let text = 
			// ace.editorCss +
			fs.readFileSync(Editor.url("packages://simple-code/panel/vs-panel/index.css"), "utf-8") + '\n'+
			fs.readFileSync(Editor.url("packages://simple-code/panel/vs-panel/monaco-editor/dev/vs/editor/editor.main.css"), "utf-8");
			

		var style = document.createElement("style");
		style.innerHTML = text;
		this.$box.appendChild(style);
		this.styleSheet = style.sheet;
	},

	initStartData(){
		// 游戏资源路径缓存
		this.file_list_buffer = [];
		this.file_list_map 	  = {};
		// 读取配置文件
		this.$title0.style.display = 'none';
		this.timer_map 			= {};
		this.cfg 				= config.getLocalStorage();
		this.pro_cfg 			= config.getProjectLocalStorage()
		this.ace				= new acePanel(this)
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
		if(cfg.titleBarFontSize != null){
			this.setCssByName('.titleBarFontSize',`{font-size: ${cfg.titleBarFontSize}px}`)
		}
		this.runExtendFunc("setOptions", cfg,isInit);
	},

	setCssByName(name,infoText){
		for (let i = 0; i < this.styleSheet.cssRules.length; i++) {
			const css_rule = this.styleSheet.cssRules[i];
			if(css_rule.selectorText == name){
				this.styleSheet.deleteRule(i)
				this.styleSheet.insertRule(name +' '+ infoText,0)
				break;
			}
			
		}
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
		// 搜索历史
		this.search_history = this.pro_cfg.search_history  = this.pro_cfg.search_history || [];

		this.setLockWindow(this.cfg.is_lock_window);
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
			this.ace.openMenu()
		},false);

		// 重置
		this.$resetBtn.addEventListener('confirm', () => {
			if (this.file_info) {
				let text = this.fileMgr.checkCurrFileChange(this.file_info);
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

		// 读取拖入的文件
		this.$editorB.addEventListener('dragover',(e)=>{
			// if(e.dataTransfer.files[0]){
				this.$dropBg.style.display = "block";
				e.preventDefault();
				e.stopPropagation();
			// }
		},false)
		
		// 读取拖入的文件
		this.$editorB.addEventListener('drop',(e)=>{
			this.$dropBg.style.display = "none";
			this.onDrag(e);
		},false);

		
		this.$editorB.addEventListener('dragleave',(e)=>{
			this.$dropBg.style.display = "none";
		},false);
		
		
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

			if(!this.isFocused()){
				this._isMoveDown = true
				this.setTimeoutById(()=>this._isMoveDown = false,2000,'mousedow')
			}
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
			this.upNeedImportListWorker()
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

	// 键盘键事件
	initKeybody() {
		let pressedKeys = {};
		let _this = this;
		let ret_type;

		let onApplyEvent = (e, type) => {
			let ret_type = true;
			let count = 0;
			let removeKey;
			for (let n in pressedKeys) if(pressedKeys[n]) count++;
			// let removeList = []	

			_this.key_cfg.forEach((cfg, i) => 
			{
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
								if(count == 1 && tools.inputTypeChk(e)){
									return; // 单键情况下且处于编辑文本状态则不触发快捷键
								}
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

		this.addKeybodyEvent([["Ctrl", "s"], ["Meta", "s"]], (e) => 
		{
			// 保存后格式化文档
			if(this.cfg.formatOnSaveFile){
				this.vs_editor.trigger('anything','editor.action.formatDocument')
				setTimeout(()=>{
					this.saveFile(true);
				},100)
			}else{
				this.saveFile(true);
			}

			
			e.preventDefault();// 吞噬捕获事件
			return false;
		}, 1, "keydown");

		// 关闭页面
		this.addKeybodyEventByName('closeTab', (e) => {
			this.closeTab(this.edit_id);
			e.preventDefault();// 吞噬捕获事件
			return false;
		}, 1, "keydown");


		// tab 左移
		this.addKeybodyEventByName('prevView', (e) => {
			this.tabToLeft(true);
			e.preventDefault();// 吞噬捕获事件
			return false;
		}, 1, "keydown");

		// tab 右移
		this.addKeybodyEventByName('nextView', (e) => {
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

	// 按钮事件
	addKeybodyEventByName(keyName, callback, isOnEditorRun, touchType = "keydown") {
		let arrKeys = this.getKeys(keyName);
		if(arrKeys){
			this.addKeybodyEvent(arrKeys, callback, isOnEditorRun, touchType) 
		}
	},

	getKeys(keyName){
		let keyInfo = keyMap[keyName];
		if(keyInfo){
			return Editor.isWin32 ? keyInfo.win32 : keyInfo.mac;
		}
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
		for (const url in this.file_cfg) {
			if(this.getTabIdByPath(url) == null){
				delete this.file_cfg[url];
			}
		}
		for (let key in this.file_cfg) {
			if (!temp_path_map[key]) delete this.file_cfg[key];
		}

		this.edit_list.forEach((_,id) => {
			this.closeTab(id);
		});
		
		let models = this.monaco.editor.getModels();
		for (const key in models) {
			const model = models[key];
			if(model) model.dispose();
		}

		//  写入配置
		this.cfg.fontSize = this.vs_editor.getRawOptions().fontSize;
		this.cfg.search_history = this.search_history;
		this.cfg.self_flex_per = this.self_flex_per;
		delete this.cfg.language;
		config.saveStorage();
	},


	initExtend() 
	{
		// 合并事件函数,分发
		let info = eventMerge.eventMerge(this.messages, "panel_ex.js");
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

	// 拖入事件
	onDrag(e){
		e.preventDefault();
		var fileObj = e.dataTransfer.files[0];
		if(fileObj){
			if(!this.openOutSideFile(fileObj.path,true))
			{
				Editor.log('暂不支持该文本类型:',path.extname(fileObj.path));
			}
		}
		
		this.runExtendFunc('onDrag',e)
	},

	// 扩展使用的事件
	onAssetsChangedEvent(file){
		this.runExtendFunc('onAssetsChangedEvent',file)
	},
	onAssetsCreatedEvent(files){
		this.runExtendFunc('onAssetsCreatedEvent',files)
	},
	onAssetsDeletedEvent(files){
		this.runExtendFunc('onAssetsDeletedEvent',files)
	},
	onAssetsMovedEvent(files){
		this.runExtendFunc('onAssetsMovedEvent',files)
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
			if(!this.is_init_finish ||this.is_not_select_active) return;
			// 阻止保存时tab乱切换
			if(this._isMoveDown || !this.isFocused()){
				this.openActiveFile(!this.is_save_wait_up && this.cfg.clickToViewCode,!this.is_save_wait_up);
			}
		},

		// 项目资源文件uuid发生改变
		'asset-db:asset-uuid-changed'(event) {
		},

		// 项目资源文件发生改变
		'asset-db:asset-changed'(event, info) {
			if(!this.is_init_finish || this.is_not_select_active) return;

			this.fileMgr.assetsChangedEvent(info);
			this.onAssetsChangedEvent(info);
		},

		// 项目资源创建
		'asset-db:assets-created'(event, files) {
			if(!this.is_init_finish) return;
			if (!files && this.file_list_buffer) return;

			this.fileMgr.assetsCreatedEvent(files)
			this.onAssetsCreatedEvent(files);
		},

		// 项目文件被删除
		'asset-db:assets-deleted'(event, files) {
			if(!this.is_init_finish) return;
			if (!files && this.file_list_buffer) return;

			
			this.fileMgr.assetsDeletedEvent(files)
			this.onAssetsDeletedEvent(files);
		},

		// 项目文件被移动了
		'asset-db:assets-moved'(event, files) 
		{
			if(!this.is_init_finish) return;
			if (!files) return;

			this.fileMgr.assetsMovedEvent(files)
			this.onAssetsMovedEvent(files);
		},


		'open-code-file'(e,file){
			this.openOutSideFile(file,true)
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
				this.ace.openMenu();
			}
		}
	}
};

layer.initExtend();
tools.extendTo(layer,vsEditorPanel);
Editor.Panel.extend(layer);
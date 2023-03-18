// 代码编辑器窗口
// 编辑功能 MonaocEditor 编辑器面板

Editor.require('packages://simple-code/panel/vs-panel/ace/ace.js');

const statistical 	= Editor.require('packages://simple-code/tools/statistical.js');
const vsEditorPanel = Editor.require('packages://simple-code/panel/vs-panel/vs-panel-base.js');
const acePanel 		= Editor.require('packages://simple-code/panel/vs-panel/ace-panel.js');
const tools 		= Editor.require('packages://simple-code/tools/tools.js');
const config 		= Editor.require('packages://simple-code/config.js');
const keyMap 		= Editor.require('packages://simple-code/keyMap.js');
const packageCfg 	= Editor.require('packages://simple-code/package.json');
const updater 		= Editor.require('packages://simple-code/tools/updater.js');
const fs 			= require('fs');
const path 			= require("path");
const electron 		= require('electron');

const eventMerge 	= Editor.require('packages://simple-code/tools/eventMerge');


const prsPath = Editor.Project && Editor.Project.path ? Editor.Project.path : Editor.remote.projectPath;

let _scripts = [];
let is_hint = false;

tools.initI18t()
/** @extends vsEditorPanel */
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
						<ui-checkbox id="lockChk" title="锁定当前文件后不再自动关闭">${tools.translate('lock-tab')}</ui-checkbox>
						<ui-checkbox id="lockWindowChk" title="锁定后窗口不再自动缩放">${tools.translate('lock-win')}</ui-checkbox>
						<ui-button id="manualCompile" class="">${tools.translate('manual-compile')}</ui-button>
						<ui-button id="gotoFileBtn" class="blue">${tools.translate('goto-file-btn')}</ui-button>
						<ui-button id="settingBtn" class="green">${tools.translate('set')}</ui-button>
						<ui-button id="resetBtn" class="red">${tools.translate('reset')}</ui-button>
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
			fs.readFileSync(Editor.url("packages://simple-code/panel/vs-panel/vs-panel.css"), "utf-8") + '\n'+
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
		// ipc event
		this.listenIpcList	  = []
		// creator编辑资源选择信息
		this.currCreatorEditorSelectInfo = {}
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
		if(cfg.codeCompileMode != null || isInit){
			this.$manualCompile.hidden = cfg.codeCompileMode != 'manual';
			this.$gotoFileBtn.hidden = cfg.codeCompileMode == 'manual';
		}
		if(cfg.titleBarFontSize != null){
			this.setCssByName('.titleBarFontSize',`{font-size: ${cfg.titleBarFontSize}px}`)
		}
		if(cfg.isCheckUpdater != null && cfg.isCheckUpdater){
			this.checkUpdate();
		}
		
		this.runExtendFunc("setOptions", cfg,isInit);
		if(!isInit) this.saveOptionsByDelayTime()
	},

	
	saveOptionsByDelayTime(){
		this.setTimeoutById(()=>{
			this.saveOptions()
		},1000,'saveOptionsByDelayTime')
	},
	
	saveOptions(){
		//  写入配置
		this.cfg.fontSize = this.vs_editor.getRawOptions().fontSize;
		this.cfg.search_history = this.search_history;
		this.cfg.self_flex_per = this.self_flex_per;
		delete this.cfg.language;
		config.saveStorage();
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
				if(cfg[option.path] === undefined && option.defaultValue !== undefined){
					cfg[option.path] = option.defaultValue; // 补充缺失的配置，升级版本导致的
				}
			}
		}
		return cfg;
	},

	// 加载数据
	initData() {
		this.mouse_pos;
		this.is_init_finish = false;
		this.waitSaveIntervals = {}
		// 当前场景所有子节点信息缓存
		this.currSceneChildrenInfo = [];
		// 搜索历史
		this.search_history = this.pro_cfg.search_history  = this.pro_cfg.search_history || [];

		this.setLockWindow(this.cfg.is_lock_window);
	},

	// 綁定事件
	initBindEvent() {

		// 失去焦点，编译代码
		// this.addEventListener('blur', () => {
		// 	if(this.cfg.codeCompileMode == 'blur'){
		// 		this.refreshSaveFild(false)
		// 	}
		// },false);

		// 失去焦点
		this.$box.addEventListener("blur",()=>
		{
			if(this.cfg.autoSaveFile == 'blur'){
				let oldEditId = this.edit_id || -1;
				// 失去焦点自動保存文件，延迟为了防止点击node切换时切换不了标签
				this.setTimeoutById(()=>{
					if (!this.getTabDiv(oldEditId)) return;
					this.saveFileFromDelayTime(false,false,oldEditId,false);
					 // 失去焦点時編譯文件
					if(this.cfg.codeCompileMode == 'blur'){
						this.refreshSaveFild(false)
					}
				},500,'autoSaveFileInterval_'+oldEditId);

			}else{
				if(this.cfg.codeCompileMode == 'blur'){
					this.refreshSaveFild(false) // 失去焦点時編譯文件
				}
			}
		},true)

		// 手动编译
		this.$manualCompile.addEventListener('confirm', () => {
			// if (this.file_info) this.saveFile(true);
			this.refreshSaveFild(true)
		},false);

		// 设置
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
			this.saveOptionsByDelayTime()
		});
		

		// node或assets 启动拖拽事件
		let dragsArgs = {}
		this.addListenerIpc("editor:dragstart", (e, t)=>{
			dragsArgs = {
				type : t.type,
				items : t.items,
				options : t.options
			}
        });

		this.addListenerIpc("editor:dragend", ()=>{
            dragsArgs = null;
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
			this.onDrag(e,dragsArgs || {});
		},false);

		
		this.$editorB.addEventListener('dragleave',(e)=>{
			this.$dropBg.style.display = "none";
		},false);
		
		this.addListenerIpc('selection:hoverin',(e,type,uuid)=>{
			this.onEditorSelectionHoverin(type,uuid);
		})

		// 鼠标右键nodeTree|asset
		this.addListenerIpc('selection:context',(e,type,uuid)=>{
			if(uuid == null){
				let curSls = Editor.Selection.curGlobalActivate()
				if(curSls && curSls.id != null){
					return; // 下面函数 selection:activated 继续调用
				}
			}
			this.onEditorSelection(type,uuid);
		})

		// 鼠标左键选中、取消
		this.addListenerIpc('selection:activated',(e,type,uuid)=>{
			this.onEditorSelection(type,uuid);
		})

		
		
		
		// 记录鼠标位置，用于菜单位置
		let mousemove = (e)=>{
			this.mouse_pos = {y:e.clientY,x:e.clientX}
		}
		this.addWindowEventListener('mousemove',mousemove,true)

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
		this.addWindowEventListener('mousedown',mousedown,true)

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

	addListenerIpc(name,callback){
		this.listenIpcList.push({name,callback});
		electron.ipcRenderer.on(name,callback);
	},

	upLayout(){
		if (this.old_width == null || Math.abs(this.$box.clientWidth - this.old_width) >3 || this.old_height == null || Math.abs(this.$box.clientHeight - this.old_height) >3) {
			this.old_width = this.$box.clientWidth;
			this.old_height = this.$box.clientHeight;
			this.vs_editor.layout();
			return true;
		}
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
								if(count == 1 && e.key.length == 1 && tools.inputTypeChk(e)){
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
		
		
		this.addWindowEventListener("keydown", function (e) {
			pressedKeys = {
				[config.keyMap[e.keyCode] ? config.keyMap[e.keyCode] : e.key] : 1,
				['Alt'] : e.altKey,
				['Ctrl'] : e.ctrlKey,
				['Meta'] : e.metaKey,
				['Shift'] : e.shiftKey,
			}
			ret_type = onApplyEvent(e, 'keydown');
			_this.runExtendFunc("onKeyDown", e);
			// console.log("A",e.key,pressedKeys)
			return ret_type;
		}, true);

		this.addWindowEventListener("keypress", function (e) {
			
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

		this.addWindowEventListener("keyup", function (e) {
			// pressedKeys = {};
			pressedKeys = {
				[config.keyMap[e.keyCode] ? config.keyMap[e.keyCode] : e.key] : 1,
				['Alt'] : e.altKey,
				['Ctrl'] : e.ctrlKey,
				['Meta'] : e.metaKey,
				['Shift'] : e.shiftKey,
			}
			_this.runExtendFunc("onKeyUp", e);
		}, true);

		// 重置key
		this.addWindowEventListener("focus", () => pressedKeys = {},true)
		
		// 阻挡冒泡creator的快捷键
		// this.$box.addEventListener("keydown", (e)=> {
		// 	let className = e.path[0] && e.path[0].className || ''
		// 	if (className.indexOf('monaco') != -1 && (e.key == "w" || e.key == "e" || e.key == "r" || e.key == "t")) e.stopPropagation()
		// }, false);

		this.addKeybodyEvent([["Ctrl", "s"], ["Meta", "s"]], (e) => 
		{
			let id = this.file_info.id;
			this.saveFileFromDelayTime(true,false,id);
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

		// tab 
		this.addKeybodyEventByName('switchTab', (e) => {
			this.setTabPage(this.old_edit_id);
			e.preventDefault();// 吞噬捕获事件
			e.stopPropagation()
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
		if(!this.isInitEditorScene){
			return
		}
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
	
	// 窗口获得焦点
	onFocus(){
		this._super()
		this.runExtendFunc("onFocus");
	},

	// 窗口失去焦点
	// onBlur(){
	// 	this._super()
	// 	this.runExtendFunc("onBlur");
	// },

	// onclose(){
	// 	this.onDestroy()
	// },

	// 页面关闭
	onDestroy() 
	{ 
		if(this._is_destroy || this.edit_list == null) return;
		this._is_destroy = true;
		this._super();
		this.runExtendFunc("onDestroy");

		// 移除 window 事件
		window.removeEventListener('beforeunload',this.onDestroy,false);
		for (let i = 0; i < this.window_event_listener.length; i++) {
			const event = this.window_event_listener[i];
			window.removeEventListener(event.eventName,event.callback,event.option)
		}
		// 移除ipc事件
		for (let i = 0; i < this.listenIpcList.length; i++) {
			const event = this.listenIpcList[i];
			electron.ipcRenderer.removeListener(event.name,event.callback);
		}

		// 停止事件
		if (this.schFunc) this.schFunc();
		if(this.menu && this.menu.destroy) this.menu.destroy()
		this.menu = null;

		// 手动编译的文件
		this.refreshSaveFild();

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
		
		// 延迟清除缓存，如果creator窗口被关闭就不需要清除
		let models = this.monaco.editor.getModels();
		setTimeout(()=>{
			for (const key in models) {
				const model = models[key];
				if(model) model.dispose();
			}
		},0.01)

		this.saveOptions();
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

	/**鼠标左或右点击节点树或资源目录时触发
	 * @param type = node | asset 
	 * */ 
	onEditorSelection(type,uuid){
		if(!this.isInitEditorScene){
			return;
		}
		this.onRefreshCreatorMenu(type,uuid);
		this.runExtendFunc('onEditorSelection',type,uuid);
	},

	
	/**鼠标移动经过节点树或资源目录时触发
	 * @param type = node | asset 
	 * */ 
	 onEditorSelectionHoverin(type,uuid){
		if(!this.isInitEditorScene){
			return;
		}
		this.onRefreshCreatorMenu(type,uuid);
		this.runExtendFunc('onEditorSelectionHoverin',type,uuid)
	},

	/** 需要刷新creator右键菜单
	 * @param type = node | asset 
	 * */ 
	 onRefreshCreatorMenu(type,uuid){
		if(!this.is_init_finish) return;
		this.currCreatorEditorSelectInfo.type = type;
		this.currCreatorEditorSelectInfo.uuid = uuid;
		this.runExtendFunc('onRefreshCreatorMenu',type,uuid)
	},

	/**
	 * 拖入事件
	 * @param {evnt} e 
	 * @param {object} dragsArgs - {type:'node',items:[{id:'uuidxx',name:''}]} || {}
	 */
	onDrag(e,dragsArgs){
		e.preventDefault();
		var fileObj = e.dataTransfer.files[0];
		if(fileObj){
			if(!this.openOutSideFile(fileObj.path,true))
			{
				Editor.log('暂不支持该文本类型:',path.extname(fileObj.path));
			}
		}
		
		this.runExtendFunc('onDrag',e,dragsArgs)
	},

	// 扩展使用的事件
	onAssetsChangedEvent(file){
		this._super(file);
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
	
	// 正在切换页面标签栏
	onSwitchTab(oldEditId = -1,newEditId){
		this._super(oldEditId,newEditId);
		if (!this.getTabDiv(oldEditId)){
			return;
		} 

		if(this.cfg.autoSaveFile == 'blur'){
			// 失去焦点自動保存文件
			this.saveFileFromDelayTime(false,false,oldEditId,false);
		}
	},

	// 检查更新
	async checkUpdate() {
		const newVersionDesc = await updater.check();
		// 打印到控制台
		if (newVersionDesc) {
			let hitnText = tools.translateZhAndEn('发现新版本,请过”扩展商店”下载更新,更新内容如下:\n','If you find the new version, please go to the "Extension Store" to download the update as follows :\n')
			Editor.info(`[${packageCfg.description}]`, hitnText ,newVersionDesc);
		}

		statistical.countStartupTimes();
	},


	messages: {

		// 场景保存
		'scene:saved'(event) {
			if(!this.is_init_finish) return;
			this.saveFileFromDelayTime();
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
module.exports = layer;
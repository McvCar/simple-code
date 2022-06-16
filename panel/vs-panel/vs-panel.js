// 代码编辑器窗口
// 编辑功能 MonaocEditor 编辑器面板
clearRequireCache()
const Editor2D 		= require('../../tools/editor2D');
Editor2D.analogApi()

const fs 			= require('fs');
const path 			= require("path");
const electron 		= require('electron');
const tools 		= require('../../tools/tools');
const ccMenuMgr		= require('./cc-menu-mgr.js');
const injectScriptService = require('./inject-script-service');
tools.initI18t();

// 加载编辑器里的 node_modules,有些公共库需要用的如：md5
module.paths.push(path.join(Editor.App.path, 'node_modules'));

Editor2D.require('packages://simple-code/panel/vs-panel/ace/ace.js');
const VsEditorPanel = require('./vs-panel-base');
const config 		= require('../../config');
const packageCfg 	= require('../../package');
const statistical 	= Editor2D.require('packages://simple-code/tools/statistical.js');
const acePanel 		= Editor2D.require('packages://simple-code/panel/vs-panel/ace-panel.js');
const updater 		= Editor2D.require('packages://simple-code/tools/updater.js');
const eventMerge 	= Editor2D.require('packages://simple-code/tools/eventMerge');

const keyMap  = config.getUserKeyMap();
const prsPath = Editor.Project && Editor.Project.path ? Editor.Project.path : Editor.remote.projectPath;


let _scripts = [];
let isShowUpdate = false;

// 编辑器面板
class EditorPanel extends VsEditorPanel{
	constructor(args){
		super(args);
		this.messages = methods;
		this.ready(args);
	}

	/** @type monaco */
	monaco = null;
	/** @type import("./file-mgr") */
	fileMgr = null;
	/** @type import("./cc-menu-mgr") */
	ccMenuMgr = null;

	// 启动事件
	ready(args) 
	{
		// console.log("启动")
		this.$ = args.$;
		this.initStartData();
		this.initCSS();
		this.checkJustUpgraded();
		this.runExtendFunc("ready",this);
		this.initVsEditor(()=>{
			this.initData();
			this.initBindEvent();
			this.initKeybody();
			this.setWaitIconActive(false);
			this.initCocosCreatorBroadcastEvent();
			this.is_init_finish = true;
			this.runExtendFunc("onLoad",this);
			this.setOptions(this.cfg,true);
			window._panel = this;
		});
	}


	// 绑定creator事件,启动阶段绑定会失效
	initCocosCreatorBroadcastEvent(){
		for (const key in this.messages) {
			if(key.indexOf(':') != -1){
				this.addBroadcastListener(key,this.messages[key]);
			}
		}
	}

	
	initCSS()
	{
		let text = 
			// ace.editorCss +
			fs.readFileSync(Editor2D.url("packages://simple-code/panel/vs-panel/vs-panel.css"), "utf-8") + '\n'+
			fs.readFileSync(Editor2D.url("packages://simple-code/panel/vs-panel/monaco-editor/dev/vs/editor/editor.main.css"), "utf-8");
			

		var style = document.createElement("style");
		style.innerHTML = text;
		this.$.box.appendChild(style);
		this.styleSheet = style.sheet;
	}


	initStartData(){
		// 游戏资源路径缓存
		this.file_list_buffer = [];
		this.file_list_map 	  = {};
		// ipc event
		this.listenIpcList	  = []
		// addBroadcastListener
		this.listenBroadcastList = []
		// creator编辑资源选择信息
		this.currCreatorEditorSelectInfo = {}
		this.timer_map 			= {};
		// 读取配置文件
		this.$.title0.style.display = 'none';
		this.panel 				= Editor2D.Panel.find("simple-code.vsEditor");
		this.cfg 				= config.getLocalStorage();
		this.pro_cfg 			= config.getProjectLocalStorage();
		this.ace				= new acePanel(this);
		this.ccMenuMgr			= new ccMenuMgr(this);
		this.injectScriptService = new injectScriptService();
	}

	// 是否刚升级
	checkJustUpgraded(){
		
		let old_version = localStorage.getItem('simple-code-version') || packageCfg.version;
		if(old_version != packageCfg.version){
			setTimeout(()=>confirm(`检测到[${packageCfg.description}]已升级,\n为了防止插件出问题,请重启Cocos Creator`),1000);
		}
		localStorage.setItem('simple-code-version',packageCfg.version)
	}

	// 设置选项
	setOptions(cfg,isInit) 
	{	
		// 基类
		super.setOptions(cfg,isInit);

		if (cfg.newFileType != null) {
			localStorage.setItem("newFileType", cfg.newFileType || "ts");
		}
		if(cfg.tabBarPos != null){
			this.setTabBarPos(cfg.tabBarPos);
	}
		if(cfg.hideToolsBar != null){
			this.$.toolsPanel.hidden = cfg.hideToolsBar;
		}
		if(cfg.codeCompileMode != null || isInit){
			this.$.manualCompile.style.display = cfg.codeCompileMode == 'manual' ? 'inline-block' : 'none';
			this.$.gotoFileBtn.style.display = cfg.codeCompileMode != 'manual' ? 'inline-block' : 'none';
		}
		if(cfg.titleBarFontSize != null){
			this.setCssByName('.titleBarFontSize',`{font-size: ${cfg.titleBarFontSize}px}`)
		}
		if(cfg.isCheckUpdater != null && cfg.isCheckUpdater){
			this.checkUpdate();
		}
		
		this.runExtendFunc("setOptions", cfg,isInit);
		if(!isInit) this.saveOptionsByDelayTime()
	}


	
	saveOptionsByDelayTime(){
		this.setTimeoutById(()=>{
			this.saveOptions()
		},1000,'saveOptionsByDelayTime')
	}

	
	saveOptions(){
		//  写入配置
		this.cfg.fontSize = this.vs_editor.getRawOptions().fontSize;
		this.cfg.self_flex_per = this.self_flex_per;
		delete this.cfg.language;
		config.saveStorage();
	}


	setCssByName(name,infoText){
		for (let i = 0; i < this.styleSheet.cssRules.length; i++) {
			const css_rule = this.styleSheet.cssRules[i];
			if(css_rule.selectorText == name){
				this.styleSheet.deleteRule(i)
				this.styleSheet.insertRule(name +' '+ infoText,0)
				break;
			}
		}
	}


	// 加载数据
	initData() {
		// 鼠标状态
		this.mouse_pos;
		this.mouseDownItem;
		this.is_mouse_down; 
		
		this.is_init_finish = false;
		this.waitSaveIntervals = {}
		// 当前场景所有子节点信息缓存
		this.currSceneChildrenInfo = [];

		this.setLockWindow(this.cfg.is_lock_window);
	}


	// 綁定事件
	initBindEvent() {

		// 失去焦点，编译代码
		this.panel.addEventListener('blur', () => 
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
		},false);

		// 手动编译
		this.$.manualCompile.addEventListener('confirm', () => {
			// if (this.file_info) this.saveFile(true);
			this.refreshSaveFild(true)
		},false);

		// 设置
		this.$.settingBtn.addEventListener('confirm', () => {
			// if (this.file_info) this.saveFile(true);
			this.ace.openMenu()
		},false);

		// // 重置
		// this.$.resetBtn.addEventListener('confirm', () => {
		// 	if (this.file_info) {
		// 		let text = this.fileMgr.checkCurrFileChange(this.file_info);
		// 		if (this.file_info.data != this.vs_editor.getValue()) {
		// 			if (text) {
		// 				this.vs_editor.setValue(text);
		// 				this.file_info.is_need_save = false;
		// 				this.file_info.data = text;
		// 				this.upTitle();
		// 			}
		// 		}
		// 		if (!text) {
		// 			this.file_info.uuid = null; // 文件已被删除
		// 			this.file_info.is_need_save = false;
		// 			this.oepnDefindFile();
		// 		}
		// 	}
		// });
		
		// 定位文件
		this.$.gotoFileBtn.addEventListener('confirm', () => {
			if (this.file_info) {
				this.scriptHint(this.file_info.uuid);
			}
		});

		// 锁定编辑
		this.$.lockChk.addEventListener('change', () => {
			this.setLockEdit(this.$.lockChk.checked ? true : false);
		});

		// 锁定窗口
		this.$.lockWindowChk.addEventListener('change', () => {
			this.setLockWindow(this.$.lockWindowChk.checked ? true : false);
			this.saveOptionsByDelayTime()
		});
		
		// 鼠标进过nodeTree或assets item
		// let oldPathDom;
		// let oldItem;
		// let onSelectionHoverin = (e,isMouseDown)=>{
		// 	if(!isMouseDown && e.path[0] == oldPathDom){
		// 		return;
		// 	}
		// 	oldPathDom = e.path[0];
		// 	// 读取当前鼠标所在位置的资源或Node列表信息
		// 	for (let i = 0; i < Math.min(5,e.path.length); i++) {
		// 		let vueObj = e.path[i].__vue__;
		// 		if(vueObj)
		// 		{
		// 			let itemInfo;
		// 			if(vueObj.asset){
		// 				itemInfo = {type:'asset',uuid:vueObj.asset.uuid}
		// 			}else if(vueObj.node){
		// 				itemInfo = {type:'node',uuid:vueObj.node.uuid}
		// 			}
		// 			// 鼠标移动经过节点树或资源目录时触发
		// 			if(itemInfo){
		// 				if(!isMouseDown && oldItem && oldItem.uuid == itemInfo.uuid){
		// 					return;
		// 				}
		// 				oldItem = itemInfo;
		// 				if(isMouseDown) this.mouseDownItem = itemInfo; // 记录鼠标所在位置资源信息
		// 				this.onEditorSelectionHoverin(itemInfo.type,itemInfo.uuid);
		// 				return;
		// 			}	
		// 		}
		// 	}
		// 	if(oldItem != null){
		// 		oldItem = undefined;
		// 		this.onEditorSelectionHoverin();
		// 	}
		// }
		
		// 记录鼠标位置,用于菜单位置
		let mousemove = (e)=>{
			// onSelectionHoverin(e);
			this.mouse_pos = {y:e.clientY,x:e.clientX}
		}
		this.addWindowEventListener('mousemove',mousemove,true)

		//// 用于触发双击事件、刷新creator菜单事件
		// let mousedown = (e)=>{
		// 	let now_time =  new Date().getTime();
		// 	if(this._mousedown_time == null || now_time - this._mousedown_time>300){
		// 		this._mousedown_time = new Date().getTime()
		// 	}else{
		// 		// 双击事件分发
		// 		let mouse_pos = {y:e.clientY,x:e.clientX}
		// 		this.onMouseDoubleClick(mouse_pos);
		// 	}

		// 	if(!this.isFocused()){
		// 		this._isMoveDown = true
		// 		this.setTimeoutById(()=>this._isMoveDown = false,2000,'mousedow')
		// 	}
		// 	onSelectionHoverin(e,true);
		// 	this.is_mouse_down = true;
		// }
		// this.addWindowEventListener('mousedown',mousedown,true)
		// this.addWindowEventListener('mouseup',()=>{
		// 	this.is_mouse_down = false;
		// },true)



		// *允许读取creator拖入的元素
		this.$.editorB.setAttribute("draggable", "true")
		// 读取拖入的文件
		this.$.editorB.addEventListener('dragover',(e)=>{
			// if(e.dataTransfer.files[0]){
				this.$.dropBg.style.display = "block";
				e.preventDefault();
				e.stopPropagation();
			// }
		},false)

		this.$.editorB.addEventListener('dragleave',(e)=>{
			this.$.dropBg.style.display = "none";
		},false);
		
		// 读取拖入的文件
		this.$.editorB.addEventListener('drop',(e)=>{
			this.$.dropBg.style.display = "none";
			
			let dragsArgs = {items:[]};
			let args = e.dataTransfer.getData('additional');
			if(args){
				args = JSON.parse(args)
				// creator的拖拽元素
				/**
				 * @type {Object} info
				 * @type {String} info.type "cc.Script"
				 * @type {String} info.value "44a54fdd-a048-4ca3-a744-7def8a82d9c3"
				 * @type {String} info.name "tools.ts"
				 */
				const info = args[0];
				if(info){
					dragsArgs.type = info.type == 'cc.Node' ? 'node' : 'asset';
					dragsArgs.items = args;
				}
			}
			this.onDrag(e,dragsArgs,this.mouseDownItem);
		},false);

		
		// 检测窗口改变大小调整 
		this.schFunc = this.setTimeoutToJS(() => 
		{
			if(this.panel.parentElement == null){
				// 本窗口已被删除
				this.onDestroy();
				return;
			}
			let is_up_layout = this.is_init_finish && this.upLayout()
			this.upNeedImportListWorker()
			this.onCheckLayout(is_up_layout)
		}, 0.5);
	}


	addListenerIpc(name,callback){
		this.listenIpcList.push({name,callback});
		electron.ipcRenderer.on(name,callback);
	}


	// creator事件广播监听
	addBroadcastListener(name,callback){
		
		let _callback = callback;//async(...args)=>{ console.log("监听:",name,await Editor.Message.request('asset-db','query-ready'))} // 修复未知警告
		this.listenBroadcastList.push({name,callback:_callback});
		Editor.Message.addBroadcastListener(name,_callback)
	}

	

	upLayout(){
		if (this.old_width == null || Math.abs(this.$.box.scrollWidth - this.old_width) >3 || this.old_height == null || Math.abs(this.$.box.scrollHeight - this.old_height) >3) {
			this.old_width = this.$.box.scrollWidth;
			this.old_height = this.$.box.scrollHeight;
			this.vs_editor.layout();
			return true;
		}
	}


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
		
		
		this.addDocumentEventListener("keydown", function (e) {
			pressedKeys = {
				[config.keyMap[e.keyCode] ? config.keyMap[e.keyCode] : e.key] : 1,
				['Alt'] : e.altKey,
				['Ctrl'] : e.ctrlKey,
				['Meta'] : e.metaKey,
				['Shift'] : e.shiftKey,
			}
			ret_type = onApplyEvent(e, 'keydown');
			_this.runExtendFunc("onKeyDown", e);
			// console.log("键盘:",e)
			return ret_type;
		}, true);

		this.addDocumentEventListener("keypress", function (e) {
			
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

		this.addDocumentEventListener("keyup", function (e) {
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
		this.addWindowEventListener("focus", () => pressedKeys = {},true)
		
		// 阻挡冒泡creator的快捷键
		// this.$.box.addEventListener("keydown", (e)=> {
		// 	let className = e.path[0] && e.path[0].className || ''
		// 	if (className.indexOf('monaco') != -1 && (e.key == "w" || e.key == "e" || e.key == "r" || e.key == "t")) e.preventDefault()
		// }, false);

		this.addKeybodyEvent([["Ctrl", "s"], ["Meta", "s"]],async (e) => 
		{
			let id = this.file_info.id;
			this.saveFileFromDelayTime(true,false,id);
			e.preventDefault();// 吞噬捕获事件
			// 保存刷新浏览器
			if (await Editor.Profile.getConfig("preview", "general.auto_refresh")){
				Editor.Message.send('preview','reload-terminal')
			}
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
		
	}


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
	}


	setTabBarPos(str){
		this.$.box.style.flexDirection = str ? 'column' : 'column-reverse';
	}

	
	// 锁定编辑
	setLockEdit(is_lock,id) 
	{
		id = id == null ? this.edit_id : id;
		let info = this.edit_list[id] || {};
		// 打开文件解除锁定编辑
		if (id == this.edit_id) this.$.lockChk.checked = is_lock;
		info.is_lock = is_lock;
		this.vs_editor.updateOptions({ lineNumbers: info.is_cmd_mode || id != 0 ? "on" : 'off' });
		this.vs_editor.updateOptions({ lineNumbers: info.is_cmd_mode || id != 0 ? "on" : 'off' });
		this.upTitle(id);
	}


	// 锁定窗口
	setLockWindow(is_lock) 
	{
		this.cfg.is_lock_window = is_lock;
		this.$.lockWindowChk.checked = is_lock ? true : false;
	}


	// 添加快捷键, 例子: this.addKeybodyEvent([ ["Ctrl","x"] ],()=>{})
	addKeybodyEvent(arrKeys, callback, isOnEditorRun, touchType = "keydown") {
		arrKeys.forEach((keys) => {
			keys.forEach((v, i) => {
				keys[i] = v == "Control" ? "Ctrl" : keys[i];
			})
			this.key_cfg.push({ keys, callback, mode: isOnEditorRun, touch_type: touchType });
		})
	}


	// 按钮事件
	addKeybodyEventByName(keyName, callback, isOnEditorRun, touchType = "keydown") {
		let arrKeys = this.getKeys(keyName);
		if(arrKeys){
			this.addKeybodyEvent(arrKeys, callback, isOnEditorRun, touchType) 
		}
	}


	getKeys(keyName){
		let keyInfo = keyMap[keyName];
		if(keyInfo){
			return Editor2D.isWin32 ? keyInfo.win32 : keyInfo.mac;
		}
	}


	// 高亮脚本
	scriptHint(uuid){
		Editor2D.Ipc.sendToAll('assets:hint', uuid);
		Editor2D.Scene.callSceneScript('simple-code', 'getEditFileBindNodes',uuid, (err, bindNodeList) => 
		{ 
			if(err) return;
			for (let i = 0; i < bindNodeList.length; i++) {
				const info = bindNodeList[i];
				Editor2D.Ipc.sendToAll('assets:hint', info.node_uuid);
			}
		});
	}

	
	setWaitIconActive(isActive){
		if(this.$.waitIco){
			this.$.waitIco.className = isActive ? 'turnAnim' : '';
		}
	}


	onCheckLayout(isUpLayout){
		this.runExtendFunc("onCheckLayout", isUpLayout);
	}


	onMouseDoubleClick(mousePos){
		this.runExtendFunc("onMouseDoubleClick",mousePos);
	}

	
	// 窗口获得焦点
	onFocus(){
		super.onFocus()
		this.runExtendFunc("onFocus");
	}


	// 窗口失去焦点
	onBlur(){
		super.onBlur()
		this.runExtendFunc("onBlur");
	}


	// onclose(){
	// 	this.onDestroy()
	// },

	// 页面关闭
	onDestroy() 
	{ 
		// console.log("释放")
		if(this._is_destroy || this.edit_list == null) return;
		this._is_destroy = true;
		this.tsWr.closeWorker();
		this.jsWr.closeWorker();
		super.onDestroy();
		this.runExtendFunc("onDestroy");
		
		this.monaco.removeAllEvent();

		// 移除Monaco事件
		for (let i = 0; i < this.monaco_editor_event_listener.length; i++) {
			const monacoEvent = this.monaco_editor_event_listener[i];
			monacoEvent.dispose()
		}

		for (let i = 0; i < this.window_event_listener.length; i++) {
			const event = this.window_event_listener[i];
			window.removeEventListener(event.eventName,event.callback,event.option)
		}
		for (let i = 0; i < this.document_event_listener.length; i++) {
			const event = this.document_event_listener[i];
			document.body.removeEventListener(event.eventName,event.callback,event.option)
		}
		
		
		// 移除ipc事件
		for (let i = 0; i < this.listenIpcList.length; i++) {
			const event = this.listenIpcList[i];
			electron.ipcRenderer.removeListener(event.name,event.callback);
		}

		// 移除Creator事件
		for (let i = 0; i < this.listenBroadcastList.length; i++) {
			const event = this.listenBroadcastList[i];
			Editor.Message.removeBroadcastListener(event.name,event.callback);
		}
		
		// 停止定时器
		for (const key in this.timer_map) {
			const stop = this.timer_map[key];
			if(stop) stop();
		}
		
		// 停止事件
		if (this.schFunc) this.schFunc();
		if(this.menu && this.menu.destroy) this.menu.destroy()
		this.menu = null;
		this.ccMenuMgr.onDestroy()
		this.injectScriptService.onDestroy();

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
		
		// this.tsWr.setEnableUpdate(false);
		// this.jsWr.setEnableUpdate(false); // 
		// this.tsWr.setEnableUpdateScript(false);
		// this.jsWr.setEnableUpdateScript(false);
		let models = this.monaco.editor.getModels();
		for (const key in models) {
			const model = models[key];
			if(model) model.dispose();
		}
		this.vs_editor.dispose();

		this.saveOptions();
	}
	


	initExtend() 
	{
		for (const key in this.messages) {
			this.messages[key] = this.messages[key].bind(this);
		}
		// 合并事件函数,分发
		let info = eventMerge.eventMerge(this.messages, "panel_ex.js");
		_scripts = info.scripts;
		this.messages = info.messages;
		
	}


	runExtendFunc(funcName, ...args) {
		_scripts.forEach((obj) => {
			if (obj[funcName]) {
				obj[funcName](...args);
			}
		})
	}

	
	/**鼠标移动经过节点树或资源目录时触发
	 * @param type = node | asset 
	 * */ 
	onEditorSelectionHoverin(type,uuid){
		this.onRefreshCreatorMenu(type,uuid);
		this.runExtendFunc('onEditorSelectionHoverin',type,uuid)
	}


	/** 需要刷新creator右键菜单,鼠标经过资源item时触发,菜单配置生成步骤需要使用到异步方法时才需要使用该事件
	 * @param type = node | asset 
	 * */ 
	onRefreshCreatorMenu(type,uuid){
		// console.log('onRefreshCreatorMenu',type,uuid)
		this.currCreatorEditorSelectInfo.type = type;
		this.currCreatorEditorSelectInfo.uuid = uuid;
		this.runExtendFunc('onRefreshCreatorMenu',type,uuid)
	}


	/**
	 * creator菜单即将弹出
	 * @param {string} type = 'assetMenu' | 'layerMenu'
	 * @param {Object} selectInfo 
	 * @param {String} selectInfo.uuid
	 * @param {String} selectInfo.type = 'asset' | 'node'
	 */
	onCCMenuPopup(type,selectInfo){
		selectInfo = this.currCreatorEditorSelectInfo;
		this.runExtendFunc('onCCMenuPopup',type,selectInfo)
	}


	/**
	 * 拖入事件
	 * @param {evnt} e 
	 * @param {object} dragsArgs - 拖拽的资源信息们 {type:'node',items:[{value:'uuidxx',name:'',type:"cc.Node"}]} || {}
	 * @param {object} mouseDownItem - 鼠标点击位置资源的信息 {type:'node',uuid:'xxxx'} || {}
	 */
	onDrag(e,dragsArgs,mouseDownItem){
		e.preventDefault();
		var fileObj = e.dataTransfer.files[0];
		let item = dragsArgs.items[0];
		if(fileObj){
			this.openOutSideFile(fileObj.path,true).then((m)=>{
				if(!m) Editor.log('暂不支持该文本类型:',path.extname(fileObj.path));
			})
		}else if(item && item.type == "cc.Script"){
			this.openFileByUuid(item.value,true)
		}
		// 分发事件给插件使用
		this.runExtendFunc('onDrag',e,dragsArgs,mouseDownItem)
	}


	/**
	 *  资源改变事件
	 * @param {Object} file
	 * @param {String} file.url
	 * @param {String} file.uuid
	 * @param {String} file.file
	 */ 
	onAssetsCreatedEvent(file){
		this.runExtendFunc('onAssetsCreatedEvent',file)
	}

	onAssetsDeletedEvent(file){
		this.runExtendFunc('onAssetsDeletedEvent',file)
	}

	onAssetsChangedEvent(file){
		super.onAssetsChangedEvent(file);
		this.runExtendFunc('onAssetsChangedEvent',file)
	}


	/**
	 *  移动资源文件
	 * @param {Object} file
	 * @param {String} file.url
	 * @param {String} file.uuid
	 * @param {String} file.file
	 * @param {String} file.srcPath
	 * @param {String} file.destPath
	 */ 
	onAssetsMovedEvent(file){
		this.runExtendFunc('onAssetsMovedEvent',file)
	}

    
    // 正在切换页面标签栏
    onSwitchTab(oldEditId = -1,newEditId){
        super.onSwitchTab(oldEditId,newEditId);
        if (!this.getTabDiv(oldEditId)){
            return;
        } 

        if(this.cfg.autoSaveFile == 'blur'){
            // 失去焦点自動保存文件
            this.saveFileFromDelayTime(false,false,oldEditId,false);
        }
    }

	// 检查更新
	async checkUpdate() {
		if(isShowUpdate) return;
		isShowUpdate = true;

		const newVersionDesc = await updater.check();
		// 打印到控制台
		if (newVersionDesc) {
			let hitnText = tools.translateZhAndEn('发现新版本,请过”扩展商店”下载更新,更新内容如下:\n','If you find the new version, please go to the "Extension Store" to download the update as follows :\n')
			Editor.Task.addNotice({title:packageCfg.description+':发现新版本',timeout:10000,type:'warn'})
			Editor.log(`[${packageCfg.description}]`, hitnText ,newVersionDesc);
		}
		statistical.countStartupTimes();
	}

};


let messages = {
	

	// 场景保存
	'scene:save'(event) {
		if(!this.is_init_finish) return;
		this.saveFileFromDelayTime();
	},

	// 场景加载完
	'scene:ready'(event) {
		if(!this.is_init_finish) return;
	},

	// 选择改变
	'selection:select'(event) {
		if(!this.is_init_finish || this.is_not_select_active) return;
		// 阻止保存时tab乱切换
		if(this._isMoveDown || !this.isFocused()){
			this.openActiveFile(!this.is_save_wait_up && this.cfg.clickToViewCode,!this.is_save_wait_up);
		}
	},

	// 项目资源创建
	'asset-add'(event, file) {
		if(!this.is_init_finish) return;
		if (!file && this.file_list_buffer) return;

		this.fileMgr.assetsCreatedEvent(file)
	},

	// 项目文件被删除
	'asset-delete'(event, file) {
		if(!this.is_init_finish) return;
		if (!file && this.file_list_buffer) return;

		
		this.fileMgr.assetsDeletedEvent(file)
	},

	// 项目资源文件发生改变、移动、重命名、
	'asset-change'(event, file) {
		if(!this.is_init_finish || this.is_not_select_active || file.isDirectory) return;

		this.fileMgr.assetsChangedEvent(file);
	},


	'open-code-file'(e,file){
		this.openOutSideFile(file,true)
	},

	// 快捷键打开当前选中文件/节点进入编辑
	'openSetting'(event, info) {
		if(!this.is_init_finish) return;

		this.ace.openMenu();
	},

	'openKeyMap'(){
		let file = config.getUserConfigPath(Editor2D.url("packages://simple-code/keyMap.js"));
		this.openOutSideFile(file,true)
	},

	'openConfig'(){
		let file = config.getUserConfigPath(Editor2D.url('packages://simple-code/editor_config.js'));
		this.openOutSideFile(file,true)
	},

	'openConfigHitn'(){
		let file = Editor2D.url("packages://simple-code/template/hint_text.txt");
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
	},

	'simple-code:on-mouse-double-click'(mousePos){
		if(mousePos){
			this.onMouseDoubleClick(mousePos)
		}
	},
	
	'simple-code:on-mouse-click'(mousePos,name){
		this.is_mouse_down = true;
		if(!this.isFocused()){
			this._isMoveDown = true
			this.setTimeoutById(()=>this._isMoveDown = false,2000,'mousedow')
		}
	},
	
	'simple-code:on-mouse-up'(mousePos){
		this.is_mouse_down = false;
	},
	
	'simple-code:on-editor-selection-hoverin'(itemInfo, isMouseDown){
		if(isMouseDown){
			this.mouseDownItem = itemInfo || this.mouseDownItem;
		}
		let type, uuid;
		if(itemInfo){
			type = itemInfo.type;
			uuid = itemInfo.uuid;
		}
		this.onEditorSelectionHoverin(type,uuid);
	},
};

// 升级插件后必须清除 require 缓存，否则升级插件后require对象是旧的缓存
function clearRequireCache(){
	const tools = require('../../tools/tools');
	if(!tools.initI18t){
		// 标记旧版,兼容旧版
		localStorage.setItem('simple-code-version','-1')
	}
	
	if(require.cache){
		// console.log("清除缓存")
		for (const key in require.cache) {
			if(key.includes('simple-code') && !key.includes('monaco-editor')){
				delete require.cache[key];
			}
		}
	}
}

// 合并事件函数,分发
let editorPanel;
let info = eventMerge.eventMerge(messages, "panel_ex.js");
messages = info.messages; // 合并后的事件
_scripts = info.scripts;
var methods = {}
for (const key in messages) {
	const func = messages[key];
	methods[key] = function(...args){
		return func.bind(editorPanel)(...args);
	}
}


// 兼容creator 3.3之前的版本
Editor.Panel.define = Editor.Panel.define || function(options) { return options }

// exports.methods = methods;
// layer.initExtend();
// tools.extendTo(layer,VsEditorPanel);
// exports.ready = function(){ 
// 	editorPanel = new EditorPanel(this);
// };
// exports.beforeClose = function(){ 
// 	// 如果编辑器未初始化完成禁止移动
// 	// if(editorPanel && !editorPanel.is_init_finish){
// 	// 	return false;
// 	// }
// }
// exports.close = function(){ 
// 	if(editorPanel){
// 		editorPanel.onDestroy() 
// 	}
// };
// 监听面板事件
// exports.linsteners = {
//     // 面板显示的时候触发的钩子
//     show() {
// 		editorPanel.upLayout()
// 	},
//     // 面板隐藏的时候触发的钩子
//     hide() {},
// };

// exports.style = ``;
// exports.template = `
// <div id="box">
// 	<div id="editorA"></div>
// 	<div id="editorB"></div>
// 	<div id="layoutTab" class="layout horizontal titleBarFontSize">
// 		<div id="tabList" class="layout horizontal">
// 			<img src=file://${Editor2D.url("packages://simple-code/panel/images/settingIco.png")} id="waitIco" class="turnAnim"></img> <span></span> <span></span>
// 			<div id="title0" class="closeTab">
// 				<div class="tabTitle"><nobr>无文件<nobr></div>
// 				<div class="closeBtn"><nobr> x <nobr></div>
// 			</div>

// 		</div>
// 		<div id="toolsPanel" class="layout horizontal">
// 			<ui-checkbox id="lockChk">${tools.translate('lock-tab')}</ui-checkbox>
// 			<ui-checkbox id="lockWindowChk">${tools.translate('lock-win')}</ui-checkbox>
// 			<ui-button id="manualCompile" class="">${tools.translate('manual-compile')}</ui-button>
// 			<ui-button id="gotoFileBtn" class="">${tools.translate('goto-file-btn')}</ui-button>
// 			<ui-button id="settingBtn" class="">${tools.translate('set')}</ui-button>
// 		</div>
// 	</div>
// 	<div id="overlay" class="overlay"></div>
// 	<div id="dropBg" class="dropBg"></div>
// </div>
// `;
// exports.$ = {
// 	lockChk: '#lockChk',
// 	lockWindowChk: '#lockWindowChk',
// 	layoutTab: '#layoutTab',
// 	manualCompile: '#manualCompile',
// 	settingBtn: '#settingBtn',
// 	// resetBtn: '#resetBtn',
// 	gotoFileBtn: '#gotoFileBtn',
// 	editorA: '#editorA',
// 	editorB: '#editorB',
// 	title0: '#title0',
// 	tabList: '#tabList',
// 	box: '#box',
// 	waitIco: '#waitIco',
// 	overlay: '#overlay',
// 	dropBg:'#dropBg',
// 	toolsPanel: '#toolsPanel',
// };

// exports.EditorPanel = EditorPanel;

module.exports = Editor.Panel.define({
    listeners: {
        show() { editorPanel.upLayout(); },
        hide() { },
    },
    template: `
		<div id="box">
			<div id="editorA"></div>
			<div id="editorB"></div>
			<div id="layoutTab" class="layout horizontal titleBarFontSize">
				<div id="tabList" class="layout horizontal">
					<img src=file://${Editor2D.url("packages://simple-code/panel/images/settingIco.png")} id="waitIco" class="turnAnim"></img> <span></span> <span></span>
					<div id="title0" class="closeTab">
						<div class="tabTitle"><nobr>无文件<nobr></div>
						<div class="closeBtn"><nobr> x <nobr></div>
					</div>
		
				</div>
				<div id="toolsPanel" class="layout horizontal">
					<ui-checkbox id="lockChk">${tools.translate('lock-tab')}</ui-checkbox>
					<ui-checkbox id="lockWindowChk">${tools.translate('lock-win')}</ui-checkbox>
					<ui-button id="manualCompile" class="">${tools.translate('manual-compile')}</ui-button>
					<ui-button id="gotoFileBtn" class="">${tools.translate('goto-file-btn')}</ui-button>
					<ui-button id="settingBtn" class="">${tools.translate('set')}</ui-button>
				</div>
			</div>
			<div id="overlay" class="overlay"></div>
			<div id="dropBg" class="dropBg"></div>
		</div>
		`,
    style: ``,
    $: {
		lockChk: '#lockChk',
		lockWindowChk: '#lockWindowChk',
		layoutTab: '#layoutTab',
		manualCompile: '#manualCompile',
		settingBtn: '#settingBtn',
		// resetBtn: '#resetBtn',
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
	
    methods: methods,
    ready() {
        editorPanel = new EditorPanel(this);
    },
    close() { 
		if(editorPanel){
			editorPanel.onDestroy() 
		}
	},
    beforeClose() { },
});

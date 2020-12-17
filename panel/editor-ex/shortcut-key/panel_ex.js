/* 
面板扩展
功能: 绑定快捷键事件
*/
'use strict';
var path 	= require('path');
var fs 		= require('fs');
var md5     = require('md5');
var fe 			= Editor.require('packages://simple-code/tools/FileTools.js');

const inputType = {"text":1,"password":1,"number":1,"date":1,"color":1,"range":1,"month":1,"week":1,"time":1,"email":1,"search":1,"url":1,"textarea":1}


module.exports = {

	// 面板初始化
	onLoad(parent){
		// index.js 对象
		this.parent = parent; 
		this.bindKey()
	},


	bindKey(){
		// 0代表只有非编辑状态时可用，1代表仅在在文本编辑状态使用，2全局不受影响
		let KEY_MODE = 2;


		// 绑定页面全局快捷键事件,注意: 区分大小写 Control = ctrl
		this.parent.addKeybodyEvent([[Editor.isWin32 ? "Ctrl" : "Meta","p"]],(e)=>
		{
			// 搜索转跳
			Editor.Ipc.sendToPanel('simple-code', 'custom-cmd',{cmd:"findJsFileAndOpen"});
			e.preventDefault();// 吞噬捕获事件
			return false;
		},KEY_MODE)


		// 绑定页面全局快捷键事件,注意: 区分大小写 Ctrl = ctrl
		this.parent.addKeybodyEvent([[Editor.isWin32 ? "Ctrl" : "Meta","o"]],(e)=>
		{
			// 搜索场景转跳
			Editor.Ipc.sendToPanel('simple-code', 'custom-cmd',{cmd:"findFileAndOpen"});
			e.preventDefault();// 吞噬捕获事件
			return false;
		},KEY_MODE)

		// 绑定页面全局快捷键事件,编辑器翻页
		this.parent.addKeybodyEvent([[Editor.isWin32 ? "Ctrl" : "Meta","i"]],(e)=>
		{
			// let is_vim_cmd_mode = Editor.monaco.vim_mode && !Editor.monaco.vim_mode.state.vim.insertMode;// vim模式禁止输入
			// if(!is_vim_cmd_mode){
			// 	return
			// }
			this.parent.vs_editor.setScrollTop(this.parent.vs_editor.getScrollTop()-100)
			e.preventDefault();// 吞噬捕获事件
			return false;
		},1)

		// 绑定页面全局快捷键事件,编辑器翻页
		this.parent.addKeybodyEvent([[Editor.isWin32 ? "Ctrl" : "Meta","j"]],(e)=>
		{
			// let is_vim_cmd_mode = Editor.monaco.vim_mode && !Editor.monaco.vim_mode.state.vim.insertMode;// vim模式禁止输入
			// if(!is_vim_cmd_mode){
			// 	return
			// }
			this.parent.vs_editor.setScrollTop(this.parent.vs_editor.getScrollTop()+100)
			e.preventDefault();// 吞噬捕获事件
			return false;
		},1)

		// 绑定页面全局快捷键事件
		this.parent.addKeybodyEvent([["F12"]],(e)=>
		{
			this.parent.openMenu()
		},KEY_MODE)


		// 绑定页面全局快捷键事件
		this.parent.addKeybodyEvent([["Alt","e"],["Ctrl","e"],["Meta","e"]],(e)=>
		{
			// 运行命令
	  		Editor.Ipc.sendToPanel('simple-code','run-command-code',"cmd");
		},1)

		// 绑定页面全局快捷键事件
		this.parent.addKeybodyEvent([["Alt","Shift","e"],["Meta","Shift","e"]],(e)=>
		{
			// 运行 Scene 命令
	  		Editor.Ipc.sendToPanel('simple-code','run-command-code',"scene");
		},2)

		// 绑定页面全局快捷键事件
		this.parent.addKeybodyEvent([["Shift","Alt","e"],["Shift","Ctrl","e"],["Shift","Meta","e"]],(e)=>
		{
			// 运行所有节点脚本命令
	  		Editor.Ipc.sendToPanel('simple-code','run-command-code',"scene");
		},2)
		
		// 锁定/解锁编程
		this.parent.addKeybodyEvent([["F1"]],(e)=>
		{
			e.preventDefault();// 吞噬捕获事件
			this.parent.setLockEdit(!this.parent.custom_cfg.is_lock)
		},1)

		// 命令行模式切换
		this.parent.addKeybodyEvent([["F2"]],(e)=>
		{
			e.preventDefault();// 吞噬捕获事件
			this.parent.setCmdMode(!this.parent.custom_cfg.is_cmd_mode)
		},1)

		if (!Editor.isWin32){

			// 绑定页面全局快捷键事件,注意: 区分大小写 Control = ctrl
			this.parent.addKeybodyEvent([["Control","f"]],(e)=>
			{
				// 搜索转跳
				Editor.Ipc.sendToPanel('simple-code', 'custom-cmd',{cmd:"findFileGoto"});
				e.preventDefault();// 吞噬捕获事件
				return false;
			},KEY_MODE)

			// 绑定页面全局快捷键事件,注意: 区分大小写 Ctrl = ctrl
			this.parent.addKeybodyEvent([["Control","v"]],(e)=>
			{
				// 搜索场景转跳
				Editor.Ipc.sendToPanel('simple-code', 'custom-cmd',{cmd:"findFileAndOpen"});
				e.preventDefault();// 吞噬捕获事件
				return false;
			},KEY_MODE)

		}
			
		for (let i = 0; i < 10; i++) {
			// 绑定页面全局快捷键事件,注意: 区分大小写 Ctrl = ctrl
			this.parent.addKeybodyEvent([[Editor.isWin32 ? "Alt" : "Meta",String(i)]],(e)=>
			{
			    let activeInfo  = Editor.Selection.curGlobalActivate() // 检测面板焦点在资源管理器还是层级管理器
			    if (activeInfo && activeInfo.type == "asset")
			    {
			    	Editor.info("设置标签:",Editor.remote.assetdb.uuidToUrl(activeInfo.id));
					localStorage.setItem("simple-code-tag_"+i,activeInfo.id);
					e.preventDefault();// 吞噬捕获事件
					return false;
				}
			},0)
		}	


		for (let i = 0; i < 10; i++) {
			// 绑定页面全局快捷键事件,注意: 区分大小写 Ctrl = ctrl
			this.parent.addKeybodyEvent([[String(i)]],(e)=>
			{
				let uuid = localStorage.getItem("simple-code-tag_"+i);
			    if (!this.inputTypeChk(e) && Editor.remote.assetdb.uuidToUrl(uuid))
			    {
					Editor.Ipc.sendToAll('assets:hint', uuid)
					Editor.Selection.select('asset', uuid)
					e.preventDefault();// 吞噬捕获事件
					return false;
				}
			},0)
		}	


		this.parent.addKeybodyEvent([["Alt" ,Editor.isWin32 ? '`' : 'Dead' ]],(e)=>
		{
		    let activeInfo  = Editor.Selection.curGlobalActivate() // 检测面板焦点在资源管理器还是层级管理器
		    if (activeInfo && activeInfo.type == "node")
		    {
		    	let nodes = Editor.Selection.curSelection("node");
		    	this._select_nodes = nodes;
		    	Editor.info("设置Node标签");
				e.preventDefault();// 吞噬捕获事件
				return false;
			}
		},0)

		this.parent.addKeybodyEvent([['`']],(e)=>
		{
		    let activeInfo  = Editor.Selection.curGlobalActivate() // 检测面板焦点在资源管理器还是层级管理器
		    if (this._select_nodes && !this.inputTypeChk(e))
		    {
		    	Editor.Selection.select('node', this._select_nodes);
			}
		},0);

		// 全选节点
		this.parent.addKeybodyEvent([["s"]],(e)=>
		{
			if (!this.inputTypeChk(e)){
				e.preventDefault();// 吞噬捕获事件
				Editor.Scene.callSceneScript('simple-code', 'select-node' ,"");
			}
		},0)


		// 绑定页面全局快捷键事件,注意: 区分大小写 Ctrl = ctrl
		this.arr_cut_asset = [];
		this.parent.addKeybodyEvent([['x']],(e)=>
		{
		    let activeInfo  = Editor.Selection.curGlobalActivate() // 检测面板焦点在资源管理器还是层级管理器
		    if (activeInfo && activeInfo.type == "asset" && !this.inputTypeChk(e))
		    {
		    	this.arr_cut_asset = Editor.Selection.curSelection('asset')
		    	for (var i = 0; i < this.arr_cut_asset.length; i++) {
					Editor.Ipc.sendToAll('assets:hint', this.arr_cut_asset[i]);
				}
				Editor.log("操作: 剪切选中的文件,请按‘c’粘贴到指定位置");
				e.preventDefault();// 吞噬捕获事件
				return false;
			}
		},0)

		this.parent.addKeybodyEvent([['c']],(e)=>
		{
		    let activeInfo  = Editor.Selection.curGlobalActivate() // 检测面板焦点在资源管理器还是层级管理器
		    if (activeInfo && activeInfo.type == "asset" && !this.inputTypeChk(e))
		    {
		    	let t_url = Editor.remote.assetdb.uuidToUrl(activeInfo.id);
		    	let t_path = Editor.remote.assetdb.urlToFspath(t_url);

		    	console.log(fe.isDirectory(t_path),t_path)
		    	if(!fe.isDirectory(t_path))
		    	{
		    		t_url = t_url.substr(0,t_url.lastIndexOf('/'));
		    	}

		    	for (var i = 0; i < this.arr_cut_asset.length; i++) {
		    		let m_url = Editor.remote.assetdb.uuidToUrl(this.arr_cut_asset[i]);
		    		let wb = m_url.substr(m_url.lastIndexOf('/'));
		    		Editor.assetdb.move(m_url, t_url+wb);
		    	}
		    	this.arr_cut_asset = [];
				e.preventDefault();// 吞噬捕获事件
				return false;
			}
		},0)
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

	// 键盘按下
	onKeyDown(event){
		// cc.log("按下",event.key);
	},

	// 键盘弹起
	onKeyUp(event){
		
	},

	// 面板销毁
	onDestroy(){

	},
	/*************  事件 *************/  



	messages:{

		// 快捷键打开当前选中文件/节点进入编辑
		'custom-cmd' (event,info) {
		},

		'scene:saved'(){
			// Editor.log("事件 save")
		}
	},
	
};
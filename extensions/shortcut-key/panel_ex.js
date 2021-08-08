/* 
面板扩展
功能: 绑定快捷键事件
*/
'use strict';
var path 	= require('path');
var fs 		= require('fs');
var md5     = require('md5');
var fe 			= Editor.require('packages://simple-code/tools/tools.js');

const inputType = {"text":1,"password":1,"number":1,"date":1,"color":1,"range":1,"month":1,"week":1,"time":1,"email":1,"search":1,"url":1,"textarea":1}


module.exports = {
	/** @type import('../../panel/vs-panel/vs-panel-base') */
	parent : null,


	// 面板初始化
	onLoad(parent){
		// index.js 对象
		this.parent = parent; 
		this.bindKey()
	},


	bindKey(){
		// 0代表只有非编辑状态时可用，1代表仅在在文本编辑状态使用，2全局不受影响
		let KEY_MODE = 2;

		// 绑定页面全局快捷键事件,编辑器翻页
		this.parent.addKeybodyEventByName('moveUp',(e)=>
		{
			// let is_vim_cmd_mode = Editor.monaco.vim_mode && !Editor.monaco.vim_mode.state.vim.insertMode;// vim模式禁止输入
			// if(!is_vim_cmd_mode){
			// 	return
			// }
			let pos = this.parent.vs_editor.getPosition();
			pos.lineNumber -=7;
			if(pos.lineNumber < 0) pos.lineNumber = 0
			this.parent.vs_editor.setPosition(pos)
			this.parent.vs_editor.revealPosition(pos)
			e.preventDefault();// 吞噬捕获事件
			return false;
		},1)

		// 绑定页面全局快捷键事件,编辑器翻页
		this.parent.addKeybodyEventByName('moveDown',(e)=>
		{
			// let is_vim_cmd_mode = Editor.monaco.vim_mode && !Editor.monaco.vim_mode.state.vim.insertMode;// vim模式禁止输入
			// if(!is_vim_cmd_mode){
			// 	return
			// }
			let pos = this.parent.vs_editor.getPosition();
			pos.lineNumber +=7;
			// if(pos.lineNumber > 0) pos.lineNumber = 0
			this.parent.vs_editor.setPosition(pos)
			this.parent.vs_editor.setScrollTop(this.parent.vs_editor.getScrollTop()+100)
			e.preventDefault();// 吞噬捕获事件
			return false;
		},1)

		// // 绑定页面全局快捷键事件
		// this.parent.addKeybodyEventByName('execCode',(e)=>
		// {
		// 	// 运行命令
	  	// 	Editor.Ipc.sendToPanel('simple-code','run-command-code',"cmd");
		// },1)

		// // 绑定页面全局快捷键事件
		// this.parent.addKeybodyEventByName('execCodeByScene',(e)=>
		// {
		// 	// 运行 Scene 命令
	  	// 	Editor.Ipc.sendToPanel('simple-code','run-command-code',"scene");
		// },2)
		
		// 锁定/解锁编程
		this.parent.addKeybodyEventByName('lockView',(e)=>
		{
			e.preventDefault();// 吞噬捕获事件
			this.parent.setLockEdit(!this.parent.file_info.is_lock)
		},1)

			
		// 字体变大
		this.parent.addKeybodyEventByName('fontBigger',(e)=>
		{
			e.preventDefault();// 吞噬捕获事件
			this.parent.setOptions({fontSize : this.parent.vs_editor.getRawOptions().fontSize+0.5})
		},1)

		// 字体变小
		this.parent.addKeybodyEventByName('fontSmall',(e)=>
		{
			e.preventDefault();// 吞噬捕获事件
			this.parent.setOptions({fontSize : this.parent.vs_editor.getRawOptions().fontSize-0.5})
		},1)

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

		this.parent.addKeybodyEventByName('setNodeTreeTag',(e)=>
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

		this.parent.addKeybodyEventByName('getNodeTreeTag',(e)=>
		{
		    if (this._select_nodes)
		    {
		    	Editor.Selection.select('node', this._select_nodes);
				e.preventDefault();// 吞噬捕获事件
			}
		},0);

		// 全选节点
		this.parent.addKeybodyEventByName('quickAddNextNode',(e)=>
		{
			if (!this.inputTypeChk(e)){
				e.preventDefault();// 吞噬捕获事件
				Editor.Scene.callSceneScript('simple-code', 'select-node' ,"");
			}
		},0)


		// 绑定页面全局快捷键事件,注意: 区分大小写 Ctrl = ctrl
		this.arr_cut_asset = [];
		this.parent.addKeybodyEvent([Editor.isWin32 ? ["Ctrl",'x'] : ["Meta",'x'] ],(e)=>
		{
			let panel = Editor.Panel.getFocusedPanel()
			if (!panel || this.inputTypeChk(e) || panel.id != "assets"){
				return
			}

		    let activeInfo  = Editor.Selection.curGlobalActivate() // 检测面板焦点在资源管理器还是层级管理器
		    if (activeInfo && activeInfo.type == "asset" && !this.inputTypeChk(e))
		    {
		    	this.arr_cut_asset = Editor.Selection.curSelection('asset')
		    	for (var i = 0; i < this.arr_cut_asset.length; i++) {
					Editor.Ipc.sendToAll('assets:hint', this.arr_cut_asset[i]);
				}
				e.preventDefault();// 吞噬捕获事件
				return false;
			}
		},0)

		this.parent.addKeybodyEvent([Editor.isWin32 ? ["Ctrl",'c'] : ["Meta",'c'] ],(e)=>
		{
			this.arr_cut_asset = [];
		},0)

		this.parent.addKeybodyEvent([Editor.isWin32 ? ["Ctrl",'v'] : ["Meta",'v'] ],(e)=>
		{
			let panel = Editor.Panel.getFocusedPanel()
			if (!panel || this.arr_cut_asset.length == 0 || this.inputTypeChk(e) || panel.id != "assets" ){
				return
			}

		    let activeInfo  = Editor.Selection.curGlobalActivate() // 检测面板焦点在资源管理器还是层级管理器
		    if (activeInfo && activeInfo.type == "asset" && !this.inputTypeChk(e))
		    {
		    	let t_url = Editor.remote.assetdb.uuidToUrl(activeInfo.id);
		    	let t_path = Editor.remote.assetdb.urlToFspath(t_url);

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
				e.stopPropagation();
				return false;
			}
		},0)

		this.parent.addKeybodyEventByName('setNodeActive',(e)=>
		{
			Editor.Scene.callSceneScript('simple-code', 'active-curr-node' ,{},function (err, event) {
				// Editor.log("delect node")
			});
			e.preventDefault();// 吞噬捕获事件
			return false;
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
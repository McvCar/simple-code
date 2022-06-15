/* 
面板扩展
功能: 绑定快捷键事件
*/
'use strict';
var path 	= require('path');
var fs 		= require('fs');
var md5     = require('md5');
var fe 		= Editor2D.require('packages://simple-code/tools/tools.js');

const inputType = {"text":1,"password":1,"number":1,"date":1,"color":1,"range":1,"month":1,"week":1,"time":1,"email":1,"search":1,"url":1,"textarea":1}


module.exports = {
	/** @type import('../../panel/vs-panel/vs-panel').EditorPanel */
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
	  	// 	Editor2D.Ipc.sendToPanel('simple-code','run-command-code',"cmd");
		// },1)

		// // 绑定页面全局快捷键事件
		// this.parent.addKeybodyEventByName('execCodeByScene',(e)=>
		// {
		// 	// 运行 Scene 命令
	  	// 	Editor2D.Ipc.sendToPanel('simple-code','run-command-code',"scene");
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
			this.parent.addKeybodyEvent([[Editor2D.isWin32 ? "Alt" : "Meta",String(i)]],async (e)=>
			{
			    let activeInfo  = Editor2D.Selection.curGlobalActivate() // 检测面板焦点在资源管理器还是层级管理器
			    if (activeInfo && activeInfo.type == "asset")
			    {
					e.preventDefault();// 吞噬捕获事件
			    	Editor.log("设置标签:",await Editor2D.assetdb.uuidToUrl(activeInfo.id));
					localStorage.setItem("simple-code-tag_"+i,activeInfo.id);
					return false;
				}
			},0)
		}	


		for (let i = 0; i < 10; i++) {
			// 绑定页面全局快捷键事件,注意: 区分大小写 Ctrl = ctrl
			this.parent.addKeybodyEvent([[String(i)]],async (e)=>
			{
				let uuid = localStorage.getItem("simple-code-tag_"+i);
				if(uuid){
					e.preventDefault();// 吞噬捕获事件
				}
			    if (!this.inputTypeChk(e) && uuid && await Editor2D.assetdb.uuidToUrl(uuid))
			    {
					Editor2D.Ipc.sendToAll('assets:hint', uuid)
					Editor2D.Selection.select('asset', uuid)
					return false;
				}
			},0)
		}	

		this.parent.addKeybodyEventByName('setNodeTreeTag',(e)=>
		{
		    let activeInfo  = Editor2D.Selection.curGlobalActivate() // 检测面板焦点在资源管理器还是层级管理器
		    if (activeInfo && activeInfo.type == "node")
		    {
		    	let nodes = Editor2D.Selection.curSelection("node");
		    	this._select_nodes = nodes;
		    	Editor.log("设置Node标签");
				e.preventDefault();// 吞噬捕获事件
				return false;
			}
		},0)

		this.parent.addKeybodyEventByName('getNodeTreeTag',(e)=>
		{
		    if (this._select_nodes && !this.parent.is_mouse_down)
		    {
		    	Editor2D.Selection.select('node', this._select_nodes);
				e.preventDefault();// 吞噬捕获事件
			}
		},0);

		// 全选节点
		this.parent.addKeybodyEventByName('quickAddNextNode',(e)=>
		{
			
			if (!this.inputTypeChk(e) && !this.parent.is_mouse_down){
				e.preventDefault();// 吞噬捕获事件
				Editor2D.Scene.callSceneScript('simple-code', 'select-node' ,"");
			}
		},0)

		// 显示、隐藏node
		this.parent.addKeybodyEventByName('setNodeActive',(e)=>
		{
			Editor2D.Scene.callSceneScript('simple-code', 'active-curr-node' ,{});
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

		'selectNode'(){
			Editor2D.Scene.callSceneScript('simple-code', 'select-node' ,"");
		},

		// 删除节点与脚本回收
		'removeNodeAndScript'(){
			// 发送事件到场景脚本处理
			Editor2D.Scene.callSceneScript('simple-code', 'removeNodeAndScript' ,{},function (err, event) {
				// Editor.log("delect node")
			});
			
		},

		'setNodeActive'(){
			Editor2D.Scene.callSceneScript('simple-code', 'active-curr-node' ,{});
		},
	},
	
};
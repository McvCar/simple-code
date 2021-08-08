/* 
面板扩展
功能: vim 功能,改造vim光标支持多选操作
*/
'use strict';
const path 			= require('path');
const fs 			= require('fs');
let vsVim;

module.exports = {
	/** @type import('../../panel/vs-panel/vs-panel').EditorPanel */
	parent : null,


	// 面板初始化
	ready(parent){
		// index.js 对象
		this.parent = parent;
		this.vim_cursor = []
	},

	// monaco 编辑器初始化
	onLoad(){
		vsVim 		= Editor2D.require('packages://simple-code/extensions/editor-vim-model/vim/lib/index.js');
		this.isWait = false;
		this.parent.vs_editor.onDidChangeCursorPosition((e)=>{
			if(this.isWait){
				return 
			}
			// 定时器用于解决 getSelections 选中列表为空的bug
			this.parent.setTimeout(()=>{
				this.isWait = true
				// 防止重复触发事件重复调用
				this.upVimCursor(this.parent.vs_editor.getSelections())
				this.isWait = false
			},0)
		});
	},
	
	// 设置选项
	setOptions(cfg,isInit) 
	{
		// vim
		if(cfg.enabledVim != null){
			cfg.enabledVim ? this.initVimMode() : this.destoryVim();
		}
	},

	// 加载vim
	initVimMode(){
		if(this.vim_mode){
			return;
		}
		this.vimStatusBar = document.getElementById('vimStatusBar');
		if(this.vimStatusBar) this.vimStatusBar.remove()

		this.vimStatusBar = document.createElement('div')
		this.vimStatusBar.id = 'vimStatusBar'
		const parent 	= document.getElementsByClassName('group console flex-1  style-scope app-status-bar')[0] || document.getElementsByClassName('content')[0] || this.parent.$.box; // 确定插入位置
		parent != this.parent.$.box && parent.children[0] ?  parent.insertBefore(this.vimStatusBar,parent.children[0]) : parent.appendChild(this.vimStatusBar);


		vsVim 		= vsVim || Editor2D.require('packages://simple-code/extensions/editor-vim-model/vim/lib/index.js');;
		const vim_mode = vsVim.initVimMode(this.parent.vs_editor, this.vimStatusBar);
		this.vim_cursor[0] = vim_mode;
		Editor.monaco.vim_mode = this.vim_mode = vim_mode;
	},

	upVimCursor(selections)
	{
		if(selections == null || this.vim_cursor == null){
			return;
		}
		let len = selections.length > this.vim_cursor.length ?  selections.length : this.vim_cursor.length;
		if(len == 0 || this.vim_mode == null){
			return;
		}
		// 1.判断第一光标是否vi模式
		// 2.判断第一个光标是否处于选取状态
		// 3.同步vi/选取状态到新光标对象里
		let is_insert_mode = !this.vim_mode.state.vim || this.vim_mode.state.vim.insertMode;
		let is_visual_mode = !is_insert_mode && !selections[0].isEmpty();
		let has_active = false

		for (let i = 0; i < len; i++) 
		{
			let select = selections[i];
			let vimObj = this.vim_cursor[i];
			// 新光标
			if(select && vimObj == null)
			{
				vimObj = this.vim_cursor[i] = vsVim.initVimMode(this.parent.vs_editor);
				// 设置光标ID
				vimObj.cursor_id = i; 
				if(is_insert_mode){
					vimObj.enterInsertMode()
				}
				has_active = true;
			}else if(select == null && vimObj && i != 0)
			{
				// 删除光标
				this.vim_cursor[i] = undefined;
				vimObj.dispose();
				has_active = true;
				continue;
			}

			if(vimObj)
			{
				if(is_visual_mode && !vimObj.state.vim.visualMode){
					vimObj.setVisualSelection(select)
				}
				else{
					vimObj.setSelectionByRange(select)
				}
			}
		}

		// 增减光标动画会改变
		for (let i = 0; i < has_active ? this.vim_cursor.length : 0; i++) 
		{
			let vimObj = this.vim_cursor[i];
			if(vimObj)
			{
				if(vimObj.state.vim.visualMode){
					vimObj.enterVisualMode()
				}else if(!vimObj.state.vim.insertMode){
					vimObj.enterVimMode()
				}else{
					vimObj.leaveVimMode()
				}
			}
		}
	},

	destoryVim(){
		if(!this.vim_mode) {
			return
		}
		for (let i = 0; i < this.vim_cursor.length; i++) 
		{
			let vimObj = this.vim_cursor[i];
			if(vimObj) vimObj.dispose();
		}
		// this.vim_mode.dispose();
		this.vimStatusBar.remove()
		
		delete Editor.monaco.vim_mode;
		delete this.vimStatusBar;
		delete this.vim_mode;

	},

	// 面板销毁
	onDestroy(){
		this.destoryVim()
	},


	messages:{

		// 'cleanFile'()
		// {
		// },
	},
	
};
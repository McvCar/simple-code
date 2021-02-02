/* 
面板扩展
功能: monaco 编辑器右击菜单和命名
*/
'use strict';
const path 			= require('path');
const fs 			= require('fs');
let vsVim;

module.exports = {

	// 面板初始化
	ready(parent){
		// index.js 对象
		this.parent = parent;
		this.vim_cursor = []
	},

	// monaco 编辑器初始化
	onLoad(){
		
		// Explanation:
		// Press F1 (Alt-F1 in Edge) => the action will appear and run if it is enabled
		// Press Ctrl-F10 => the action will run if it is enabled
		// Press Chord Ctrl-K, Ctrl-M => the action will run if it is enabled

		// this.parent.vs_editor.editor.addAction({
		// 	// An unique identifier of the contributed action.
		// 	id: 'my-unique-id',

		// 	// A label of the action that will be presented to the user.
		// 	label: 'My Label!!!',

		// 	// An optional array of keybindings for the action.
		// 	keybindings: [
		// 		this.parent.monaco.KeyMod.CtrlCmd | this.parent.monaco.KeyCode.F10,
		// 		// chord
		// 		this.parent.monaco.KeyMod.chord(this.parent.monaco.KeyMod.CtrlCmd | this.parent.monaco.KeyCode.KEY_K, this.parent.monaco.KeyMod.CtrlCmd | this.parent.monaco.KeyCode.KEY_M)
		// 	],

		// 	// A precondition for this action.
		// 	precondition: null,

		// 	// A rule to evaluate on top of the precondition in order to dispatch the keybindings.
		// 	keybindingContext: null,

		// 	contextMenuGroupId: 'navigation',

		// 	contextMenuOrder: 1.5,

		// 	// Method that will be executed when the action is triggered.
		// 	// @param editor The editor instance is passed in as a convinience
		// 	run: function(ed) {
		// 		alert("i'm running => " + ed.getPosition());
		// 		return null;
		// 	}
		// });

	},
	
	// 面板销毁
	onDestroy(){
	},


	messages:{

		// 'cleanFile'()
		// {
		// },
	},
	
};
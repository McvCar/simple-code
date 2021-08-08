/* 
面板扩展
功能: 括号颜色化
*/
'use strict';
const path 			= require('path');
const fs 			= require('fs');

let COLOR = [
    "rgba(104,208,254,1)",
    "rgba(255,255,64,1)",
    "rgba(255,127,255,1)",
]
let styleText = `
	.cus_bracket_line{
		border-style: ridge;
		border-width: 0px 0px 1px 0px;
		border-color: rgba(101, 142, 177, 1);
	}
`

module.exports = {
	/** @type import('../../panel/vs-panel/vs-panel').EditorPanel */
	parent : null,


	// 面板初始化
	ready(parent){
		// index.js 对象
		this.parent = parent;
	},

	// monaco 编辑器初始化
	onLoad(){
	},
	
	// 设置选项
	setOptions(cfg,isInit) 
	{
		if(cfg.enabledBracketColor != null){
			cfg.enabledBracketColor ? this.initBracketColor() : this.destoryBracketColor();
		}
	},

	initBracketColor(){
		let bracketPair = Editor2D.require('packages://simple-code/extensions/editor-bracket-pair-colorizer/bracket-pair-colorizer/src/index.js');
		let args  = {colours:COLOR,debounce:200}
		this.bracketColorObj = bracketPair.bracketColorDecorate(this.parent.vs_editor,Editor.monaco,args);
		
		// 鼠标选中时显示的样式
		let dom = this.parent.vs_editor._domElement;
		var style = document.createElement("style");
		style.innerHTML = styleText;
		if (dom) {
			dom.appendChild(style);
		}
		this.styleSheet = style;
	},

	destoryBracketColor(){
		if(this.bracketColorObj){
			this.bracketColorObj.destroy()
			this.styleSheet.remove()
			delete this.bracketColorObj;
		}
	},

	// 面板销毁
	onDestroy(){
		this.destoryBracketColor()
	},


	messages:{

		// 'cleanFile'()
		// {
		// },
	},
	
};
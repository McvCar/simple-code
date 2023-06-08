/* 
面板扩展
功能: 彩虹缩进
*/
'use strict';
const path 			= require('path');
const fs 			= require('fs');
const Editor2D 		= require('../../tools/editor2D');
let COLOR;
// COLOR 			= [
//     "rgba(255,255,255,0.01)",
//     "rgba(255,255,255,0.03)",
//     "rgba(255,255,255,0.05)",
//     "rgba(255,255,255,0.07)",
//     "rgba(255,255,255,0.09)",
//     "rgba(255,255,255,0.11)",
//     "rgba(255,255,255,0.13)",
//     "rgba(255,255,255,0.15)",
// ];

COLOR 			= [
    "rgba(255,255,255,0.15)",
    "rgba(255,255,255,0.13)",
    "rgba(255,255,255,0.11)",
    "rgba(255,255,255,0.09)",
    "rgba(255,255,255,0.07)",
    "rgba(255,255,255,0.05)",
    "rgba(255,255,255,0.03)",
    "rgba(255,255,255,0.01)",
];
// COLOR 			= [
//     "rgba(255,255,64,0.04)",
//     "rgba(127,255,127,0.04)",
//     "rgba(255,127,255,0.04)",
//     "rgba(79,236,236,0.04)"
// ]

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
		if(cfg.enabledRainbow != null){
			cfg.enabledRainbow ? this.initRainbow() : this.destoryRainbow();
		}
	},

	initRainbow(){
		let args  = {colours:COLOR,debounce:200}
		let rainbow = Editor2D.require('packages://simple-code/extensions/editor-rainbow-decorator/rainbow-decorator/dist/index.js');
		this.rainbowObj = rainbow.rainbowDecorate(this.parent.vs_editor,this.parent.$.box,args);;
	},

	destoryRainbow(){
		if(this.rainbowObj){
			this.rainbowObj.destroy()
			delete this.rainbowObj;
		}
	},

	// 面板销毁
	onDestroy(){
		this.destoryRainbow()
	},


	messages:{

		// 'cleanFile'()
		// {
		// },
	},
	
};
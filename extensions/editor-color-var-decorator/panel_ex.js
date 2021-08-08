/* 
面板扩展
功能: cc.Color 颜色显示
*/
'use strict';
const path 			= require('path');
const fs 			= require('fs');
let id 				= 'cc.Color'

// 颜色格式 hex 转 rgba
// function hexToRGBA(hex){
// 	let alpha = false,
// 	  h = hex.slice(hex.startsWith('#') ? 1 : 0);
// 	if (h.length === 3) h = [...h].map(x => x + x).join('');
// 	else if (h.length === 8) alpha = true;
// 	h = parseInt(h, 16);

// 	let color = { 
// 		red: (h >>> (alpha ? 24 : 16)), 
// 		green: (h & (alpha ? 0x00ff0000 : 0x00ff00)) >>> (alpha ? 16 : 8), 
// 		blue:  (h & (alpha ? 0x0000ff00 : 0x0000ff)) >>> (alpha ? 8 : 0), 
// 		alpha: alpha ? h & 0x000000ff : 1 
// 	}
// 	return color;
	
// };

function hexToRgba(hex) {
	hex = hex[0] == '#' ? hex.substr(1) : hex;
	let color = { 
		red: parseInt("0x" + hex.slice(0, 2))/255, 
		green: parseInt("0x" + hex.slice(2, 4))/255, 
		blue:  parseInt("0x" + hex.slice(4, 6))/255, 
		alpha: 1 
	}
    return color;
}

function rgbToHex(r, g, b) {
    return ((r << 16) | (g << 8) | b).toString(16);
}

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
		// this.parent.runExtendFunc('setDecoratorStyle',id,text);
		let regObj = {
			provideColorPresentations: (model, colorInfo) => {
				var color = colorInfo.color;
				var label;
				var text 	= model.getValueInRange(colorInfo.range);

				var red256 = Math.round(color.red * 255);
				var green256 = Math.round(color.green * 255);
				var blue256 = Math.round(color.blue * 255);
				var alpha256 = Math.round(color.alpha * 255);
				if(text.match(/fromHEX/)){
					label = 'fromHEX("#'+rgbToHex(red256,green256,blue256)+'")'
				}else{
					if (color.alpha === 1) {
						label = text.substr(0,5) + "(" + red256 + ", " + green256 + ", " + blue256 + ")";
					} else {
						label = text.substr(0,5) + "(" + red256 + ", " + green256 + ", " + blue256 + ", " + alpha256 + ")";
					}
				}

				return [
					{
						label: label
					}
				];
			},

			provideDocumentColors: (model) => {
				if(!this.parent.cfg.enabledCCColor){
					return [];
				}

				let p = new Promise( (resolve, reject )=> 
				{
					if (model.getLineCount() > 100000) {
						return resolve([]); // 1万行不进行解析工作
					}
					let colors = []
					this.onLoadColors(model,colors)
					this.onLoadHexs(model,colors)
					resolve(colors);
				});
				return p;
			}

		}
		
		this.parent.pushMonacoEvent(this.parent.monaco.languages.registerColorProvider("javascript",regObj))
		this.parent.pushMonacoEvent(this.parent.monaco.languages.registerColorProvider("typescript",regObj))
	},

	onLoadColors(model,colors)
	{
        var code   = model.getValue();
        var regEx  = /(color)[ 	]{0,5}\([ 	]{0,5}([0-9\.]+)[ 	]{0,5},[ 	]{0,5}([0-9\.]+)[ 	]{0,5},[ 	]{0,5}([0-9\.]+)[ 	,]{0,5}([0-9\.]{0,10})\)/ig;
        var match  = regEx.exec(code);
        while (match) 
        {
            var startPos = model.getPositionAt(match.index);
            var endPos = model.getPositionAt(match.index+match[0].length);
			var color = { red: Number(match[2])/255, green:  Number(match[3])/255, blue:  Number(match[4])/255, alpha: match[5] != '' ?  Number(match[5])/255 : 1 }
            colors.push({
				color,
                range:{
                    startLineNumber: startPos.lineNumber,
                    startColumn: startPos.column,
                    endLineNumber: endPos.lineNumber,
                    endColumn: endPos.column
				}});
			match  = regEx.exec(code);
		}
	},
	
	onLoadHexs(model,colors)
	{
        var code   = model.getValue();
        var regEx  = /(fromHEX)\s*?\(\s*?['"]+(#{0,1}\w+?)['"]+\s*?\)/g;
        var match  = regEx.exec(code);
        while (match) 
        {
            var startPos = model.getPositionAt(match.index);
            var endPos = model.getPositionAt(match.index+match[0].length);
			var color = hexToRgba(match[2])
            colors.push({
				color,
                range:{
                    startLineNumber: startPos.lineNumber,
                    startColumn: startPos.column,
                    endLineNumber: endPos.lineNumber,
                    endColumn: endPos.column
				}});
			match  = regEx.exec(code);
		}
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
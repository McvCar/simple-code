/* 
面板扩展
功能: cc.Color 颜色显示
*/
'use strict';
const path 			= require('path');
const fs 			= require('fs');
let id 				= 'cc.Color'

module.exports = {

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
				var red256 = Math.round(color.red * 255);
				var green256 = Math.round(color.green * 255);
				var blue256 = Math.round(color.blue * 255);
				var alpha256 = Math.round(color.alpha * 255);
				var label;
				if (color.alpha === 1) {
					label = "Color(" + red256 + ", " + green256 + ", " + blue256 + ")";
				} else {
					label = "Color(" + red256 + ", " + green256 + ", " + blue256 + ", " + alpha256 + ")";
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
					this.onLoadColors(model,resolve)
				});
				return p;
			}

		}

		this.parent.monaco.languages.registerColorProvider("javascript",regObj)
		this.parent.monaco.languages.registerColorProvider("typescript",regObj)
	},

	onLoadColors(model,resolve)
	{
        var colors = [];
        var code   = model.getValue();
        var regEx  = /Color[ 	]{0,5}\([ 	]{0,5}([0-9\.]+)[ 	]{0,5},[ 	]{0,5}([0-9\.]+)[ 	]{0,5},[ 	]{0,5}([0-9\.]+)[ 	,]{0,5}([0-9\.]{0,10}).*\)/ig;
        var match  = regEx.exec(code);
        while (match) 
        {
            var startPos = model.getPositionAt(match.index);
            var endPos = model.getPositionAt(match.index+match[0].length);
			
            colors.push({
				color: { red: Number(match[1])/255, green:  Number(match[2])/255, blue:  Number(match[3])/255, alpha: match[4] != '' ?  Number(match[4])/255 : 1 },
                range:{
                    startLineNumber: startPos.lineNumber,
                    startColumn: startPos.column,
                    endLineNumber: endPos.lineNumber,
                    endColumn: endPos.column
				}});
			match  = regEx.exec(code);
		}
		resolve(colors);
		// this.parent.setDecorator('setDecoratorStyle',id,text);
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
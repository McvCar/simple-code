/**
 * 注入脚本代码到Creator主窗口运行提供服务
 */

const electron = parseFloat(process.versions.electron) < 13 ? require('electron').remote : require('@electron/remote')
const Editor2D = require("../../tools/editor2D");
const tools    = require('../../tools/tools.js');
const fs 	  = require('fs');


class injectScriptService{
	constructor(parent){
		this.parent  = parent;
		this.isInit  = false;
		this.bufferName = `__simpleCodeServiceScriptBuffer${new Date().getTime()}`
		this.mainWin = this.getMainWebContents();
		this.scpripts = [
			{program:null, filePath : Editor2D.url('packages://simple-code/panel/vs-panel/inject-script-template/listener-mouse-event.js')}
		];
		this.init();
    }

	init(){
		if(!this.mainWin){
			console.warn(`${tools.translate('name')}: 没有发现主窗口, 拖拽菜单功能可能会运行不正常，请联系作者反馈问题`,`${tools.translate('name')}: No main window found, menu function cannot work properly`);
		}

		this.scpripts.forEach(script => {
			script.program = this.injectScript(script.filePath);
		});

		this.isInit = true;
	}

	injectScript(filePath){
		if(this.mainWin){
			let code = fs.readFileSync(filePath, 'utf8');
			code = code.replace('module.exports','//');
			code = `
				if(!window.${this.bufferName}){
					window.${this.bufferName} = {};
				}
				window.${this.bufferName}['${filePath}'] = 
				(function(){
					${code}
					Service.bufferName = '${this.bufferName}'
					Service.load();
					return Service;
				})();0;
			`
			this.mainWin.executeJavaScript(code);
			
			return;
		}else{
			let program = require(filePath);
			program.load();

			return program;
		}
	}

	onDestroy(){
		if(this.mainWin){
			this.scpripts.forEach(script => {
				let code = `
					if(window.${this.bufferName} && window.${this.bufferName}['${script.filePath}']){
						window.${this.bufferName}['${script.filePath}'].onDestroy();
						window.${this.bufferName}['${script.filePath}'] = undefined;
					}
				`
				this.mainWin.executeJavaScript(code);
			});
			this.mainWin.executeJavaScript(`delete window.${this.bufferName};0;`);
			
		}else{
			this.scpripts.forEach(script => {
				if(script.program){
					script.program.onDestroy();
				}
			});

		}
	}

	executeJavaScript(code){

	}

	// 获得Creator主窗口
	getMainWebContents(){
		let allwins = electron.BrowserWindow.getAllWindows();
		for (let i = 0; i < allwins.length; i++) {
			const win = allwins[i];
			const url = win.getURL()
			if(url.includes('windows/main.html') || win.title && win.title.includes('Cocos Creator')){
				return win.webContents;
			}
		}
		return;
	}
}

module.exports = injectScriptService;
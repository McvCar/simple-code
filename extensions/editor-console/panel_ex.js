/* 
面板扩展
功能: 控制台
例子: https://microsoft.github.io/monaco-editor/playground.html#interacting-with-the-editor-listening-to-mouse-events
*/
'use strict';
const path 			= require('path');
const fs 			= require('fs');
const config 		= Editor2D.require('packages://simple-code/config');
const eruda 		= Editor2D.require('packages://simple-code/extensions/editor-console/eruda/eruda.js');

module.exports = {
	/** @type import('../../panel/vs-panel/vs-panel').EditorPanel */
	parent : null,

	// 面板初始化
	ready(parent){
		// index.js 对象
		this.parent = parent;
		this.records = this.parent.pro_cfg.records = this.parent.pro_cfg.records || [];
		this.cmd_ind = this.records.length;
	},

	// 设置选项
	setOptions(cfg,isInit) 
	{
		if(cfg.enabledConsoleBtn != null && !isInit){
			eruda._entryBtn._$el[0].style.visibility = cfg.enabledConsoleBtn ? "visible" : 'hidden';
		}
	},

	// monaco 编辑器初始化
	onLoad()
	{
		let el = document.createElement('div');
		this.parent.$.box.appendChild(el)
		eruda.init({
			container: el,
			tool: ['console'],
			useShadowDom: true,
			autoScale: true,
			defaults: {
				displaySize: 30,
				transparency: 1,
				theme: 'Monokai Pro'
			}
		});

		eruda._devTools._window_height = this.parent.$.box.clientHeight
		let shadowRoot = eruda._devTools._tools.console._$inputBox.shadowRoot || eruda._devTools._tools.console._$inputBox.attachShadow({mode: 'open'});
		this.editorBox = document.createElement('div');
		this.editorBox.style['width'] = '100%'
		this.editorBox.style['height'] = '100%'
		let sty = document.createElement('style');
		sty.innerHTML = fs.readFileSync(Editor2D.url("packages://simple-code/panel/vs-panel/monaco-editor/dev/vs/editor/editor.main.css"), "utf-8");//ace.editorCss;
		shadowRoot.appendChild(sty)
		shadowRoot.appendChild(this.editorBox)
		this.loadEditor()
		eruda._entryBtn.setPos({x:this.parent.$.box.offsetWidth-40,y:25})


		eruda._entryBtn.on('click', () => this.cmd_editor.layout());
		eruda._entryBtn._$el[0].style.visibility = this.parent.cfg.enabledConsoleBtn ? "visible" : 'hidden';
		eruda._entryBtn._$el[0].title = "控制台快捷键: Ctrl+`、Esc"

		// 打开控制台快捷键
		this.parent.addKeybodyEventByName('openConsole',(e)=>
		{
			eruda._devTools._isShow ? eruda._devTools.hide() : eruda._devTools.show();
			if(eruda._devTools._isShow){
				this.cmd_editor.focus()
				this.cmd_editor.layout()
			}
			e.preventDefault();// 吞噬捕获事件
			return false;
		},1);

		// this.parent.addKeybodyEvent([["Escape"]],(e)=>
		// {
		// 	if(!this.parent.cfg.enabledVim){
		// 		eruda._devTools.show();
		// 		this.cmd_editor.focus()
		// 		this.cmd_editor.layout()
		// 	}
		// 	e.preventDefault();// 吞噬捕获事件
		// 	return false;
		// },1);
	},
	
	getWindowObj(){
		if(Editor.monaco.preview && Editor.monaco.preview.contentWindow == null) delete Editor.monaco.preview;
		return Editor.monaco.preview && Editor.monaco.preview.contentWindow || window;
	},

	loadEditor()
	{
		const vsLoader = Editor2D.require('packages://simple-code/panel/vs-panel/monaco-editor/dev/vs/loader.js');
		// 创建vs编辑器，api参考 monaco.d.ts文件
		vsLoader.require(['vs/editor/editor.main'], () => 
		{
			let monaco = this.monaco = Editor.monaco || monaco;
			config.vsEditorConfig.language = 'typescript';  // 预热 javascript模块
			config.vsEditorConfig.value = ``
			// this.tsWr.setEnableUpdateScript(true);
			var editor = monaco.editor.create(this.editorBox,config.vsEditorConfig);
			this.cmd_editor = editor;
			editor.updateOptions({
				minimap:{enabled:false}, gotoLocation:{enable:false}, hover:{enable:false} ,lineNumbers:'off',renderLineHighlight:false, links:false, contextmenu:false,
				suggest:{maxVisibleSuggestions:3}
			});
			monaco.editor.setTheme(this.parent.cfg.theme);
			editor.onKeyDown(this.handleKeyDown.bind(this));
			editor.onDidChangeModelContent(this.handleInput.bind(this));
			// //获得焦点
			// editor.onDidFocusEditorText((e) => {
			// 	// 关闭cocosCreator 默认的tab键盘事件,不然会冲突
			// 	require(Editor.appPath + "/editor-framework/lib/renderer/ui/utils/focus-mgr.js").disabled = true;
			// });

			// // 失去焦点
			// editor.onDidBlurEditorText((e) => {
			// 	require(Editor.appPath + "/editor-framework/lib/renderer/ui/utils/focus-mgr.js").disabled = false;
			// });
			this.initCompletion();
		});
	},

	// 读取环境变量代码提示
	initCompletion(){
		let obj   = 
		{
			provideCompletionItems:  (model, position ,context, token)=> {
				if(this.cmd_editor.getModel() != model){
					return {suggestions:[]}
				}

				var p = new Promise( (resolve, reject )=> 
				{
					let suggestions = []
					let text = model.getLineContent(position.lineNumber);
					let pos  = model.getOffsetAt( this.cmd_editor.getPosition() );
					let regEx = /[\w$_\.0-9]+\./g;
					let isLoadObj = false
					while(true)
					{
						let findObj = regEx.exec(text);
						if(findObj == null) {
							break;
						};
						if( findObj[0].length+findObj.index+1>= pos){
							isLoadObj = true
							this.newItem(findObj,suggestions);
							break;
						}
					}

					if(!isLoadObj){
						// Editor.monaco.preview 为游戏预览窗口的环境
						this.loadObjectProperty(this.getWindowObj(),suggestions,false);
					}

					for (let i = 0; i < suggestions.length; i++) {
						const v = suggestions[i];
						delete v.range;
						delete v.sortText;
						delete v.preselect;
					}
					resolve( {suggestions,incomplete:false});
				});
			
				return p;
			}
		}
		// 光标选中当前自动补全item时触发动作，一般情况下无需处理
		// resolveCompletionItem(item, token) {
		// 	return null;
		// }
		//Register the custom completion function into Monaco Editor    
		this.parent.pushMonacoEvent(this.monaco.languages.registerCompletionItemProvider('typescript',obj ));
	},

	newItem(findObj,suggestions)
	{
		let words = findObj[0].split('.');
		let obj = this.getWindowObj();
		for (let i = 0; i < words.length-1; i++) {
			const word = words[i];
			try {
				let value = obj[word];
				if(value != null){
					obj = obj[word];
				}else{
					obj = null;
					break;
				}
			} catch (error) {
				console.log(error)
				break;
			}
		}

		if(obj!=null) this.loadObjectProperty(obj,suggestions);
	},

	loadObjectProperty(obj,suggestions,isLoadmeta=false){

		try {
			// 取成员
			let words2 = Object.getOwnPropertyNames(Object.getPrototypeOf(obj))
			let words = Object.getOwnPropertyNames(obj)
			words = words.concat(words2);

			for (let i = 0; i < words.length; i++) 
			{
				const word = words[i];
				let meta = '';
				if(isLoadmeta){
					try {
						let v = obj[word];
						meta = v.toString()
					} catch (error) {
						// console.log(error)
					}
				}
				suggestions.push({
					label: word,
					insertText: word,
					kind: this.monaco.languages.CompletionItemKind.Value,
					detail: meta
				});
			}
		} catch (error) {
			// console.log(error);
		}
	},

	onExecCode(){
		eruda._devTools.show();
		this.cmd_editor.layout()
	},

	execCode(code){
		// Editor.monaco.preview 为游戏预览窗口的环境
		if(Editor.monaco.preview && Editor.monaco.preview.contentWindow.eval){
			console.log(code)
			let ret = Editor.monaco.preview.contentWindow.eval(code);
			if(ret != null){
				console.log(ret);
			}
		}else{
			eruda._devTools._tools.console.inputCmd(code)
		}
	},

	handleInput(e){
		// if(e.changes && e.changes[0] && e.changes[0].text.replace(/[	 ]/g,'') == '\n'){
		// 	let text = this.cmd_editor.getValue()
		// 	text = text.substr(0,e.changes[0].rangeOffset)+text.substr(e.changes[0].rangeOffset+e.changes[0].text.length);
		// 	if(text == '') return;
			
		// 	let ind = this.records.indexOf(text);
		// 	if(ind != -1){
		// 		this.records.splice(ind,1);
		// 	}
		// 	this.records.push(text);
		// 	this.cmd_editor.setValue('');
		// 	this.cmd_ind = this.records.length;
		// 	try {
		// 		this.execCode(text);
		// 	} catch (error) {
		// 		console.error(error)
		// 	}
		// }
	},
	

	handleKeyDown(e)
	{
		let widget = this.cmd_editor._domElement.getElementsByClassName('suggest-widget')[0];
		if(widget && widget.style.visibility != 'hidden'){
			return;
		}
		
		let has_key = false
		let text = ''
		if(e.browserEvent.key == 'ArrowUp')
		{
			--this.cmd_ind
			if(this.cmd_ind<0){
				this.cmd_ind = 0
			}
			text = this.records[this.cmd_ind] || '';
			this.cmd_editor.setValue(text);
			has_key = true
		}else if(e.browserEvent.key == 'ArrowDown')
		{
			text = this.records[++this.cmd_ind] || '';
			this.cmd_editor.setValue(text);
			has_key = true
			if(this.cmd_ind>this.records.length){
				this.cmd_ind = this.records.length
			}
		}else if(e.browserEvent.key == 'Enter')
		{
			has_key = true
			let text = this.cmd_editor.getValue()
			if(text == '') return;
			this.records.push(text);
			this.cmd_editor.setValue('');
			this.cmd_ind = this.records.length;
			try {
				this.execCode(text);
			} catch (error) {
				console.error(error)
			}
		}else if(e.browserEvent.key == 'Escape')
		{
			has_key = true;
			eruda._devTools.hide()
			this.parent.vs_editor.focus()
		}
		// console.log(this.cmd_editor.getModel().getPositionAt(text.length-1))

		this.parent.setTimeout(()=>{
			let select = this.cmd_editor.getSelection()
			select.endColumn = select.positionColumn;
			select.endLineNumber = select.positionLineNumber;
			select.selectionStartColumn = select.positionColumn;
			select.selectionStartLineNumber = select.positionLineNumber;
			select.startColumn = select.startColumn;
			select.startLineNumber = select.startLineNumber;	
			this.cmd_editor.setSelection(select);
		},0)

		if(has_key){
			e.preventDefault();
			e.stopPropagation();
		}
	},

	// 面板销毁
	onDestroy(){
		eruda.destroy();
	},


	messages:{

		// 'cleanFile'()
		// {
		// },
	},
	
};
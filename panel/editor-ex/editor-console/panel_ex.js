/* 
面板扩展
功能: 控制台
例子: https://microsoft.github.io/monaco-editor/playground.html#interacting-with-the-editor-listening-to-mouse-events
*/
'use strict';
const path 			= require('path');
const fs 			= require('fs');
const config 		= Editor.require('packages://simple-code/config');
const eruda 		= Editor.require('packages://simple-code/panel/editor-ex/editor-console/eruda/eruda.js');
const ace = Editor.require('packages://simple-code/ace/ace.js');

module.exports = {
	// 面板初始化
	ready(parent){
		// index.js 对象
		this.parent = parent;
		this.cmd_ind = 0
		this.records = this.parent.pro_cfg.records = this.parent.pro_cfg.records || [];
	},

	// monaco 编辑器初始化
	onLoad()
	{
		let el = document.createElement('div');
		this.parent.$box.appendChild(el)
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

		eruda._devTools._window_height = this.parent.$box.clientHeight
		let shadowRoot = eruda._devTools._tools.console._$inputBox.createShadowRoot();
		this.editorBox = document.createElement('div');
		this.editorBox.style['width'] = '100%'
		this.editorBox.style['height'] = '100%'
		let sty = document.createElement('style');
		sty.innerHTML = fs.readFileSync(Editor.url("packages://simple-code/monaco-editor/dev/vs/editor/editor.main.css"), "utf-8");//ace.editorCss;
		shadowRoot.appendChild(sty)
		shadowRoot.appendChild(this.editorBox)
		this.loadEditor()
		eruda._entryBtn.setPos({x:this.parent.$box.offsetWidth-30,y:20})
		eruda._entryBtn.on('click', () => this.cmd_editor.layout())
	},

	loadEditor()
	{
		const vsLoader = Editor.require('packages://simple-code/monaco-editor/dev/vs/loader.js');
		// vs代码路径
		vsLoader.require.config({ 'vs/nls': { availableLanguages: { '*': 'zh-cn' } }, paths: { 'vs': Editor.url('packages://simple-code/monaco-editor/dev/vs', 'utf8') } });
		// 创建vs编辑器，api参考 monaco.d.ts文件
		vsLoader.require(['vs/editor/editor.main'], () => 
		{
			let monaco = Editor.monaco || monaco;
			config.vsEditorConfig.language = 'javascript';  // 预热 javascript模块
			config.vsEditorConfig.value = ``
			var editor = monaco.editor.create(this.editorBox,config.vsEditorConfig);
			window.cmd_editor = this.cmd_editor = editor;
			editor.updateOptions({minimap:{enabled:false},lineNumbers:'off',renderLineHighlight:false});
			monaco.editor.setTheme(this.parent.cfg.theme);
			editor.onKeyDown(this.handleKeyDown.bind(this));
			editor.onDidChangeModelContent(this.handleInput.bind(this));
			
			//获得焦点
			editor.onDidFocusEditorText((e) => {
				// 关闭cocosCreator 默认的tab键盘事件,不然会冲突
				require(Editor.appPath + "/editor-framework/lib/renderer/ui/utils/focus-mgr.js").disabled = true;
			});

			// 失去焦点
			editor.onDidBlurEditorText((e) => {
				require(Editor.appPath + "/editor-framework/lib/renderer/ui/utils/focus-mgr.js").disabled = false;
			});
		});
		

		// var editor = ace.edit(this.editorBox);
		// editor.setOptions({
		// 	// 默认:false
		// 	wrap: false, // 换行
		// 	autoScrollEditorIntoView: false, // 自动滚动编辑器视图
		// 	enableLiveAutocompletion: true, // 智能补全
		// 	enableSnippets: true, // 启用代码段
		// 	enableBasicAutocompletion: false, // 启用基本完成 不推荐使用
		// });
		// this.cmd_editor = window.cmd_editor = editor;

		// // 设置主题
		// editor.setTheme("ace/theme/monokai");
		// // 设置编辑语言
		// editor.getSession().setMode("ace/mode/javascript");
		// // 设置快捷键模式
		// editor.setHighlightActiveLine(false);
		// editor.setShowPrintMargin(false);
		// editor.renderer.setShowGutter(false);
		// editor.renderer.setHighlightGutterLine(false);
		// editor.$mouseHandler.$focusTimeout = 0;
		// editor.$highlightTagPending = true;
		// editor.renderer.content.style.cursor = "default";
		// editor.renderer.setStyle("ace_autocomplete");
		// editor.setOption("displayIndentGuides", false);
		
	},

	onExecCode(){
		eruda._devTools.show();
		this.cmd_editor.layout()
	},

	handleInput(e){
		if(e.changes && e.changes[0] && e.changes[0].text.replace(/[	 ]/g,'') == '\n'){
			let text = this.cmd_editor.getValue()
			text = text.substr(0,e.changes[0].rangeOffset)+text.substr(e.changes[0].rangeOffset+e.changes[0].text.length);
			if(text == '') return;
			
			eruda._devTools._tools.console.inputCmd(text)
			let ind = this.records.indexOf(text);
			if(ind != -1){
				this.records.splice(ind,1);
			}
			this.records.push(text);
			this.cmd_editor.setValue('');
			this.cmd_ind = this.records.length;
		}
	},

	handleKeyDown(e)
	{
		let has_key = false
		if(e.browserEvent.key == 'ArrowUp')
		{
			let text = this.records[--this.cmd_ind] || '';
			if(text){
				this.cmd_editor.setValue(text);
			}
			has_key = true
			if(this.cmd_ind<0){
				this.cmd_ind = 0
			}
		}else if(e.browserEvent.key == 'ArrowDown')
		{
			let text = this.records[++this.cmd_ind] || '';
			if(text){
				this.cmd_editor.setValue(text);
			}
			has_key = true
			if(this.cmd_ind>this.records.length){
				this.cmd_ind = this.records.length
			}
		}

		if(has_key){
			e.preventDefault();
			e.stopPropagation();
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
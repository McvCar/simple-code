/* 
面板扩展
功能: 运行选中的代码
*/
'use strict';
const tools = require('../../tools/tools');
let id 				= 'editor-run-code'

module.exports = {
	/** @type import('../../panel/vs-panel/vs-panel').EditorPanel */
	parent : null,


	styleText : `.editorRunCodeIcon{
		height: 0;
		width: 0;
		border-top: 8px solid transparent;
		border-bottom: 8px solid transparent;
		border-left: 8px solid #7de24a;
		cursor:pointer;
	}`,
	
	// 面板初始化
	ready(parent){
		// index.js 对象
		this.parent = parent;
		this.is_mouse_down = false;
	},

	// monaco 编辑器初始化
	onLoad()
	{
		// 1.读取选中区域
		// 2.生成图标
		// 3.点击图标执行运行选中的代码
		// this.parent.vs_editor.onDidChangeCursorSelection((e)=>{
		// 	if(this.sch == null){
		// 		this.sch = setTimeout(()=>{
		// 			this.sch =  null
		// 			let selections = this.parent.vs_editor.getSelections();
		// 			this.upDecorator(selections);
		// 		},50);
		// 	}
		// });

		this.parent.vs_editor.onMouseDown((e)=>{
			this.is_mouse_down = true;
		});

		this.parent.vs_editor.onMouseUp((e)=>{
			if(!this.parent.cfg.enabledDebugBtn){
				return;
			}
			this.parent.setTimeout(()=>{
				this.is_mouse_down = false;
				let selections = this.parent.vs_editor.getSelections();
				this.upDecorator(selections);
			},50);
		});
		this.initWidget();
	},

	initWidget()
	{
		let _this = this;
		// Add a content widget 
		this.runWidget = {
			domNode: null,
			position:{
				lineNumber: 7,
				column: 8
			},
			getId: function() {
				return 'editor.run.code.widget';
			},
			setActive: function(isVisible){
				this.domNode.style.display = isVisible ? 'block' : 'none'
			},
			getDomNode: function(){
				if (!this.domNode)
				{
					this.domNode = document.createElement('div');
					this.domNode.title="点击运行选中的代码"
					var style = document.createElement("style");
					style.innerHTML = _this.styleText;
					this.domNode.className = 'editorRunCodeIcon'
					this.domNode.appendChild(style);
				}
				return this.domNode;
			},
			setPosition: function(lineNumber,column) {
				this.position.lineNumber = lineNumber;
				this.position.column = column;
				_this.parent.vs_editor.layoutContentWidget(this);
			},
			getPosition: function() {
				return {
					position: this.position,
					preference: [_this.parent.monaco.editor.ContentWidgetPositionPreference.EXACT, _this.parent.monaco.editor.ContentWidgetPositionPreference.EXACT]
				};
			}
		};

		// 图标：运行按钮
		let dom = this.runWidget.getDomNode();
		dom.addEventListener('mousedown',(e)=>
		{
			e.preventDefault();
			e.stopPropagation();
			let text = this.parent.vs_editor.getModel().getValueInRange(this.parent.vs_editor.getSelection())
			try {
				Editor.log( eval(text) )
			} catch (error) {
				Editor.log(tools.T('执行代码块出错:','Error executing code block:'),error)
			}
			this.parent.runExtendFunc('onExecCode',text);
		},false)
		this.runWidget.setActive(false);
		this.parent.vs_editor.addContentWidget(this.runWidget);
	},

	upDecorator(selections)
	{
		if(this.is_mouse_down || selections.length == 0 || selections.length > 1 || selections[0].isEmpty()){
			this.runWidget.setActive(false);
			return;
		}
		let selection = selections[0];
		let line = Math.min( selection.selectionStartLineNumber,selection.positionLineNumber);
		line = line == 1 ? line : line -1;
		let column = this.parent.vs_editor.getModel().getLineLength(line)
		this.runWidget.setActive(true);
		this.runWidget.setPosition(line,column+5);
	},

	// 广播通知需要刷新装饰物
	onLoadDecoratorStyleHandle(){

	},

	// 设置选项
	setOptions(cfg,isInit) 
	{
		if(cfg.enabledDebugBtn != null){
			if(!cfg.enabledDebugBtn){
				this.runWidget.setActive(cfg.enabledDebugBtn);
			}
		}
	},

	destoryWidget(){
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
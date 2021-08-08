/* 
面板扩展
功能: 书签🔖
点击左边行数栏标记
*/
'use strict';
const path 			= require('path');
const fs 			= require('fs');
const config 		= Editor2D.require('packages://simple-code/config.js');

let id 				= 'editor-book-mark'

module.exports = {
	/** @type import('../../panel/vs-panel/vs-panel').EditorPanel */
	parent : null,


	styleText : `.editor-book-mark {
		background: lightblue;
		width: 5px !important;
		margin-left: 3px;
	}`,

	// 面板初始化
	ready(parent){
		// index.js 对象
		this.parent  = parent;
		// 本地保存数据
		this.pro_cfg = config.getProjectLocalStorage();
		this.book_marks = this.pro_cfg.book_marks = this.pro_cfg.book_marks || {};

	},

	getMarks(){
		let url = this.parent.vs_editor.getModel().uri.toString()
		return this.book_marks[url] = this.book_marks[url] || [];
	},

	getNextMark()
	{
		let list = this.getMarks()
		list.sort((a,b)=>a.range.startLineNumber-b.range.startLineNumber);
		let pos  = this.parent.vs_editor.getPosition()
		let ind  = list.findIndex(v=>v.range.startLineNumber > pos.lineNumber)
		return list[ind] || list[0];
	},

	// monaco 编辑器初始化
	onLoad(){

		// 1.判断点击已有的书签是否在点击区域
		// 2.在:删除该书签重新渲染
		// 3.不在:新建书签重新渲染
		// 4.渲染装饰物
		this.parent.vs_editor.onMouseDown(e => {
			const target  = e.target;
			// 判断点击的区域位置是否行符地方
			if (target.type === this.parent.monaco.editor.MouseTargetType.GUTTER_LINE_DECORATIONS) {
				// 找出书签装饰物
				this.clickMark(target.position.lineNumber)
			}
		});

		// 书签样式
		this.parent.runExtendFunc('setDecoratorStyle',id,this.styleText);
		this.bindKeybody()
	},


	clickMark(lineNumber){
		let list 		 = this.getMarks();
		let existIndex 	 = list.findIndex(v=>v.range.startLineNumber === lineNumber);

		if (existIndex === -1) {
			let select = this.parent.vs_editor.getSelection();
			select = lineNumber == select.selectionStartLineNumber ? select : undefined
			this.addMark(lineNumber,select);
		} else {
			list.splice(existIndex, 1);
		}

		this.onLoadDecoratorStyle();
	},

	addMark(lineNumber,selection){
		let list 		 = this.getMarks();
		list.push({
			// id: "",
			// ownerId: 0,
			selection : selection || undefined,
			scroll_top : this.parent.vs_editor.getScrollTop(),
			range: new this.parent.monaco.Range(
				lineNumber,
				1,
				lineNumber,
				1,
			),
			options: {
				isWholeLine: true,
				linesDecorationsClassName: id,
				minimap: {position:2},
				stickiness: this.parent.monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
			},
		});
	},

	// 广播通知需要刷新装饰物
	onLoadDecoratorStyle(){
		let list 		 = this.getMarks();
		if(list){
			// 检测超出范围的标签删除掉
			let line_max = this.parent.vs_editor.getModel().getLineCount()
			for (let i = list.length-1; i >=0; i--) {
				const mark = list[i];
				if(mark.range.startLineNumber > line_max){
					list.splice(i,1);
				}
			}
		}
		this.parent.runExtendFunc('setDecorator',id,list);
	},
	
	bindKeybody(){

		// 跳到编辑器标签
		for (let i = 0; i < 10; i++) {
			// 绑定页面全局快捷键事件,注意: 区分大小写 Ctrl = ctrl
			this.parent.addKeybodyEvent([[Editor2D.isWin32 ? "Alt" : "Meta",String(i)]],async (e)=>
			{
				if(this.parent.file_info == null) return;

				let tab_tag_cfg = this.pro_cfg.tab_tag_cfg = this.pro_cfg.tab_tag_cfg || {};
				let tab_info 	= tab_tag_cfg[String(i)];
				if(tab_info){
					e.preventDefault();// 吞噬捕获事件
					let file_info = await this.parent.openOutSideFile(tab_info.fsPath,true)
					if(file_info){
						file_info.position = tab_info.position;
						file_info.selection = tab_info.selection;
						file_info.scroll_top = tab_info.scroll_top;
						this.parent.readFile(file_info);
						return false;
					}
				}
			},1)
		}

		// 绑定编辑器标签
		for (let i = 0; i < 10; i++) {
			// 绑定页面全局快捷键事件,注意: 区分大小写 Ctrl = ctrl
			this.parent.addKeybodyEvent([[Editor2D.isWin32 ? "Ctrl" : "Alt",String(i)]],(e)=>
			{
				if(this.parent.file_info == null || this.parent.file_info.vs_model == null) return;

				let tab_tag_cfg = this.pro_cfg.tab_tag_cfg = this.pro_cfg.tab_tag_cfg || {}
				tab_tag_cfg[String(i)] = {
					fsPath : this.parent.file_info.vs_model.fsPath, 
					position:this.parent.file_info.position,
					selection:this.parent.file_info.selection,
					scroll_top:this.parent.vs_editor.getScrollTop()
				}
				e.preventDefault();// 吞噬捕获事件
				return false;
			},1)
		}
		
		this.parent.addKeybodyEventByName('nextBookmark',(e)=>
		{
			if(this.parent.file_info == null || this.parent.file_info.vs_model == null) return;
			
			let mark = this.getNextMark();
			if(mark == null) return;

			let file_info = this.parent.file_info;
			file_info.selection = mark.selection || {
				selectionStartLineNumber: mark.range.startLineNumber,
				selectionStartColumn: mark.range.startColumn,
				positionLineNumber: mark.range.endLineNumber,
				positionColumn: mark.range.endColumn,
			};
			file_info.scroll_top = mark.scroll_top;
			this.parent.readFile(file_info);

			e.preventDefault();// 吞噬捕获事件
			return false;
		},1)
	},

	// 面板销毁
	onDestroy(){
		for (const key in this.book_marks) {
			if (this.book_marks[key] == null || this.book_marks[key].length == 0) {
				delete this.book_marks[key]
				
			}
		}
	},


	messages:{

		// 'cleanFile'()
		// {
		// },
	},
	
};
/* 
面板扩展
功能: prettier 格式化插件
*/
'use strict';

const tools = require('../../tools/tools');
const path 	= require("path");
const config = require('../../config');
const OLD_PRETTIER_CONFIG_FILE = path.join(__dirname,'prettier.config.js')
const PRETTIER_CONFIG_FILE 	   = path.join(config.cfgFileDir,'prettier.config.js');

module.exports = {
	/** @type import('../../panel/vs-panel/vs-panel').EditorPanel */
	parent : null,


	// 面板初始化
	onLoad(parent) {
		// index.js 对象 
		this.parent = parent;

		// 复制配置文件
		if (!tools.isFileExit(PRETTIER_CONFIG_FILE)) {
			tools.copyFile(OLD_PRETTIER_CONFIG_FILE, PRETTIER_CONFIG_FILE);
		}
		
		// 读取配置
		this.cfg = require(PRETTIER_CONFIG_FILE);
		this.cfg.endOfLine = this.cfg.endOfLine || 'lf';

		// monaco 菜单
		this.parent.vs_editor.addAction({
			id: 'prettier-format', // 菜单项 id
			label: 'Format form Prettier ', // 菜单项名称
			// keybindings: [this.monaco.KeyMod.CtrlCmd | this.monaco.KeyCode.KEY_J], // 绑定快捷键
			// A precondition for this action.
			run: this.handel.bind(this),
		})
	},

	// 设置选项
	setOptions(cfg,isInit) 
	{	
		if(cfg.enabledFormatFromPrettier == null) return;
		
		if(cfg.enabledFormatFromPrettier){
			if(!isInit){
				return Editor.log(tools.translateZhAndEn ("使用prettier插件 重启creator后生效",
					'Restart Creator using the PretTier plugin.'));
			}
			this.initEvent()
		}else{
			if(!isInit){
				return Editor.log(tools.translateZhAndEn ("禁用prettier插件 重启creator后生效",
					'The Prettier plug-in is uninstalled and takes effect after restarting Creator'));
			}
		}
	},

	initEvent()
	{
		if(!Symbol.asyncIterator){
			// 旧版js解析器不支持该库
			return;
		}
		
		const prettier = require('prettier');
		const diff 	= require('diff');
		// 代码格式化
		let _this = this;
		// Editor.monaco.languages.registerDocumentRangeFormattingEditProvider("typescript", {
		// 	provideDocumentRangeFormattingEdits(model , range , options , token){
				
		// 		// const editor = _this.parent.vs_editor;

		// 		_this.cfg.filepath = model.dbUrl;
		// 		delete _this.cfg.cursorOffset;
		// 		_this.cfg.rangeStart = model.getOffsetAt(range.getStartPosition())
		// 		_this.cfg.rangeEnd = model.getOffsetAt(range.getEndPosition())

		// 		// 格式化
		// 		let code = model.getValue();

		// 		try {
		// 			let formatText = prettier.format(code,_this.cfg);
		// 			// model.setValue(formatText);
		// 			let edits = _this.getDiffTexts(diff.diffChars(code,formatText),model);
		// 			return edits;
		// 		} catch (error) {
		// 			console.warn(error);
		// 			return []
		// 		}
		// 	}
		// })


		this.parent.pushMonacoEvent(Editor.monaco.languages.registerDocumentFormattingEditProvider("typescript", {
			provideDocumentFormattingEdits(model , options , token){
				
				_this.cfg.filepath = model.fsPath;
				let select = _this.parent.vs_editor.getSelection()
				let cursorOffset = !select || !select.isEmpty() ? -1 : model.getOffsetAt(select.getPosition());
				_this.cfg.cursorOffset = cursorOffset
				delete _this.cfg.rangeStart;
				delete _this.cfg.rangeStart;
				
				// 设置换行格式
				let currEOL = model.getEOL() == '\n' ? 'lf' : 'crlf';
				if(currEOL != _this.cfg.endOfLine && _this.cfg.endOfLine != 'auto' && _this.cfg.endOfLine != 'cr'){
					model.pushEOL(_this.cfg.endOfLine == 'lf' ? 0 : 1)
				}

				// 格式化
				let code = model.getValue() ; // endOfLine 换行格式 即\n（或LF换行）和\r\n（或回车+CRLF换行）
				
				try {
					let formatInfo = prettier.formatWithCursor(code,_this.cfg);
					if(formatInfo.formatted == code){
						return [];
					}if(formatInfo.cursorOffset != -1){
						model.setValue(formatInfo.formatted);
						_this.parent.vs_editor.setPosition(model.getPositionAt(formatInfo.cursorOffset));
						return [];
					}else if(code < 50000){ // 保证性能情况下才使用这种格式化, 解决格式化后光标错位问题
						let edits = _this.getDiffTexts(diff.diffChars(code,formatInfo.formatted),model);
						return edits;
					}else{
						model.setValue(formatInfo.formatted);
						return [];
					}
				} catch (error) {
					console.warn(error);
					return []
				}
			}
		}));
		
	},

	// 对比差异再插入，解决格式化后光标错位问题
	getDiffTexts(diffList,model){

		let edits = []

		let offset = 0;
		for (let i = 0; i < diffList.length; i++) {
			const item = diffList[i];

			if(item.added){
				let pos = model.getPositionAt(offset);
				let select = new Editor.monaco.Selection(pos.lineNumber,pos.column,pos.lineNumber,pos.column);
				edits.push({
					range:select,
					text:item.value,
					forceMoveMarkers:false,
				})
			}else if(item.removed){
				let s_pos = model.getPositionAt(offset);
				offset += item.count;
				let e_pos = model.getPositionAt(offset);
				let select = new Editor.monaco.Selection(s_pos.lineNumber,s_pos.column,e_pos.lineNumber,e_pos.column);
				edits.push({
					range:select,
					text:'',
					forceMoveMarkers:false,
				})
			}else{
				offset += item.count;
			}
		}
		
		return edits;
	},

	handel() {
	},


/*************  事件 *************/

	messages: {
		'openPrettierConfig'(){
			this.parent.openOutSideFile(PRETTIER_CONFIG_FILE,true);
		}
	},

};
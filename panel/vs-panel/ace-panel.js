/**
 * 1.管理文件资源逻辑部分
 */

const ace = Editor.require('packages://simple-code/panel/vs-panel/ace/ace.js');
const settings_menu = Editor.require('packages://simple-code/panel/vs-panel/ace/ext-settings_menu.js');
const prompt_ex = Editor.require('packages://simple-code/panel/vs-panel/ace/ext-prompt.js');

const prsPath = Editor.Project && Editor.Project.path ? Editor.Project.path : Editor.remote.projectPath;

class AcePanel{
	constructor(parent){
		this.parent = parent;
		this.initAce();
		this.initEvent()
    }

	initAce() {
		// 副级编辑器
		ace.config.set("basePath", Editor.url('packages://simple-code/ace/', 'utf8'));
		var editor = ace.edit(this.parent.$editorA);
		editor.setOptions({
			// 默认:false
			wrap: true, // 换行
			autoScrollEditorIntoView: false, // 自动滚动编辑器视图
			enableLiveAutocompletion: true, // 智能补全
			enableSnippets: true, // 启用代码段
			enableBasicAutocompletion: false, // 启用基本完成 不推荐使用
		});

		// 设置主题
		editor.setTheme("ace/theme/monokai");
		// 设置编辑语言
		editor.getSession().setMode("ace/mode/javascript");
		// 设置快捷键模式
		editor.setKeyboardHandler('ace/keyboard/sublime');
		editor.setReadOnly(false);
		editor.getSession().setTabSize(4);
		editor.setShowPrintMargin(false);
		this.ace_editor = editor;
	}

	initEvent(){
		// 设置面板改变的时候
		this.ace_editor.on("setOption", (e) => {
			this.parent.setOptions({ [e.name]: e.value });
		});
	}

	setMiniSearchBoxToTouchPos(width=150,isAutoHeight=0,isTextEditMode=0,isHidePopup=false)
	{
		this.setMiniSearchBox(this.parent.mouse_pos,width,isAutoHeight,isTextEditMode,isHidePopup)
	}

	// 设置迷你输入框大小
	setMiniSearchBox(pos,width=150,isAutoHeight=0,isTextEditMode=0,isHidePopup=false)
	{
		let box = document.getElementById('mini_prompt_box');
		let input = document.getElementById('mini_prompt_input');
		let popup = document.getElementById('mini_prompt_popup');
		
		if(!box || !input || !popup)
		{
			return;
		}
		
		if(pos) {
			let max_x = document.body.clientWidth - width-100;
			let x = pos.x>max_x ? max_x : pos.x - width*0.5;
			box.style.margin = `${pos.y-10}px auto auto ${x}px`
		};

		box.style['max-width'] = width+'px'
		popup.style['max-width'] = width+'px'
		if(isHidePopup) popup.style['display'] = 'none';
		if(isAutoHeight) {
			input.cmdLine.setOption("wrap", "free") // ace 编辑器选项
			input.cmdLine.setOption('maxLines',35)
			input.cmdLine.isEditorMode = true;
		}
		if(isTextEditMode) {
			input.cmdLine.setOption("wrap", "off") // ace 编辑器选项
			input.cmdLine.setOption('maxLines',35)
			input.cmdLine.setHighlightActiveLine(true);
			input.cmdLine.setShowPrintMargin(false);
			input.cmdLine.renderer.setShowGutter(true);
			input.cmdLine.renderer.setHighlightGutterLine(true);
			// input.cmdLine.setTheme("ace/theme/monokai");
			input.cmdLine.isEditorMode = true;
		}else{
			input.cmdLine.setShowPrintMargin(false);
			input.cmdLine.renderer.setShowGutter(false);
			input.cmdLine.renderer.setHighlightGutterLine(false);
		}
		input.cmdLine.resize()
	}
	
	/**
	 * 打开下拉框, 例子: this.openSearchBox("",fileList,(data)=>{console.log(data.item)});
	 * @param {string} msg 默认显示内容
	 * @param {Function} itemList 搜索列表
	 * @param {Function} onAccept 用户确认
	 * @param {Function} onCompletionsFunc 修改搜索框时，通过该函数读取显示的实时显示的列表
	 * @param {Function} onDone 窗口关闭，完成
	 * @param {string} type 历史记录标记
	 */
	 openSearchBox(msg = "", itemList, onAccept, onCompletionsFunc,onDone,type='general') {
		let _this = this

		// 搜索记录
		let record = _this.parent.pro_cfg.search_record = _this.parent.pro_cfg.search_record || {}
		if(!record[type]){
			record[type] = []
		}
		
		// 打开个自定义 下拉 选项 
		this.ace_editor.prompt(msg, {
			// 名字
			name: "searchFile",
			selection: [0, Number.MAX_VALUE],
			maxHistoryCount: itemList.length>200 ? 20 : 100,// 历史记录最大数量
			
			onAccept: function (data, label) {
				if (data.item && !onCompletionsFunc) this.addToHistory(data.item);
				onAccept(data, label);
			},

			addToHistory: function (item) {
				var history = this.history();
				history.unshift(item);
				delete item.message;
				for (var i = 1; i < history.length; i++) {
					if (history[i]["value"] == item.value) {
						history.splice(i, 1);
						break;
					}
				}
				if (this.maxHistoryCount > 0 && history.length > this.maxHistoryCount) {
					history.splice(history.length - 1, 1);
				}
				record[type] = history;
			},

			// 搜索文字蓝色高亮
			getPrefix: function (cmdLine) {
				var currentPos = cmdLine.getCursorPosition();
				var filterValue = cmdLine.getValue();
				return filterValue.substring(0, currentPos.column);
			},

			// 历史使用记录
			history: function () {
				let commands = JSON.parse(JSON.stringify(record[type] || []));
				for (let i = commands.length - 1; i >= 0; i--) {

					let isNot = true
					for (let n = 0; n < itemList.length; n++) {
						let now_item = itemList[n];
						if (commands[i].value == now_item.value) {
							isNot = false
							break;
						}
					}

					if (isNot) {
						commands = commands.slice(0, i);
					}
				}
				return commands
			},


			sortCompletions(completions, prefix) {
				if (prefix == "") return completions;
				prefix = prefix.toLowerCase();

				for (let i = 0; i < completions.length; i++) {
					let info = completions[i];
					let text = info.value.toLowerCase();
					let similar_count = 0;
					let start_pos = 999;
					let end_pos = 999;
					let break_tag = false;
					for (let n = 0; n < prefix.length; n++) {
						let char = prefix[n];
						let isFind = false;
						for (let n2 = n; n2 < text.length; n2++) {
							if (char == text[n2]) {
								if (start_pos == 999)
									start_pos = n2
								else if (!break_tag) end_pos = n2
								n = n2;
								similar_count++;
								isFind = true;
								break;
							} else {
								if (end_pos != 999) {
									break_tag = true;
								} else if (!break_tag) {
									start_pos = 999
								}
							}
						}

						if (!isFind) {
							break;
						}
					}
					if (end_pos == 999) start_pos = 999;
					let head_count = end_pos - start_pos;
					info.score = (_this.parent.SEARCH_SCORES[info.extname] || 70) + head_count * 10 + (start_pos != 999 ? start_pos * -10 : 0) + parseInt(similar_count / text.length * 30);
				}

				completions.sort((a, b) => b.score - a.score);
				return completions;
			},

			// 返回下拉列表命令
			getCompletions: onCompletionsFunc || function (cmdLine) {
				function getFilteredCompletions(commands, prefix) {
					var resultCommands = JSON.parse(JSON.stringify(commands));

					var filtered;
					ace.config.loadModule("ace/autocomplete", function (module) {
						filtered = new module.FilteredList(resultCommands);
					});
					return filtered.filterCompletions(resultCommands, prefix);
				}

				function getUniqueCommandList(commands, usedCommands) {
					if (!usedCommands || !usedCommands.length) {
						return commands;
					}
					var excludeCommands = [];
					usedCommands.forEach(function (item) {
						excludeCommands.push(item.value);
					});

					var resultCommands = [];

					commands.forEach(function (item) {
						if (excludeCommands.indexOf(item.value) === -1) {
							resultCommands.push(item);
						}
					});

					return resultCommands;
				}

				var prefix = this.getPrefix(cmdLine);

				var recentlyUsedCommands = getFilteredCompletions(this.history(), prefix);
				var otherCommands = getUniqueCommandList(itemList, recentlyUsedCommands);
				otherCommands = getFilteredCompletions(otherCommands, prefix);

				if (recentlyUsedCommands.length && otherCommands.length) {
					recentlyUsedCommands[0]["message"] = " Recently used";
					otherCommands[0]["message"] = " Other commands";
				}

				var completions = this.sortCompletions(recentlyUsedCommands.concat(otherCommands), prefix);
				return completions.length > 0 ? completions : [{
					value: "找不到命令...",
					error: 1
				}];
			}
		});
	}


	// 打开设置菜单
	openMenu() {
		// 打开配置面板
		if (!this.ace_editor.showSettingsMenu) {
			Editor.require('packages://simple-code/panel/vs-panel/ace/ext-settings_menu.js').init();
		}
		this.ace_editor.showSettingsMenu(this.parent.cfg);
	}


}

module.exports = AcePanel;
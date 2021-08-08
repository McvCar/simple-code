/* 
面板扩展
功能: 生成 gettrs 和 setters 
文档: https://github.com/WilsonGodoi/generate-getters-setters
*/
'use strict';
const fe = Editor2D.require('packages://simple-code/tools/tools.js');

module.exports = {
	/** @type import('../../panel/vs-panel/vs-panel').EditorPanel */
	parent : null,


	// 面板初始化
	onLoad(parent) {
		// index.js 对象
		this.parent = parent;

		// monaco 右击菜单
		this.parent.vs_editor.addAction({
			id: 'gettrs-settrs', // 菜单项 id
			label: fe.translate('gettrs-settrs'), // 菜单项名称
			// keybindings: [this.monaco.KeyMod.CtrlCmd | this.monaco.KeyCode.KEY_J], // 绑定快捷键
			// A precondition for this action.
			precondition: 'editorHasSelection', // 选取状态才显示
			contextMenuGroupId: '9_cutcopypaste', // 所属菜单的分组
			contextMenuOrder: 9,
			run: this.handel.bind(this),
		})
	},

	handel() {

		// 获得编辑器
		const editor = this.parent.vs_editor;
		const model = editor.getModel();
		let languageInfo = model.getLanguageIdentifier();
		if(!languageInfo || languageInfo.language != 'typescript'){
			Editor.log(fe.translate('gettrs-setters-language'));
			return;
		}

		let code = ``;
		let reverse = false;

		// 获得选取的内容
		let selections = editor.getSelections();
		
		for (let selection of selections) {
			reverse = selection.getDirection();
		}

		// 选取位置反转
		if (reverse) {
			selections = selections.reverse();
		}

		// 合并选取的文本
		for (let selection of selections) {
			code += model.getValueInRange(selection);
			code += `\n`;
		}

		// 少于一定值则不执行
		if (code.length < 1) {
			Editor.log('No selected properties.');
			return;
		}
		
		try {
			// 创建代码
			var getterAndSetter = this.createGetterAndSetter(code);
			if(getterAndSetter == ''){
				Editor.log('Something went wrong! Try that the properties are in this format: "private name: string;"');
				return;
			}
			// 插入代码到后面
			// editor.edit(e => e.insert(selections[selections.length - 1].end, getterAndSetter));
			let select = selections[selections.length - 1];
			select = new Editor.monaco.Selection(select.endLineNumber,select.endColumn+1,select.endLineNumber,select.endColumn+1)
			let edits = [{
				range:select,
				text:'\n'+getterAndSetter,
				forceMoveMarkers:true,
			}]
			model.pushStackElement();
			model.pushEditOperations([select], edits, () => []);
			model.pushStackElement();
		}
		catch (error) {
			Editor.log('Something went wrong! Try that the properties are in this format: "private name: string;"');
		}
	},

	toCamelCase(str) {
		return str.replace(/\w+/g, w => w[0].toUpperCase() + w.slice(1));
	},

  	createGetterAndSetter(textProperties) {

		// 用换行分割每个变量
		let rows = textProperties.split('\n').map(x => x.replace(';', ''));
		// 成员变量缓存
		let properties = [];

		for (let row of rows) {
			let s_i = row.indexOf('=');
			if(s_i != -1) row = row.substr(0,s_i);
			if (row.trim() !== "") { // 删除空行
				properties.push(row); // 记录
			}
		}

		let generatedCode = '';
		// 遍历成员
		for (let p in properties) {
			// 去掉空格或换行的前缀
			while (properties[p].startsWith(" ")) { properties[p] = properties[p].substr(1); }
			while (properties[p].startsWith("\t")) { properties[p] = properties[p].substr(1); }
			let words = [];
			if(properties[p].indexOf(':') == -1) continue;

			// 空格分割 private id:number
			let rows = properties[p].split(" ").map(x => x.replace('\r\n', ''));
			for (let row of rows) {
				if (row.trim() !== '') {
					words.push(row.replace('\r', '')); // 成员缓存分割信息
				}
			}
			let type, attribute, Attribute = "";
			let create = false;

			if(words[0] != 'public' && words[0] != 'private' && words[0] != 'protected'){
				// if words === ["name:", "string"];
				words.unshift('public');
			}
			
			// 解析成员组成
			// if words === ["private", "name:", "string"];
			if (words.length === 3) {
				let attributeArray = words[1].split(":");
				type = words[2];
				attribute = attributeArray[0];
				Attribute = this.toCamelCase(attribute);

				create = type;
				// if words === ["private", "name:string"];
			} else if (words.length === 2) {
				let array = words[1].split(":");
				type = array[1];
				attribute = array[0];
				Attribute = this.toCamelCase(attribute);
				create = type;
				// if words === ["private", "name", ":", "string"];
			} else if (words.length === 4) {

				let array = [];
				for (let word of words) {
					if (word !== ':') {
						array.push(word);
					}
				}
				type = array[2].trim();
				attribute = array[1];
				Attribute = this.toCamelCase(attribute);
				create = type;
			} else {
				Editor.log('Something went wrong! Try that the properties are in this format: "private name: string;"')
				generatedCode = ``;
				break;
			}

			if (create) {

				let code = `
    public ${(type === "Boolean" || type === "boolean" ? "is" : "get")}${Attribute}(): ${type} {
        return this.${attribute};
    }

    public set${Attribute}(${attribute}: ${type}): void {
        this.${attribute} = ${attribute};
    }
`;
				generatedCode += code;
			}
		}

		return generatedCode;
	},

/*************  事件 *************/

	messages: {

	},

};
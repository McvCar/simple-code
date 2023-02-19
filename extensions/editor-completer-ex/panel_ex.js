/* 
面板扩展
功能: 代码输入提示
*/
'use strict';
var path 	= require('path');
var fs 		= require('fs');



module.exports = {
	/** @type import('../../panel/vs-panel/vs-panel').EditorPanel */
	parent : null,
	/** @type import('./editor-completion').default */
	completor: null,

	// 
	ready(parent){
		// index.js 对象
		this.parent = parent; 

		let EditorCompletion = require('./editor-completion');
		this.completor = new EditorCompletion.default(this.parent);
		
		// 进入编辑器时刷新下nodeTree信息
		this.parent.panel.addEventListener('focus', () => {
			this.upCurrSceneChildrenInfo();
		},false);
	},

	// 编辑器启动完成
	onLoad(parent){
		this.initCompletionEvent()
		this.loadCompleter()
	},

	initCompletionEvent(){
		this.completor.onLoad(this.parent.vs_editor)
		this.parent.pushMonacoEvent(this.parent.monaco.languages.registerCompletionItemProvider('typescript',this.completor));
		this.parent.pushMonacoEvent(this.parent.monaco.languages.registerCompletionItemProvider('plaintext',this.completor));
	},

	// 配置代码输入提示
	loadCompleter(){
		
		// 载入自定义提示
		let text = fs.readFileSync(Editor2D.url('packages://simple-code/template/hint_text.txt', 'utf8')).toString()
		// 提示列表格式 : arrWord = ["cat", "this.node.runAction( cc.MoveTo(0,cc.p(0,0) ))",...]
		let arrWord = text.split(" ");
		this.completor.addCustomCompleters(arrWord)

		// 动态添加提示
		// this.completor.addCustomCompleters(["cc.Sequence([new cc.delayTime(1),new cc.MoveTo(0.1,pos),new cc.CallFunc(()=>{})])"])
		// // 提示缩写, 只需输入 "delay"就有提示
		// this.completor.addCustomCompleter("delay","cc.Sequence([new cc.delayTime(1)],new cc.CallFunc(()=>{})])","延时动作回调")
		
		// this.completor.addCustomCompleter("this.ui.","this.ui.","命令模式下该ui保存场景所有节点")
		// this.completor.addCustomCompleter("this.node.","this.node.","命令模式下该node保存当前鼠标选择的节点")
		
		this.completor.addCustomCompleter("forEach in","forEach((value,key)=>{${1: }})","遍历数组",27,true)
		this.completor.addCustomCompleter("for","for (let ${1:i} = 0; ${1:i} < ${2:arr}.length; i++) {\n	let ${3:vaule} = ${2:arr}[${1:i}];\n}","for(let i=0; i<array.length;i++)",27,true)
		this.completor.addCustomCompleter("for loop","for (let ${1:i} = 0; ${1:i} < ${2:arr}.length; i++) {\n	let ${3:vaule} = ${2:arr}[${1:i}];\n}","for(let i=0; i<array.length;i++)",27,true)
		this.completor.addCustomCompleter("for re loop","for (let ${1:i} = ${2:arr}.length-1; ${1:i} >= 0; i--) {\n	let ${3:vaule} = ${2:arr}[${1:i}];\n}","for(let i=array.length -1; i>=0;i--)",27,true)
		this.completor.addCustomCompleter("for in","for (let ${1:k} in ${2:object}) {\n	let ${3:vaule} = ${2:object}[${1:k}];\n}","for (let k in object)",27,true)
		this.completor.addCustomCompleter("while","while (${1:true}) {\n	${2: }\n}","while (true)",27,true)
		this.completor.addCustomCompleter("if","if (${1:true}) {\n	${2: }\n}","if (true)",27,true)
		this.completor.addCustomCompleter("else if","else if(${1:true}) {\n	${2: }\n}","else if(true){}",27,true)
		this.completor.addCustomCompleter("switch (key)","switch (${1:key}) {\n	case value:\n		\n		break;\n\n	default:\n		break;\n}",'',27,true)
		this.completor.addCustomCompleter("try catch","try {\n		${2: }	\n} catch (${1:error}) {\n ${3: }\n}",'try catch(err)',27,true)
		this.completor.addCustomCompleter("import  from; ",'import ${1:model} from"${2:model}"','',27,true)
		this.completor.addCustomCompleter("import * as cc from \"cc\"; ",'import * as cc from \"cc\";','',27,true)
	},

	onSaveFile(fileInfo){
		// 保存后刷新下
		if(!this.parent.is_save_wait_up){
			this.completor.upAllSymSuggests()
		}
	},

	onAssetsCreatedEvent(files){
		this.completor.upAllSymSuggests()
	},
	
	// 刷新场景所有的子节点信息缓存
	upCurrSceneChildrenInfo() {
		if(!this.parent.is_init_finish) return;
		// 从场景获得nodeTree数据
		Editor2D.Scene.callSceneScript('simple-code', 'scene-children-info', (err, currSceneChildrenInfo) => {
			if (!currSceneChildrenInfo) return;

			if(!this.parent) return;
			this.completor.cleanCustomCompleterByGroup('nodeTree')
			// 写入提示
			currSceneChildrenInfo.forEach((info)=>
			{
				// 动态添加当前场景所有节点的name输入提示
				// 名字，名字，节点路径深度描述，类型图标，是否覆盖
				if(!info.name.match(/[\W\s]/)){
					this.completor.addCustomCompleter(info.name,info.name,info.path,this.parent.monaco.languages.CompletionItemKind.Unit,true,'nodeTree')
				}
			})
		})
	},

	onLoadAssetAndCompleter(filePath, extname, isUrlType,isScript)
	{
		// if(isScript){
		// 	// 插入模块名字提示
		// 	let file_name = filePath.substr(filePath.lastIndexOf('/') + 1)
		// 	let word = file_name.substr(0,file_name.lastIndexOf('.'))
		// 	this.completor.addCustomCompleter(word,word,file_name,this.parent.monaco.languages.CompletionItemKind.Reference,true);
		// }
		// else 
		if(isUrlType){
			// 插入模块文件名提示
			let word = filePath.substr(12,filePath.lastIndexOf('.')-12)
			let matchInfo = filePath.match(/resources\/(.+)/)
			if(matchInfo){
				word = matchInfo[1];
				if(word.lastIndexOf('.plist') == -1){
					this.completor.addCustomCompleter(word,word,'',this.parent.monaco.languages.CompletionItemKind.Folder,true);
				}
			}
		}
	},

	// 面板销毁
	onDestroy(){

	},
	/*************  事件 *************/  


	messages:{

		// 场景加载完
		// 'scene:ready'(event) {
		// 	if(!this.parent.is_init_finish) return;
		// 	this.upCurrSceneChildrenInfo();
		// },
	},
	
};
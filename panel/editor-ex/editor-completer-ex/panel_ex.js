/* 
面板扩展
功能: 代码输入提示
*/
'use strict';
var path 	= require('path');
var fs 		= require('fs');
var md5     = require('md5');



module.exports = {

	// 面板初始化
	onLoad(parent){
		// index.js 对象
		this.parent = parent; 
		this.loadCompleter()
	},

	// 配置代码输入提示
	loadCompleter(){
		
		// 载入自定义提示
		let text = fs.readFileSync(Editor.url('packages://simple-code/template/hint_text.txt', 'utf8')).toString()
		// 提示列表格式 : arrWord = ["cat", "this.node.runAction( cc.MoveTo(0,cc.p(0,0) ))",...]
		let arrWord = text.split(" ");
		this.parent.addCustomCompleters(arrWord)

		// 动态添加提示
		// this.parent.addCustomCompleters(["cc.Sequence([new cc.delayTime(1),new cc.MoveTo(0.1,pos),new cc.CallFunc(()=>{})])"])
		// // 提示缩写, 只需输入 "delay"就有提示
		// this.parent.addCustomCompleter("delay","cc.Sequence([new cc.delayTime(1)],new cc.CallFunc(()=>{})])","延时动作回调")
		
		// this.parent.addCustomCompleter("this.ui.","this.ui.","命令模式下该ui保存场景所有节点")
		// this.parent.addCustomCompleter("this.node.","this.node.","命令模式下该node保存当前鼠标选择的节点")
		
		this.parent.addCustomCompleter("forEach","forEach((value,key)=>{${1: }})","遍历数组",27,true)
		this.parent.addCustomCompleter("for","for (let ${1:i} = 0; ${1:i} < ${2:arr}.length; i++) {\n	let ${3:vaule} = ${2:arr}[${1:i}];\n}","for(let i=0; i<array.length;i++)",27,true)
		this.parent.addCustomCompleter("for loop","for (let ${1:i} = 0; ${1:i} < ${2:arr}.length; i++) {\n	let ${3:vaule} = ${2:arr}[${1:i}];\n}","for(let i=0; i<array.length;i++)",27,true)
		this.parent.addCustomCompleter("for re loop","for (let ${1:i} = ${2:arr}.length-1; ${1:i} >= 0; i--) {\n	let ${3:vaule} = ${2:arr}[${1:i}];\n}","for(let i=array.length -1; i>=0;i--)",27,true)
		this.parent.addCustomCompleter("for in","for (let ${1:k} in ${2:object}) {\n	let ${3:vaule} = ${2:object}[${1:k}];\n}","for (let k in object)",27,true)
		this.parent.addCustomCompleter("while","while (${1:true}) {\n	${2: }\n}","while (true)",27,true)
		this.parent.addCustomCompleter("if","if (${1:true}) {\n	${2: }\n}","if (true)",27,true)
		this.parent.addCustomCompleter("else if","else if(${1:true}) {\n	${2: }\n}","else if(true){}",27,true)
		this.parent.addCustomCompleter("switch (key)","switch (${1:key}) {\n	case value:\n		\n		break;\n\n	default:\n		break;\n}",'',27,true)
		this.parent.addCustomCompleter("try catch","try {\n		${2: }	\n} catch (${1:error}) {\n ${3: }\n}",'try catch(err)',27,true)
		this.parent.addCustomCompleter("import  from; ",'import ${1:model} from"${2:model}"','',27,true)
	},

	
	// 刷新场景内节点信息
	onCurrSceneChildrenInfo(currSceneChildrenInfo)
	{
		if(!this.parent) return;
		// 写入提示
		currSceneChildrenInfo.forEach((info)=>
		{
			// 动态添加当前场景所有节点的name输入提示
			// 名字，名字，节点路径深度描述，类型图标，是否覆盖
			this.parent.addCustomCompleter(info.name,info.name,info.path,12,true)
		})
	},

	// 面板销毁
	onDestroy(){

	},
	/*************  事件 *************/  



	messages:{

		// 快捷键打开当前选中文件/节点进入编辑
		'custom-cmd' (event,info) {
		},

		'scene:saved'(){
			// Editor.log("事件 save")
		}
	},
	
};
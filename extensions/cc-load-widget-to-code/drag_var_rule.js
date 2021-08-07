/**
 * 生成拖拽变量代码块规则
 * 修改后重启Creator生效
 * Generate drag and drop variable code block rules
 * Restart Creator after modification takes effect
 */

module.exports = {
	
	/**
	 * 第4阶段
	 * @description 最后给脚本组件成员变量赋值
	 * @param {cc.Component} scriptComp - 当前编辑中的脚本组件对象, scriptComp.onLoad 
	 * @param {string} widgetType - 要修改的成员变量类型,widgetType = cc.Node
	 * @param {string} symbolName - 要修改的成员变量,symbolName = 'name'
	 * @param {boolean} isArray - 数据是否数组类型
	 * @param {Array} insertUuids - 插入的uuid, isAssets是节点情况下该值为节点的uuids,否则为资源文件的uuids; insertUuids = ['xxxx-xxx-xx']
	 * @param {boolean} isAssets - 是资源费否则是节点
	 * @param {object} rule - 第1阶段解析的参数, rule = {symbolName:'',widgetType:'',nodeUuid:'',args:['@','Sprite','name']} || null
	 * @returns 
	 */
	 setComponentVar(scriptComp,widgetType,symbolName,isArray,insertUuids,isAssets,rule){
		// scene环境运行,打印日志请用 console.warn('打印') ;
		// 使用例子 :

		// if(isAssets || isArray || !insertUuids || !scriptComp.hasOwnProperty(symbolName)){
		// 	return
		// }
		// // 获得需要解析的node对象
		// let nodeUuid = insertUuids[0];
		// let node 	 = cc.engine.getInstanceById(nodeUuid);
		// if(!node){
		// 	return;
		// }
		// // 给脚本的成员赋值完成绑定组件
		// let comp = widgetType == 'cc.Node' ? node : node.getComponent(widgetType);
		// if(comp){
		// 	scriptComp[symbolName] = comp;
		// }
		// console.log('组件赋值',symbolName)
	},

	/**
	 * 第3阶段
	 * @description 代码文本加工处理, 比如添加按钮回调函数之类的, 这里靠你想象了
	 * @param {string} codeText - 代码的内容
	 * @param {string} fileUrl - 当前脚本路径, fileUrl = 'db://assets/scene/file.js'
	 * @param {Array} compRuleList - 生成代码规则列表,compRuleList = [ {symbolName:'',widgetType:'',nodeUuid:'',args:['@','Sprite','name']} ]
	 * @param {ITextModel} model - monaco 编辑器当前页面控制器,可以不使用
	 * @returns {string} - 返回加工完成的代码文本
	 */
	processCode(codeText,fileUrl,compRuleList,model){
		return codeText;
	},

	/**
	 * 第2阶段
	 * @description 获得插入的代码文本,用生成员变量的文本
	 * @param {string} widgetType - 组件类型,widgetType = cc.Node
	 * @param {string} symbolName - 变量名,symbolName = 'name'
	 * @param {string} replaceText - 被替代的旧文本, replaceText = 'property({ type: cc.Node .....'
	 * @param {object} rule - 第1阶段解析的参数, rule = {symbolName:'',widgetType:'',nodeUuid:'',args:['@','Sprite','name']} || null
	 * @param {boolean} isArray - 是否数组变量
	 * @param {boolean} isTs - 是否TS脚本
	 * @param {boolean} isUrl - 资源类型是否为路径类
	 * @returns - 返回插入的代码块 = 'property({ type: cc.Node .....'
	 */
	getInsertText(widgetType,symbolName,replaceText,rule,isArray,isTs,isUrl)
    {
		let text = ''
		if(isTs)
        {
			// TS 变量生成规则
			let intext = replaceText != null  ? '' : '\n\n	';
			if(isArray){
				text = intext+
					`@property({ type: [${widgetType}], displayName:''})\n` +
				`	${symbolName}: ${widgetType}[] = [];`
			}else{
				text = intext+
					`@property({ type: ${widgetType}, displayName:'' })\n` +
				`	${symbolName}: ${widgetType} = null;`
			}
		}else
		{
			// JS 变量生成规则
			let key = isUrl ? "url: " : 'type: ' 
			let intext = replaceText != null ? '' : '\n		';
			text = intext + 
				symbolName+':{\n'+
			'			default: '+(isArray? "[]":"null")+',\n'+
			'			'+key+widgetType+',\n'+
			'		},';
		}
		return text;
	},

	/**
	 * 第1阶段
	 * @description 生成自定义绑定规则，根据 node.name 解析组件的绑定规则 ( Clrl+Shift+E 时才调用这里 )
	 * @param {cc.Node} node - 场景上的 node
	 * @returns {Array} 返回生成 成员变量规则 = {symbolName:'',widgetType:'',nodeUuid:'',args:['@','Sprite','name']}
	 */
	 getNodeWidgetRule(node){
		// scene环境运行,打印日志请用 console.warn('打印') ;

		// 1. 通过名字解析规则, name = '@-Sprite-name'
		let name = node.name;
		// splitSymbol = ['@','Sprite','name']
		let splitSymbol = name.split('-')

		// 2.解析头缀是否正确 @
		if(splitSymbol.length < 3 || splitSymbol[0] != '@'){
			return;
		}

		// 3.解析变量名 symbolName = 'name'
		let symbolName = splitSymbol[2];

		// 4.解析组件类型 widgetType = 'Sprite'
		let widgetType = splitSymbol[1];
		if(cc[widgetType+'Component']){
			widgetType = 'cc.'+widgetType;
		}
		
		// 5.获得组件, comp as cc.Sprite
		let comp = widgetType == 'cc.Node' ? node : node.getComponent(widgetType);
		if(!comp){
			// Editor.log("找不到组件: ",name,widgetType)
			return;
		}
		
		/* 6.返回生成 成员变量规则
		 * 使用示例:
		 * @property({ type: widgetType, displayName:'' })
		 * symbolName: widgetType = null;
		 */
		return {
			// 变量名
			symbolName:symbolName,
			// 组件类型名字
			widgetType:widgetType,
			// 组件所在节点的uuid
			nodeUuid:node.uuid,
			// 记录解析配置信息, 在生成代码阶段可以做更多操作，比如生成按钮绑定文本块之类的
			args:splitSymbol,
			// 禁止生成拖拽变量, 在按钮只绑定函数不生成组件时使用;
			disableGenerated:false,
		}
	},


	/**
	 * 
	 * @description 获取绑定组件与代码的规则 (一般这里不需要修改)
	 * @param {string} fileUrl - 当前脚本的文件路径 db://assets/scene/file.js
	 * @param {array} bindNodeList - 与当前脚本绑定的Node们
	 * @param {cc.Node} rootNode - 当前选中的Node或场景 Root Node
	 * @returns {Array} - 返回生成变量规则 compRuleList = [{symbolName:'',widgetType:'',nodeUuid:'',args:['@','Sprite','name']}]
	 */
	getCustomWidgetRule(fileUrl,bindNodeList,rootNode){
		// scene环境运行,打印日志请用 console.warn('打印') ;

		// 遍历整个场景的 node
		let compRuleList = []
		getNodeChildren(rootNode,(node)=>
		{
			let compRule = this.getNodeWidgetRule(node);
			if(compRule){
				compRuleList.push(compRule);
			}
		})
		// 
		return compRuleList; 
	},


};





/**
 * @description 遍历所有深层子节点
 * @param {cc.Node} node 
 * @param {function} callFunc 
 * @returns 
 */
function getNodeChildren(node,callFunc)
{
	if (!node) return;

	let nodes = node.children;
	nodes.forEach((v)=>{
		getNodeChildren(v,callFunc)
	});
	callFunc(node)
}

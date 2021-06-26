/**
 * 生成拖拽变量代码块规则
 * 修改后重启Creator生效
 * Generate drag and drop variable code block rules
 * Restart Creator after modification takes effect
 */

module.exports = {
	
	/**
	 * 第3阶段
	 * @description 做最后的代码加工处理, 比如添加按钮回调函数之类的, 这里靠你想象了
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
	 * @description 生成自定义绑定规则，根据 node.name 解析组件的绑定规则 ( Alt+Shift+C 时才调用这里 )
	 * @param {cc.Node} node - 场景上的 node
	 * @returns {Array} 返回生成 成员变量规则 = {symbolName:'',widgetType:'',nodeUuid:'',args:['@','Sprite','name']}
	 */
	 getNodeWidgetRule(node){

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
		if(cc[widgetType]){
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
		}
	},


	/**
	 * 
	 * @description 获取绑定组件与代码的规则 (一般这里不需要修改)
	 * @param {string} fileUrl - 当前脚本的文件路径 db://assets/scene/file.js
	 * @param {array} bindNodeList - 与当前脚本绑定的Node们
	 * @param {cc.Node} scene - 当前场景 Root Node
	 * @returns {Array} - 返回生成变量规则 compRuleList = [{symbolName:'',widgetType:'',nodeUuid:'',args:['@','Sprite','name']}]
	 */
	getCustomWidgetRule(fileUrl,bindNodeList,scene){

		// 遍历整个场景的 node
		let compRuleList = []
		getNodeChildren(scene,(node)=>
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

	let nodes = node.getChildren();
	nodes.forEach((v)=>{
		getNodeChildren(v,callFunc)
	});
	callFunc(node)
}

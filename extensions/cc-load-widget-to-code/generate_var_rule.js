/**
 * 生成拖拽变量代码块规则
 * 修改后重启Creator生效
 * Generate drag and drop variable code block rules
 * Restart Creator after modification takes effect
 */

 module.exports = {
	// 快速绑定组件优先顺序,不填默认为 cc.Node
	QUICK_LOAD_TYPE_ORDER: ['cc.Button', 'cc.MeshRenderer', 'cc.Slider', 'cc.ProgressBar', 'cc.Toggle', 'dragonBones.ArmatureDisplay', 'sp.Skeleton', 'cc.Animation', 'cc.Sprite', 'cc.Label', 'cc.EditBox', 'cc.RichText'],

	/**
	 * 第4阶段
	 * @description 最后给脚本组件成员变量赋值
	 * @param {cc.Component} scriptComp - 当前编辑中的脚本组件对象, scriptComp.onLoad 
	 * @param {string} widgetType - 要修改的成员变量类型,widgetType = cc.Node
	 * @param {string} symbolName - 要修改的成员变量,symbolName = 'name'
	 * @param {boolean} isArray - 数据是否数组类型
	 * @param {Array} insertUuids - 插入的uuid, isAssets是节点情况下该值为节点的uuids,否则为资源文件的uuids; insertUuids = ['xxxx-xxx-xx']
	 * @param {boolean} isAssets - 是资源费否则是节点
	 * @param {object} rule - 第1阶段解析的参数, rule = {symbolName:'',widgetType:'',nodeUuid:'',assetUuid:'',args:['@','Sprite','name']} || null
	 * @returns 
	 */
	setComponentVar(scriptComp, widgetType, symbolName, isArray, insertUuids, isAssets, rule) {
		// scene环境运行,打印日志请用 console.warn('打印') ;
		// 使用例子 :

		if(isAssets || isArray || !insertUuids || !scriptComp.hasOwnProperty(symbolName)){
			return
		}

		/** 案例3-3: 获取node上的Button组件对象，并生成click函数与绑定  */
		// if(rule.widgetType == 'cc.Button'){
		// 	// 生成click函数文本
		// 	let node = findNode(rule.nodeUuid); // 通过uuid从场景中获取节点对象
		// 	if(node){
		// 		// 按钮绑定脚本click函数
		// 		let btnComp = node.getComponent('cc.Button');
		// 		btnComp.transition = cc.ButtonComponent.Transition.SCALE;
		// 		var eventHandler = new cc.Component.EventHandler();
		// 		eventHandler.target = scriptComp.node;
		// 		eventHandler.component = scriptComp.__classname__; // 这个是代码文件名
		// 		eventHandler.handler = rule.symbolName+'Btn'; // click函数
		// 		eventHandler.customEventData = symbolName;
		// 		btnComp.clickEvents = [eventHandler];
		// 	}
		// }

	},

	/**
	 * 第3阶段
	 * @description 代码文本加工处理, 比如添加按钮回调函数之类的, 这里靠你想象了
	 * @param {string} codeText - 代码的内容
	 * @param {string} fileUrl - 当前脚本路径, fileUrl = 'db://assets/scene/file.js'
	 * @param {Array} rules - 生成代码规则列表,rules = [ {symbolName:'',widgetType:'',nodeUuid:'',assetUuid:'',args:['@','Sprite','name']} ]
	 * @param {ITextModel} model - monaco 编辑器当前页面控制器,可以不使用
	 * @param {Array<cc.Node>} nodes - 需要加工处理的nodes
	 * @returns {string} - 返回加工完成的代码文本
	 */
	processCode(codeText, fileUrl, rules, model, nodes) {
		// scene环境运行,打印日志请用 console.warn('打印') ;

		/** 案例3-2: 获取node上的Button组件对象，并生成click函数并绑定(测试使用的是ts脚本) */
		// for (let i = 0; i < rules.length; i++) {
		// 	const rule = rules[i];
		// 	if(rule.widgetType == 'cc.Button'){
		// 		// 生成click函数文本
		// 		let funcText = `\n	${rule.symbolName}Btn(){}\n`;
		// 		let ind = codeText.lastIndexOf('}')
		// 		codeText = codeText.substring(0,ind) + funcText + codeText.substring(ind)
		// 	}
		// }
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
	getInsertText(widgetType, symbolName, replaceText, rule, isArray, isTs, isUrl) {
		let text = ''
		if (isTs) {
			// TS 变量生成规则
			let intext = replaceText != null ? '' : '\n\n	';
			if (isArray) {
				text = intext +
					`@property({ type: [${widgetType}], displayName:''})\n` +
					`	private ${symbolName}: ${widgetType}[] = [];`
			} else {
				text = intext +
					`@property({ type: ${widgetType}, displayName:'' })\n` +
					`	private ${symbolName}: ${widgetType} = null;`
			}
		} else {
			// JS 变量生成规则
			let key = isUrl ? "url: " : 'type: '
			let intext = replaceText != null ? '' : '\n		';
			text = intext +
				symbolName + ':{\n' +
				'			default: ' + (isArray ? "[]" : "null") + ',\n' +
				'			' + key + widgetType + ',\n' +
				'		},';
		}
		return text;
	},


	/**
	 * 第1阶段,鼠标拖拽node或asset触发事件 
	 * @description 修改 rules 内容实现自定义
	 * @param {Array} rules - 生成脚本成员变量规则 , rules = [ {symbolName:'',widgetType:'',nodeUuid:'',assetUuid:'',args:['@','Sprite','name']} ](可写)
	 * @param {boolean} isArray - 是否生成数组类型变量(可写)
	 * @param {boolean} isQuick - 是否快速绑定模式(只读)
	 * @returns {object} 返回生成 成员变量规则参数 
	 */
	dragWidgetStart(rules, isArray, isQuick) {
		// scene环境运行,打印日志请用 console.warn('打印') ;

		/** 案例0: 在脚本里额外添加成员变量 */
		// rules.push({
		// 	symbolName: "newVar",  // 变量名
		// 	widgetType: 'cc.Node', // 变量类型
		// 	nodeUuid: 'xxx-xxx-xx',// 该变量需要绑定的 Node Uuid
		// })
		
		/** 案例1: 强制成员变量为数组类型 */
		// isArray = true; 

		/** 案例2: 强制成员变量名为test,组件类型为cc.Node */
		// for (let i = 0; i < rules.length; i++) {
		// 	const rule = rules[i];
		// 	if(rule.nodeUuid){
		// 		rule.symbolName = 'test'
		// 		rule.widgetType = 'cc.Node'
		// 		rule.args = '自定义参数'
		// 	}
		// }

		/** 案例3-1: 获取node上的Button组件对象，并生成click函数并绑定 */
		// for (let i = 0; i < rules.length; i++) {
		// 	const rule = rules[i];
		// 	if(rule.nodeUuid){
		// 		let node = findNode(rule.nodeUuid); // 通过uuid从场景中获取节点对象
		// 		if(node){
		// 			let btnComp = node.getComponent('cc.Button');
		// 			if(btnComp){
		// 				rule.widgetType = 'cc.Button' // 成员变量类型强制改为Button
		// 				rule.args = {act:"bindFunction"} // 自定义参数
		// 			}
		// 		}
		// 	}
		// }				

		/** 案例4: 将拖拽node的子节点也一起绑定脚本中 */
		// for (let i = 0; i < rules.length; i++) {
		// 	const rule = rules[i];
		// 	if(rule.nodeUuid){
		// 		let node = findNode(rule.nodeUuid); // 通过uuid从场景中获取节点对象
		// 		if(node){
		// 			let childNode = node.children[0]
		// 			if(childNode){
		// 				// 新增生成规则
		// 				rules.push({
		// 					symbolName:rule.symbolName+"Child", // 变量名
		// 					widgetType:'cc.Node', // 变量类型
		// 					nodeUuid:childNode.uuid,
		// 				})
		// 			}
		// 		}
		// 	}
		// }
		return { rules, isArray } // 只能返回纯数据，不允许传cc.xx对象
	},

	/**
	 * 第1阶段
	 * @description 生成自定义绑定规则，根据 node.name 解析组件的绑定规则 ( Clrl+Shift+E 时才调用这里 )
	 * @param {cc.Node} node - 场景上的 node
	 * @returns {Array} 返回生成 成员变量规则 = {symbolName:'',widgetType:'',nodeUuid:'',args:['@','Sprite','name']}
	 */
	getNodeWidgetRule(node) {
		// scene环境运行,打印日志请用 console.warn('打印') ;

		// 1. 通过名字解析规则, name = '@-Sprite-name'
		let name = node.name;
		// splitSymbol = ['@','Sprite','name']
		let splitSymbol = name.split('-')

		// 2.解析头缀是否正确 @
		if (splitSymbol.length < 3 || splitSymbol[0] != '@') {
			return;
		}

		// 3.解析变量名 symbolName = 'name'
		let symbolName = splitSymbol[2];

		// 4.解析组件类型 widgetType = 'Sprite'
		let widgetType = splitSymbol[1];
		if (cc[widgetType] || cc[widgetType + 'Component']) {
			widgetType = 'cc.' + widgetType;
		}

		// 5.获得组件, comp as cc.Sprite
		let comp = widgetType == 'cc.Node' ? node : node.getComponent(widgetType);
		if (!comp) {
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
			symbolName: symbolName,
			// 组件类型名字
			widgetType: widgetType,
			// 组件所在节点的uuid
			nodeUuid: node.uuid,
			// 记录解析配置信息, 在生成代码阶段可以做更多操作，比如生成按钮绑定文本块之类的
			args: splitSymbol,
			// 禁止生成拖拽变量, 在按钮只绑定函数不生成组件时使用;
			disableGenerated: false,
		}
	},


	/**
	 * 
	 * @description 获取绑定组件与代码的规则 (一般这里不需要修改)
	 * @param {string} fileUrl - 当前脚本的文件路径 db://assets/scene/file.js
	 * @param {array} bindNodeList - 与当前脚本绑定的Node们
	 * @param {cc.Node} rootNode - 当前选中的Node或场景 Root Node
	 * @returns {Array} - 返回生成变量规则 rules = [{symbolName:'',widgetType:'',nodeUuid:'',args:['@','Sprite','name']}]
	 */
	getCustomWidgetRule(fileUrl, bindNodeList, rootNode) {
		// scene环境运行,打印日志请用 console.warn('打印') ;

		// 遍历整个场景的 node
		let rules = []
		getNodeChildren(rootNode, (node) => {
			let compRule = this.getNodeWidgetRule(node);
			if (compRule) {
				rules.push(compRule);
			}
		})
		// 
		return rules;
	},


};





/**
 * @description 遍历所有深层子节点
 * @param {cc.Node} node 
 * @param {function} callFunc 
 * @returns 
 */
function getNodeChildren(node, callFunc) {
	if (!node) return;

	let nodes = node.children;
	nodes.forEach((v) => {
		getNodeChildren(v, callFunc)
	});
	callFunc(node)
}

// 检测场景是否存在该子节点并返回相关信息
function findNode(nodeUuid)
{
	var canvas = cc.director.getScene();
	var ret_node
	if (canvas && nodeUuid) {
		getNodeChildren(canvas, (node) => {
			if (!ret_node && node.uuid == nodeUuid) {
				ret_node = node;
				return ret_node;
			}
		})
	}
	return ret_node;
}
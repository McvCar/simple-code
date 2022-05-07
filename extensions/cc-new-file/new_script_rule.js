/* 
* 新建脚本规则
* 修改重启Creator后生效
*/
let path = require("path")


module.exports = {

	/**
	 * 1.获得新建脚本保存路径
	 * @param {string} templePath - 模板文件路径 c://xxx/xxx/define.js
	 * @param {string} sceneUrl - 场景或预制节点路径 'db://assets/scene/gameScene.fire' or 'db://assets/panel/login.prefab' 
	 * @param {string} currNodeName - 当前选中的 node.name
	 * @returns - 返回新建脚本保存路径
	 */
 	getSavePath(templePath,sceneUrl,currNodeName){
		// 在home.scene文件同级目录下保存脚本
		let saveUrl = path.dirname(sceneUrl) + '/' + 'script/' + currNodeName + path.extname(templePath)
		// saveUrl = 'db://assets/scene/scripts/node-name.js'
		// db://assets/ 为项目根目录
		return saveUrl;
	},

	/**
	 * 2.获得新建脚本保存内容
	 * @param {string} originText - 脚本代码内容
	 * @param {string} saveUrl - 保存路径
	 * @param {cc.Node} bindNode - 当前脚本绑定的 node
	 * @returns - 返回脚本内容用于
	 */
 	getSaveText(originText,saveUrl,bindNode){
		// scene环境运行,打印日志请用 console.warn('打印') ;
		
		// 替换类名，删除特殊字符
		let className = bindNode.name.replace(/(\W|\d|_)/g, '');
		// 头部大写
		className = className[0].toUpperCase() + className.substr(1)

		let findObj = originText.match(/(\s+?class\s+?)([a-zA-Z_$][\w]*)/);
		if(findObj){
			let startPos = findObj.index+findObj[1].length;
			let endPos = findObj.index+findObj[0].length;
			originText = originText.substr(0,startPos)+className+originText.substr(endPos)
		}

		findObj = originText.match(/(s*?@ccclasss*?\(s*?['"])(.*?)['"]s*?\)/);
		if(findObj){
			let startPos = findObj.index+findObj[1].length;
			let endPos = startPos+findObj[2].length;
			originText = originText.substr(0,startPos)+className+originText.substr(endPos)
		}
		
		// 文件头部信息
		let time = new Date().toLocaleString();
		originText = originText.replace(' * @Date',' * @Date '+time);
		return originText;
	},


	/**
	 * 3.创建完成回调
	 * @param {string} saveUrl - 保存路径
	 * @param {string} originText - 脚本代码内容
	 * @param {cc.Node} bindNode - 当前脚本绑定的 node
	 * @param {boolean} isSucceed - 绑定脚本到Node成功
	 */
 	onComplete(saveUrl,originText,bindNode,jsFileName,isSucceed){
		 if(!isSucceed){
			 // 绑定脚本到Node失败
			 return;
		 }
		// scene环境运行,打印日志请用 console.warn('打印') ;

		// 获得已绑定node的组件
		// let comp = bindNode.getComponent(jsFileName);
		// 此阶段可对脚本成员变量进行赋值绑定其它组件关系
		// console.warn(comp);
	},
};

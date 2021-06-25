/* 
* 新建脚本规则
*/
let path = require("path")

module.exports = {

	/**
	 * 获得新建文件保存路径
	 * @param {string} templePath - 模板文件路径 c://xxx/xxx/define.js
	 * @param {string} sceneUrl - 场景或预制节点路径 'db://assets/scene/gameScene.fire' or 'db://assets/panel/login.prefab' 
	 * @param {string} currNodeName - 当前选中的 node.name
	 * @returns - 新建文件保存路径
	 */
 	getSavePath(templePath,sceneUrl,currNodeName){
		// 在scene.fire文件同级目录下保存脚本
		let saveUrl = path.dirname(sceneUrl) + '/' + 'scripts/' + currNodeName + path.extname(templePath)
		// saveUrl = '/db:/assets/scene/scripts/node-name.js'
		if(saveUrl[0] == '/'){
			saveUrl = 'db:/'+saveUrl.substr(4);
		}
		// db://assets/ 为项目根目录
		return saveUrl;
	},
};
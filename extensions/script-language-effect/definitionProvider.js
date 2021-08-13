
/**
 * 转跳到定义
 */
class DefinitionProvider {
	/**
	 * 
	 * @param {import('../../panel/vs-panel/vs-panel').EditorPanel} parent 
	 * @param {string} languageId 
	 */
	constructor(parent,languageId){
		this.parent = parent;
		this.languageId = languageId;
	}
	
	// ctrl+点击触发
	provideDefinition(model, position, token)
	{
		// let wordInfo = model.getWordAtPosition(position);
		let lineText = model.getLineContent(position.lineNumber);
		let findObj = lineText.match(/#include\s*<(.*)>/)
		if(findObj == null){
			return []
		}
		let importFileName = findObj[1];

		// 异步等待返回
		return new Promise(async (resolve, reject )=>
		{
			let list = await this.getFile(importFileName);
			resolve(list);
		})
	}

	// 获得鼠标点击位置文件信息
	async getFile(fileName){
		let list = [];
		fileName = fileName + '.chunk'
		for (let i = 0; i < this.parent.file_list_buffer.length; i++) {
			const item = this.parent.file_list_buffer[i];
			if(item.extname == '.chunk'){
				if(item.url.endsWith(fileName)){
					await this.parent.loadVsModel(item.url,item.extname,true)
					list.push({
						uri: this.parent.monaco.Uri.parse(this.parent.fileMgr.fsPathToModelUrl(item.fsPath)),
						range: new this.parent.monaco.Range(1,1,1,1),
					})
				}
			}
		}
		return list;
	}
}

module.exports = DefinitionProvider
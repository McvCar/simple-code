const tools = require("./tools")

module.exports = {

	// 用户使用次数统计
	async countStartupTimes(){
		if(Editor.User && Editor.User.getData){
			Editor.User.getData().then((post_data)=>{
				if(!post_data) {
					returns
				}
				post_data.version = '3.x'
				tools.httpPost('120.77.174.207','/logincount',8081,post_data);
			});
		}
	},

}

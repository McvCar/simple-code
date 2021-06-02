
module.exports = {

	eventList:{},

	// 
	sendEvent:function (name,...args){
		let events = this.eventList[name];
		if(!events){
			return
		}

		for (let i = events.length-1; i >= 0; i--) {
			const func = events[i];
			try {
				func(...args)
			} catch (error) {
				Editor.error(error);
			}
		}
	},

	listenEvent:function (name,func){
		let events = this.eventList[name] = this.eventList[name] || [];
		events.push(func);
		return func
	},

	removeEvent:function (func){
		for (const key in this.eventList) {
			const events = this.eventList[key];
			for (let i = 0; i < events.length; i++) {
				const func_ = events[i];
				if(func_ == func){
					events.splice(i,1);
					return true
				}
			}
		}
	},

	removeAllEvent:function (){
		this.eventList = {}
	},

	merge: function(obj){
		Object.assign(obj,this)
	},
}

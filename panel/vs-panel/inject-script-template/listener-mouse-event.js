let Service = {

    load(){
		this.oldPathDom;
		this.oldItem;
        this.mouseDownItem;
        this.mousedownTime;
        this.mousePos;
        this.pkgName = 'simple-code';
        this.window_event_listener = [];

		this.addWindowEventListener('mousemove',this.mousemove.bind(this),true)
		this.addWindowEventListener('mousedown',this.mousedown.bind(this),true)
		this.addWindowEventListener('mouseup',this.mouseup.bind(this),true)
    },
    
	addWindowEventListener(eventName,callback,option){
		this.window_event_listener.push({eventName,callback,option});
		window.addEventListener(eventName,callback,option);
	},

    // 鼠标经过nodeTree或assets item
    onSelectionHoverin(e,isMouseDown){
        if(!isMouseDown && e.path[0] == this.oldPathDom){
            return;
        }
        this.oldPathDom = e.path[0];
        // 读取当前鼠标所在位置的资源或Node列表信息
        for (let i = 0; i < Math.min(5,e.path.length); i++) {
            let vueObj = e.path[i].__vue__;
            if(vueObj)
            {
                let itemInfo;
                if(vueObj.asset){
                    itemInfo = {type:'asset',uuid:vueObj.asset.uuid}
                }else if(vueObj.node){
                    itemInfo = {type:'node',uuid:vueObj.node.uuid}
                }
                // 鼠标移动经过节点树或资源目录时触发
                if(itemInfo){
                    if(!isMouseDown && this.oldItem && this.oldItem.uuid == itemInfo.uuid){
                        return;
                    }
                    this.oldItem = itemInfo;
                    if(isMouseDown) this.mouseDownItem = itemInfo; // 记录鼠标所在位置资源信息
                    this.onEditorSelectionHoverin(itemInfo,isMouseDown);
                    return;
                }	
            }
        }
        if(this.oldItem != null){
            this.oldItem = undefined;
            this.onEditorSelectionHoverin(null,isMouseDown);
        }
    },


    // 记录鼠标位置,用于菜单位置
    mousemove(e){
        this.onSelectionHoverin(e);
        this.mousePos = {y:e.clientY,x:e.clientX}
    },

    // 用于触发双击事件、刷新creator菜单事件
    mousedown(e){
        let mousePos = {y:e.clientY,x:e.clientX}
        let now_time =  new Date().getTime();
        // 双击事件分发
        if(this.mousedownTime == null || now_time - this.mousedownTime>300){
            this.mousedownTime = new Date().getTime()
        }else{
            this.onMouseDoubleClick(mousePos);
        }

        this.onSelectionHoverin(e,true);
        this.onMouseClick(mousePos);
    },

    // 记录鼠标位置,用于菜单位置
    mouseup(e){
        let mousePos = {y:e.clientY,x:e.clientX}
        Editor.Message.broadcast(this.pkgName+':on-mouse-up',mousePos);
    },


    onMouseDoubleClick(mousePos){
        Editor.Message.broadcast(this.pkgName+':on-mouse-double-click',mousePos);
    },

    
    onMouseClick(mousePos){
        // console.log(this.pkgName, 'on-mouse-double-click',mousePos)
        Editor.Message.broadcast(this.pkgName+':on-mouse-click',mousePos,this.bufferName);
    },
    
    onEditorSelectionHoverin(itemInfo, isMouseDown){
        Editor.Message.broadcast(this.pkgName+':on-editor-selection-hoverin',itemInfo, isMouseDown);
    },

    onDestroy(){
		for (let i = 0; i < this.window_event_listener.length; i++) {
			const event = this.window_event_listener[i];
            // console.log("释放",event)
			window.removeEventListener(event.eventName,event.callback,event.option)
		}
    }
}

module.exports = Service;
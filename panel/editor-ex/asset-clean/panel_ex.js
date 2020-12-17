/* 
面板扩展
功能: 绑定快捷键事件
*/
'use strict';
const path 			= require('path');
const fs 			= require('fs');
const md5			= require('md5');
const fe 			= Editor.require('packages://simple-code/tools/FileTools.js');
const AssetCleaner 	= Editor.require('packages://simple-code/panel/editor-ex/asset-clean/AssetCleanerForCocosCreator/AssetCleaner');
const prsPath 		= Editor.Project && Editor.Project.path ? Editor.Project.path : Editor.remote.projectPath;

let is_lock			= false;

module.exports = {

	// 面板初始化
	onLoad(parent){
		// index.js 对象
		this.parent = parent; 
	},


	// 面板销毁
	onDestroy(){

	},

	loadList(outMap,color)
	{
		let not_select_list = []
		let is_swi_mode = true
		for (let [type, files] of outMap.entries()) {
		    if (files.length <= 0) {
		        continue;
		    }
		
		    for (let i = 0, len = files.length; i < len; i++) 
		    {
	    		let info = files[i];
	    		if(!info.uuid) {
			    	info.uuid = Editor.remote.assetdb.fspathToUuid(info.path);			
	    		}

		    	if(info.uuid)
		    	{
		    		let item = document.getElementById(info.uuid)
		    		if(item)
		    		{
		    			if(is_lock)
		    			{
			    			item.style.backgroundColor = color; // 紫色高亮
		    			}else{
		    				item.style.backgroundColor = null; // 取消高亮
		    			}
		    			is_swi_mode = false
		    		}else if(Editor.remote.assetdb.existsByUuid(info.uuid))
		    		{
		    			//新版不支持,切换模式
		    			not_select_list.push(info.uuid)
		    			// Editor.log("未发现item",info.path);
						// Editor.Selection.select('asset', uuid)
		    			// Editor.Ipc.sendToAll('assets:hint', uuid)
		    		}
		    	}
		    }

		    // 新版高亮
		    if(not_select_list.length && is_swi_mode)
		    {
				Editor.Selection.select('asset', not_select_list)
		    }
		}

	},

	search()
	{
		if(!this.noBindMap)
		{
			let { noBindMap, noLoadMap,outStr } = AssetCleaner.start(prsPath  + path.sep + "assets");
			this.noBindMap = noBindMap
			this.noLoadMap = noLoadMap
			Editor.log("搜索完成,请点开资源管理查看");
			Editor.log(outStr);
		}
		this.loadList(this.noBindMap,'rgba(114, 0, 218, 0.57)');
		this.loadList(this.noLoadMap,'rgba(14, 0, 218, 0.57)');
	},

	messages:{

		'cleanFile'()
		{
			if(!this.noBindMap) Editor.info("初次搜索未使用的资源,期间会卡顿几秒,请稍等...");
			setTimeout(()=>
			{
				is_lock = !is_lock;
				this.search();

				// 锁定选中状态
				if(this.sch_id) clearInterval(this.sch_id)
				if(is_lock) {
					this.sch_id = setInterval(this.search.bind(this),2000);
					Editor.success("已锁定选中状态，若取消锁定 请再次按下'高亮未使用资源'快捷键");
				}
			},this.noBindMap ? 1:500);
		},
	},
	
};
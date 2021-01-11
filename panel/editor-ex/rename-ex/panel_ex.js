/* 
面板扩展
功能: 下拉框转跳文件,转跳场景,重命名,打开项目到外部编辑器...
*/
'use strict';
const path 		= require('path');
const md5     	= require('md5');
const fs 		= require('fs');
const fe 		= Editor.require('packages://simple-code/tools/FileTools.js');
const cfg 		= Editor.require('packages://simple-code/config.js');

module.exports = {

	// 面板初始化
	onLoad(parent){
		// index.js 对象
		this.parent = parent; 
	},

	// 显示重命名框, list = [{value,meta,score,args}]
	showRenameBox(type,list){
		if(list.length == 0) return;

		// 重命名规则函数
		let changeListName = (name)=>{
			let findObj = name.match(/@([0-9]*)/)
			let start_num = findObj ? Number( findObj[1] ) : 0;

			for (let i = 0; i < list.length ; i++) {
				let ind = (start_num+i)
				if (findObj == null){
					list[i].value = name // 重命名
				}else{
					list[i].value = name.substr(0,findObj.index) + String(ind) + name.substr(findObj.index+findObj[0].length) // 重命名
				}
			}
		}

		// 修改搜索框时，通过该函数读取显示的实时显示下拉列表内容, cmdLine为输入文本框对象
		let onCompletionsFunc = (cmdLine)=>{
			let name = cmdLine.getValue();
			if (name == '') return list;

			changeListName(name);
			return list;
		}

		// 选中后处理
		let onAccept = (data,cmdLine)=>{
			let name = cmdLine.getValue();
			changeListName(name);

			if(type == "asset")
			{
				// 重命名资源
				list.forEach((info)=>{
					let to_path = info.args.dir_path+info.args.url+info.args.suffix;
					Editor.remote.assetdb.move(info.args.url,to_path);
				})
			}else if(type == "node")
			{
				// 重命名节点
				list.forEach((info)=>{
					let rename = info.value;
					Editor.Ipc.sendToPanel('scene', 'scene:set-property',{
						id: info.args.uuid,
						path: "name",//要修改的属性
						type: "String",
						value: rename,
						isSubProp: false,
					});
				})
			}
			
		}

		// 显示下拉框 
		this.parent.openSearchBox( list[0].value + "@0" ,list,onAccept,onCompletionsFunc);
		this.parent.setMiniSearchBoxToTouchPos(200)
	},

	getFileName(path){
		let s_i  = path.lastIndexOf("/")+1
		let e_i  = path.lastIndexOf(".")
		e_i = e_i < s_i ? -1 :e_i
		let name 	= path.substr(s_i, e_i == -1 ? undefined : e_i - s_i )
		let suffix 	=  e_i == -1 ? "" : path.substr(e_i)
		return {name,suffix,dir_path:path.substr(0,s_i)}
	},

	// 面板销毁
	onDestroy(){

	},

	// 重命名
	openRename(type){

		let isOpen 		= false
		let activeInfo  = Editor.Selection.curGlobalActivate() // 检测面板焦点在资源管理器还是层级管理器
		if (!activeInfo) return;

		type = type || activeInfo.type;
		let list = []
		let name = ""
		if (type == "asset")
		{
			// 获得选中的资源
			let asset_list = Editor.Selection.curSelection("asset");
			asset_list.forEach((uuid)=>
			{
				let info = Editor.remote.assetdb.assetInfoByUuid(uuid);
				if (!info) return;
				
				let file = this.getFileName(info.url);
				info.suffix = file.suffix;
				info.name   = file.name
				info.dir_path   = file.dir_path
				// 加载资源列表
				list.push( this.parent.getItem(file.name,file.name,0,info) );
			})
			this.showRenameBox(type,list)
			isOpen = list.length > 0
		}
		else if(type == "node")
		{
			// 获得选中的节点
			Editor.Scene.callSceneScript('simple-code', 'get-select-node-info' ,"", (err, args)=>
			{
				// 加载节点列表
				args.forEach((info)=>{
					list.push( this.parent.getItem(info.name,info.name,0,info) );
				})
				this.showRenameBox(type,list)
			});
			isOpen = Editor.Selection.curSelection("node").length> 0
		}

		return isOpen;
	},

	/*************  事件 *************/  

	messages:{

		'applyRenameToNodes'(){
			this.openRename('node')
		},
		'applyRenameToAssets'(){
			this.openRename('asset')
		},
		'selection:activated'(e,type){
			let asset_list = Editor.Selection.curSelection(type);
			if(asset_list && asset_list.length >1)
			{
				let menuCfg = {
					layerMenu : [
						{ label : "批量重命名", enabled:true, cmd: "applyRenameToNodes"},
					],
					assetMenu : [
						{ label : "批量重命名", enabled:true, cmd: "applyRenameToAssets"},
					],
				}
				Editor.Ipc.sendToMain('simple-code:setMenuConfig',{id:"rename-ex",menuCfg:menuCfg});
			}else{
				Editor.Ipc.sendToMain('simple-code:setMenuConfig',{id:"rename-ex",menuCfg:undefined});
			}
		},

		// 下拉框批量重命名
		'rename'(event,info)
		{
			this.openRename()
		},
	},
	
};
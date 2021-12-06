/* 
面板扩展
功能: 下拉框转跳文件,转跳场景,重命名,打开项目到外部编辑器...
*/
'use strict';
const path 		= require('path');
const md5     	= require('md5');
const fs 		= require('fs');
const Editor2D = require('../../tools/editor2D');
const cfg 		= Editor2D.require('packages://simple-code/config.js');
const tools  	= Editor2D.require('packages://simple-code/tools/tools.js');

module.exports = {

	/** @type import('../../panel/vs-panel/vs-panel').EditorPanel */
	parent : null,


	// 面板初始化
	onLoad(parent){
		// index.js 对象
		this.parent = parent; 

		// 键盘事件：重名
		this.parent.addKeybodyEventByName('renameNodeOrFile',(e)=>
		{
			let panel = Editor2D.Panel.getFocusedPanel()
			if (!this.parent.is_mouse_down && panel && (panel.name == 'assets' || panel.name == 'hierarchy') ){
				this.openRename()
				e.preventDefault();// 吞噬捕获事件
			}
		},0)
	},

	// 显示重命名框, list = [{value,meta,score,args}]
	showRenameBox(type,reType,list){
		if(list.length == 0) return;
		
		for (let i = 0; i < list.length ; i++) {
			list[i]._value = list[i].value;
		}

		// 重命名规则函数
		let changeListName = (name)=>{

			if(reType == 'sort'){
				let findObj = name.match(/@([0-9]+)/)
				let start_num = findObj ? Number( findObj[1] ) : 0;
	
				for (let i = 0; i < list.length ; i++) {
					let ind = (start_num+i)
					if (findObj == null){
						list[i].value = name // 重命名
					}else{
						list[i].value = name.substr(0,findObj.index) + String(ind) + name.substr(findObj.index+findObj[0].length) // 重命名
					}
				}
			}else if(reType == 'prefix'){
				for (let i = 0; i < list.length ; i++) {
					list[i].value = name+list[i]._value;
				}
			}else if(reType == 'suffix'){
				for (let i = 0; i < list.length ; i++) {
					list[i].value = list[i]._value+name;
				}
			}else if(reType == 'remove_name'){
				for (let i = 0; i < list.length ; i++) {
					try {
						let findObj = list[i]._value.match(new RegExp(name));
						if(findObj){
							list[i].value = list[i]._value.substr(0,findObj.index) + list[i]._value.substr(findObj.index+findObj[0].length);
						}
					} catch (error) {
					}
				}
			}else if(reType == 'com'){
				for (let i = 0; i < list.length ; i++) {
					list[i].value = name;
				}
			}
		}

		// 修改搜索框时，通过该函数读取显示的实时显示下拉列表内容, cmdLine为输入文本框对象
		let onCompletionsFunc = (cmdLine)=>{
			let name = cmdLine.getValue();
			// if (name == '') return list;

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
					let to_path = info.args.dir_path+info.value+info.args.suffix;
					Editor2D.assetdb.move(info.args.url,to_path);
				})
			}else if(type == "node")
			{
				// 重命名节点
				list.forEach((info)=>{
					let rename = info.value;
					let args = {
						uuid: info.args.uuid,
						path: 'name',//要修改的属性
						dump: {
							type: "string",
							value: rename
						}
					};
					Editor.Message.request('scene', 'set-property',args);
				})
			}
			
		}

		let texts = {
			'sort':list[0].value + "@0" ,
			'prefix': 'type_',
			'suffix': '_type',
			'remove_name': '[0-9]+',
			'com': list[0].value ,
		}
		// 显示下拉框 
		this.parent.ace.openSearchBox( texts[reType] || '' ,list,onAccept,onCompletionsFunc,null,'rename');
		this.parent.ace.setMiniSearchBoxToTouchPos(200)
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
	async openRename(type,reType = 'sort'){

		let isOpen 		= false
		let activeInfo  = Editor2D.Selection.curGlobalActivate() // 检测面板焦点在资源管理器还是层级管理器
		if (!activeInfo) return;

		type = type || activeInfo.type;
		let list = []
		let name = ""
		if (type == "asset")
		{
			// 获得选中的资源
			let asset_list = Editor2D.Selection.curSelection("asset");
			for (let i = 0; i < asset_list.length; i++) {
				const uuid = asset_list[i];
				
				let info = await Editor2D.assetdb.assetInfoByUuid(uuid);
				if (!info) return;
				
				let file = this.getFileName(info.url);
				info.suffix = file.suffix;
				info.name   = file.name
				info.dir_path   = file.dir_path
				// 加载资源列表
				list.push( this.parent.getItem(file.name,file.name,0,info) );
			}
			this.showRenameBox(type,reType,list)
			isOpen = list.length > 0
		}
		else if(type == "node")
		{
			// 获得选中的节点
			Editor2D.Scene.callSceneScript('simple-code', 'get-select-node-info' ,"", (err, args)=>
			{
				// 加载节点列表
				args.forEach((info)=>{
					list.push( this.parent.getItem(info.name,info.name,0,info) );
				})
				this.showRenameBox(type,reType,list)
			});
			isOpen = Editor2D.Selection.curSelection("node").length> 0
		}

		return isOpen;
	},

	
	/**
	 * creator菜单即将弹出
	 * @param {string} type = 'assetMenu' | 'layerMenu'
	 * @param {Object} selectInfo 
	 * @param {String} selectInfo.uuid
	 * @param {String} selectInfo.type = 'asset' | 'node'
	 */
	 onCCMenuPopup(_,selectInfo){
		
		let asset_list = Editor2D.Selection.curSelection(selectInfo.type);
		if(asset_list.length && selectInfo && selectInfo.uuid){
			let type = selectInfo.type;

			let submenu = [
				{ label: '数字序列 (D)', enabled: true,click:()=>this.openRename(type,'sort')},
				{ label: '加前缀', enabled: true,click:()=>this.openRename(type,'prefix')},
				{ label: '加后缀', enabled: true,click:()=>this.openRename(type,'suffix')},
				{ label: '正则匹配删除命名', enabled: true,click:()=>this.openRename(type,'remove_name')},
				{ label: '常规重命名', enabled: true, click:()=>this.openRename(type,'com') },
			];
			let menuCfg = {
				layerMenu : [
					{ label : "批量重命名 ✎", enabled:true, submenu:submenu,},
				],
				assetMenu : [
					{ label : "批量重命名 ✎", enabled:true, submenu:submenu,},
				],
			}
			this.parent.ccMenuMgr.setMenuConfig({id:"rename-ex",menuCfg:menuCfg});
		}else{
			this.parent.ccMenuMgr.setMenuConfig({id:"rename-ex",menuCfg:undefined});
		}
	},

	/*************  事件 *************/  

	messages:{

		'applyRename'(e,args){
			let types = {'重命名':'com','加前缀':'prefix','加后缀':'suffix','数字序列':'sort','正则匹配删除命名':'remove_name',}
			let type = args.paths[0] == '节点批量重命名' ? 'node' : 'asset'
			let reType = types[args.paths[1]]
			this.openRename(type,reType)
		},
		
		'selection:activated'(e,type){
		},

		// 下拉框批量重命名
		'rename'(event,info)
		{
			this.openRename()
		},
	},
	
};
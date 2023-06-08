'use strict';
clearRequireCache()
const Editor2D = require('../tools/editor2D.js');
Editor2D.analogApi();

const path 		= require('path');
const fs 		= require('fs');
const md5     	= require('md5');
const config 	= require('../config');
const fe    	= Editor2D.require('packages://simple-code/tools/tools.js');



var eventFuncs = 
 {
	// 加载
	load(){
		// Editor.log("场景加载")
	},
	unload(){
	},

 	// 获得活动面板
	getActiveUuid()
	{
	   let activeInfo  = Editor2D.Selection.curGlobalActivate() // 检测面板焦点在资源管理器还是层级管理器
	   if (activeInfo && activeInfo.type == "asset" && activeInfo.id && activeInfo.id.indexOf('db:') == -1)
	   {
			return [activeInfo.id];
	   }else{
			let ls      = this.getJsFileList( this.findNode( Editor2D.Selection.curSelection('node')[0]) );
			let uuidList = [];
			ls.forEach((v,i)=>uuidList.push(v.__scriptUuid));
			return uuidList;
	   }
	},

	// 获得当前所有选中的节点
	getSelectdNodes()
	{
		let selects = Editor2D.Selection.curSelection('node')
		let arrNode = []
		selects.forEach((uuid)=>{
			let node = this.findNode(uuid)
			arrNode.push(node) 
		})

		return arrNode
	},

	// 检测场景是否存在该子节点并返回相关信息
	findNode(select_uuid)
	{
		var canvas      = cc.director.getScene();
		var ret_node 
		if (canvas && select_uuid) {
			this.getNodeChildren(canvas,(node)=>{
				if (node.uuid == select_uuid){
					ret_node = node;
					return ret_node;
				}
			})
		}
		return ret_node;
	},

	// 遍历所有深层子节点
	getNodeChildren(node,callFunc)
	{
		if (!node) return;
		let nodes = node.children;
		nodes.forEach((v)=>{
			v._path_str = (node._path_str || node.name)+"/" + v.name;
			this.getNodeChildren(v,callFunc)
		});
		callFunc(node)
	},

	getNodeReChildren(node,callFunc)
	{
		if (!node) return;
		let nodes = node.children;
		callFunc(node)
		nodes.forEach((v)=>{
			v._path_str = (node._path_str || node.name)+"/" + v.name;
			this.getNodeReChildren(v,callFunc)
		});
	},

	
	isHasJsFile(node){
		if(!node) {return false};
		return this.getJsFileList(node)[0];
	},

	getJsFileList(node){
		if(!node) {return []};
		let list = [];		
		node.getComponents(cc.Component).forEach((v)=>{
			if(v.__classname__ && v.__classname__.indexOf(".") == -1) list.push(v);       //js脚本
		});
		return list;
	},

	// 创建目录,绝对路径
	createDir(dirPath){
		if ( fs.existsSync(dirPath) ) return;
		let paths = dirPath.split(path.sep);//分割路径
		let path_ = "";
		for (let n = 0; n < paths.length; n++) {
			path_ += paths[n] + path.sep;
			if(!fs.existsSync(path_)){
				fs.mkdirSync(path_);
			}
		}
	},

 	// 获得当前打开的场景文件路径 	
 	async getCurrSceneUrl(){
 		let scene 	 	= cc.director.getScene();
 		if(!scene) return ;
		let uuid = cc.director.getScene().uuid
		if(uuid && uuid.indexOf('-') != -1){
			return await Editor2D.assetdb.uuidToUrl( uuid )
		}

		let name = cc.director.getScene().name
		if(name.endsWith('prefab')){
			let s_i = name.indexOf('*');
			uuid = name.substr(0,s_i);
			return await Editor2D.assetdb.uuidToUrl( uuid );
		}
 	},

 	uuidToUrl(uuids,callback){
 		// 当前打开的预制节点路径
 		Editor2D.Ipc.sendToMain('simple-code:uuidToUrl',{uuids:uuids}, function (error, answer) 
 		{
 			if (answer && answer.urls && answer.urls[0]) return callFunc( answer.urls)
 		});
 	},

	// 调用原生JS的定时器
	setTimeoutToJS (func,time=1,{count=-1,dt=time}={}) {
		// 执行多少次
		if (count === 0) {
			let headler = setTimeout(func,time*1000);
			return () => clearTimeout(headler) 
		}else{
			
			// 小于0就永久执行
			if (count<0) { count = cc.macro.REPEAT_FOREVER };

			let headler1,headler2;
			headler1 = setTimeout(() => {

				let i = 0;
				let funcGo = function(){
					i++;
					if (i === count) { clearInterval(headler2) }
					func();
				}

				// 小于0就永久执行
				if (count<0) { funcGo = function(){ func() } }

				headler2 = setInterval(funcGo,time*1000);
				funcGo();

			},dt*1000);

			return () => {
				clearTimeout(headler1);
				clearInterval(headler2);
			}
		}
	},

	// 是否新场景
	isNewScene(){
	    let node =cc.director.getScene()
	    // 空场景
	    if (!node){
	        return false;
	    // 是新场景
	    }else if(node.name == "New Node" && node.getChildByName('Canvas')!= null && node.getChildByName('Canvas').getComponent(cc.Canvas) != null){
	        return true;
	    }else{
	        false;
	    }
	    return false
	},

	// 运行新场景
	runNewScene(call){

	    // if (this.isNewScene()){
	    //     call(1)
	    // }else{
	        Editor2D.Ipc.sendToPanel('scene', 'scene:new-scene');
	        setTimeout(()=>
	        {
	            if (this.isNewScene())
	            {
	                call(1)
	                Editor.log("成功切换到新场景")
	            }else
	            {
	                call(0)
	                
	            }
	        }, 1000);
	    // }
	},

	// 打开测试场景
	openDebugScene(uuid,isScene,call){
		this.runNewScene((is_new)=>
		{
			if(!is_new){ 
				call(0)
				return Editor.log("请保存场景后再运行调试")
			}

			if(isScene){
				cc.director._loadSceneByUuid_temp(uuid,(err,scene)=>
				{
					if (err){
						call(0)
						Editor.error("加载调试场景失败:\n",err)
						return 
					}

					setTimeout(()=>{
						Editor.log("成功加载模拟场景")
						scene.name = "New Node";
						call(1);
					},100)
				});

			}else
			{
				let scene = cc.director.getScene()
				let canvas = scene.getChildByName("Canvas")
				if (canvas){
					canvas.removeAllChildren(true)
					Editor2D.Ipc.sendToPanel("scene","scene:create-nodes-by-uuids",[uuid],canvas.uuid,{unlinkPrefab:null},(err,e)=>{
						call(1)
					});
				}else{
					call(0)
				}
			}

		})
	},

	// 设置组件属性
	setCompProperty(node,valueName,value,valueType,compName='cc.Node'){
		valueType = valueType || typeof value;
		let path = ''
		let uuid = node.uuid;
		if(compName == 'cc.Node'){
			path = valueName
		}else{
			let ind ;
			for (let i = 0; i < node._components.length; i++) {
				const comp = node._components[i];
				if(comp.__classname__ == compName){
					ind = i;
					break;
				}
			}
			path = `__comps__.${ind}.${valueName}`
		}
		
		// 数组类型额外加工
		let isArray = value instanceof Array;
		if(isArray){
			for (let i = 0; i < value.length; i++) {
				const element = value[i];
				element.path = `${path}.${i}`;
				element.type = valueType;
			}

			// 设置拖拽变量数组大小
			Editor.Message.send('scene', 'set-property',{
				uuid: uuid,
				path: `${path}.length`,
				dump: {
				  type: "Array",
				  value: value.length
				}
			  });
		}

		// 使用该方法才能记录撤销动作与标记需要保存
		Editor.Message.send('scene', 'set-property',{
			uuid: uuid,
			path: path,//要修改的属性
			dump: {
				type: valueType, // "cc.Node",
				isArray: isArray,//是否数组
				value: value // uuid
			}
		});
	},

	// 获得组件位置
	getComponentIndex (node,name){
		for (let i = 0; i < node._components.length; i++) {
			const comp = node._components[i];
			if(comp.__classname__ == name){
				return i;
			}
		}
	},

	// 获得当前编辑的脚本绑定的节点
	getEditFileBindNodes(fileUuid){
		var canvas = cc.director.getScene();
		var bindNodeList = [];
		if (canvas && fileUuid) {
			this.getNodeChildren(canvas, (node) => {
				// 检测该node是否绑定了该脚本
				let code_comp_list = this.getJsFileList(node);
				code_comp_list.forEach((code_comp, i) => {
					if (code_comp.__scriptUuid == fileUuid) {
						bindNodeList.push({ 
							node_uuid: node.uuid, 
							comp_name: code_comp.__classname__ 
						});
					}
				});
			})
		}
		return bindNodeList;
	},


	'hint-node'(event,name){
		var canvas      = cc.director.getScene();
		if (canvas) {
			this.getNodeChildren(canvas,(node)=>{
				if (node.name == name){
					Editor2D.Selection.select('node', [node.uuid]);
					return node;
				}
			})
		}
	},
	
	'select-node'()
	{
		let is_file_self = false;
		let ret_node  = null;
		let name_list = {};
		let uuid_list = Editor2D.Selection.curSelection('node');
		for (var i = 0; i < uuid_list.length; i++) 
		{
			let node = this.findNode(uuid_list[i]);
			if (node) name_list[node.name] = true;
		}

		if (uuid_list.length==0){
			Editor.log("请您先选中节点后再操作");
			return;
		}

		let call = ()=>
		{
			let scene = cc.director.getScene()
			this.getNodeChildren(scene,(node)=>
			{
				if (ret_node == null && name_list[node.name]) {
					if (uuid_list.indexOf(node.uuid) == -1){
						if (is_file_self)
						{
							ret_node = node;
							uuid_list.push(ret_node.uuid)
							Editor2D.Selection.select('node', uuid_list);
							Editor2D.Ipc.sendToAll('hint', uuid_list)
							return ret_node;
						}
					}else{
						is_file_self = true
					}
				}
			})
		};
		
		call();
		if (!ret_node){
			is_file_self = true;
			call();
		}
	},

	'select-node-by-name'(args)
	{
		let uuid_list = [];
		let scene = this.findNode(args.parent_uuid)
		if (!scene){
			Editor.log("请您先选中节点后再操作..");
			return;
		}

		this.getNodeChildren(scene,(node)=>
		{
			if (node.name.indexOf(args.name) != -1) {
				uuid_list.push(node.uuid)
			}
		});

		Editor2D.Selection.select('node', uuid_list);
		Editor2D.Ipc.sendToAll('hint', uuid_list)
	},

	// 获得选中的节点信息
	'get-select-node-info': function () {
		// 获得当前选中的节点信息
		let nodes = this.getSelectdNodes()
		let arrInfo  = []
		nodes.forEach((v)=>{
			arrInfo.push({
				uuid:v.uuid,
				name:v.name,
				path:v._path_str,
			})
		})
		
		// event.reply(null,arrInfo);
		return arrInfo;
	},

	// 获得文本内容
	'get-node-code': function (event,uuids) {
		if (uuids && uuids.length >0){
			let list = []
			let max = uuids.length;
			uuids.forEach((uuid)=>{
				Editor2D.assetdb.queryInfoByUuid(uuid,(e,a)=>
				{
					if(!e && a && a.path){
						let name        = a.path.substr(a.path.lastIndexOf(path.sep)+1) 
						let file_type   = name.substr(name.lastIndexOf('.')+1)
						if (file_type != name && file_type != "png" ){
							let text   = fs.readFileSync(a.path).toString();
							list.push({ data:text, uuid:uuid,path:a.url,name:name ,file_type:file_type});
						}else{
							max --;
						}
					}else{
						max --;
					}

					if (max == list.length){
						event.reply(null,list);
					}
				})

			});
		}else{
			event.reply(null,[]);
		}
	},

	// 获得当前焦点uuid的信息
	'get-active-uuid': function (event) {
		// event.reply(null,{uuids:this.getActiveUuid()});
		
		// console.warn('返回信息',this.getActiveUuid())
		return {uuids:this.getActiveUuid()};
	},


	// 文件外部打开
	'open-file-by-outside': function (event) {
		let id = this.getActiveUuid()[0]
		if (id){
			Editor2D.Ipc.sendToMain('assets:open-text-file',id);
		}else{
			Editor.log("当前活动面板没有发现可打开的资源")
		}
	},

	// 运行命令
	'run-command-code': function (event,args) {
		let require = cc.require;
		var scene  = cc.director.getScene();
		var node   = this.findNode( Editor2D.Selection.curSelection('node')[0])
		var ui 	   = {}
		this.getNodeChildren(scene,(node)=>{
			ui[node.name] = node;
		})
		
		let miniCmd = 
		{
			scene: scene,
			node : node,
			ui:ui,//场景上所有的节点
			run : function()
			{
				try {
				    let log = eval(""+args.data+"");
				    if (log && (typeof log == "object")){
				    	this.dump(log)
				    	console.log(log)
				    }else{
			    		Editor.log(log);
			    		console.log(log);
				    }
				} catch(t) {
					if(t && t.stack){
						let head = t.stack.substr(0,t.stack.indexOf("\n"))
						let endd = t.stack.substr(t.stack.indexOf(">")+1)
						endd = endd.substr(0,endd.indexOf(")"))
						Editor.log("调试命令 ERROR:",head+endd)
					}
				}

			},
			dump(obj){
				let str = ""
				let i = 0
				for(let name in obj) {
					try{ 
						str += name + ": " + obj[name] + "\n"
					}catch(err){
						str += name + ": " + typeof obj[name] + "\n"
					}
					i ++;
					if (i>100){
						str+="...more"
						break;
					}
				}
				Editor.log("dump:"+obj,str)
			},
		}

		miniCmd.run();

		// 引擎需要开放这个才有动画效果
		cc.engine._animatingInEditMode = 1
		cc.engine.animatingInEditMode = 1
		if (args.type == "scene")
		{
		}else if(args.uuid){
			this['run-js-file'](null,args);// 执行代码脚本
		}

	},

	'run-js-file'(event,args){
		this.getNodeReChildren(cc.director.getScene(),(v)=>
		{
			let list = this.getJsFileList(v);
			list.forEach((js)=>
			{
				if(js.__scriptUuid == args.uuid){
					if(js.onLoad) {js.onLoad()}
					if(js.start) {js.start()}
					if(js.update) {
						this.setTimeoutToJS(()=>{
							if(js.isValid) js.update(0.02);
						},0.02,{count:60})
					}
				}
			})
		})
	},
	

};

// 升级插件后必须清除 require 缓存，否则升级插件后require对象是旧的缓存
function clearRequireCache(){
    if(require.cache){
        for (const key in require.cache) {
            if(key.includes('simple-code')){
                delete require.cache[key];
            }
        }
    }
}

// 合并事件函数,分发
let info 		=  Editor2D.require('packages://simple-code/tools/eventMerge').eventMerge(eventFuncs,"scene_ex.js")
let fileList 	= fe.getDirAllFiles(Editor2D.url("packages://simple-code/extensions"),[])
eventFuncs 		= info.messages

// 模块加载的时候触发的函数
exports.load = function() {eventFuncs.load()};
// 模块卸载的时候触发的函数
exports.unload = function() {eventFuncs.unload()};

exports.methods = eventFuncs;
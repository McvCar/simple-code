'use strict';
const path 		= require('path');
const fs 		= require('fs');
const fe    	= Editor.require('packages://simple-code/tools/FileTools.js');

// 工作路径
let prsPath  = Editor.Project && Editor.Project.path ? Editor.Project.path : Editor.remote.projectPath ;

// 模块加载的时候触发的函数
module.exports.load = function() {};
// 模块卸载的时候触发的函数
module.exports.unload = function() {};

var eventFuncs = 
 {

 	// 新建js模板路径
 	getJsTemplatePath(node_uuid,file_type){
 		return Editor.url('packages://simple-code/template/define.'+file_type, 'utf8')
 	},

 	// 保存新建脚本路径
 	getNewFileSavePath(node_url,file_type){
 		// 场景文件路径: node_url = db://assets/xxxx/xxxx.xxx
 		node_url = node_url.substr(0,node_url.lastIndexOf("/")) + '/' +"script_min" + '/'; //保存到预制节点的同级目录
 		return node_url;
 	},

 	// 获得活动面板
	getActiveUuid()
	{
	   let activeInfo  = Editor.Selection.curGlobalActivate() // 检测面板焦点在资源管理器还是层级管理器
	   if (activeInfo && activeInfo.type == "asset")
	   {
			return [activeInfo.id];
	   }else{
			let ls      = this.getJsFileList( this.findNode( Editor.Selection.curSelection('node')[0]) );
			let uuidList = [];
			ls.forEach((v,i)=>uuidList.push(v.__scriptUuid));
			return uuidList;
	   }
	},

	// 获得当前所有选中的节点
	getSelectdNodes()
	{
		let selects = Editor.Selection.curSelection('node')
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
		let nodes = node.getChildren();
		nodes.forEach((v)=>{
			v._path_str = (node._path_str || node.name)+"/" + v.name;
			this.getNodeChildren(v,callFunc)
		});
		callFunc(node)
	},

	getNodeReChildren(node,callFunc)
	{
		if (!node) return;
		let nodes = node.getChildren();
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
 	getCurrSceneUrl(callFunc){
 		let scene 	 	= cc.director.getScene();
 		if(!scene) return callFunc();

		// 获得scene路径
		let url = Editor.remote.assetdb.uuidToUrl(scene.uuid);
		if (url) return callFunc(url,true,scene.uuid);

		// 当前打开的预制节点路径
		Editor.Ipc.sendToMain('simple-code:getPrefabUuid',{}, function (error, answer) 
		{
			if (answer != null){
				callFunc( Editor.remote.assetdb.uuidToUrl(answer),false,answer)
			}
		});
 	},

 	uuidToUrl(uuids,callback){
 		// 当前打开的预制节点路径
 		Editor.Ipc.sendToMain('simple-code:uuidToUrl',{uuids:uuids}, function (error, answer) 
 		{
 			if (answer && answer.urls && answer.urls[0]) return callFunc( answer.urls)
 		});
 	},

 	// 获得场景下所有节点信息
 	getSceneChildrensInfo(){
		var canvas      = cc.director.getScene();
		if(!canvas) return [];

		let list = []
 		this.getNodeChildren(canvas,(node)=>{
 			list.push({
 				name:node.name+"",
 				uuid:node.uuid,
 				path:node._path_str || node.name+"",
 			})
 		})

 		return list;
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
	        Editor.Ipc.sendToAll('scene:new-scene');
	        setTimeout(()=>
	        {
	            if (this.isNewScene())
	            {
	                call(1)
	                Editor.info("成功切换到新场景")
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
				return Editor.info("请保存场景后再运行调试")
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
						Editor.info("成功加载模拟场景")
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
					Editor.Ipc.sendToAll("scene:create-nodes-by-uuids",[uuid],canvas.uuid,{unlinkPrefab:null},(err,e)=>{
						call(1)
					});
				}else{
					call(0)
				}
			}

		})
	},

	'select-node'(event,args)
	{
		let is_file_self = false;
		let ret_node  = null;
		let name_list = {};
		let uuid_list = Editor.Selection.curSelection('node');
		for (var i = 0; i < uuid_list.length; i++) 
		{
			let node = this.findNode(uuid_list[i]);
			if (node) name_list[node.name] = true;
		}

		if (uuid_list.length==0){
			Editor.info("请您先选中节点后再操作");
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
							Editor.Selection.select('node', uuid_list);
							Editor.Ipc.sendToAll('hint', uuid_list)
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

	'select-node-by-name'(event,args)
	{
		let uuid_list = [];
		let scene = this.findNode(args.parent_uuid)
		if (!scene){
			Editor.info("请您先选中节点后再操作..");
			return;
		}

		this.getNodeChildren(scene,(node)=>
		{
			if (node.name.indexOf(args.name) != -1) {
				uuid_list.push(node.uuid)
			}
		});

		Editor.Selection.select('node', uuid_list);
		Editor.Ipc.sendToAll('hint', uuid_list)
	},

	// 获得选中的节点信息
	'get-select-node-info': function (event) {
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
		
		event.reply(null,arrInfo);
	},

	// 获得文本内容
	'get-node-code': function (event,uuids) {
		if (uuids && uuids.length >0){
			let list = []
			let max = uuids.length;
			uuids.forEach((uuid)=>{
				Editor.assetdb.queryInfoByUuid(uuid,(e,a)=>
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
		event.reply(null,{uuids:this.getActiveUuid()});
	},

	// 获取场景内所有子节点信息
	'scene-children-info': function (event) {
		event.reply(null,JSON.stringify(this.getSceneChildrensInfo()))	
	},

	// 控制動畫定時器
	'cc-engine-animatin-mode': function (event,is_cmd_mode) {
		cc.engine.animatingInEditMode = is_cmd_mode //引擎需要开放这个才有动画效果
		cc.engine._animatingInEditMode = is_cmd_mode
	},

	// 运行命令
	'runCommandLine': function (event,args) {
		let require = cc.require;
		var scene  = cc.director.getScene();
		var node   = this.findNode( Editor.Selection.curSelection('node')[0])
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
						Editor.error("调试命令 ERROR:",head+endd)
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
		this['run-js-file'](null,args);// 执行代码脚本
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
	
	'new-js-file': function(event)
	{
		let file_type 	= localStorage.getItem("newFileType")|| "js"
		let head_node   = Editor.Selection.curSelection('node')[0];
		let node        = this.findNode(head_node );
		let activeInfo  = Editor.Selection.curGlobalActivate(); 

		if(node && activeInfo.type == "node")
		{
			let jsFile = this.isHasJsFile(node);
			if (jsFile)
			{
				alert("该节点已经存在js脚本,不再创建脚本"); 
			}else
			{
				const md5     	= require('md5');
				let uuid       = node.uuid;
				let jsFileName = "a_" + node.name +"_"+ md5(node.uuid).substr(0,6); 
				let data       = fs.readFileSync(this.getJsTemplatePath(uuid,file_type)); 
				let url        = 'db://assets/_script_min/'; 

				// 获得当前场景或预制节点文件路径
				this.getCurrSceneUrl((node_url)=>
				{
					if(!node_url) return event.reply(null,{});

					// 默认新建文件保存地方
					url = this.getNewFileSavePath(node_url,file_type)
					// 创建目录
					this.createDir(Editor.url(url))
					// 创建文件
					Editor.assetdb.create( url+jsFileName+'.'+file_type, data, ( err, results )=> 
					{
						if(err) return event.reply(null,{});

						// 定时检测creator加载新建文件缓存没
						let stop_func;
						let chk_count = 0
						stop_func = this.setTimeoutToJS(()=>
						{
							//等场景加载完脚本
							node = this.findNode(uuid)
							if (node && !node._objFlags){
						 		let comp = node.getComponent(jsFileName)
						 		if(comp)
						 		{
						 			// 创建脚本瞬间添加的node组件会丢失,所以需要检测3次组件确定加载了
						 			if (chk_count++ == 3){
						 				stop_func();
						 				event.reply(null,{data:"",node_uuid:uuid,scipt_uuid:comp.__scriptUuid});
								        Editor.Ipc.sendToPanel('simple-code', 'custom-cmd',{cmd:"openFile"});
						 			}
						 		}else
						 		{
					 				// 阻止报错提示
					 				let func = Editor.failed;
					 				Editor.failed = ()=>{}
						 			try {
						 			    comp = cc.require(jsFileName)
						 			} catch(t) {}

						 			Editor.failed = func;

						 			// 添加组件
						 			if (comp){
						 				// Editor.Ipc.sendToPanel('scene', 'scene:add-component', uuid, jsFileName); //添加不了脚本
						 				node.addComponent(jsFileName);
						 			}
						 		}
							}
						},0.5,{count:30})
					},500)
				});	
			}
		}else{
			Editor.info("该功能需要您选中一个节点后再执行才能创建脚本与绑定节点")
			event.reply(null,{});
		}
		
	}


};

// 合并事件函数,分发
let info 		= Editor.require("packages://simple-code/panel/event-merge").eventvMerge(eventFuncs,"scene_ex.js")
let fileList 	= fe.getDirAllFiles(Editor.url("packages://simple-code/panel/editor-ex"),[])
eventFuncs 		= info.messages


module.exports.methods = eventFuncs;

// 模块加载的时候触发的函数
exports.load = function() {};
// 模块卸载的时候触发的函数
exports.unload = function() {};
// 模块内定义的方法
exports.methods = {
    log(str) {
        console.log(str);
        return true;
    },
};
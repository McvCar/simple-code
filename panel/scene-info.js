'use strict';
const path 		= require('path');
const fs 		= require('fs');
const md5     	= require('md5');
const fe    	= Editor.require('packages://simple-code/tools/FileTools.js');

// 工作路径
let prsPath  = Editor.importPath.split('library'+path.sep)[0] ;



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
	        Editor.Ipc.sendToPanel('scene', 'scene:new-scene');
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
					Editor.Ipc.sendToPanel("scene","scene:create-nodes-by-uuids",[uuid],canvas.uuid,{unlinkPrefab:null},(err,e)=>{
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


	// 文件外部打开
	'open-file-by-outside': function (event) {
		let id = this.getActiveUuid()[0]
		if (id){
			Editor.Ipc.sendToMain('assets:open-text-file',id);
		}else{
			Editor.info("当前活动面板没有发现可打开的资源")
		}
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
	'run-command-code': function (event,args) {
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
		if (args.type == "scene")
		{
			this.testEditorScene();
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

	testEditorScene(){

		if (!cc.director._changeCocosFunc){
			cc.director._changeCocosFunc = true

			// 通过uuid加载场景
			cc.director._loadSceneByUuid_temp = (uuid, onLaunched, onUnloaded)=>{
		        cc.AssetLibrary.loadAsset(uuid, function (error, sceneAsset) {
		            var self = cc.director;
		            self._loadingScene = '';
		            if (error) {
		                error = 'Failed to load scene: ' + error;
		                cc.error(error);
		            }
		            else {
		                if (sceneAsset instanceof cc.SceneAsset) {
		                    var scene = sceneAsset.scene;
		                    scene._id = sceneAsset._uuid;
		                    scene._name = sceneAsset._name;

                            self.runSceneImmediate(scene, onUnloaded, onLaunched);
		                    return;
		                }
		                else {
		                    error = 'The asset ' + uuid + ' is not a scene';
		                    cc.error(error);
		                }
		            }
		            if (onLaunched) {
		                onLaunched(error);
		            }
		        });
			}

			cc.director.loadScene = (sceneName,c1,c2,c3)=>{
				Editor.assetdb.deepQuery( (err, results)=> {
					for (let i = 0; i < results.length; i++) 
					{
						let result = results[i];
						if (result.extname == ".fire" && result.name.indexOf(sceneName) != -1){
							cc.director._loadSceneByUuid_temp(result.uuid,c1,c2,c3);
							return
						}
					}
					cc.warn("调试未发现场景:",sceneName)
				})
			}


			// let old_func = cc.loader._getResUuid.bind(cc.loader);
			// cc.loader._getResUuid =  (url, type, quiet) =>
			// {
			// 	let uuid = old_func(url,type,quiet)
			//     if (uuid != "") {
			//         return uuid;
			//     }

			//     // Ignore parameter
			//     var index = url.indexOf('?');
			//     if (index !== -1)
			//         url = url.substr(0, index);
			 	
			//  	if(this._assetList){
			//  		for (var i = 0; i < this._assetList.length; i++) {
			//  			let info = this._assetList[i]
			//  			let infoUrl = Editor.remote.assetdb.uuidToUrl(info.uuid);
			//  			if (infoUrl.indexOf(url) != -1){
			//  				uuid = info.uuid;
			//  				break
			//  			}
			//  		}
			//  	}
			   	
			//     return uuid;
			// };
		}
		
		// // 缓存资源列表
		// Editor.assetdb.deepQuery( (err, results)=> {
		// 	this._assetList = results;
		// })	

		this.getCurrSceneUrl((url,isScene,uuid)=>{
			this.openDebugScene(uuid,isScene,(isSucceed)=>{
				if (isSucceed){
					setTimeout(()=>this['run-node-js'](),1)
				}
			})
		})
	},

	// 运行场景所有节点绑定的脚本
	'run-node-js': function (event,args) {
		// mm.prototype.constructor._executeInEditMode = true; mm.prototype.constructor._playOnFocus = true
	   let node = cc.director.getScene() // this.findNode( children[0] );
	   if (node == null){
	   		return Editor.log("调试节点脚本:没有发现运行的场景")
	   }

	   let dt = 0.01
	   let stopRuncFunc = ()=>{
	   		if (this._run_scene_update_times_id){
	   			this._run_scene_update_times_id()
	   			delete this._run_scene_update_times_id;
				CC_EDITOR = true
				Editor.info("调试节点脚本:已停止模拟运行环境调试")
	   		}
	   }

	   if(this._run_scene_update_times_id){
		   	stopRuncFunc();
	   		return 
	   } 

	   // 忽略组件
	   let ignore_list = {
	   		"cc.Camera" :{"onEnable":1,"onDisable":1,"onLoad":1,"start":1,"update":1},
	   		"cc.Canvas" :{"onEnable":1,"onDisable":1,"onLoad":1,"start":1,"update":1},
	   		"cc.MeshRenderer" :{"onEnable":1,"onDisable":1,"onLoad":1,"start":1,"update":1},
	   		"cc.Sprite" :{"onEnable":1,"onDisable":1,"onLoad":1,"start":1,"update":1},
	   		"cc.Label" :{"onEnable":1,"onDisable":1,"onLoad":1,"start":1,"update":1},
	   		"cc.Label" :{"onEnable":1,"onDisable":1,"onLoad":1,"start":1,"update":1},
	   }

	   let runCompFunc = (v,funcName,args,isOneRun=true)=>
	   {
			//let comps = getComponents(cc.Component)
			v._components.forEach((jsComp)=>
			{
				if(jsComp && jsComp.enabled && (ignore_list[jsComp.__classname__] == null || ignore_list[jsComp.__classname__][funcName] == null) )//|| !jsComp.__proto__.constructor._executeInEditMode) )
				{
					let hasName = funcName+jsComp.name+"_is_run_testScene_";
					if(jsComp[funcName] && (!isOneRun || !v[hasName])) {
						v[hasName] = true
						CC_EDITOR = jsComp.__classname__ && jsComp.__classname__.indexOf("cc.") == -1;// 使用引擎的方法
						// console.log(jsComp.__classname__,funcName)
						jsComp[funcName](args)
						CC_EDITOR = true
					}
				}
			})
		}

		Editor.info("调试节点脚本:开始模拟运行环境调试")
		this._run_scene_update_times_id = this.setTimeoutToJS(()=>
		{
			try{
				if (!node.isValid) return stopRuncFunc();
				this.getNodeReChildren(node,(v)=>
				{
					if (v.isValid && ( v == node || v.activeInHierarchy) )
					{
						if(v._scene_test_loop_count == null)
						{
							v._scene_test_loop_count = 1;

							v.on("child-added",(event)=>{
								// runCompFunc(event.detail,"onLoad");
								// if (event.detail.activeInHierarchy()
								// runCompFunc(event.detail,"start");
							})

							v.on("active-in-hierarchy-changed",(event)=>{
								let child = event.detail || event
								if (child.active){
									runCompFunc(child,"onEnable",null,false);
								}
							})

							v.on("child-removed",(event)=>{
								let child = event.detail || event
								runCompFunc(child,"onDisable",null,false);
							})
							runCompFunc(v,"onLoad");
							runCompFunc(v,"onEnable",null,false);

						}else if(v._scene_test_loop_count == 1){
							v._scene_test_loop_count = 2
							runCompFunc(v,"start");
						}else if(v._scene_test_loop_count == 2){
							runCompFunc(v,"update",dt,false);
						}
					}
				})
				cc.engine._animatingInEditMode = 1
				cc.engine.animatingInEditMode = 1
			}catch(t){
				Editor.error("调试脚本ERROR:\n",t)
				stopRuncFunc();
			}

		},dt,{count:-1})

		// node.on("child-added",(event)=>{
		// 	let v = event.detail
		// 	if (v.activeInHierarchy)
		// 	{
		// 		Editor.log(v.name)
		// 		let comps = v.getComponents(cc.Component)
		// 		comps.forEach((jsComp)=>{
		// 			if(jsComp){
		// 				if(jsComp.onLoad) jsComp.onLoad()
		// 				if(jsComp.start) jsComp.start()
		// 			}
		// 		})
		// 	}
	 //   })
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


module.exports = eventFuncs;
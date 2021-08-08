/* 
面板扩展
功能: 监听 creator项目下 node_modules 目录与加载
*/
'use strict';
const path 	= require('path');
const fs 	= require('fs');
const tools = require('../../tools/tools');

const prsPath 				= Editor.Project && Editor.Project.path ? Editor.Project.path : Editor.remote.projectPath;
const node_modules_path 	= path.join(prsPath,'node_modules');
const REG_EXP_MULTILAYER 	= /node_modules/g
const REG_EXP_JSON_CONFIG 	= /(tsconfig.*\.json|jsconfig.*\.json|package\.json)/;
const REG_EXP_TS_CONFIG 	= /(tsconfig.*\.json|jsconfig.*\.json)/;
const REG_EXP_PACKAGE 		= /(package\.json)/


module.exports = {
	/** @type import('../../panel/vs-panel/vs-panel').EditorPanel */
	parent : null,

	// 初始化事件
	onLoadEvent(parent){
		// index.js 对象
		this.parent = parent; 
		this._isInit = false;
		this.dependencies = {};
		// 创建view缓存model事件
		this.parent.pushMonacoEvent(this.parent.monaco.editor.onDidCreateModel((model)=>
		{
			// 加载 tsconfig 配置文件解析
			let url = model.uri.toString();
			if(url.match(REG_EXP_TS_CONFIG) && this.isDependencie(url)){
				this.parent.tsWr.addProjectReference(url)
				this.parent.setTimeout(()=>this.parent.tsWr.writeOtherFile(url,model.getValue()),1);
			}else{
				this.updatePackageMainModulePath(model)
			}
		}));

		// 删除代码文件 view缓存model
		this.parent.pushMonacoEvent(this.parent.monaco.editor.onWillDisposeModel((model)=>{
			// 删除 tsconfig 配置文件解析
			let url = model.uri.toString();
			let isconfig = url.match(REG_EXP_TS_CONFIG);
			if(isconfig){ 
				this.parent.tsWr.removeProjectReference(url)
			}
			if(isconfig || url.endsWith('package.json')){
				this.parent.setTimeout(()=>this.parent.tsWr.removeOtherFile(url),1);
			}
		}));

		this.initProjectConfig()
	},

	// 加载creator游戏脚本package.json、tsconfig.json配置
	initProjectConfig()
	{
		// 加载、监听tsconfig项目配置变动
		let tsconfigPath = path.join(prsPath,'tsconfig.json');
		this.watchFile = this.parent.fileMgr.addWatchPath(tsconfigPath,this.onFileStatChange.bind(this))

		// 必须先加载package项目配置
		let packagePath = path.join(prsPath,'package.json');
		if(tools.isFileExit(packagePath)){
			let jsonText = fs.readFileSync(packagePath).toString()
			this.updateProjectPackage(jsonText)
		}

		// 监听package项目配置变动
		this.parent.fileMgr.addWatchPath(packagePath,(eventName,files)=>{
			if (eventName == "create" || eventName == 'change') {
				if(tools.isFileExit(packagePath)){
					let jsonText = fs.readFileSync(packagePath).toString()
					this.updateProjectPackage(jsonText,true)
				}
			}
			this.onFileStatChange(eventName,files);
		})
	},

	// 设置选项
	setOptions(cfg,isInit) 
	{	if(cfg.enabledNpmDir == null) return;
		
		if(cfg.enabledNpmDir){
			if(!isInit){
				return Editor.log("加载node_modules设置 重启creator后生效")
			}
			this.initWatch()
		}else if(!cfg.enabledNpmDir && this._isInit)
		{
			this.stop()
		}
	},

	// 初始化 node_modules 文件夹监听
	initWatch(){
		delete this.check_timeout;
		this._isInit = true;
		this.watchFile = this.parent.fileMgr.addWatchPath(node_modules_path,this.onFileStatChange.bind(this))
	},
	
	// node_modules文件变化监听
	onFileStatChange(eventName,files){
		if (eventName == "init" || eventName == "create") {
			// Finished walking the tree
			this.addNodeModuleFiles(files);
		}else if (eventName == 'change') {
			this.changeNodeModuleFiles(files);

		}else if (eventName == 'delete') {
			this.unlinkNodeModuleFiles(files);
		}
	},

	// 读取项目package文件信息
	async updateProjectPackage(text,isLoadDependenciesFiles=false){
		let packageContent = tools.parseJson(text);
		if(packageContent == null){
			return;
		}
		// 依赖包加载，用于代码提示自动导入路径
		this.dependencies = Object.assign(
			{},
			packageContent.dependencies,
			packageContent.devDependencies,
			packageContent.peerDependencies,
			packageContent.bundledDependencies,
			packageContent.optionalDependencies,
		);

		// 加载依赖模块文件
		if(isLoadDependenciesFiles){
			for (const key in this.dependencies) {
				let packagePath = path.join(node_modules_path,key,'package.json');
				packagePath = packagePath.replace(/\\/g,'/')
				if(tools.isFileExit(packagePath)){
					let packageModel = await this.parent.loadVsModel(packagePath,path.extname(packagePath),false);
					this.updatePackageMainModulePath(packageModel);
				};
			}
		}
	},

	/**
	 *  系统文件保存修改内容
	 * @param {Object} file
	 * @param {String} file.url
	 * @param {String} file.uuid
	 * @param {String} file.file
	 */ 
	onAssetsChangedEvent(file){
		let fspath = file.uuid == 'outside' ? file.url : file.file;
		if(fspath.match(REG_EXP_JSON_CONFIG)){
			let vs_model = this.parent.fileMgr.getModelByFsPath(fspath);
			if(vs_model && this.isDependencie(vs_model.uri.toString())){
				this.parent.tsWr.writeOtherFile(vs_model.uri.toString(),vs_model.getValue());
			}
		}
	},

	// 刷新并导入并模块入口文件
	updatePackageMainModulePath(model){
		let url = model.uri.toString();
		if(!url.match(REG_EXP_PACKAGE) || !this.isDependencie(url)){
			return;
		}
		
		this.parent.setTimeout(async ()=>{
			this.parent.tsWr.writeOtherFile(url,model.getValue()); // 保存package.json文件缓存到ts解析器参与进一步解析工作
			let tryModulePaths = await this.parent.tsWr.getPackageMainModulePath(url);
			// console.log("modeule包路径:",url,tryModulePaths)
			let filePath = await this.parent.fileMgr.loadNeedImportPathsAsync({[url]:tryModulePaths});
			if(filePath){
				// 性能优化: 忽略模块文件import路径深度解析功能
				this.parent.tsWr.setIgnoreTryImportScriptFile(this.parent.fileMgr.fsPathToModelUrl(filePath));
			}
		},1)
	},

	// 是否项目依赖的包
	isDependencie(url){

		let split = url.split('node_modules')
		let modulePath = split[1];
		if(!modulePath || tools.objectCount(this.dependencies) == 0){
			return true;
		}
		let dir = path.dirname(modulePath);
		dir = dir.substr(1);
		for (const key in this.dependencies) {
			if(key == dir){
				return true;
			}
		}
		return false;
	},

	// 多层 node_modules 目录
	isMultilayerNodeModuleDir(filePath){
		let reg = filePath.match(REG_EXP_MULTILAYER);
		return reg && reg.length>1;
	},

	isNodeModuleDir(path){
		return path && path.indexOf(node_modules_path) != -1;
	},

	addNodeModuleFiles(files){
		for (let k in files) {
			let filePath = files[k]
			if(!this.isMultilayerNodeModuleDir(filePath) && !filePath.endsWith('.DS_Store')){
				filePath = filePath.replace(/\\/g,'/');
				if(!this.parent.file_list_map[filePath]){
					// 修改文件系统
					let file = {
						url : filePath,
						file : filePath,
						uuid: 'outside'
					};
					this.parent.messages['asset-add'].bind(this.parent)(0,file)
				}
			}
		}
	},

	// 改变文件
	changeNodeModuleFiles(files){
		for (let k in files) {
			let filePath = files[k];
			if(!this.isMultilayerNodeModuleDir(filePath) && !filePath.endsWith('.DS_Store')){
				filePath = filePath.replace(/\\/g,'/');
				if(!this.parent.file_list_map[filePath]){
					// 修改文件系统
					let file = {
						url : filePath,
						file : filePath,
						uuid: 'outside'
					};
					this.parent.messages['asset-change'].bind(this.parent)(0,file)
				}
			}
		}
	},

	// 移除文件
	unlinkNodeModuleFiles(files){
		let removeFiles = []
		for (let k in files) {
			let filePath = files[k]
			if(!this.isMultilayerNodeModuleDir(filePath) && !filePath.endsWith('.DS_Store')){
				filePath = filePath.replace(/\\/g,'/');
				if(this.parent.file_list_map[filePath]){
					// 修改文件系统
					let file = {
						url : filePath,
						file : filePath,
						uuid: 'outside'
					};
					this.parent.messages['asset-delete'].bind(this.parent)(0,file)
				}
			}
		}

		// console.log('移除文件夹：',removeFiles)
	},


	stop(){
		if(this.watchFile){
			this.watchFile.stop()
			this.watchFile = null;
		}
		if(this.check_timeout){
			clearTimeout(this.check_timeout);
			delete this.check_timeout;
		}
	},

	// 面板销毁
	onDestroy(){
		this.stop()
	},
	/*************  事件 *************/  

	messages:{
		'scene:saved'(){
		}
	},
	
};
let fs = require("fs");
let path = require("path");
let packageCfg = require("../package.json")
var http 		= require('http');
var querystring = require('querystring');
const Editor2D = require("./editor2D");

const inputType = { "text": 1, "password": 1, "number": 1, "date": 1, "color": 1, "range": 1, "month": 1, "week": 1, "time": 1, "email": 1, "search": 1, "url": 1, "textarea": 1 }
let checkFsPath = new RegExp("\\.\\./", "g");
let readFileQueue = []
let readFileMaxCount = 50
let readFileCount = 0

let translateMap = {}

module.exports = {

	// 不是输入状态是时
	inputTypeChk(e) {
		if (e.path[0]) {
			let type = e.path[0].type;
			if (inputType[type]) {
				return true
			}
		}
	},

	getLanguage(){
		return window.navigator && window.navigator.language && window.navigator.language.split('-')[0];
	},

	// 更新i18翻译文本，解决creator不重启不会刷新修改问题
	initI18t(){
		let locale = this.getLanguage() || 'zh';
		let filePath = Editor2D.url('packages://simple-code/i18n/'+locale+'.js');
		if(!this.isFileExit(filePath)){
			return
		}
		let mapList = require(filePath);
		let converList = {}
		for (const key in mapList) {
			const converText = mapList[key];
			converList[packageCfg.name+'.'+key] = converText
		}
		translateMap = converList;
		// Editor.i18n.extend(converList)
	},

	translate(key){
		let name = packageCfg.name+'.'+key
		return translateMap[name] || Editor2D.T(name) || name
	},

	translateZhAndEn(zeText,enText){
		return this.getLanguage() == 'zh' ? zeText : enText;
	},

	// 翻译中英文
	T(zeText,enText){
		return this.translateZhAndEn(zeText,enText);
	},

	isEmptyObject(obj){
		if(obj){
			for (const key in obj) {
				return false
			}
		}
		return true;
	},

	// 拷贝本对象方法到目标对象
	// newObj 子类
	// baseObj 父类
	// mergeFuncs = ["init"]; 新旧类的同名函数合并一起
	extendTo(newObj, baseObj, mergeFuncs = []) {
		if (!baseObj || !newObj) return;

		for (let k in baseObj) {
			let v = baseObj[k]
			if (newObj[k] == null) {
				newObj[k] = v
			}
			// 函数继承使用 "this._super()" 调用父类
			else if (typeof v == "function" && typeof newObj[k] == "function" && !newObj[k]._isExend) {
				let newFunc = newObj[k];
				newObj[k] = function () {
					this._super = v;
					let ret = newFunc.apply(this, arguments);// 执行函数并传入传参
					delete this._super;
					return ret;
				};
				newObj[k]._isExend = true
			}
		}
	},

	copyToClipboard(str) {
		var input = str;
		const el = document.createElement('textarea');
		el.value = input;
		el.setAttribute('readonly', '');
		el.style.contain = 'strict';
		el.style.position = 'absolute';
		el.style.left = '-9999px';
		el.style.fontSize = '12pt'; // Prevent zooming on iOS

		const selection = getSelection();
		var originalRange = false;
		if (selection.rangeCount > 0) {
			originalRange = selection.getRangeAt(0);
		}
		document.body.appendChild(el);
		el.select();
		el.selectionStart = 0;
		el.selectionEnd = input.length;

		var success = false;
		try {
			success = document.execCommand('copy');
		} catch (err) { }

		document.body.removeChild(el);

		if (originalRange) {
			selection.removeAllRanges();
			selection.addRange(originalRange);
		}

		return success;
	},

	parseJson(text){
		try {
			return JSON.parse(text)
		} catch (error) {
			return undefined;
		}
	},

	objectCount(obj){
		let len = 0
		for (const key in obj) {
			len++
		}
		return len;
	},

	// 获得import路径
	getImportStringPaths(codeText) {

		var regEx = /(require\(|import |reference path=)(.{0,}['"])(.+)['"]/g;
		var match = regEx.exec(codeText);
		var imports = []
		while (match) {
			let start = match.index + match[1].length + match[2].length;
			imports.push({
				path: match[3],
				start: start,
				length: match[3].length,
			})
			match = regEx.exec(codeText);
		}
		return imports
	},

	//将相对路径转为绝对路径
	relativePathTofsPath(absolutePath, relativePath) {
		var uplayCount = 0; // 相对路径中返回上层的次数。
		var m = relativePath.match(checkFsPath);
		if (m) uplayCount = m.length;

		var lastIndex = absolutePath.length - 1;
		var subString = absolutePath
		for (var i = 0; i <= uplayCount; i++) {
			lastIndex = subString.lastIndexOf("/", lastIndex);
			subString = subString.substr(0, lastIndex)
		}
		return this.normPath( subString  + "/" + relativePath.substr(relativePath.lastIndexOf('./') + 2));
	},

	//将绝对路径转为相对路径
	fsPathToRelativePath(currPath, importPath) {
		let s_i = currPath.lastIndexOf('/')
		if (s_i != -1) currPath = currPath.substr(0, s_i);
		let relativePath = path.relative(currPath, importPath);
		if (relativePath[0] != '.') {
			relativePath = './' + relativePath;
		}
		return this.normPath(relativePath);
	},


	//转换相对路径
	converRelative(relativePath, oldFilePath, newFilePath) {
		let s_i = oldFilePath.lastIndexOf('/')
		if (s_i != -1) oldFilePath = oldFilePath.substr(0, s_i);
		s_i = newFilePath.lastIndexOf('/')
		if (s_i != -1) newFilePath = newFilePath.substr(0, s_i);

		let rve_to_abs = this.normPath(path.resolve(oldFilePath, relativePath));
		relativePath = this.normPath(path.relative(newFilePath, rve_to_abs));
		if (relativePath[0] != '.') {
			relativePath = './' + relativePath;
		}
		return relativePath;
	},



	normPath(filePath) {
		return filePath.replace(/\\/g, '/');
	},

	// 异步读取文件
	readFileAsyn(filePath,callback)
	{
		let args = {filePath,callback};
		readFileQueue.push(args)
		// 最多同时读取50个文件
		readFileCount++;
		if(readFileCount >= readFileMaxCount){
			// console.log("readFileAsyn:读取超出最大文件数量",readFileCount);
			return;
		}
		this._handleReadFileQueue()
	},
	
	// 处理 readFileAsyn 队列
	_handleReadFileQueue(){
		// 1 == Math.min(50,1)
		let len = Math.min( readFileMaxCount , readFileQueue.length );
		for (let i = 0; i < len; i++) {
			// 处理队列
			let args = readFileQueue.splice(0,1)[0];
			fs.readFile(args.filePath,(err,data)=>
			{
				readFileCount--
				if(readFileCount > 500){
					setTimeout(this._handleReadFileQueue.bind(this),100)
				}else{
					this._handleReadFileQueue()
				}

				try {
					args.callback(err,data);
				} catch (error) {
					console.log(error)
				}
			})
		}
	},

	copyFile(sourcePath, toPath) {
		fs.writeFileSync(toPath, fs.readFileSync(sourcePath))
	},

	// copyFile(sourcePath,toPath){
	//     fs.readFile(sourcePath,function(err,data){
	//         if(err) throw new Error('复制失败:'+sourcePath+" TO "+data);
	//         fs.writeFile(toPath,data,function(err){
	//             if(err) throw new Error('复制写入失败'+sourcePath+" TO "+data);
	//         })
	//     })
	// },

	moveDir(sourcePath, toPath) {
		if (!fs.existsSync(sourcePath)) {
			console.log("不存在目录:", sourcePath);
			return;
		}

		if (sourcePath[sourcePath.length - 1] != path.sep) {
			sourcePath += path.sep;// 加猴嘴
		}
		if (toPath[toPath.length - 1] != path.sep) {
			toPath += path.sep;// 加猴嘴
		}

		let list = this.getDirAllFiles(sourcePath, []);
		list.forEach((fileName, i) => {

			let toFilePath = fileName.replace(sourcePath, toPath);
			console.log("执行:", fileName, toFilePath);
			let dirName = path.dirname(toFilePath);
			this.createDir(dirName);
			// 移动文件
			fs.renameSync(fileName, toFilePath);
		})
	},

	createDir(dirPath) {
		if (fs.existsSync(dirPath)) return;
		let paths = dirPath.split(path.sep);//分割路径
		let path_ = "";

		// c:\
		let n = 0
		let max = paths.length
		if (paths[0].indexOf(":") != -1) {
			path_ = paths[0];
			n++;
		}

		if (paths[max - 1].indexOf(".") != -1) {
			max--;
		}

		for (n; n < max; n++) {
			path_ += path.sep + paths[n];
			if (!fs.existsSync(path_)) {
				fs.mkdirSync(path_);
			}
		}
	},

	// 获得文件夹列表
	getDirList(dirPath, result) {
		let files = fs.readdirSync(dirPath);
		files.forEach((val, index) => {
			let fPath = path.join(dirPath, val);
			if (fs.existsSync(fPath) && fs.statSync(fPath).isDirectory()) {
				result.push(fPath);
			}
		});
		return result;
	},

	// 获得文件列表
	getFileList(dirPath, result = []) {
		let files = fs.readdirSync(dirPath);
		files.forEach((val, index) => {
			let fPath = path.join(dirPath, val);
			if (fs.existsSync(fPath) && fs.statSync(fPath).isFile()) {
				result.push(fPath);
			}
		});
		return result;
	},

	isDirectory(fPath) {
		return fs.existsSync(fPath) && fs.statSync(fPath).isDirectory()
	},

	getDirAllFiles(dirPath, result = []) {
		let files = fs.readdirSync(dirPath);
		files.forEach((val, index) => {
			let fPath = path.join(dirPath, val);
			if (fs.existsSync(fPath) && fs.statSync(fPath).isDirectory()) {
				this.getDirAllFiles(fPath, result);
			} else if (fs.statSync(fPath).isFile()) {
				result.push(fPath);
			}
		});
		return result;
	},

	getFileString(fileList, options) {
		let curIndex = 0;
		let totalIndex = fileList.length;
		let str = {};
		for (let key in fileList) {
			let filePath = fileList[key];
			let b = this._isFileExit(filePath);
			if (b) {
				fs.readFile(filePath, 'utf-8', function (err, data) {
					if (!err) {
						self._collectString(data, str);
					} else {
						console.log("error: " + filePath);
					}
					self._onCollectStep(filePath, ++curIndex, totalIndex, str, options);
				})
			} else {
				self._onCollectStep(filePath, ++curIndex, totalIndex, str, options);
			}
		}
	},

	_onCollectStep(filePath, cur, total, str, data) {
		if (data && data.stepCb) {
			data.stepCb(filePath, cur, total);
		}
		if (cur >= total) {
			self._onCollectOver(str, data);
		}
	},
	_onCollectOver(collectObjArr, data) {
		let strArr = [];
		let str = "";
		for (let k in collectObjArr) {
			str += k;
			strArr.push(k);
		}
		// console.log("一共有" + strArr.length + "个字符, " + strArr);
		console.log("一共有" + strArr.length + "个字符");
		if (data && data.compCb) {
			data.compCb(str);
		}
	},
	mkDir(path) {
		try {
			fs.mkdirSync(path);
		} catch (e) {
			if (e.code !== 'EEXIST') throw e;
		}
	},
	isFileExit(file) {
		try {
			fs.accessSync(file, fs.F_OK);
		} catch (e) {
			return false;
		}
		return true;
	},

	async isFileExitAsync(file) {
		return new Promise((resolev)=>{
			fs.access(file,(err)=>{	
				resolev(err == null);
			});
		});
	},

	_collectString(data, collectObject) {
		for (let i in data) {
			let char = data.charAt(i);
			if (collectObject[char]) {
				collectObject[char]++;
			} else {
				collectObject[char] = 1;
			}
		}
	},
	emptyDir(rootFile) {
		//删除所有的文件(将所有文件夹置空)
		let emptyDir = function (fileUrl) {
			let files = fs.readdirSync(fileUrl);//读取该文件夹
			for (let k in files) {
				let filePath = path.join(fileUrl, files[k]);
				let stats = fs.statSync(filePath);
				if (stats.isDirectory()) {
					emptyDir(filePath);
				} else {
					fs.unlinkSync(filePath);
					console.log("删除文件:" + filePath);
				}
			}
		};
		//删除所有的空文件夹
		let rmEmptyDir = function (fileUrl) {
			let files = fs.readdirSync(fileUrl);
			if (files.length > 0) {
				for (let k in files) {
					let rmDir = path.join(fileUrl, files[k]);
					rmEmptyDir(rmDir);
				}
				if (fileUrl !== rootFile) {// 不删除根目录
					fs.rmdirSync(fileUrl);
					console.log('删除空文件夹' + fileUrl);
				}
			} else {
				if (fileUrl !== rootFile) {// 不删除根目录
					fs.rmdirSync(fileUrl);
					console.log('删除空文件夹' + fileUrl);
				}
			}
		};
		emptyDir(rootFile);
		rmEmptyDir(rootFile);
	},
	/*
		is_fileType($('#uploadfile').val(), 'doc,pdf,txt,wps,odf,md,png,gif,jpg')
	* */
	is_fileType(filename, types) {
		types = types.split(',');
		let pattern = '\.(';
		for (let i = 0; i < types.length; i++) {
			if (0 !== i) {
				pattern += '|';
			}
			pattern += types[i].trim();
		}
		pattern += ')$';
		return new RegExp(pattern, 'i').test(filename);
	},

	getFileName(filePath) {
		let s_i = filePath.lastIndexOf('/');
		if (s_i == -1) s_i = filePath.lastIndexOf('\\');
		let name = filePath
		if (s_i != -1) name = name.substr(s_i + 1)
		s_i = name.lastIndexOf('.');
		if (s_i != -1) {
			name = name.substr(0, s_i)
		}
		return name;
	},

	getFileExtname(filePath) {
		let s_i = filePath.lastIndexOf('.');
		let extname = ""
		if (s_i != -1) {
			extname = filePath.substr(s_i).toLowerCase()
		}
		return extname;
	},


	getUrlInfo(url) {
		let s_i = url.lastIndexOf('/');
		if (s_i == -1) s_i = url.lastIndexOf('\\');

		let name = ""
		if (s_i != -1) name = url.substr(s_i + 1)

		s_i = name.lastIndexOf('.');
		let extname = ""
		if (s_i != -1) {
			extname = name.substr(s_i).toLowerCase()
		}
		return { name, extname, url }
	},

	
    /**
     * 拆分版本号
     * @param {string} version 版本号文本
     * @returns {number[]}
     * @example
     * splitVersionString('1.2.0');  // [1, 2, 0]
     */
	 splitVersionString(version) {
        return (
            version.replace(/-/g, '.')
                .split('.')
                .map(v => (parseInt(v) || 0))
        );
    },

    /**
     * 对比版本号
     * @param {string} a 版本 a
     * @param {string} b 版本 b
     * @returns {-1 | 0 | 1}
     * @example
     * compareVersion('1.0.0', '1.0.1');    // -1
     * compareVersion('1.1.0', '1.1.0');    // 0
     * compareVersion('1.2.1', '1.2.0');    // 1
     * compareVersion('1.2.0.1', '1.2.0');  // 1
     */
    compareVersion(a, b) {
        const acs = this.splitVersionString(a),
            bcs = this.splitVersionString(b);
        const count = Math.max(acs.length, bcs.length);
        for (let i = 0; i < count; i++) {
            const ac = acs[i],
                bc = bcs[i];
            // 前者缺少分量或前者小于后者
            if (ac == null || ac < bc) {
                return -1;
            }
            // 后者缺少分量或前者大于后者
            if (bc == null || ac > bc) {
                return 1;
            }
        }
        return 0;
    },


	httpPost(ip,path,port,args,callback){
		var options = {
			hostname: ip,
			port: port,
			path: path,
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
			}
		};
	
		var req = http.request(options, function (res) {
			// console.log('STATUS: ' + res.statusCode);
			// console.log('HEADERS: ' + JSON.stringify(res.headers));
			res.setEncoding('utf8');
			res.on('data', function (chunk) {
				if(callback) callback(chunk);
			});
		});
	
		req.on('error', function (e) {
			if(callback) callback();
		});
	
		// write data to request body
		var content = querystring.stringify(args);
		req.write(content);
		req.end();
	},

}

let fs = require("fs");
let path = require("path");

let self = module.exports = {
    
    normPath(filePath){
        return filePath.replace(/\\/g,'/');
    },

    copyFile(sourcePath,toPath){
        fs.writeFileSync(toPath,fs.readFileSync(sourcePath))
    },

    // copyFile(sourcePath,toPath){
    //     fs.readFile(sourcePath,function(err,data){
    //         if(err) throw new Error('复制失败:'+sourcePath+" TO "+data);
    //         fs.writeFile(toPath,data,function(err){
    //             if(err) throw new Error('复制写入失败'+sourcePath+" TO "+data);
    //         })
    //     })
    // },

    moveDir(sourcePath,toPath){
        if(!fs.existsSync(sourcePath)){
            console.log("不存在目录:",sourcePath);
            return;
        }

        if(sourcePath[sourcePath.length-1] != path.sep){
            sourcePath += path.sep;// 加猴嘴
        }
        if(toPath[toPath.length-1] != path.sep){
            toPath += path.sep;// 加猴嘴
        }

        let list = this.getDirAllFiles(sourcePath,[]);
        list.forEach((fileName,i)=>{

            let toFilePath  = fileName.replace(sourcePath,toPath);
            console.log("执行:",fileName,toFilePath);
            let dirName     = path.dirname(toFilePath);
            this.createDir(dirName);
            // 移动文件
            fs.renameSync(fileName,toFilePath);
        })
    },

    createDir(dirPath){
        if ( fs.existsSync(dirPath) ) return;
        let paths = dirPath.split(path.sep);//分割路径
        let path_ = "";

        // c:\
        let n = 0
        let max = paths.length
        if ( paths[0].indexOf(":") != -1)
        {
            path_ = paths[0];
            n ++;
        }

        if (paths[max-1].indexOf(".")){
            max --;
        }

        for (n ; n < max; n++) {
            path_ += path.sep + paths[n];
            if(!fs.existsSync(path_)){
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
    getFileList(dirPath, result) {
        let files = fs.readdirSync(dirPath);
        files.forEach((val, index) => {
            let fPath = path.join(dirPath, val);
            if (fs.existsSync(fPath) && fs.statSync(fPath).isFile()) {
                result.push(fPath);
            }
        });
        return result;
    },

    isDirectory(fPath){
        return fs.existsSync(fPath) && fs.statSync(fPath).isDirectory()
    },
    
    getDirAllFiles(dirPath, result) {
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
        for (let key in  fileList) {
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

    getFileName(filePath)
    {
        let s_i = filePath.lastIndexOf('/');
        if(s_i == -1) s_i = filePath.lastIndexOf('\\');
        let name = filePath
        if (s_i != -1) name = name.substr(s_i + 1)
        s_i = name.lastIndexOf('.');
        if (s_i != -1) {
            name = name.substr(0,s_i)
        }
        return name;
    },

    getFileExtname(filePath)
    {
		let s_i = filePath.lastIndexOf('.');
		let extname = ""
		if (s_i != -1) {
			extname = filePath.substr(s_i).toLowerCase()
		}
        return extname;
    },

    
	getUrlInfo(url) {
		let s_i = url.lastIndexOf('/');
		if(s_i == -1) s_i = url.lastIndexOf('\\');
		
		let name = ""
		if (s_i != -1) name = url.substr(s_i + 1)

		s_i = name.lastIndexOf('.');
		let extname = ""
		if (s_i != -1) {
			extname = name.substr(s_i).toLowerCase()
		}
		return { name, extname,url }
	}
	
}
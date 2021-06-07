let fs = require("fs");
let path = require("path");

let checkFsPath = new RegExp("\\.\\./", "g"); 
const inputType = {"text":1,"password":1,"number":1,"date":1,"color":1,"range":1,"month":1,"week":1,"time":1,"email":1,"search":1,"url":1,"textarea":1}

module.exports = {

	// 不是输入状态是时
	inputTypeChk(e){
		if (e.path[0] ){
			let type = e.path[0].type ;
			if ( inputType[type]){
				return true
			}
		}
	},

	// 拷贝本对象方法到目标对象
	// newObj 子类
	// baseObj 父类
	// mergeFuncs = ["init"]; 新旧类的同名函数合并一起
	extendTo(newObj,baseObj,mergeFuncs = []){
		if (!baseObj || !newObj) return;
		
		for(let k in baseObj){
			let v = baseObj[k]
			if (newObj[k] == null){
				newObj[k] = v
			}
			// 函数继承使用 "this._super()" 调用父类
			else if (typeof v == "function" && typeof newObj[k] == "function" && !newObj[k]._isExend){
				let newFunc = newObj[k];
				newObj[k] = function(){
					this._super = v;
					let ret = newFunc.apply(this,arguments);// 执行函数并传入传参
					delete this._super;
					return ret;
				};
				newObj[k]._isExend = true
			}
		}
	},

	copyToClipboard(str){
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
		} catch (err) {}

		document.body.removeChild(el);

		if (originalRange) {
			selection.removeAllRanges();
			selection.addRange(originalRange);
		}

		return success;
	},

	// 获得import路径
	getImportStringPaths(codeText) 
	{
		
        var regEx = /(require\(|import )(.{0,}['"])(.+)['"]/g;
		var match = regEx.exec(codeText);
		var bracketStack = []
		var imports = []
		while (match) 
		{
			let start = match.index+match[1].length+match[2].length;
			imports.push({
				path : match[3],
				start : start,
				length : match[3].length,
			})
			match = regEx.exec(codeText);
		}
		return imports
	},

	//将相对路径转为绝对路径
	relativePathTofsPath(relativePath, absolutePath) 
	{
		var uplayCount = 0; // 相对路径中返回上层的次数。
		var m = relativePath.match(checkFsPath);
		if (m) uplayCount = m.length;
	
		var lastIndex = absolutePath.length - 1;
		var subString = absolutePath
		for (var i = 0; i <= uplayCount; i++) {
			lastIndex = subString.lastIndexOf("/", lastIndex);
			subString = subString.substr(0, lastIndex)
		}
		return subString + "/" + relativePath.substr(relativePath.lastIndexOf('./')+2);
	},


	//转换相对路径
	converRelative(relativePath,oldFilePath,newFilePath) 
	{
		let s_i = oldFilePath.lastIndexOf('/')
		if(s_i != -1) oldFilePath = oldFilePath.substr(0,s_i);
		s_i = newFilePath.lastIndexOf('/')
		if(s_i != -1) newFilePath = newFilePath.substr(0,s_i);

		let rve_to_abs = path.resolve(oldFilePath,relativePath);
		relativePath = path.relative(newFilePath,rve_to_abs);
		if(relativePath[0] != '.'){
			relativePath = './'+relativePath;
		}
		return relativePath;
	},
	

	parseJavaScript(program,fileName){
	},
}

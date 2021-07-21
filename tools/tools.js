let fs = require("fs");
let path = require("path");
let esprima = require("./esprima/esprima");
var http 		= require('http');
var querystring = require('querystring');

let espJsMap = {CallExpression:'{},',FunctionExpression:'()=>{},',ArrayExpression:'[],',Literal:'"0",',ArrowFunctionExpression:'()=>{}',}
let patt = new RegExp('([0-9a-zA-Z_]+)[ =]*[ ]*[(].*[)][ \n=>]*{','g'); 
let checkFsPath = new RegExp("\\.\\./", "g");

module.exports = {

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

	// 获得代码函数名字列表，用于全局代码提示
	getScriptFuncEntrys(codeText)
	{
		let ret_match = codeText.match(patt);
		if(!ret_match) return []
		let list = [];
		ret_match.forEach((v,k)=>
		{
			patt.test(v)
			if(RegExp.$1){
				list.push(RegExp.$1);
			}
		})
		return list;
	},

	parseJavaScript(program,fileName){
		let js_info
		try {
			js_info = esprima.parseModule(program);
		} catch (error) {
			console.warn("代码存在语法错误:",fileName);
			return '';
		}
		// console.log(fileName)

		let js_text = '';

		let findObject = (data) =>
		{
			let var_info = {name:"",obj:null};
			let obj_exp 
			if(data.type == "VariableDeclaration")
			{
				if(data.declarations[0]){
					obj_exp = data.declarations[0];
					if(obj_exp){
						if(obj_exp.init && obj_exp.init.type == "ObjectExpression")
						{
							var_info.name = obj_exp.id.name;
							var_info.obj = obj_exp.init.properties;
						}
					}
				}
			}
			else if(data.type == "ExpressionStatement")
			{
				if (data.expression.right && data.expression.right.type == "ObjectExpression")
				{
					var_info.name = data.expression.left.name ||"";
					var_info.obj  = data.expression.right.properties;
				}
			}else if(data.type == "Property")
			{
				if (data.value && data.value.type == "ObjectExpression")
				{
					var_info.name = data.key.name || data.key.value || "";
					var_info.obj  = data.value.properties;
				}
			}

			return var_info;	
		}

		let parseObject = (var_info,order,parent_name='')=>
		{
			if(var_info.name == "" && order == 0) var_info.name = fileName;

			parent_name += order == 0 ? var_info.name : '["'+var_info.name+'"]'
			// 定义变量、对象属性
			// js_text += var_info.name + (order == 0 ? "={" : ':{')
			if(var_info.obj.length){
				js_text += parent_name + "={}\n"
			}
			// 解析obj内容
			for (let n = 0; n < var_info.obj.length; n++) 
			{
				let var_temp = var_info.obj[n]
				let sym 	 = espJsMap[var_temp.value.type] || '{}';
				if(var_temp.value.type == "ObjectExpression")
				{
					// 递归obj
					parseObject({name:(var_temp.key.name || var_temp.key.value),obj:var_temp.value.properties},order+1,parent_name)
				}else if(sym) {
					js_text += parent_name + '["' + (var_temp.key.name || var_temp.key.value) + '"]=' + sym+'\n';
				}
			}
			// js_text +=(order == 0 ? "}\n" : '},')
		}


		let parseFuncs = (data,order)=>
		{
			for (let i = 0; i < data.length; i++) 
			{
				let vd = data[i];
				if(vd.type == "ExpressionStatement")
				{
					if(vd.expression){
						let obj_exp = vd.expression
						if(obj_exp){
							if(obj_exp.right && (obj_exp.right.type == "FunctionExpression" || obj_exp.right.type == "ArrowFunctionExpression"))
							{
								// 全局变量去掉头提示
								if(obj_exp.left && obj_exp.left.object && obj_exp.left.object.name == "global" || obj_exp.left.object.name == "window"){
									js_text += 'function ' + obj_exp.left.object.name +"(){}\n"
								}else{
									js_text += obj_exp.left.object.name +'.'+obj_exp.left.property.name+"= ()=>{}\n";
								}
							}
						}
					}
				}else if(vd.type == "FunctionDeclaration"){
					js_text += 'function ' + vd.id.name+"(){}\n"
				}
			}
		}


		for (let i = 0; i < js_info.body.length; i++) 
		{
			let vd = js_info.body[i];
			let var_info = findObject(vd);
			if(!var_info.obj) continue;
			parseObject(var_info,0)
		}
		parseFuncs(js_info.body,0)
		// console.log("->\n",js_text);
		return js_text
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

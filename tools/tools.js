let fs = require("fire-fs");
let path = require("fire-path");
let esprima = require("./esprima/esprima");

let espJsMap = {CallExpression:'{},',FunctionExpression:'()=>{},',ArrayExpression:'[],',Literal:'"0",',ArrowFunctionExpression:'()=>{}',}
let patt = new RegExp('([0-9a-zA-Z_]+)[ =]*[ ]*[(].*[)][ \n=>]*{','g'); 
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
}

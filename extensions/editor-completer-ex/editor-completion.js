"use strict";

const tools = require("../../tools/tools");
const fs = require("fs");

exports.IMPORT_COMMAND = 'resolveImport';


class ImportCompletion
{
    // 触发提示字符

	constructor(parent)
    {
		this.parent = parent;
        this.triggerCharacters = ['/','.'];
        this.all_sym_sugges = []
		// 编辑代码提示 配置
		this.comp_cfg_map = {};
		this.cus_comp_group = {
		// group:[{
		// 	label: "forEach", //显示的名称，‘奖金’
		// 	insertText: "forEach((v,k)=>{})", //插入的值，‘100’
		// 	kind: 0, //提示的图标
		// 	detail: "遍历" //描述，‘我的常量
		// }]
        };
        this.command = {
            title: 'AI: Autocomplete',
            id: exports.IMPORT_COMMAND,
            arguments: [0]
        }
    }

    onLoad(editor){
        // Register the resolveImport
        this.editor = editor;
        this.callbackTimeouts = {}
        this.editor._commandService.addCommand(exports.IMPORT_COMMAND,(_,filePath,type)=>{
            this.parent.setTimeoutById(()=>{
                delete this.callbackTimeouts[filePath];
            },600,'ImportCompletion'+filePath);

            // 临时解决会调用两次的bug
            if(!this.callbackTimeouts[filePath]){
                this.handleFixImport(filePath,type);
            }
            this.callbackTimeouts[filePath] = 1;
        });
    }

	// 添加自定义代码输入提示, 例子: this.addCustomCompleters(["words","cc.Label"])
	addCustomCompleters(words) {
		words.forEach((v) => {
			this.addCustomCompleter(v);
		});
	}

	// 添加自定义代码提示,例子: this.addCustomCompleter("forEach","forEach((v,k)=>{})","遍历数组")
	addCustomCompleter(word, value, meta, kind, isCover = false, groupKey="default") {
		if(word.length <2 || !isNaN(Number(word[0])) ) return;
        let compInfo = this.cus_comp_group[groupKey] = this.cus_comp_group[groupKey] || {map:{},list:[]};
        
		// 覆盖信息
		if (isCover && compInfo.map[word]) {
			let list = compInfo.map[word];
			list.label = word;
			list.insertText = (value || word);
			list.detail = meta;
			list.kind = kind != null ? kind : this.parent.monaco.languages.CompletionItemKind.Text;
			return list;
		}else{
			if (!compInfo.map[word] || isCover) {
				compInfo.map[word] = {
					label: word,
					insertText: (value || word),
					kind: kind != null ? kind : this.parent.monaco.languages.CompletionItemKind.Text,
					insertTextRules: this.parent.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
					// preselect:true,
					detail: meta || ''
				};
				compInfo.list.push(compInfo.map[word]);
				return compInfo.map[word];
			}
		}
	}

    // 清除自定义代码提示
    cleanCustomCompleterByGroup(groupKey="default"){
        delete this.cus_comp_group[groupKey];
    }

    provideCompletionItems(model,position,context,token) 
    {
        let suggestions = [];
        if(model != this.editor.getModel()){
            return {suggestions};
        }

        let m_path      = model.uri.toString();
        let text        = model.getLineContent(position.lineNumber);
        // 1.文件路径提示
        this.getPathItems(model,position,text,suggestions);
        if(suggestions.length){
            return {suggestions,incomplete:false};
        }

        if(this.all_sym_sugges.length == 0) this.upAllSymSuggests();

        var p = new Promise( (resolve, reject )=> 
        {
            let offset = model.getOffsetAt(position);
            // 2.isHasSym 检测是否存在精准的内置代码提示
            this.parent.tsWr.hasCompletionsAtPosition(m_path,offset).then((isHasSym)=>
            {	
                let retSuggesFunc = (isUseGlobal)=>
                {
                    isUseGlobal ? suggestions.push.apply(suggestions,this.all_sym_sugges) : 0; // 全局变量提示
                    for (let i = 0; i < suggestions.length; i++) {
                        const v = suggestions[i];
                        delete v.range;
                        delete v.sortText;
                        delete v.preselect;
                    }
                    resolve( {suggestions,incomplete:false});
                }

                !isHasSym ? this.getCommonItems(model,text,suggestions,isHasSym) : 0; // 自定义提示信息
                
                // 3.全部代码文件的代码提示合集
                let isJs = 	this.parent.fileMgr.getUriInfo(m_path).extname == '.js'
                let enable = isJs && this.parent.cfg.enabledJsGlobalSugges ||  !isJs && this.parent.cfg.enabledTsGlobalSugges
                let wordInfo = model.getWordAtPosition(position);

                // 文本头部
                if(!wordInfo && text.substr(position.column-2,1) != '.'  || wordInfo && text.substr(wordInfo.startColumn-2,1) != '.')
                {
                    // 4.使用 Auto import 提示
                    this.parent.tsWr.getAutoImportSuggests(m_path).then((list)=>{
                        // for (let i = 0; i < list.length; i++) {
                        //     let item = list[i];
                        //     item.command = this.command;
                        // }
                        suggestions.push.apply(suggestions,list)
                        // 使用全文件模糊代码提示
                        retSuggesFunc(true && enable);
                    });
                }else{
                    // 4.存在精准的内置代码提示，不使用模糊代码提示
                    retSuggesFunc(!isHasSym && enable);
                }
            })
            
        })
        return p;
    }

    // 其它代码提示列表
    getCommonItems(model,text,suggestions){
        let is_has_string = text.indexOf('"') != -1 || text.indexOf("'") !=-1;
        for (const key in this.cus_comp_group) {
            const compInfo = this.cus_comp_group[key];
            for (let i = 0; i < compInfo.list.length; i++) 
            {
                const v = compInfo.list[i];
                if(!is_has_string && 
                    v.kind == this.parent.monaco.languages.CompletionItemKind.Folder ){ // 只在字符串中提示文件路径
                    continue;
                }
                suggestions.push(v)
            }
        }
        return suggestions;
    }

    getPathItems(model,position,text,suggestions){
        let imports = tools.getImportStringPaths(text);
        if(!imports.length) return;

        let item ;
        for (let i = 0; i < imports.length; i++) {
            let col = position.column-1;
            // “”范围内路径
            if(imports[i].start <= col && imports[i].start+imports[i].length >= col){
                item = imports[i];
                break;
            }
        }
        if(!item) {
            return;
        }

        // 读取目录
        let i = item.path.lastIndexOf('/')
        if(i == -1){
            return;// 没有相对路径
        }

        let importFsPath = tools.relativePathTofsPath(model.fsPath,item.path.substr(0,i+1));
        if(!tools.isDirectory(importFsPath)){
            return;// 没有目录
        }
        this.getDirItems(importFsPath,suggestions,/(\.ts|\.js)/,false);
    }

    getDirItems(fsPath,suggestions,useExtnames,isShowExtname){
        let files = fs.readdirSync(fsPath);
        files.forEach((dirFile, index) => 
        {
            if(dirFile.indexOf('.') != -1 && (
                dirFile == '.DS_Store' || 
                dirFile.indexOf(".meta") != -1 || 
                useExtnames && !dirFile.match(useExtnames))){
                return;
            }
            let kind = dirFile.indexOf('.') != -1 ? this.parent.monaco.languages.CompletionItemKind.File : this.parent.monaco.languages.CompletionItemKind.Folder;
            let extname = tools.getFileExtname(dirFile) || '文件夹';
            if(!isShowExtname){
                dirFile = tools.getFileName(dirFile);
            }
            suggestions.push({
                label: dirFile,
                insertText: dirFile,
                kind:  kind,
                detail: extname,
            });
        });
    }
    
    

    // 光标选中当前自动补全item时触发动作
    // resolveCompletionItem(item, token) {
    //     console.log('补全',item, token)
    //     // if(item.isAutoImport){
    //     //     this.handleFixImport();
    //     // }
    //     return null;
    // }
    
    // 刷新全局模糊代码提示
	upAllSymSuggests()
	{
		if(!this.parent.cfg.enabledJsGlobalSugges && !this.parent.cfg.enabledTsGlobalSugges){
			return;
		}
		// 防止短时间内大量重复调用
		this.parent.setTimeoutById(()=>
		{
			this.parent.tsWr.getAllSuggests().then((suggeList)=>
			{
				this.all_sym_sugges = suggeList;
			});
		},50,'upAllSymSuggests')
	}


    // 使用自动修复功能完成import
    handleFixImport(fileName,type) 
    {
        let model = this.editor.getModel();  
        let position = this.editor.getPosition();  
        let worldInfo = model.getWordAtPosition(position)
        if(!worldInfo){
            position.column -= 2;
            worldInfo = model.getWordAtPosition(position)
            if(!worldInfo){
                return;
            }
        }

        let start = model.getOffsetAt({
            lineNumber: position.lineNumber,
            column: worldInfo.startColumn
        });
        let end = model.getOffsetAt({
            lineNumber: position.lineNumber,
            column: worldInfo.endColumn
        });

        let options = model.getOptions();
        let formatOptions = {
            ConvertTabsToSpaces: options.insertSpaces,
            TabSize: options.tabSize,
            IndentSize: options.tabSize,
            IndentStyle: 'Smart',
            NewLineCharacter: '\n',
            InsertSpaceAfterCommaDelimiter: true,
            InsertSpaceAfterSemicolonInForStatements: true,
            InsertSpaceBeforeAndAfterBinaryOperators: true,
            InsertSpaceAfterKeywordsInControlFlowStatements: true,
            InsertSpaceAfterFunctionKeywordForAnonymousFunctions: true,
            InsertSpaceAfterOpeningAndBeforeClosingNonemptyParenthesis: false,
            InsertSpaceAfterOpeningAndBeforeClosingNonemptyBrackets: false,
            InsertSpaceAfterOpeningAndBeforeClosingTemplateStringBraces: false,
            PlaceOpenBraceOnNewLineForControlBlocks: false,
            PlaceOpenBraceOnNewLineForFunctions: false
        };
        let errorCodes = [2304];

        this.parent.monaco.tsWr.getCodeFixesAtPosition(model.uri.toString(),start,end,errorCodes,formatOptions)
        .then((list)=>{
            if(!list || !list.length){
                return;
            }

            // 优先使用指定路径的修复项
            let useItem;
            for (let i = 0; i < list.length; i++) {
                const fixInfo = list[i];
                if(fixInfo.modulePath == fileName){
                    useItem = fixInfo;
                    break
                }else if(fixInfo.isAddExisting){
                    useItem = fixInfo;
                }
            }
            if(!useItem) useItem = list[0];

            this.fixImport(model,useItem.changes)
            this.upAllSymSuggests();
            if(type == 'showPanel'){
                // 刷新提示面板
                this.parent.setTimeout(()=>{
                    this.editor._commandService.executeCommand('editor.action.triggerSuggest')
                },100)
            }
        })
    }

    fixImport(model, changes){
        let selects = []
        let edits = []
        for (let i = 0; i < changes.length; i++) {
            const item = changes[i];
            for (let n = 0; n < item.textChanges.length; n++) 
            {
                const fix = item.textChanges[n];
                const range = this.textSpanToRange(model,fix.span)
                selects.push(range);
                edits.push({
                    range:range,
                    text:fix.newText,
                    forceMoveMarkers:false,
                })
            }
        }
        model.pushStackElement();
        model.pushEditOperations(selects, edits, () => []);
        model.pushStackElement();
    }

    textSpanToRange(model, span) {
        var p1 = model.getPositionAt(span.start);
        var p2 = model.getPositionAt(span.start + span.length);
        var startLineNumber = p1.lineNumber, startColumn = p1.column;
        var endLineNumber = p2.lineNumber, endColumn = p2.column;
        return { startLineNumber: startLineNumber, startColumn: startColumn, endLineNumber: endLineNumber, endColumn: endColumn };
    }

}

exports.default = ImportCompletion;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

var monaco ;
var bracketPairColorizer = /** @class */ (function () {
    function bracketPairColorizer(editor, options) {
        // 1.生成括号颜色样式信息

        if (options === void 0) { options = {}; }

        // 旧的装饰器
        this.oldDecorators = [];
        var depth = (options.colours || []).length || (options.classNames || []).length || bracketPairColorizer.defaultColours.length;

        // 生成样式信息
        var output = "";
        if (!options.classNames) {
            this.classNames = [];
            for (var i = 0; i < depth; i++) {
                var colour = options.colours ? options.colours[i] : bracketPairColorizer.defaultColours[i];
                output += ".bracket.bracket-color" + i + " {\ncolor: " + colour + "; }\n";
                this.classNames.push("bracket bracket-color" + i);
            }
        }
        else {
            this.classNames = options.classNames;
        }
        
        // 绑定样式信息
        if (output) {
            let dom = editor._domElement
            var style = document.createElement("style");
            style.innerHTML = output;
            if (dom) {
                dom.appendChild(style);
            }
            this.styleSheet = style;
        }

        this.destroy = this.destroy.bind(this);
        this.applyWithDebounce = this.applyWithDebounce.bind(this);
        this.debounce = options.debounce || bracketPairColorizer.defaultDebounceDelay;
        this.editor = editor;
        this.disposables = []

        this.applyWithDebounce();
        this.disposables.push(editor.onDidChangeModel(this.applyWithDebounce));
        this.disposables.push(editor.onDidChangeModelContent(this.applyWithDebounce));
        this.disposables.push(editor.onDidDispose(this.destroy));
    }
    Object.defineProperty(bracketPairColorizer.prototype, "depth", {
        get: function () {
            return this.classNames.length;
        },
        enumerable: true,
        configurable: true
    });
    bracketPairColorizer.prototype.destroy = function () {
        // 1.释放后删除样式、装饰器、绑定的事件
        this.editor = undefined;
        if (this.styleSheet) 
        {
            this.styleSheet.remove();
            delete this.styleSheet;
            this.disposables.forEach(function (d) {
                return d.dispose();
            });

            if(this.oldModel && !this.oldModel._isDisposed){
                this.oldDecorators = this.oldModel.deltaDecorations(this.oldDecorators, []);
            }
        }
    };
    bracketPairColorizer.prototype.applyWithDebounce = function () {
        var _this = this;
        if (!this.debounceTimer) {
            this.debounceTimer = window.setTimeout(function () {
                _this.apply();
                _this.debounceTimer = null;
            }, this.debounce);
            return;
        }
    };
    bracketPairColorizer.prototype.apply = function () 
    {
        // 释放之前的装饰对象
        if(this.oldModel && !this.oldModel._isDisposed){
            this.oldDecorators = this.oldModel.deltaDecorations(this.oldDecorators, []);
        }
        if (!this.editor) {
            return;
        }
        var model = this.editor.getModel();
        if (!model || model.getLineCount() > 100000) {
            return; // 一万行不进行解析工作
        }
        // 1.界面变动后开始刷新括号配色
        // 2.解析每一对括号的位置信息
        // 3.给每对括号分配颜色
        // 4.调用vs_model的装饰器开始给括号上色


        var bracketPairColorizers = [];
        var code  = this.editor.getValue();
        var regEx = /[\[\{\(]/g;
        var match = regEx.exec(code);
        var colorInd = 0;
        var bracketStack = []
        while (match) 
        {
            var startPos = model.getPositionAt(match.index);
            let bracket = model.matchBracket(startPos);
            if(bracket == null){
                match = regEx.exec(code);
                continue
            }

            let stackInd = bracketStack.length;
            let parentRange = bracketStack[stackInd-1];
            while(stackInd != 0){
                if(parentRange && bracket[0].startLineNumber > parentRange.endLineNumber || bracket[0].startLineNumber == parentRange.endLineNumber && bracket[0].startColumn >= parentRange.endColumn){
                    // 同级的括号
                    bracketStack.pop();
                    stackInd = bracketStack.length;
                    parentRange = bracketStack[stackInd-1];
                }else{
                    break;
                }
            }
            bracketStack.push(bracket[1]);
            
            // .splice(-1,1)
            let className = this.classNames[ stackInd % this.classNames.length ]; // css 
            for (let i = 0; i < bracket.length; i++) {
                const range = bracket[i];
                var decoration = {
                    range: range, 
                    options: {
                        // className: className,
                        inlineClassName: className,
                        stickiness: monaco.editor.TrackedRangeStickiness.AlwaysGrowsWhenTypingAtEdges,
                    },
                };
                bracketPairColorizers.push(decoration);
            }
            match = regEx.exec(code);
        }
        this.oldModel = model;
        this.oldDecorators = model.deltaDecorations(this.oldDecorators, bracketPairColorizers);
    };
    bracketPairColorizer.defaultColours = [
        "rgba(104,208,254,1)",
        "rgba(255,255,64,1)",
        "rgba(255,127,255,1)",
    ];
    bracketPairColorizer.defaultDebounceDelay = 200;
    return bracketPairColorizer;
}());



function bracketColorDecorate(editor, monacoEditor,options) {
    monaco = monacoEditor
    return new bracketPairColorizer(editor, options);
}
exports.default = bracketColorDecorate;
exports.bracketColorDecorate = bracketColorDecorate;
//# sourceMappingURL=index.js.map
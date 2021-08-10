"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

const vsLoader = Editor.require('packages://simple-code/panel/vs-panel/monaco-editor/dev/vs/loader.js');
var monaco = vsLoader.require("vs/editor/editor.main");
var monaco_editor_1 = monaco;
var RainbowDecorator = /** @class */ (function () {
    function RainbowDecorator(editor, options) {
        if (options === void 0) { options = {}; }
        this.oldDecorators = [];
        this.oldInvalidDecorators = [];
        this.tabSize = 4;
        var depth = (options.colours || []).length || (options.classNames || []).length || RainbowDecorator.defaultColours.length;
        for (var i = 0; i < depth; i++) {
            this.oldDecorators.push([]);
        }
        var output = "";
        if (!options.classNames) {
            this.classNames = [];
            for (var i = 0; i < depth; i++) {
                var colour = options.colours ? options.colours[i] : RainbowDecorator.defaultColours[i];
                output += ".rainbow.rainbow-depth" + i + " {\nbackground: " + colour + "; }\n";
                this.classNames.push("rainbow rainbow-depth" + i);
            }
        }
        else {
            this.classNames = options.classNames;
        }
        if (!options.errorClassName) {
            output += ".rainbow.rainbow-error {\nbackground: " + (options.errorColour || RainbowDecorator.defaultErrorColour) + "; }\n";
            this.errorClassName = "rainbow rainbow-error";
        }
        else {
            this.errorClassName = options.errorClassName;
        }
        if (output) {
            let dom = Editor.Panel.find('simple-code')
            var style = document.createElement("style");
            style.innerHTML = output;
            if (dom) {
                dom.$box.appendChild(style);
            }
            this.styleSheet = style;
        }
        this.destroy = this.destroy.bind(this);
        this.applyWithDebounce = this.applyWithDebounce.bind(this);
        this.skipErrors = options.skipErrors || this.skipErrors;
        this.tabSize = options.tabSize || this.tabSize;
        this.debounce = options.debounce || RainbowDecorator.defaultDebounceDelay;
        this.editor = editor;
        this.disposables = []
        
        this.applyWithDebounce();
        this.disposables.push(editor.onDidChangeModel(this.applyWithDebounce));
        this.disposables.push(editor.onDidChangeModelContent(this.applyWithDebounce));
        this.disposables.push(editor.onDidDispose(this.destroy));
    }
    Object.defineProperty(RainbowDecorator.prototype, "depth", {
        get: function () {
            return this.classNames.length;
        },
        enumerable: true,
        configurable: true
    });
    RainbowDecorator.prototype.destroy = function () {
        this.editor = undefined;
        if (this.styleSheet) 
        {
            this.styleSheet.remove();
            delete this.styleSheet;
            this.disposables.forEach(function (d) {
                return d.dispose();
            });

            if(this.oldModel && !this.oldModel._isDisposed){
                this.oldDecorators          = this.oldModel.deltaDecorations(this.oldDecorators, []);
                this.oldInvalidDecorators   = this.oldModel.deltaDecorations(this.oldInvalidDecorators, []);
            }
        }
    };
    RainbowDecorator.prototype.applyWithDebounce = function () {
        var _this = this;
        if (!this.debounceTimer) {
            this.debounceTimer = window.setTimeout(function () {
                _this.apply();
                _this.debounceTimer = null;
            }, this.debounce);
            return;
        }
    };
    RainbowDecorator.prototype.apply = function () 
    {
        if(this.oldModel && !this.oldModel._isDisposed){
            this.oldDecorators          = this.oldModel.deltaDecorations(this.oldDecorators, []);
            this.oldInvalidDecorators   = this.oldModel.deltaDecorations(this.oldInvalidDecorators, []);
        }
        if (!this.editor) {
            return;
        }
        var rainbowDecorators = [];
        var errorDecorators = [];
        for (var i = 0; i < this.depth; i++) {
            rainbowDecorators.push([]);
        }
        var code = this.editor.getValue();
        var model = this.editor.getModel();
        if (!model) {
            return;
        }
        var regEx = /^[\t ]+/gm;
        var re = new RegExp("\t", "g");
        var tabs = "";
        for (var i = 0; i < this.tabSize; i++) {
            tabs += " ";
        }
        var match = regEx.exec(code);
        while (match) {
            var ma = (match[0].replace(re, tabs)).length;
            if (!this.skipErrors && ma % this.tabSize !== 0) {
                var startPos = model.getPositionAt(match.index);
                var endPos = model.getPositionAt(match.index + match[0].length);
                var decoration = {
                    range: new monaco_editor_1.Range(startPos.lineNumber, startPos.column, endPos.lineNumber, endPos.column), options: {
                        className: this.errorClassName,
                        stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
                    },
                };
                errorDecorators.push(decoration);
            }
            else {
                var m = match[0];
                var l = m.length;
                var o = 0;
                var n = 0;
                while (n < l) {
                    var startPos = model.getPositionAt(match.index + n);
                    if (m[n] === "\t") {
                        n++;
                    }
                    else {
                        n += this.tabSize;
                    }
                    var endPos = model.getPositionAt(match.index + n);
                    var decoratorIndex = o % rainbowDecorators.length;
                    var decoration = {
                        range: new monaco_editor_1.Range(startPos.lineNumber, startPos.column, endPos.lineNumber, endPos.column), options: {
                            className: this.classNames[decoratorIndex],
                            stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
                        }
                    };
                    rainbowDecorators[decoratorIndex].push(decoration);
                    o++;
                }
            }
            match = regEx.exec(code);
        }
        for (var i = 0; i < this.depth; i++) {
            this.oldDecorators[i] = model.deltaDecorations(this.oldDecorators[i], rainbowDecorators[i]);
        }
        this.oldInvalidDecorators = model.deltaDecorations(this.oldInvalidDecorators, errorDecorators);
        this.oldModel = model;
    };
    RainbowDecorator.defaultErrorColour = "rgba(128,32,32,0.3)";
    RainbowDecorator.defaultColours = [
        "rgba(64,64,16,0.3)",
        "rgba(32,64,32,0.3)",
        "rgba(64,32,64,0.3)",
        "rgba(16,48,48,0.3)",
    ];
    RainbowDecorator.defaultDebounceDelay = 200;
    return RainbowDecorator;
}());
function rainbowDecorate(editor, options) {
    return new RainbowDecorator(editor, options);
}
exports.default = rainbowDecorate;
exports.rainbowDecorate = rainbowDecorate;
//# sourceMappingURL=index.js.map
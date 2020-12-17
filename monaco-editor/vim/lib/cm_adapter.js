"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

const vsLoader = Editor.require('packages://simple-code/monaco-editor/dev/vs/loader.js');
var _monacoEditor = vsLoader.require("vs/editor/editor.main");

var _cursorTypeOperations = vsLoader.require("vs/editor/common/controller/cursorTypeOperations");

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var VerticalRevealType = {
  Bottom: 4
}; // for monaco 0.19.x where x < 3

var EditorOptConstants = {
  readOnly: 65,
  cursorWidth: 20,
  fontInfo: 32
};
var _window$navigator = window.navigator,
    userAgent = _window$navigator.userAgent,
    platform = _window$navigator.platform;
var edge = /Edge\/(\d+)/.exec(userAgent);
var ios = !edge && /AppleWebKit/.test(userAgent) && /Mobile\/\w+/.test(userAgent);
var mac = ios || /Mac/.test(platform);
var nonASCIISingleCaseWordChar = /[\u00df\u0587\u0590-\u05f4\u0600-\u06ff\u3040-\u309f\u30a0-\u30ff\u3400-\u4db5\u4e00-\u9fcc\uac00-\ud7af]/;

function isWordCharBasic(ch) {
  return /\w/.test(ch) || ch > "\x80" && (ch.toUpperCase() != ch.toLowerCase() || nonASCIISingleCaseWordChar.test(ch));
}

function Pos(line, column) {
  if (!(this instanceof Pos)) {
    return new Pos(line, column);
  }

  this.line = line;
  this.ch = column;
}

function signal(cm, signal, args) {
  cm.dispatch(signal, args);
}

function dummy(key) {
  return function () {// console.log(key, 'dummy function called with', Array.prototype.slice.call(arguments));
  };
}

var doFold, noFold;

if (String.prototype.normalize) {
  doFold = function doFold(str) {
    return str.normalize("NFD").toLowerCase();
  };

  noFold = function noFold(str) {
    return str.normalize("NFD");
  };
} else {
  doFold = function doFold(str) {
    return str.toLowerCase();
  };

  noFold = function noFold(str) {
    return str;
  };
}

var StringStream = function StringStream(string, tabSize) {
  this.pos = this.start = 0;
  this.string = string;
  this.tabSize = tabSize || 8;
  this.lastColumnPos = this.lastColumnValue = 0;
  this.lineStart = 0;
};

StringStream.prototype = {
  eol: function eol() {
    return this.pos >= this.string.length;
  },
  sol: function sol() {
    return this.pos == this.lineStart;
  },
  peek: function peek() {
    return this.string.charAt(this.pos) || undefined;
  },
  next: function next() {
    if (this.pos < this.string.length) return this.string.charAt(this.pos++);
  },
  eat: function eat(match) {
    var ch = this.string.charAt(this.pos);
    if (typeof match == "string") var ok = ch == match;else var ok = ch && (match.test ? match.test(ch) : match(ch));

    if (ok) {
      ++this.pos;
      return ch;
    }
  },
  eatWhile: function eatWhile(match) {
    var start = this.pos;

    while (this.eat(match)) {}

    return this.pos > start;
  },
  eatSpace: function eatSpace() {
    var start = this.pos;

    while (/[\s\u00a0]/.test(this.string.charAt(this.pos))) {
      ++this.pos;
    }

    return this.pos > start;
  },
  skipToEnd: function skipToEnd() {
    this.pos = this.string.length;
  },
  skipTo: function skipTo(ch) {
    var found = this.string.indexOf(ch, this.pos);

    if (found > -1) {
      this.pos = found;
      return true;
    }
  },
  backUp: function backUp(n) {
    this.pos -= n;
  },
  column: function column() {
    throw "not implemented";
  },
  indentation: function indentation() {
    throw "not implemented";
  },
  match: function match(pattern, consume, caseInsensitive) {
    if (typeof pattern == "string") {
      var cased = function cased(str) {
        return caseInsensitive ? str.toLowerCase() : str;
      };

      var substr = this.string.substr(this.pos, pattern.length);

      if (cased(substr) == cased(pattern)) {
        if (consume !== false) this.pos += pattern.length;
        return true;
      }
    } else {
      var match = this.string.slice(this.pos).match(pattern);
      if (match && match.index > 0) return null;
      if (match && consume !== false) this.pos += match[0].length;
      return match;
    }
  },
  current: function current() {
    return this.string.slice(this.start, this.pos);
  },
  hideFirstChars: function hideFirstChars(n, inner) {
    this.lineStart += n;

    try {
      return inner();
    } finally {
      this.lineStart -= n;
    }
  }
};

function toCmPos(pos) {
  return new Pos(pos.lineNumber - 1, pos.column - 1);
}

function toMonacoPos(pos) {
  return new _monacoEditor.Position(pos.line + 1, pos.ch + 1);
}

var Marker =
/*#__PURE__*/
function () {
  function Marker(cm, id, line, ch) {
    _classCallCheck(this, Marker);

    this.cm = cm;
    this.id = id;
    this.lineNumber = line + 1;
    this.column = ch + 1;
    cm.marks[this.id] = this;
  }

  _createClass(Marker, [{
    key: "clear",
    value: function clear() {
      delete this.cm.marks[this.id];
    }
  }, {
    key: "find",
    value: function find() {
      return toCmPos(this);
    }
  }]);

  return Marker;
}();

function monacoToCmKey(e) {
  var skip = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
  var addQuotes = true;
  var keyName = Editor.monaco.KeyCode[e.keyCode];

  if (e.key) {
    keyName = e.key;
    addQuotes = false;
  }

  var key = keyName;
  var skipOnlyShiftCheck = skip;

  switch (e.keyCode) {
    case _monacoEditor.KeyCode.Shift:
    case _monacoEditor.KeyCode.Meta:
    case _monacoEditor.KeyCode.Alt:
    case _monacoEditor.KeyCode.Ctrl:
      return key;

    case _monacoEditor.KeyCode.Escape:
      skipOnlyShiftCheck = true;
      key = 'Esc';
      break;
  }

  if (keyName.startsWith('KEY_')) {
    key = keyName[keyName.length - 1].toLowerCase();
  } else if (keyName.endsWith('Arrow')) {
    skipOnlyShiftCheck = true;
    key = keyName.substr(0, keyName.length - 5);
  } else if (keyName.startsWith('US_')) {
    key = e.browserEvent.key;
  }

  if (!skipOnlyShiftCheck && !e.altKey && !e.ctrlKey && !e.metaKey) {
    key = e.key || e.browserEvent.key;
  } else {
    if (e.altKey) {
      key = "Alt-".concat(key);
    }

    if (e.ctrlKey) {
      key = "Ctrl-".concat(key);
    }

    if (e.metaKey) {
      key = "Meta-".concat(key);
    }

    if (e.shiftKey) {
      key = "Shift-".concat(key);
    }
  }

  if (key.length === 1 && addQuotes) {
    key = "'".concat(key, "'");
  }

  return key;
}

var CMAdapter =
/*#__PURE__*/
function () {
  function CMAdapter(editor) {
    _classCallCheck(this, CMAdapter);

    _initialiseProps.call(this);

    this.editor = editor;
    this.state = {};
    this.marks = {};
    this.$uid = 0;
    this.disposables = [];
    this.listeners = {};
    this.curOp = {};
    this.attached = false;
    this.statusBar = null;
    this.addLocalListeners();
    this.ctxInsert = this.editor.createContextKey('insertMode', true);
  }

  _createClass(CMAdapter, [{
    key: "attach",
    value: function attach() {
      CMAdapter.keyMap.vim.attach(this);
    }
  }, {
    key: "addLocalListeners",
    value: function addLocalListeners() {
      this.disposables.push(this.editor.onDidChangeCursorPosition(this.handleCursorChange), this.editor.onDidChangeModelContent(this.handleChange), this.editor.onKeyDown(this.handleKeyDown));
    }
  }, {
    key: "handleReplaceMode",
    value: function handleReplaceMode(key, e) {
      var fromReplace = false;
      var _char = key;
      var pos = this.editor.getPosition();
      var range = new _monacoEditor.Range(pos.lineNumber, pos.column, pos.lineNumber, pos.column + 1);
      var forceMoveMarkers = true;

      if (key.startsWith('\'')) {
        _char = key[1];
      } else if (_char === 'Enter') {
        _char = '\n';
      } else if (_char === 'Backspace') {
        var lastItem = this.replaceStack.pop();

        if (!lastItem) {
          return;
        }

        fromReplace = true;
        _char = lastItem;
        range = new _monacoEditor.Range(pos.lineNumber, pos.column, pos.lineNumber, pos.column - 1);
      } else {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      if (!this.replaceStack) {
        this.replaceStack = [];
      }

      if (!fromReplace) {
        this.replaceStack.push(this.editor.getModel().getValueInRange(range));
      }

      this.editor.executeEdits('vim', [{
        text: _char,
        range: range,
        forceMoveMarkers: forceMoveMarkers
      }]);

      if (fromReplace) {
        this.editor.setPosition(range.getStartPosition());
      }
    }
  }, {
    key: "setOption",
    value: function setOption(key, value) {
      this.state[key] = value;

      if (key === 'theme') {
        _monacoEditor.editor.setTheme(value);
      }
    }
  }, {
    key: "getConfiguration",
    value: function getConfiguration() {
      var editor = this.editor;
      var opts = EditorOptConstants;

      if (typeof editor.getConfiguration === 'function') {
        return editor.getConfiguration();
      } else if ('EditorOption' in _monacoEditor.editor) {
        // for monaco 0.19.3 onwards
        opts = _monacoEditor.editor.EditorOption;
      }

      return {
        readOnly: editor.getOption(opts.readOnly),
        viewInfo: {
          cursorWidth: editor.getOption(opts.cursorWidth)
        },
        fontInfo: editor.getOption(opts.fontInfo)
      };
    }
  }, {
    key: "getOption",
    value: function getOption(key) {
      if (key === 'readOnly') {
        return this.getConfiguration().readOnly;
      } else if (key === 'firstLineNumber') {
        return this.firstLine() + 1;
      } else if (key === 'indentWithTabs') {
        return !this.editor.getModel().getOptions().insertSpaces;
      } else {
        if (typeof this.editor.getConfiguration === 'function') {
          return this.editor.getRawConfiguration()[key];
        }

        return this.editor.getRawOptions()[key];
      }

      return this.state[key];
    }
  }, {
    key: "dispatch",
    value: function dispatch(signal) {
      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      var listeners = this.listeners[signal];

      if (!listeners) {
        return;
      }

      listeners.forEach(function (handler) {
        return handler.apply(void 0, args);
      });
    }
  }, {
    key: "on",
    value: function on(event, handler) {
      if (!this.listeners[event]) {
        this.listeners[event] = [];
      }

      this.listeners[event].push(handler);
    }
  }, {
    key: "off",
    value: function off(event, handler) {
      var listeners = this.listeners[event];

      if (!listeners) {
        return;
      }

      this.listeners[event] = listeners.filter(function (l) {
        return l !== handler;
      });
    }
  }, {
    key: "firstLine",
    value: function firstLine() {
      return 0;
    }
  }, {
    key: "lastLine",
    value: function lastLine() {
      return this.lineCount() - 1;
    }
  }, {
    key: "lineCount",
    value: function lineCount() {
      return this.editor.getModel().getLineCount();
    }
  }, {
    key: "defaultTextHeight",
    value: function defaultTextHeight() {
      return 1;
    }
  }, {
    key: "getLine",
    value: function getLine(line) {
      if (line < 0) {
        return '';
      }

      var model = this.editor.getModel();
      var maxLines = model.getLineCount();

      if (line + 1 > maxLines) {
        line = maxLines - 1;
      }

      return this.editor.getModel().getLineContent(line + 1);
    }
  }, {
    key: "getAnchorForSelection",
    value: function getAnchorForSelection(selection) {
      if (selection.isEmpty()) {
        return selection.getPosition();
      }

      var selDir = selection.getDirection();
      return selDir === _monacoEditor.SelectionDirection.LTR ? selection.getStartPosition() : selection.getEndPosition();
    }
  }, {
    key: "getHeadForSelection",
    value: function getHeadForSelection(selection) {
      if (selection.isEmpty()) {
        return selection.getPosition();
      }

      var selDir = selection.getDirection();
      return selDir === _monacoEditor.SelectionDirection.LTR ? selection.getEndPosition() : selection.getStartPosition();
    }
  }, {
    key: "getCursor",
    value: function getCursor() {
      var type = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

      if (!type) {
        return toCmPos(this.editor.getPosition());
      }

      var sel = this.editor.getSelection();
      var pos;

      if (sel.isEmpty()) {
        pos = sel.getPosition();
      } else if (type === 'anchor') {
        pos = this.getAnchorForSelection(sel);
      } else {
        pos = this.getHeadForSelection(sel);
      }

      return toCmPos(pos);
    }
  }, {
    key: "getRange",
    value: function getRange(start, end) {
      var p1 = toMonacoPos(start);
      var p2 = toMonacoPos(end);
      return this.editor.getModel().getValueInRange(_monacoEditor.Range.fromPositions(p1, p2));
    }
  }, {
    key: "getSelection",
    value: function getSelection() {
      return this.editor.getModel().getValueInRange(this.editor.getSelection());
    }
  }, {
    key: "replaceRange",
    value: function replaceRange(text, start, end) {
      var p1 = toMonacoPos(start);
      var p2 = !end ? p1 : toMonacoPos(end);
      this.editor.executeEdits('vim', [{
        text: text,
        range: _monacoEditor.Range.fromPositions(p1, p2)
      }]); // @TODO - Check if this breaks any other expectation

      this.pushUndoStop();
    }
  }, {
    key: "pushUndoStop",
    value: function pushUndoStop() {
      this.editor.pushUndoStop();
    }
  }, {
    key: "setCursor",
    value: function setCursor(line, ch) {
      var pos = line;

      if (_typeof(line) !== 'object') {
        pos = {};
        pos.line = line;
        pos.ch = ch;
      }

      var monacoPos = this.editor.getModel().validatePosition(toMonacoPos(pos));
      this.editor.setPosition(toMonacoPos(pos));
      this.editor.revealPosition(monacoPos);
    }
  }, {
    key: "somethingSelected",
    value: function somethingSelected() {
      return !this.editor.getSelection().isEmpty();
    }
  }, {
    key: "operation",
    value: function operation(fn, force) {
      return fn();
    }
  }, {
    key: "listSelections",
    value: function listSelections() {
      var _this = this;

      var selections = this.editor.getSelections();

      if (!selections.length || this.inVirtualSelectionMode) {
        return [{
          anchor: this.getCursor('anchor'),
          head: this.getCursor('head')
        }];
      }

      return selections.map(function (sel) {
        var pos = sel.getPosition();
        var start = sel.getStartPosition();
        var end = sel.getEndPosition();
        return {
          anchor: _this.clipPos(toCmPos(_this.getAnchorForSelection(sel))),
          head: _this.clipPos(toCmPos(_this.getHeadForSelection(sel)))
        };
      });
    }
  }, {
    key: "focus",
    value: function focus() {
      this.editor.focus();
    }
  }, {
    key: "setSelections",
    value: function setSelections(selections, primIndex) {
      var hasSel = !!this.editor.getSelections().length;
      var sels = selections.map(function (sel, index) {
        var anchor = sel.anchor,
            head = sel.head;

        if (hasSel) {
          return _monacoEditor.Selection.fromPositions(toMonacoPos(anchor), toMonacoPos(head));
        } else {
          return _monacoEditor.Selection.fromPositions(toMonacoPos(head), toMonacoPos(anchor));
        }
      });

      if (!primIndex) {
        sels.reverse();
      } else if (sels[primIndex]) {
        sels.push(sels.splice(primIndex, 1)[0]);
      }

      if (!sels.length) {
        return;
      }

      var sel = sels[0];
      var posToReveal;

      if (sel.getDirection() === _monacoEditor.SelectionDirection.LTR) {
        posToReveal = sel.getEndPosition();
      } else {
        posToReveal = sel.getStartPosition();
      }

      this.editor.setSelections(sels);
      this.editor.revealPosition(posToReveal);
    }
  }, {
    key: "setSelection",
    value: function setSelection(frm, to) {
      var range = _monacoEditor.Range.fromPositions(toMonacoPos(frm), toMonacoPos(to));

      this.editor.setSelection(range);
    }
  }, {
    key: "getSelections",
    value: function getSelections() {
      var editor = this.editor;
      return editor.getSelections().map(function (sel) {
        return editor.getModel().getValueInRange(sel);
      });
    }
  }, {
    key: "replaceSelections",
    value: function replaceSelections(texts) {
      var editor = this.editor;
      editor.getSelections().forEach(function (sel, index) {
        editor.executeEdits('vim', [{
          range: sel,
          text: texts[index],
          forceMoveMarkers: false
        }]);
      });
    }
  }, {
    key: "toggleOverwrite",
    value: function toggleOverwrite(toggle) {
      if (toggle) {
        this.enterVimMode();
        this.replaceMode = true;
      } else {
        this.leaveVimMode();
        this.replaceMode = false;
        this.replaceStack = [];
      }
    }
  }, {
    key: "charCoords",
    value: function charCoords(pos, mode) {
      return {
        top: pos.line,
        left: pos.ch
      };
    }
  }, {
    key: "coordsChar",
    value: function coordsChar(pos, mode) {
      if (mode === 'local') {}
    }
  }, {
    key: "clipPos",
    value: function clipPos(p) {
      var pos = this.editor.getModel().validatePosition(toMonacoPos(p));
      return toCmPos(pos);
    }
  }, {
    key: "setBookmark",
    value: function setBookmark(cursor, options) {
      var bm = new Marker(this, this.$uid++, cursor.line, cursor.ch);

      if (!options || !options.insertLeft) {
        bm.$insertRight = true;
      }

      this.marks[bm.id] = bm;
      return bm;
    }
  }, {
    key: "getScrollInfo",
    value: function getScrollInfo() {
      var editor = this.editor;

      var _editor$getVisibleRan = editor.getVisibleRanges(),
          _editor$getVisibleRan2 = _slicedToArray(_editor$getVisibleRan, 1),
          range = _editor$getVisibleRan2[0];

      return {
        left: 0,
        top: range.startLineNumber - 1,
        height: editor.getModel().getLineCount(),
        clientHeight: range.endLineNumber - range.startLineNumber + 1
      };
    }
  }, {
    key: "triggerEditorAction",
    value: function triggerEditorAction(action) {
      this.editor.trigger('vim', action);
    }
  }, {
    key: "dispose",
    value: function dispose() {
      this.dispatch('dispose');
      this.removeOverlay();

      if (CMAdapter.keyMap.vim) {
        CMAdapter.keyMap.vim.detach(this);
      }

      this.disposables.forEach(function (d) {
        return d.dispose();
      });
    }
  }, {
    key: "getInputField",
    value: function getInputField() {}
  }, {
    key: "getWrapperElement",
    value: function getWrapperElement() {}
  }, {
    key: "enterVimMode",
    value: function enterVimMode() {
      var toVim = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
      this.ctxInsert.set(false);
      var config = this.getConfiguration();
      this.initialCursorWidth = config.viewInfo.cursorWidth || 0;
      this.editor.updateOptions({
        cursorWidth: config.fontInfo.typicalFullwidthCharacterWidth,
        cursorBlinking: 'solid'
      });
    }
  }, {
    key: "leaveVimMode",
    value: function leaveVimMode() {
      this.ctxInsert.set(true);
      this.editor.updateOptions({
        cursorWidth: this.initialCursorWidth || 0,
        cursorBlinking: 'blink'
      });
    }
  }, {
    key: "virtualSelectionMode",
    value: function virtualSelectionMode() {
      return this.inVirtualSelectionMode;
    }
  }, {
    key: "markText",
    value: function markText() {
      // only used for fat-cursor, not needed
      return {
        clear: function clear() {},
        find: function find() {}
      };
    }
  }, {
    key: "getUserVisibleLines",
    value: function getUserVisibleLines() {
      var ranges = this.editor.getVisibleRanges();

      if (!ranges.length) {
        return {
          top: 0,
          bottom: 0
        };
      }

      var res = {
        top: Infinity,
        bottom: 0
      };
      ranges.reduce(function (acc, range) {
        if (range.startLineNumber < acc.top) {
          acc.top = range.startLineNumber;
        }

        if (range.endLineNumber > acc.bottom) {
          acc.bottom = range.endLineNumber;
        }

        return acc;
      }, res);
      res.top -= 1;
      res.bottom -= 1;
      return res;
    }
  }, {
    key: "findPosV",
    value: function findPosV(startPos, amount, unit) {
      var editor = this.editor;
      var finalAmount = amount;
      var finalUnit = unit;
      var pos = toMonacoPos(startPos);

      if (unit === 'page') {
        var editorHeight = editor.getLayoutInfo().height;
        var lineHeight = this.getConfiguration().fontInfo.lineHeight;
        finalAmount = finalAmount * Math.floor(editorHeight / lineHeight);
        finalUnit = 'line';
      }

      if (unit === 'line') {
        pos.lineNumber += finalAmount;
      }

      return toCmPos(pos);
    }
  }, {
    key: "findMatchingBracket",
    value: function findMatchingBracket(pos) {
      var mPos = toMonacoPos(pos);
      var res = this.editor.getModel().matchBracket(mPos);

      if (!res || !(res.length === 2)) {
        return {
          to: null
        };
      }

      return {
        to: toCmPos(res[1].getStartPosition())
      };
    }
  }, {
    key: "findFirstNonWhiteSpaceCharacter",
    value: function findFirstNonWhiteSpaceCharacter(line) {
      let count = this.editor.getModel().getLineCount()
      line = line<count ? line :count-1;
      return this.editor.getModel().getLineFirstNonWhitespaceColumn(line + 1) - 1;
    }
  }, {
    key: "scrollTo",
    value: function scrollTo(x, y) {
      if (!x && !y) {
        return;
      }

      if (!x) {
        if (y < 0) {
          y = this.editor.getPosition().lineNumber - y;
        }

        this.editor.setScrollTop(this.editor.getTopForLineNumber(y + 1));
      }
    }
  }, {
    key: "moveCurrentLineTo",
    value: function moveCurrentLineTo(viewPosition) {
      var editor = this.editor;
      var pos = editor.getPosition();

      var range = _monacoEditor.Range.fromPositions(pos, pos);

      switch (viewPosition) {
        case 'top':
          editor.revealRangeAtTop(range);
          return;

        case 'center':
          editor.revealRangeInCenter(range);
          return;

        case 'bottom':
          // private api. no other way
          editor._revealRange(range, VerticalRevealType.Bottom);

          return;
      }
    }
  }, {
    key: "getSearchCursor",
    value: function getSearchCursor(query, pos, caseFold) {
      var matchCase = false;
      var isRegex = false;

      if (query instanceof RegExp && !query.global) {
        matchCase = !query.ignoreCase;
        query = query.source;
        isRegex = true;
      }

      if (pos.ch == undefined) pos.ch = Number.MAX_VALUE;
      var monacoPos = toMonacoPos(pos);
      var context = this;
      var editor = this.editor;
      var lastSearch = null;
      var model = editor.getModel();
      var matches = model.findMatches(query, false, isRegex, matchCase) || [];
      return {
        getMatches: function getMatches() {
          return matches;
        },
        findNext: function findNext() {
          return this.find(false);
        },
        findPrevious: function findPrevious() {
          return this.find(true);
        },
        jumpTo: function jumpTo(index) {
          if (!matches || !matches.length) {
            return false;
          }

          var match = matches[index];
          lastSearch = match.range;
          context.highlightRanges([lastSearch], 'currentFindMatch');
          context.highlightRanges(matches.map(function (m) {
            return m.range;
          }).filter(function (r) {
            return !r.equalsRange(lastSearch);
          }));
          return lastSearch;
        },
        find: function find(back) {
          if (!matches || !matches.length) {
            return false;
          }

          var match;

          if (back) {
            var _pos = lastSearch ? lastSearch.getStartPosition() : monacoPos;

            match = model.findPreviousMatch(query, _pos, isRegex, matchCase);

            if (!match || !match.range.getStartPosition().isBeforeOrEqual(_pos)) {
              return false;
            }
          } else {
            var _pos2 = lastSearch ? lastSearch.getEndPosition() : monacoPos;

            match = model.findNextMatch(query, _pos2, isRegex, matchCase);

            if (!match || !_pos2.isBeforeOrEqual(match.range.getStartPosition())) {
              return false;
            }
          }

          lastSearch = match.range;
          context.highlightRanges([lastSearch], 'currentFindMatch');
          context.highlightRanges(matches.map(function (m) {
            return m.range;
          }).filter(function (r) {
            return !r.equalsRange(lastSearch);
          }));
          return lastSearch;
        },
        from: function from() {
          return lastSearch && toCmPos(lastSearch.getStartPosition());
        },
        to: function to() {
          return lastSearch && toCmPos(lastSearch.getEndPosition());
        },
        replace: function replace(text) {
          if (lastSearch) {
            editor.executeEdits('vim', [{
              range: lastSearch,
              text: text,
              forceMoveMarkers: true
            }]);
            lastSearch.setEndPosition(editor.getPosition());
            editor.setPosition(lastSearch.getStartPosition());
          }
        }
      };
    }
  }, {
    key: "highlightRanges",
    value: function highlightRanges(ranges) {
      var className = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'findMatch';
      var decorationKey = "decoration".concat(className);
      this[decorationKey] = this.editor.deltaDecorations(this[decorationKey] || [], ranges.map(function (range) {
        return {
          range: range,
          options: {
            stickiness: _monacoEditor.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
            zIndex: 13,
            className: className,
            showIfCollapsed: true
          }
        };
      }));
      return this[decorationKey];
    }
  }, {
    key: "addOverlay",
    value: function addOverlay(_ref, hasBoundary, style) {
      var query = _ref.query;
      var matchCase = false;
      var isRegex = false;

      if (query && query instanceof RegExp && !query.global) {
        isRegex = true;
        matchCase = !query.ignoreCase;
        query = query.source;
      }

      var match = this.editor.getModel().findNextMatch(query, this.editor.getPosition(), isRegex, matchCase);

      if (!match || !match.range) {
        return;
      }

      this.highlightRanges([match.range]);
    }
  }, {
    key: "removeOverlay",
    value: function removeOverlay() {
      var _this2 = this;

      ['currentFindMatch', 'findMatch'].forEach(function (key) {
        _this2.editor.deltaDecorations(_this2["decoration".concat(key)] || [], []);
      });
    }
  }, {
    key: "scrollIntoView",
    value: function scrollIntoView(pos) {
      if (!pos) {
        return;
      }

      this.editor.revealPosition(toMonacoPos(pos));
    }
  }, {
    key: "moveH",
    value: function moveH(units, type) {
      if (type !== 'char') {
        return;
      }

      var pos = this.editor.getPosition();
      this.editor.setPosition(new _monacoEditor.Position(pos.lineNumber, pos.column + units));
    }
    /**
     * Uses internal apis which not sure why is internal
     */

  }, {
    key: "scanForBracket",
    value: function scanForBracket(pos, dir, dd, config) {
      var mPos = toMonacoPos(pos);
      var model = this.editor.getModel();
      var range = model.matchBracket(mPos);

      if (!range || range.length !== 2) {
        var bracket = '{([';

        for (var i = 0; i < bracket.length; i++) {
          var bracketRange = model.findMatchingBracketUp(bracket[i], mPos);

          if (bracketRange) {
            range = model.matchBracket(bracketRange.getEndPosition());
            break;
          }
        }
      }

      if (!range || range.length !== 2) {
        return null;
      }

      var res;

      if (dir === -1) {
        res = range[1].getStartPosition();
      } else {
        res = range[0].getStartPosition();
      }

      return {
        pos: toCmPos(res),
        ch: model.getValueInRange(dir === -1 ? range[0] : range[1])
      };
    }
  }, {
    key: "indexFromPos",
    value: function indexFromPos(pos) {
      return this.editor.getModel().getOffsetAt(toMonacoPos(pos));
    }
  }, {
    key: "posFromIndex",
    value: function posFromIndex(offset) {
      return toCmPos(this.editor.getModel().getPositionAt(offset));
    }
  }, {
    key: "indentLine",
    value: function indentLine(line) {
      var indentRight = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
      var editor = this.editor;

      var cursors = editor._getCursors();

      var pos = new _monacoEditor.Position(line + 1, 1);

      var sel = _monacoEditor.Selection.fromPositions(pos, pos); // no other way than to use internal apis to preserve the undoStack for a batch of indents


      editor.executeCommands("editor.action.".concat(indentRight ? 'indent' : 'outdent', "Lines"), _cursorTypeOperations.TypeOperations[indentRight ? 'indent' : 'outdent'](cursors.context.config, this.editor.getModel(), [sel]));
    }
  }, {
    key: "setStatusBar",
    value: function setStatusBar(statusBar) {
      this.statusBar = statusBar;
    }
  }, {
    key: "openDialog",
    value: function openDialog(html, callback, options) {
      if (!this.statusBar) {
        return;
      }

      return this.statusBar.setSec(html, callback, options);
    }
  }, {
    key: "openNotification",
    value: function openNotification(html) {
      if (!this.statusBar) {
        return;
      }

      this.statusBar.showNotification(html);
    }
  }]);

  return CMAdapter;
}();

CMAdapter.Pos = Pos;
CMAdapter.signal = signal;
CMAdapter.on = dummy('on');
CMAdapter.off = dummy('off');
CMAdapter.addClass = dummy('addClass');
CMAdapter.rmClass = dummy('rmClass');
CMAdapter.defineOption = dummy('defineOption');
CMAdapter.keyMap = {
  'default': function _default(key) {
    return function (cm) {
      return true;
    };
  }
};
CMAdapter.isWordChar = isWordCharBasic;
CMAdapter.keyName = monacoToCmKey;
CMAdapter.StringStream = StringStream;

CMAdapter.e_stop = function (e) {
  if (e.stopPropagation) {
    e.stopPropagation();
  } else {
    e.cancelBubble = true;
  }

  CMAdapter.e_preventDefault(e);
  return false;
};

CMAdapter.e_preventDefault = function (e) {
  if (e.preventDefault) {
    e.preventDefault();

    if (e.browserEvent) {
      e.browserEvent.preventDefault();
    }
  } else {
    e.returnValue = false;
  }

  return false;
};

CMAdapter.commands = {
  redo: function redo(cm) {
    cm.triggerEditorAction('redo');
  },
  undo: function undo(cm) {
    cm.triggerEditorAction('undo');
  },
  newlineAndIndent: function newlineAndIndent(cm) {
    cm.triggerEditorAction('editor.action.insertLineAfter');
  }
};

CMAdapter.lookupKey = function lookupKey(key, map, handle) {
  if (typeof map === 'string') {
    map = CMAdapter.keyMap[map];
  }

  var found = typeof map == "function" ? map(key) : map[key];
  if (found === false) return "nothing";
  if (found === "...") return "multi";
  if (found != null && handle(found)) return "handled";

  if (map.fallthrough) {
    if (!Array.isArray(map.fallthrough)) return lookupKey(key, map.fallthrough, handle);

    for (var i = 0; i < map.fallthrough.length; i++) {
      var result = lookupKey(key, map.fallthrough[i], handle);
      if (result) return result;
    }
  }
};

CMAdapter.defineExtension = function (name, fn) {
  CMAdapter.prototype[name] = fn;
};

var _initialiseProps = function _initialiseProps() {
  var _this3 = this;

  this.handleKeyDown = function (e) {
    // Allow previously registered keydown listeners to handle the event and
    // prevent this extension from also handling it.
    if (e.browserEvent.defaultPrevented & e.keyCode !== _monacoEditor.KeyCode.Escape) {
      return;
    }

    if (!_this3.attached) {
      return;
    }

    var key = monacoToCmKey(e);

    if (_this3.replaceMode) {
      _this3.handleReplaceMode(key, e);
    }

    if (!key) {
      return;
    }

    if (CMAdapter.keyMap.vim && CMAdapter.keyMap.vim.call) {
      var cmd = CMAdapter.keyMap.vim.call(key, _this3);

      if (cmd) {
        e.preventDefault();
        e.stopPropagation();

        try {
          cmd();
        } catch (err) {
          console.error(err);
        }
      }
    }
  };

  this.handleCursorChange = function (e) {
    var position = e.position,
        source = e.source;
    var editor = _this3.editor;
    var selection = editor.getSelection();

    if (!_this3.ctxInsert.get() && e.source === 'mouse' && selection.isEmpty()) {
      var maxCol = editor.getModel().getLineMaxColumn(position.lineNumber);

      if (e.position.column === maxCol) {
        editor.setPosition(new _monacoEditor.Position(e.position.lineNumber, maxCol - 1));
        return;
      }
    }

    _this3.dispatch('cursorActivity', _this3, e);
  };

  this.handleChange = function (e) {
    var changes = e.changes;
    var change = {
      text: changes.reduce(function (acc, change) {
        acc.push(change.text);
        return acc;
      }, []),
      origin: '+input'
    };
    var curOp = _this3.curOp = _this3.curOp || {};

    if (!curOp.changeHandlers) {
      curOp.changeHandlers = _this3.listeners['change'] && _this3.listeners['change'].slice();
    }

    if (_this3.virtualSelectionMode()) {
      return;
    }

    if (!curOp.lastChange) {
      curOp.lastChange = curOp.change = change;
    } else {
      curOp.lastChange.next = curOp.lastChange = change;
    }

    _this3.dispatch('change', _this3, change);
  };
};

var _default2 = CMAdapter;
exports["default"] = _default2;
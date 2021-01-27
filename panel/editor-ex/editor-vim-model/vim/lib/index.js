"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.initVimMode = initVimMode;
Object.defineProperty(exports, "VimMode", {
  enumerable: true,
  get: function get() {
    return _keymap_vim["default"];
  }
});
Object.defineProperty(exports, "StatusBar", {
  enumerable: true,
  get: function get() {
    return _statusbar["default"];
  }
});

var _keymap_vim = _interopRequireDefault(require("./cm/keymap_vim"));

var _statusbar = _interopRequireDefault(require("./statusbar"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function initVimMode(editor) {
  var statusbarNode = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
  var StatusBarClass = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : _statusbar["default"];
  var sanitizer = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;

  // 注册 读取 键盘 、光标、处理事件函数 . 创建 vim 专用插入模式文本光标
  var vimAdapter = new _keymap_vim["default"](editor); // vim适配器 -> CMAdapter

  if (!statusbarNode) {
    vimAdapter.attach();
    return vimAdapter;
  }

  // 状态描述器配置
  var statusBar = new StatusBarClass(statusbarNode, editor, sanitizer); // vim 状态描述面板
  var keyBuffer = '';
  // vi 模式改变
  vimAdapter.on('vim-mode-change', function (mode) {
    statusBar.setMode(mode);
  });
  // vi 输入命令模式
  vimAdapter.on('vim-keypress', function (key) {
    if (key === ':') {
      keyBuffer = '';
    } else {
      keyBuffer += key;
    }

    statusBar.setKeyBuffer(keyBuffer);
  });
  // vi 命令输入完成
  vimAdapter.on('vim-command-done', function () {
    keyBuffer = '';
    statusBar.setKeyBuffer(keyBuffer);
  });
  // vi 适配器释放
  vimAdapter.on('dispose', function () {
    statusBar.toggleVisibility(false);
    statusBar.closeInput();
    statusBar.clear();
  });
  statusBar.toggleVisibility(true);
  vimAdapter.setStatusBar(statusBar);
  // 激活vi -> attachVimMap
  vimAdapter.attach();
  return vimAdapter;
}
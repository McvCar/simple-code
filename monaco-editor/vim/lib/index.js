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
  var vimAdapter = new _keymap_vim["default"](editor);

  if (!statusbarNode) {
    vimAdapter.attach();
    return vimAdapter;
  }

  var statusBar = new StatusBarClass(statusbarNode, editor, sanitizer);
  var keyBuffer = '';
  vimAdapter.on('vim-mode-change', function (mode) {
    statusBar.setMode(mode);
  });
  vimAdapter.on('vim-keypress', function (key) {
    if (key === ':') {
      keyBuffer = '';
    } else {
      keyBuffer += key;
    }

    statusBar.setKeyBuffer(keyBuffer);
  });
  vimAdapter.on('vim-command-done', function () {
    keyBuffer = '';
    statusBar.setKeyBuffer(keyBuffer);
  });
  vimAdapter.on('dispose', function () {
    statusBar.toggleVisibility(false);
    statusBar.closeInput();
    statusBar.clear();
  });
  statusBar.toggleVisibility(true);
  vimAdapter.setStatusBar(statusBar);
  vimAdapter.attach();
  return vimAdapter;
}
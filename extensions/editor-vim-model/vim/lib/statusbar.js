"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var VimStatusBar =
/*#__PURE__*/
function () {
  function VimStatusBar(node, editor) {
    var _this = this;

    var sanitizer = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

    _classCallCheck(this, VimStatusBar);

    this.closeInput = function () {
      _this.removeInputListeners();

      _this.input = null;

      _this.setSec('');

      if (_this.editor) {
        _this.editor.focus();
      }
    };

    this.clear = function () {
      _this.setInnerHtml_(_this.node, '');
    };

    this.inputKeyUp = function (e) {
      var options = _this.input.options;

      if (options && options.onKeyUp) {
        options.onKeyUp(e, e.target.value, _this.closeInput);
      }
    };

    this.inputBlur = function () {
      var options = _this.input.options;

      if (options.closeOnBlur) {
        _this.closeInput();
      }
    };

    this.inputKeyDown = function (e) {
      var _this$input = _this.input,
          options = _this$input.options,
          callback = _this$input.callback;

      if (options && options.onKeyDown && options.onKeyDown(e, e.target.value, _this.closeInput)) {
        return;
      }

      if (e.keyCode === 27 || options && options.closeOnEnter !== false && e.keyCode == 13) {
        _this.input.node.blur();

        e.stopPropagation();

        _this.closeInput();
      }

      if (e.keyCode === 13 && callback) {
        e.stopPropagation();
        e.preventDefault();
        callback(e.target.value);
      }
    };

    this.node = node;
    this.modeInfoNode = document.createElement('span');
    this.secInfoNode = document.createElement('span');
    this.notifNode = document.createElement('span');
    this.notifNode.className = 'vim-notification';
    this.keyInfoNode = document.createElement('span');
    this.keyInfoNode.setAttribute('style', 'float: right');
    this.node.appendChild(this.modeInfoNode);
    this.node.appendChild(this.secInfoNode);
    this.node.appendChild(this.notifNode);
    this.node.appendChild(this.keyInfoNode);
    this.toggleVisibility(false);
    this.editor = editor;
    this.sanitizer = sanitizer;
  }

  _createClass(VimStatusBar, [{
    key: "setMode",
    value: function setMode(ev) {
      if (ev.mode === 'visual' && ev.subMode === 'linewise') {
        this.setText('--VISUAL LINE--');
        return;
      }

      this.setText("--".concat(ev.mode.toUpperCase(), "--"));
    }
  }, {
    key: "setKeyBuffer",
    value: function setKeyBuffer(key) {
      this.keyInfoNode.textContent = key;
    }
  }, {
    key: "setSec",
    value: function setSec(text, callback, options) {
      this.notifNode.textContent = '';

      if (text === undefined) {
        return;
      }

      this.setInnerHtml_(this.secInfoNode, text);
      var input = this.secInfoNode.querySelector('input');

      if (input) {
        input.focus();
        this.input = {
          callback: callback,
          options: options,
          node: input
        };

        if (options) {
          if (options.selectValueOnOpen) {
            input.select();
          }

          if (options.value) {
            input.value = options.value;
          }
        }

        this.addInputListeners();
      }

      return this.closeInput;
    }
  }, {
    key: "setText",
    value: function setText(text) {
      this.modeInfoNode.textContent = text;
    }
  }, {
    key: "toggleVisibility",
    value: function toggleVisibility(toggle) {
      if (toggle) {
        this.node.style.display = 'block';
      } else {
        this.node.style.display = 'none';
      }

      if (this.input) {
        this.removeInputListeners();
      }

      clearInterval(this.notifTimeout);
    }
  }, {
    key: "addInputListeners",
    value: function addInputListeners() {
      var node = this.input.node;
      node.addEventListener('keyup', this.inputKeyUp);
      node.addEventListener('keydown', this.inputKeyDown);
      node.addEventListener('input', this.inputKeyInput);
      node.addEventListener('blur', this.inputBlur);
    }
  }, {
    key: "removeInputListeners",
    value: function removeInputListeners() {
      if (!this.input || !this.input.node) {
        return;
      }

      var node = this.input.node;
      node.removeEventListener('keyup', this.inputKeyUp);
      node.removeEventListener('keydown', this.inputKeyDown);
      node.removeEventListener('input', this.inputKeyInput);
      node.removeEventListener('blur', this.inputBlur);
    }
  }, {
    key: "showNotification",
    value: function showNotification(text) {
      var _this2 = this;

      var sp = document.createElement('span');
      this.setInnerHtml_(sp, text);
      this.notifNode.textContent = sp.textContent;
      this.notifTimeout = setTimeout(function () {
        _this2.notifNode.textContent = '';
      }, 5000);
    }
  }, {
    key: "setInnerHtml_",
    value: function setInnerHtml_(element, htmlContents) {
      if (this.sanitizer) {
        // Clear out previous contents first.
        while (element.children.length) {
          element.removeChild(element.children[0]);
        }

        element.appendChild(this.sanitizer(htmlContents));
      } else {
        element.innerHTML = htmlContents;
      }
    }
  }]);

  return VimStatusBar;
}();

exports["default"] = VimStatusBar;
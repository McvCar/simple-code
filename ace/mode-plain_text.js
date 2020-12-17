define("ace/mode/plain_text",["ace_require","exports","module","ace/lib/oop","ace/mode/text","ace/mode/text_highlight_rules","ace/mode/behaviour"], function(ace_require, exports, module) {
"use strict";

var oop = ace_require("../lib/oop");
var TextMode = ace_require("./text").Mode;
var TextHighlightRules = ace_require("./text_highlight_rules").TextHighlightRules;
var Behaviour = ace_require("./behaviour").Behaviour;

var Mode = function() {
    this.HighlightRules = TextHighlightRules;
    this.$behaviour = new Behaviour();
};

oop.inherits(Mode, TextMode);

(function() {
    this.type = "text";
    this.getNextLineIndent = function(state, line, tab) {
        return '';
    };
    this.$id = "ace/mode/plain_text";
}).call(Mode.prototype);

exports.Mode = Mode;
});                (function() {
                    window.ace_require(["ace/mode/plain_text"], function(m) {
                        if (typeof module == "object" && typeof exports == "object" && module) {
                            module.exports = m;
                        }
                    });
                })();
            
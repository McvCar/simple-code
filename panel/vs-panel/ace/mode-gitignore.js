define("ace/mode/gitignore_highlight_rules",["ace_require","exports","module","ace/lib/oop","ace/mode/text_highlight_rules"], function(ace_require, exports, module) {
"use strict";

var oop = ace_require("../lib/oop");
var TextHighlightRules = ace_require("./text_highlight_rules").TextHighlightRules;

var GitignoreHighlightRules = function() {
    this.$rules = {
        "start" : [
            {
                token : "comment",
                regex : /^\s*#.*$/
            }, {
                token : "keyword", // negated patterns
                regex : /^\s*!.*$/
            }
        ]
    };
    
    this.normalizeRules();
};

GitignoreHighlightRules.metaData = {
    fileTypes: ['gitignore'],
    name: 'Gitignore'
};

oop.inherits(GitignoreHighlightRules, TextHighlightRules);

exports.GitignoreHighlightRules = GitignoreHighlightRules;
});

define("ace/mode/gitignore",["ace_require","exports","module","ace/lib/oop","ace/mode/text","ace/mode/gitignore_highlight_rules"], function(ace_require, exports, module) {
"use strict";

var oop = ace_require("../lib/oop");
var TextMode = ace_require("./text").Mode;
var GitignoreHighlightRules = ace_require("./gitignore_highlight_rules").GitignoreHighlightRules;

var Mode = function() {
    this.HighlightRules = GitignoreHighlightRules;
    this.$behaviour = this.$defaultBehaviour;
};
oop.inherits(Mode, TextMode);

(function() {
    this.lineCommentStart = "#";
    this.$id = "ace/mode/gitignore";
}).call(Mode.prototype);

exports.Mode = Mode;
});                (function() {
                    window.ace_require(["ace/mode/gitignore"], function(m) {
                        if (typeof module == "object" && typeof exports == "object" && module) {
                            module.exports = m;
                        }
                    });
                })();
            
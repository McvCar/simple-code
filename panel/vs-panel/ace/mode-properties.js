define("ace/mode/properties_highlight_rules",["ace_require","exports","module","ace/lib/oop","ace/mode/text_highlight_rules"], function(ace_require, exports, module) {
"use strict";

var oop = ace_require("../lib/oop");
var TextHighlightRules = ace_require("./text_highlight_rules").TextHighlightRules;

var PropertiesHighlightRules = function() {

    var escapeRe = /\\u[0-9a-fA-F]{4}|\\/;

    this.$rules = {
        "start" : [
            {
                token : "comment",
                regex : /[!#].*$/
            }, {
                token : "keyword",
                regex : /[=:]$/
            }, {
                token : "keyword",
                regex : /[=:]/,
                next  : "value"
            }, {
                token : "constant.language.escape",
                regex : escapeRe
            }, {
                defaultToken: "variable"
            }
        ],
        "value" : [
            {
                regex : /\\$/,
                token : "string",
                next : "value"
            }, {
                regex : /$/,
                token : "string",
                next : "start"
            }, {
                token : "constant.language.escape",
                regex : escapeRe
            }, {
                defaultToken: "string"
            }
        ]
    };

};

oop.inherits(PropertiesHighlightRules, TextHighlightRules);

exports.PropertiesHighlightRules = PropertiesHighlightRules;
});

define("ace/mode/properties",["ace_require","exports","module","ace/lib/oop","ace/mode/text","ace/mode/properties_highlight_rules"], function(ace_require, exports, module) {
"use strict";

var oop = ace_require("../lib/oop");
var TextMode = ace_require("./text").Mode;
var PropertiesHighlightRules = ace_require("./properties_highlight_rules").PropertiesHighlightRules;

var Mode = function() {
    this.HighlightRules = PropertiesHighlightRules;
    this.$behaviour = this.$defaultBehaviour;
};
oop.inherits(Mode, TextMode);

(function() {
    this.$id = "ace/mode/properties";
}).call(Mode.prototype);

exports.Mode = Mode;
});                (function() {
                    window.ace_require(["ace/mode/properties"], function(m) {
                        if (typeof module == "object" && typeof exports == "object" && module) {
                            module.exports = m;
                        }
                    });
                })();
            
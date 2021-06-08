define("ace/snippets/razor",["ace_require","exports","module"], function(ace_require, exports, module) {
"use strict";

exports.snippetText = "snippet if\n\
(${1} == ${2}) {\n\
	${3}\n\
}";
exports.scope = "razor";

});                (function() {
                    window.ace_require(["ace/snippets/razor"], function(m) {
                        if (typeof module == "object" && typeof exports == "object" && module) {
                            module.exports = m;
                        }
                    });
                })();
            
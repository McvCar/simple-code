define("ace/snippets/makefile",["ace_require","exports","module"], function(ace_require, exports, module) {
"use strict";

exports.snippetText = "snippet ifeq\n\
	ifeq (${1:cond0},${2:cond1})\n\
		${3:code}\n\
	endif\n\
";
exports.scope = "makefile";

});                (function() {
                    window.ace_require(["ace/snippets/makefile"], function(m) {
                        if (typeof module == "object" && typeof exports == "object" && module) {
                            module.exports = m;
                        }
                    });
                })();
            
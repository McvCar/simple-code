define("ace/snippets/rst",["ace_require","exports","module"], function(ace_require, exports, module) {
"use strict";

exports.snippetText = "# rst\n\
\n\
snippet :\n\
	:${1:field name}: ${2:field body}\n\
snippet *\n\
	*${1:Emphasis}*\n\
snippet **\n\
	**${1:Strong emphasis}**\n\
snippet _\n\
	\\`${1:hyperlink-name}\\`_\n\
	.. _\\`$1\\`: ${2:link-block}\n\
snippet =\n\
	${1:Title}\n\
	=====${2:=}\n\
	${3}\n\
snippet -\n\
	${1:Title}\n\
	-----${2:-}\n\
	${3}\n\
snippet cont:\n\
	.. contents::\n\
	\n\
";
exports.scope = "rst";

});                (function() {
                    window.ace_require(["ace/snippets/rst"], function(m) {
                        if (typeof module == "object" && typeof exports == "object" && module) {
                            module.exports = m;
                        }
                    });
                })();
            
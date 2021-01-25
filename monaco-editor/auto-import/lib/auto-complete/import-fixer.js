"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Monaco = require("monaco-editor");
var util_1 = require("./../parser/util");
var ImportFixer = /** @class */ (function () {
    function ImportFixer(editor) {
        this.editor = editor;
        this.useSemiColon = false;
        this.spacesBetweenBraces = true;
        this.doubleQuotes = false;
    }
    ImportFixer.prototype.fix = function (document, imp) {
        var edits = this.getTextEdits(document, imp);
        this.editor.executeEdits('', edits);
    };
    ImportFixer.prototype.getTextEdits = function (document, imp) {
        var edits = new Array();
        // const { path } = imp.file
        // const relativePath = this.normaliseRelativePath(
        //   path,
        //   this.getRelativePath(document, path)
        // )
        var _a = this.parseResolved(document, imp), importResolved = _a.importResolved, fileResolved = _a.fileResolved, imports = _a.imports;
        if (importResolved)
            return edits;
        if (fileResolved) {
            edits.push({
                range: new Monaco.Range(0, 0, document.getLineCount(), 0),
                text: this.mergeImports(document, imp, imports[0].path)
            });
        }
        else {
            edits.push({
                range: new Monaco.Range(0, 0, 0, 0),
                text: this.createImportStatement(imp, true)
            });
        }
        return edits;
    };
    /**
     * Returns whether a given import has already been
     * resolved by the user
     */
    ImportFixer.prototype.parseResolved = function (document, imp) {
        var exp = /(?:import[ \t]+{)(.*)}[ \t]from[ \t]['"](.*)['"]/g;
        var currentDoc = document.getValue();
        var matches = util_1.getMatches(currentDoc, exp);
        var parsed = matches.map(function (_a) {
            var _ = _a[0], names = _a[1], path = _a[2];
            return ({
                names: names.split(',').map(function (imp) { return imp.trim().replace(/\n/g, ''); }),
                path: path
            });
        });
        var imports = parsed.filter(function (_a) {
            var path = _a.path;
            return path === imp.file.path || imp.file.aliases.indexOf(path) > -1;
        });
        var importResolved = imports.findIndex(function (i) { return i.names.indexOf(imp.name) > -1; }) > -1;
        return { imports: imports, importResolved: importResolved, fileResolved: !!imports.length };
    };
    /**
     * Merges an import statement into the document
     */
    ImportFixer.prototype.mergeImports = function (document, imp, path) {
        var exp = this.useSemiColon === true
            ? new RegExp("(?:import {)(?:.*)(?:} from ')(?:" + path + ")(?:';)")
            : new RegExp("(?:import {)(?:.*)(?:} from ')(?:" + path + ")(?:')");
        var currentDoc = document.getValue();
        var foundImport = currentDoc.match(exp);
        if (foundImport) {
            var workingString = foundImport[0];
            var replaceTarget = this.useSemiColon === true
                ? /{|}|from|import|'|"| |;/gi
                : /{|}|from|import|'|"| |/gi;
            workingString = workingString.replace(replaceTarget, '').replace(path, '');
            var imports = workingString.split(',').concat([imp.name]);
            var newImport = this.createImportStatement({
                name: imports.join(', '),
                path: path
            });
            currentDoc = currentDoc.replace(exp, newImport);
        }
        return currentDoc;
    };
    /**
     * Adds a new import statement to the document
     */
    ImportFixer.prototype.createImportStatement = function (imp, endline) {
        if (endline === void 0) { endline = false; }
        var path = 'path' in imp ? imp.path : imp.file.aliases[0] || imp.file.path;
        var formattedPath = path.replace(/\"/g, '').replace(/\'/g, '');
        var returnStr = '';
        var newLine = endline ? '\r\n' : '';
        if (this.doubleQuotes && this.spacesBetweenBraces) {
            returnStr = "import { " + imp.name + " } from \"" + formattedPath + "\";" + newLine;
        }
        else if (this.doubleQuotes) {
            returnStr = "import {" + imp.name + "} from \"" + formattedPath + "\";" + newLine;
        }
        else if (this.spacesBetweenBraces) {
            returnStr = "import { " + imp.name + " } from '" + formattedPath + "';" + newLine;
        }
        else {
            returnStr = "import {" + imp.name + "} from '" + formattedPath + "';" + newLine;
        }
        if (this.useSemiColon === false) {
            returnStr = returnStr.replace(';', '');
        }
        return returnStr;
    };
    ImportFixer.prototype.getRelativePath = function (document, importObj) {
        return importObj;
        // return importObj.discovered
        //   ? importObj.fsPath
        //   : path.relative(path.dirname(document.fileName), importObj.fsPath)
    };
    ImportFixer.prototype.normaliseRelativePath = function (importObj, relativePath) {
        var removeFileExtenion = function (rp) {
            return rp ? rp.substring(0, rp.lastIndexOf('.')) : rp;
        };
        var makeRelativePath = function (rp) {
            var preAppend = './';
            if (!rp.startsWith(preAppend)) {
                rp = preAppend + rp;
            }
            // TODO
            if (true /* /^win/.test(process.platform)*/) {
                rp = rp.replace(/\\/g, '/');
            }
            return rp;
        };
        relativePath = makeRelativePath(relativePath);
        relativePath = removeFileExtenion(relativePath);
        return relativePath;
    };
    return ImportFixer;
}());
exports.ImportFixer = ImportFixer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1wb3J0LWZpeGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2F1dG8tY29tcGxldGUvaW1wb3J0LWZpeGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsc0NBQXVDO0FBRXZDLHlDQUE2QztBQUc3QztJQUtFLHFCQUFvQixNQUEyQztRQUEzQyxXQUFNLEdBQU4sTUFBTSxDQUFxQztRQUM3RCxJQUFJLENBQUMsWUFBWSxHQUFHLEtBQUssQ0FBQTtRQUN6QixJQUFJLENBQUMsbUJBQW1CLEdBQUcsSUFBSSxDQUFBO1FBQy9CLElBQUksQ0FBQyxZQUFZLEdBQUcsS0FBSyxDQUFBO0lBQzNCLENBQUM7SUFFTSx5QkFBRyxHQUFWLFVBQVcsUUFBa0MsRUFBRSxHQUFpQjtRQUM5RCxJQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsQ0FBQTtRQUM5QyxJQUFJLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUE7SUFDckMsQ0FBQztJQUVNLGtDQUFZLEdBQW5CLFVBQW9CLFFBQWtDLEVBQUUsR0FBaUI7UUFDdkUsSUFBTSxLQUFLLEdBQUcsSUFBSSxLQUFLLEVBQWdELENBQUE7UUFFdkUsNEJBQTRCO1FBRTVCLG1EQUFtRDtRQUNuRCxVQUFVO1FBQ1YseUNBQXlDO1FBQ3pDLElBQUk7UUFFRSxJQUFBLHNDQUdMLEVBSE8sa0NBQWMsRUFBRSw4QkFBWSxFQUFFLG9CQUFPLENBRzVDO1FBQ0QsSUFBSSxjQUFjO1lBQUUsT0FBTyxLQUFLLENBQUE7UUFFaEMsSUFBSSxZQUFZLEVBQUU7WUFDaEIsS0FBSyxDQUFDLElBQUksQ0FBQztnQkFDVCxLQUFLLEVBQUUsSUFBSSxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsUUFBUSxDQUFDLFlBQVksRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFDekQsSUFBSSxFQUFFLElB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
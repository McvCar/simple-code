"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var import_fixer_1 = require("./import-fixer");
var kind_resolution_1 = require("./util/kind-resolution");
exports.IMPORT_COMMAND = 'resolveImport';
var ImportCompletion = /** @class */ (function () {
    function ImportCompletion(editor, importDb) {
        var _this = this;
        this.editor = editor;
        this.importDb = importDb;
        // TODO: Add typings / find public API
        var cs = editor._commandService;
        // Register the resolveImport
        cs.addCommand({
            id: exports.IMPORT_COMMAND,
            handler: function (_) {
                var args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    args[_i - 1] = arguments[_i];
                }
                var _a;
                return (_a = _this.handleCommand).call.apply(_a, [_this].concat(args));
            }
        });
    }
    /**
     * Handles a command sent by monaco, when the
     * suggestion has been selected
     */
    ImportCompletion.prototype.handleCommand = function (imp, document) {
        new import_fixer_1.ImportFixer(this.editor).fix(document, imp);
    };
    ImportCompletion.prototype.provideCompletionItems = function (document) {
        var _this = this;
        var imports = this.importDb.all();
        return imports.map(function (i) { return _this.buildCompletionItem(i, document); });
    };
    // public provideCompletionItems__on_keypress(
    //   document: Monaco.editor.ITextModel,
    //   position: Monaco.Position
    // ) {
    //   const wordToComplete = document
    //     .getWordAtPosition(position)
    //     .word.trim()
    //     .toLowerCase()
    //   const importMatcher = (imp: Import) =>
    //     imp.name.toLowerCase() === wordToComplete
    //   const fileMatcher = (f: File) => f.imports.findIndex(importMatcher) > -1
    //   const found = this.importDb.getImports(importMatcher, fileMatcher)
    //   return found.map(i => this.buildCompletionItem(i, document))
    // }
    ImportCompletion.prototype.buildCompletionItem = function (imp, document) {
        var path = this.createDescription(imp);
        return {
            label: imp.name,
            kind: kind_resolution_1.default(imp),
            detail: "Auto import from '" + path + "'\n" + imp.type + " " + imp.name,
            command: {
                title: 'AI: Autocomplete',
                id: exports.IMPORT_COMMAND,
                arguments: [imp, document]
            }
        };
    };
    ImportCompletion.prototype.createDescription = function (_a) {
        var file = _a.file;
        return file.aliases[0] || file.path;
    };
    return ImportCompletion;
}());
exports.default = ImportCompletion;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1wb3J0LWNvbXBsZXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvYXV0by1jb21wbGV0ZS9pbXBvcnQtY29tcGxldGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUdBLCtDQUE0QztBQUM1QywwREFBaUQ7QUFFcEMsUUFBQSxjQUFjLEdBQUcsZUFBZSxDQUFBO0FBRTdDO0lBQ0UsMEJBQ1UsTUFBMkMsRUFDM0MsUUFBa0I7UUFGNUIsaUJBWUM7UUFYUyxXQUFNLEdBQU4sTUFBTSxDQUFxQztRQUMzQyxhQUFRLEdBQVIsUUFBUSxDQUFVO1FBRTFCLHNDQUFzQztRQUN0QyxJQUFNLEVBQUUsR0FBSSxNQUFjLENBQUMsZUFBZSxDQUFBO1FBRTFDLDZCQUE2QjtRQUM3QixFQUFFLENBQUMsVUFBVSxDQUFDO1lBQ1osRUFBRSxFQUFFLHNCQUFjO1lBQ2xCLE9BQU8sRUFBRSxVQUFDLENBQUM7Z0JBQUUsY0FBTztxQkFBUCxVQUFPLEVBQVAscUJBQU8sRUFBUCxJQUFPO29CQUFQLDZCQUFPOzs7Z0JBQUssT0FBQSxDQUFBLEtBQUEsS0FBSSxDQUFDLGFBQWEsQ0FBQSxDQUFDLElBQUksWUFBQyxLQUFJLFNBQUssSUFBSTtZQUFyQyxDQUFzQztTQUNoRSxDQUFDLENBQUE7SUFDSixDQUFDO0lBRUQ7OztPQUdHO0lBQ0ksd0NBQWEsR0FBcEIsVUFBcUIsR0FBaUIsRUFBRSxRQUFrQztRQUN4RSxJQUFJLDBCQUFXLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLENBQUE7SUFDakQsQ0FBQztJQUVNLGlEQUFzQixHQUE3QixVQUE4QixRQUFrQztRQUFoRSxpQkFJQztRQUhDLElBQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxFQUFFLENBQUE7UUFFbkMsT0FBTyxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQUEsQ0FBQyxJQUFJLE9BQUEsS0FBSSxDQUFDLG1CQUFtQixDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsRUFBckMsQ0FBcUMsQ0FBQyxDQUFBO0lBQ2hFLENBQUM7SUFFRCw4Q0FBOEM7SUFDOUMsd0NBQXdDO0lBQ3hDLDhCQUE4QjtJQUM5QixNQUFNO0lBQ04sb0NBQW9DO0lBQ3BDLG1DQUFtQztJQUNuQyxtQkFBbUI7SUFDbkIscUJBQXFCO0lBRXJCLDJDQUEyQztJQUMzQyxnREFBZ0Q7SUFDaEQsNkVBQTZFO0lBRTdFLHVFQUF1RTtJQUV2RSxpRUFBaUU7SUFDakUsSUFBSTtJQUVJLDhDQUFtQixHQUEzQixVQUNFLEdBQWlCLEVBQ2pCLFFBQWtDO1FBRWxDLElBQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsQ0FBQTtRQUV4QyxPQUFPO1lBQ0wsS0FBSyxFQUFFLEdBQUcsQ0FBQyxJQUFJO1lBQ2YsSUFBSSxFQUFFLHlCQUFZLENBQUMsR0FBRyxDQUFDO1lBQ3ZCLE1BQU0sRUFBRSx1QkFBcUIsSUFBSSxXQUFNLEdBQUcsQ0FBQyxJQUFJLFNBQUksR0FBRyxDQUFDLElBQU07WUFDN0QsT0FBTyxFQUFFO2dCQUNQLEtBQUssRUFBRSxrQkFBa0I7Z0JBQ3pCLEVBQUUsRUFBRSxzQkFBYztnQkFDbEIsU0FBUyxFQUFFLENBQUMsR0FBRyxFQUFFLFFBQVEsQ0FBQzthQUMzQjtTQUNGLENBQUE7SUFDSCxDQUFDO0lBRU8sNENBQWlCLEdBQXpCLFVBQTBCLEVBQXNCO1lBQXBCLGNBQUk7UUFDOUIsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUE7SUFDckMsQ0FBQztJQUNILHVCQUFDO0FBQUQsQ0FBQyxBQXBFRCxJQW9FQztBQUVELGtCQUFlLGdCQUFnQixDQUFBIn0=
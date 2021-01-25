"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var import_action_1 = require("./import-action");
var import_completion_1 = require("./import-completion");
var import_db_1 = require("./import-db");
var AutoImport = /** @class */ (function () {
    function AutoImport(options) {
        this.imports = new import_db_1.default();
        exports.monaco = options.monaco;
        this.editor = options.editor;
        this.attachCommands();
    }
    /**
     * Register the commands to monaco & enable auto-importation
     */
    AutoImport.prototype.attachCommands = function () {
        var completor = new import_completion_1.default(this.editor, this.imports);
        exports.monaco.languages.registerCompletionItemProvider('javascript', completor);
        exports.monaco.languages.registerCompletionItemProvider('typescript', completor);
        var actions = new import_action_1.ImportAction(this.editor, this.imports);
        exports.monaco.languages.registerCodeActionProvider('javascript', actions);
        exports.monaco.languages.registerCodeActionProvider('typescript', actions);
    };
    return AutoImport;
}());
exports.default = AutoImport;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvYXV0by1jb21wbGV0ZS9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUVBLGlEQUE4QztBQUM5Qyx5REFBa0Q7QUFDbEQseUNBQWtDO0FBU2xDO0lBSUUsb0JBQVksT0FBZ0I7UUFGckIsWUFBTyxHQUFHLElBQUksbUJBQVEsRUFBRSxDQUFBO1FBRzdCLGNBQU0sR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFBO1FBQ3ZCLElBQUksQ0FBQyxNQUFNLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQTtRQUU1QixJQUFJLENBQUMsY0FBYyxFQUFFLENBQUE7SUFDdkIsQ0FBQztJQUVEOztPQUVHO0lBQ0ksbUNBQWMsR0FBckI7UUFDRSxJQUFNLFNBQVMsR0FBRyxJQUFJLDJCQUFnQixDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFBO1FBQ2pFLGNBQU0sQ0FBQyxTQUFTLENBQUMsOEJBQThCLENBQUMsWUFBWSxFQUFFLFNBQVMsQ0FBQyxDQUFBO1FBQ3hFLGNBQU0sQ0FBQyxTQUFTLENBQUMsOEJBQThCLENBQUMsWUFBWSxFQUFFLFNBQVMsQ0FBQyxDQUFBO1FBRXhFLElBQU0sT0FBTyxHQUFHLElBQUksNEJBQVksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQTtRQUMzRCxjQUFNLENBQUMsU0FBUyxDQUFDLDBCQUEwQixDQUFDLFlBQVksRUFBRSxPQUFPLENBQUMsQ0FBQTtRQUNsRSxjQUFNLENBQUMsU0FBUyxDQUFDLDBCQUEwQixDQUFDLFlBQVksRUFBRSxPQUFPLENBQUMsQ0FBQTtJQUNwRSxDQUFDO0lBQ0gsaUJBQUM7QUFBRCxDQUFDLEFBdkJELElBdUJDO0FBRUQsa0JBQWUsVUFBVSxDQUFBIn0=
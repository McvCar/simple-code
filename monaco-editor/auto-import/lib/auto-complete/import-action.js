"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var import_completion_1 = require("./import-completion");
var ImportAction = /** @class */ (function () {
    function ImportAction(editor, importDb) {
        this.editor = editor;
        this.importDb = importDb;
        editor.updateOptions({
            lightbulb: {
                enabled: true
            }
        });
    }
    ImportAction.prototype.provideCodeActions = function (document, range, context, token) {
        var actionContext = { document: document, range: range, context: context, token: token };
        if (this.canHandleAction(actionContext)) {
            return this.actionHandler(actionContext);
        }
    };
    ImportAction.prototype.canHandleAction = function (context) {
        if (!context.context.markers)
            return false;
        var diagnostic = context.context.markers[0];
        if (!diagnostic)
            return false;
        if (diagnostic.message.startsWith('Typescript Cannot find name') ||
            diagnostic.message.startsWith('Cannot find name')) {
            var imp = diagnostic.message
                .replace('Typescript Cannot find name', '')
                .replace('Cannot find name', '')
                .replace(/{|}|from|import|'|"| |\.|;/gi, '');
            var found = this.importDb.getImports(imp);
            if (found) {
                context.imports = found;
                return true;
            }
        }
        return false;
    };
    ImportAction.prototype.actionHandler = function (context) {
        var path = function (_a) {
            var file = _a.file;
            return file.aliases[0] || file.path;
        };
        var handlers = new Array();
        context.imports.forEach(function (i) {
            handlers.push({
                title: "Import '" + i.name + "' from module \"" + path(i) + "\"",
                command: {
                    title: 'AI: Autocomplete',
                    id: import_completion_1.IMPORT_COMMAND,
                    arguments: [i, context.document]
                }
            });
        });
        return handlers;
    };
    return ImportAction;
}());
exports.ImportAction = ImportAction;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1wb3J0LWFjdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9hdXRvLWNvbXBsZXRlL2ltcG9ydC1hY3Rpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFFQSx5REFBb0Q7QUFXcEQ7SUFDRSxzQkFDVSxNQUEyQyxFQUMzQyxRQUFrQjtRQURsQixXQUFNLEdBQU4sTUFBTSxDQUFxQztRQUMzQyxhQUFRLEdBQVIsUUFBUSxDQUFVO1FBRTFCLE1BQU0sQ0FBQyxhQUFhLENBQUM7WUFDbkIsU0FBUyxFQUFFO2dCQUNULE9BQU8sRUFBRSxJQUFJO2FBQ2Q7U0FDRixDQUFDLENBQUE7SUFDSixDQUFDO0lBRU0seUNBQWtCLEdBQXpCLFVBQ0UsUUFBa0MsRUFDbEMsS0FBbUIsRUFDbkIsT0FBMkMsRUFDM0MsS0FBK0I7UUFFL0IsSUFBSSxhQUFhLEdBQUcsRUFBRSxRQUFRLFVBQUEsRUFBRSxLQUFLLE9BQUEsRUFBRSxPQUFPLFNBQUEsRUFBRSxLQUFLLE9BQUEsRUFBRSxDQUFBO1FBQ3ZELElBQUksSUFBSSxDQUFDLGVBQWUsQ0FBQyxhQUFhLENBQUMsRUFBRTtZQUN2QyxPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsYUFBYSxDQUFDLENBQUE7U0FDekM7SUFDSCxDQUFDO0lBRU8sc0NBQWUsR0FBdkIsVUFBd0IsT0FBZ0I7UUFDdEMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTztZQUFFLE9BQU8sS0FBSyxDQUFBO1FBRXJDLElBQUEsdUNBQVUsQ0FBMkI7UUFDMUMsSUFBSSxDQUFDLFVBQVU7WUFBRSxPQUFPLEtBQUssQ0FBQTtRQUU3QixJQUNFLFVBQVUsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLDZCQUE2QixDQUFDO1lBQzVELFVBQVUsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLGtCQUFrQixDQUFDLEVBQ2pEO1lBQ0EsSUFBTSxHQUFHLEdBQUcsVUFBVSxDQUFDLE9BQU87aUJBQzNCLE9BQU8sQ0FBQyw2QkFBNkIsRUFBRSxFQUFFLENBQUM7aUJBQzFDLE9BQU8sQ0FBQyxrQkFBa0IsRUFBRSxFQUFFLENBQUM7aUJBQy9CLE9BQU8sQ0FBQyw4QkFBOEIsRUFBRSxFQUFFLENBQUMsQ0FBQTtZQUU5QyxJQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQTtZQUMzQyxJQUFJLEtBQUssRUFBRTtnQkFDVCxPQUFPLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQTtnQkFDdkIsT0FBTyxJQUFJLENBQUE7YUFDWjtTQUNGO1FBQ0QsT0FBTyxLQUFLLENBQUE7SUFDZCxDQUFDO0lBRU8sb0NBQWEsR0FBckIsVUFBc0IsT0FBZ0I7UUFDcEMsSUFBSSxJQUFJLEdBQUcsVUFBQyxFQUFzQjtnQkFBcEIsY0FBSTtZQUNoQixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQTtRQUNyQyxDQUFDLENBQUE7UUFDRCxJQUFJLFFBQVEsR0FBRyxJQUFJLEtBQUssRUFBK0IsQ0FBQTtRQUN2RCxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxVQUFBLENBQUM7WUFDdkIsUUFBUSxDQUFDLElBQUksQ0FBQztnQkFDWixLQUFLLEVBQUUsYUFBVyxDQUFDLENBQUMsSUFBSSx3QkFBa0IsSUFBSSxDQUFDLENBQUMsQ0FBQyxPQUFHO2dCQUNwRCxPQUFPLEVBQUU7b0JBQ1AsS0FBSyxFQUFFLGtCQUFrQjtvQkFDekIsRUFBRSxFQUFFLGtDQUFjO29CQUNsQixTQUFTLEVBQUUsQ0FBQyxDQUFDLEVBQUUsT0FBTyxDQUFDLFFBQVEsQ0FBQztpQkFDakM7YUFDRixDQUFDLENBQUE7UUFDSixDQUFDLENBQUMsQ0FBQTtRQUNGLE9BQU8sUUFBUSxDQUFBO0lBQ2pCLENBQUM7SUFDSCxtQkFBQztBQUFELENBQUMsQUFqRUQsSUFpRUM7QUFqRVksb0NBQVkifQ==
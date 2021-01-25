"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var isAnImport = function (name, file) {
    var matcher = typeof name === 'function' ? name : function (i) { return i.name.indexOf(name) > -1; };
    return file.imports.findIndex(matcher) > -1;
};
var ImportDb = /** @class */ (function () {
    function ImportDb() {
        this.files = new Array();
    }
    Object.defineProperty(ImportDb.prototype, "size", {
        /**
         * Returns the total amount of files in the store
         */
        get: function () {
            return this.files.length;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Returns all the imports from the store
     */
    ImportDb.prototype.all = function () {
        var imports = new Array();
        this.files.forEach(function (file) {
            file.imports.forEach(function (imp) {
                return imports.push(__assign({}, imp, { file: file }));
            });
        });
        return imports;
    };
    /**
     * Fetches an import from the store
     * @argument name The import name to get
     * @argument fileMatcher (optional) custom function to filter the files
     */
    ImportDb.prototype.getImports = function (name, fileMatcher) {
        if (fileMatcher === void 0) { fileMatcher = function (f) { return isAnImport(name, f); }; }
        var files = this.files.filter(fileMatcher);
        var importMatcher = typeof name === 'function' ? name : function (i) { return i.name === name; };
        var imports = files.map(function (file) { return (__assign({}, file.imports.find(importMatcher), { file: file })); });
        return imports;
    };
    /**
     * Save a file to the store
     * @param file The file to save
     */
    ImportDb.prototype.saveFile = function (file) {
        var data = __assign({ imports: [], aliases: [] }, file);
        var index = this.files.findIndex(function (f) { return f.path === data.path; });
        if (index === -1) {
            this.files.push(data);
        }
        else {
            this.files[index] = data;
        }
    };
    /**
     * Bulk save files to the store
     * @param files The files to save
     */
    ImportDb.prototype.saveFiles = function (files) {
        var _this = this;
        files.forEach(function (file) { return _this.saveFile(file); });
    };
    /**
     * Fetches a file by it's path or alias
     * @param path The path to find
     */
    ImportDb.prototype.getFile = function (path) {
        var file = this.files.find(function (f) { return f.path === path || f.aliases.indexOf(path) > -1; });
        return file;
    };
    /**
     * Adds an import to a file
     * @param path The path / alias of the file to update
     * @param name The import name to add
     * @param type The import type
     */
    ImportDb.prototype.addImport = function (path, name, type) {
        if (type === void 0) { type = 'var'; }
        var file = this.getFile(path);
        if (file) {
            var exists = isAnImport(name, file);
            if (!exists)
                file.imports.push({
                    name: name,
                    type: type
                });
        }
        return !!file;
    };
    /**
     * Removes an import from a file
     * @param path The path / alias of the file to update
     * @param name The import name to remove
     */
    ImportDb.prototype.removeImport = function (path, name) {
        var file = this.getFile(path);
        if (file) {
            var index = file.imports.findIndex(function (i) { return i.name === name; });
            if (index !== -1)
                file.imports.splice(index, 1);
        }
        return !!file;
    };
    return ImportDb;
}());
exports.default = ImportDb;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1wb3J0LWRiLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2F1dG8tY29tcGxldGUvaW1wb3J0LWRiLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFzQkEsSUFBTSxVQUFVLEdBQUcsVUFBQyxJQUE0QixFQUFFLElBQVU7SUFDMUQsSUFBTSxPQUFPLEdBQ1gsT0FBTyxJQUFJLEtBQUssVUFBVSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFVBQUEsQ0FBQyxJQUFJLE9BQUEsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQXpCLENBQXlCLENBQUE7SUFFcEUsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQTtBQUM3QyxDQUFDLENBQUE7QUFFRDtJQUFBO1FBQ1MsVUFBSyxHQUFHLElBQUksS0FBSyxFQUFRLENBQUE7SUE2SGxDLENBQUM7SUF4SEMsc0JBQVcsMEJBQUk7UUFIZjs7V0FFRzthQUNIO1lBQ0UsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQTtRQUMxQixDQUFDOzs7T0FBQTtJQUVEOztPQUVHO0lBQ0ksc0JBQUcsR0FBVjtRQUNFLElBQU0sT0FBTyxHQUFHLElBQUksS0FBSyxFQUFnQixDQUFBO1FBRXpDLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLFVBQUEsSUFBSTtZQUNyQixJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxVQUFBLEdBQUc7Z0JBQ3RCLE9BQUEsT0FBTyxDQUFDLElBQUksY0FDUCxHQUFHLElBQ04sSUFBSSxNQUFBLElBQ0o7WUFIRixDQUdFLENBQ0gsQ0FBQTtRQUNILENBQUMsQ0FBQyxDQUFBO1FBRUYsT0FBTyxPQUFPLENBQUE7SUFDaEIsQ0FBQztJQUVEOzs7O09BSUc7SUFDSSw2QkFBVSxHQUFqQixV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
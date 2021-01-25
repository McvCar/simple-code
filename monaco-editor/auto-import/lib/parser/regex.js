"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var util_1 = require("./util");
var findConstants = /export[ \t\n]+(?:declare[ \t\n]+)?(const +enum|default|class|interface|let|var|const|enum|type|function)[ \t\n]+([^=\n\t (:;<]+)/g;
var findDynamics = /export +{([^}]+)}/g;
var regexTokeniser = function (file) {
    var imports = new Array();
    // Extract constants
    {
        var matches = util_1.getMatches(file, findConstants);
        var imps = matches.map(function (_a) {
            var _ = _a[0], type = _a[1], name = _a[2];
            return ({ type: type, name: name });
        });
        imports.push.apply(imports, imps);
    }
    // Extract dynamic imports
    {
        var matches = util_1.getMatches(file, findDynamics);
        var flattened = [].concat.apply([], matches.map(function (_a) {
            var _ = _a[0], imps = _a[1];
            return imps.split(',');
        }));
        // Resolve 'import as export'
        var resolvedAliases = flattened.map(function (raw) {
            var _a = raw.split(' as '), imp = _a[0], alias = _a[1];
            return alias || imp;
        });
        // Remove all whitespaces + newlines
        var trimmed = resolvedAliases.map(function (imp) { return imp.trim().replace(/\n/g, ''); });
        var imps = trimmed.map(function (name) { return ({
            name: name,
            type: 'any'
        }); });
        imports.push.apply(imports, imps);
    }
    return imports;
};
exports.default = regexTokeniser;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVnZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvcGFyc2VyL3JlZ2V4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQ0EsK0JBQW1DO0FBRW5DLElBQU0sYUFBYSxHQUFHLG1JQUFtSSxDQUFBO0FBQ3pKLElBQU0sWUFBWSxHQUFHLG9CQUFvQixDQUFBO0FBRXpDLElBQU0sY0FBYyxHQUFHLFVBQUMsSUFBWTtJQUNsQyxJQUFNLE9BQU8sR0FBRyxJQUFJLEtBQUssRUFBVSxDQUFBO0lBRW5DLG9CQUFvQjtJQUNwQjtRQUNFLElBQU0sT0FBTyxHQUFHLGlCQUFVLENBQUMsSUFBSSxFQUFFLGFBQWEsQ0FBQyxDQUFBO1FBQy9DLElBQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBQyxFQUFlO2dCQUFkLFNBQUMsRUFBRSxZQUFJLEVBQUUsWUFBSTtZQUFNLE9BQUEsQ0FBQyxFQUFFLElBQUksTUFBQSxFQUFFLElBQUksTUFBQSxFQUFFLENBQUM7UUFBaEIsQ0FBZ0IsQ0FBQyxDQUFBO1FBQy9ELE9BQU8sQ0FBQyxJQUFJLE9BQVosT0FBTyxFQUFTLElBQUksRUFBQztLQUN0QjtJQUVELDBCQUEwQjtJQUMxQjtRQUNFLElBQU0sT0FBTyxHQUFHLGlCQUFVLENBQUMsSUFBSSxFQUFFLFlBQVksQ0FBQyxDQUFBO1FBQzlDLElBQU0sU0FBUyxHQUFhLEVBQUUsQ0FBQyxNQUFNLE9BQVQsRUFBRSxFQUN6QixPQUFPLENBQUMsR0FBRyxDQUFDLFVBQUMsRUFBUztnQkFBUixTQUFDLEVBQUUsWUFBSTtZQUFNLE9BQUEsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUM7UUFBZixDQUFlLENBQUMsQ0FDL0MsQ0FBQTtRQUVELDZCQUE2QjtRQUM3QixJQUFNLGVBQWUsR0FBRyxTQUFTLENBQUMsR0FBRyxDQUFDLFVBQUEsR0FBRztZQUNqQyxJQUFBLHNCQUFnQyxFQUEvQixXQUFHLEVBQUUsYUFBSyxDQUFxQjtZQUN0QyxPQUFPLEtBQUssSUFBSSxHQUFHLENBQUE7UUFDckIsQ0FBQyxDQUFDLENBQUE7UUFFRixvQ0FBb0M7UUFDcEMsSUFBTSxPQUFPLEdBQUcsZUFBZSxDQUFDLEdBQUcsQ0FBQyxVQUFBLEdBQUcsSUFBSSxPQUFBLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxFQUE3QixDQUE2QixDQUFDLENBQUE7UUFFekUsSUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FDdEIsVUFBQyxJQUFJLElBQWEsT0FBQSxDQUFDO1lBQ2pCLElBQUksTUFBQTtZQUNKLElBQUksRUFBRSxLQUFLO1NBQ1osQ0FBQyxFQUhnQixDQUdoQixDQUNILENBQUE7UUFFRCxPQUFPLENBQUMsSUFBSSxPQUFaLE9BQU8sRUFBUyxJQUFJLEVBQUM7S0FDdEI7SUFFRCxPQUFPLE9BQU8sQ0FBQTtBQUNoQixDQUFDLENBQUE7QUFFRCxrQkFBZSxjQUFjLENBQUEifQ==
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMatches = function (string, regex) {
    var matches = [];
    var match;
    while ((match = regex.exec(string))) {
        matches.push(match);
    }
    return matches;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9wYXJzZXIvdXRpbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFhLFFBQUEsVUFBVSxHQUFHLFVBQUMsTUFBYyxFQUFFLEtBQWE7SUFDdEQsSUFBTSxPQUFPLEdBQUcsRUFBRSxDQUFBO0lBQ2xCLElBQUksS0FBSyxDQUFBO0lBQ1QsT0FBTyxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUU7UUFDbkMsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQTtLQUNwQjtJQUNELE9BQU8sT0FBTyxDQUFBO0FBQ2hCLENBQUMsQ0FBQSJ9
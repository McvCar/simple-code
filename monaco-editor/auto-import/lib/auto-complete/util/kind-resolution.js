"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var __1 = require("..");
var kindResolver = function (imp) {
    switch (imp.type) {
        case 'function':
            return __1.monaco.languages.CompletionItemKind.Function;
        case 'interface':
            return __1.monaco.languages.CompletionItemKind.Interface;
        case 'var':
        case 'const':
        case 'let':
        case 'default':
            return __1.monaco.languages.CompletionItemKind.Variable;
        case 'enum':
        case 'const enum':
            return __1.monaco.languages.CompletionItemKind.Enum;
        case 'class':
            return __1.monaco.languages.CompletionItemKind.Class;
        case 'type':
            return __1.monaco.languages.CompletionItemKind.Method;
        default:
            return __1.monaco.languages.CompletionItemKind.Reference;
    }
};
exports.default = kindResolver;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2luZC1yZXNvbHV0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2F1dG8tY29tcGxldGUvdXRpbC9raW5kLXJlc29sdXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSx3QkFBMkI7QUFHM0IsSUFBTSxZQUFZLEdBQUcsVUFBQyxHQUFpQjtJQUNyQyxRQUFRLEdBQUcsQ0FBQyxJQUFJLEVBQUU7UUFDaEIsS0FBSyxVQUFVO1lBQ2IsT0FBTyxVQUFNLENBQUMsU0FBUyxDQUFDLGtCQUFrQixDQUFDLFFBQVEsQ0FBQTtRQUVyRCxLQUFLLFdBQVc7WUFDZCxPQUFPLFVBQU0sQ0FBQyxTQUFTLENBQUMsa0JBQWtCLENBQUMsU0FBUyxDQUFBO1FBRXRELEtBQUssS0FBSyxDQUFDO1FBQ1gsS0FBSyxPQUFPLENBQUM7UUFDYixLQUFLLEtBQUssQ0FBQztRQUNYLEtBQUssU0FBUztZQUNaLE9BQU8sVUFBTSxDQUFDLFNBQVMsQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLENBQUE7UUFFckQsS0FBSyxNQUFNLENBQUM7UUFDWixLQUFLLFlBQVk7WUFDZixPQUFPLFVBQU0sQ0FBQyxTQUFTLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFBO1FBRWpELEtBQUssT0FBTztZQUNWLE9BQU8sVUFBTSxDQUFDLFNBQVMsQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUE7UUFFbEQsS0FBSyxNQUFNO1lBQ1QsT0FBTyxVQUFNLENBQUMsU0FBUyxDQUFDLGtCQUFrQixDQUFDLE1BQU0sQ0FBQTtRQUVuRDtZQUNFLE9BQU8sVUFBTSxDQUFDLFNBQVMsQ0FBQyxrQkFBa0IsQ0FBQyxTQUFTLENBQUE7S0FDdkQ7QUFDSCxDQUFDLENBQUE7QUFFRCxrQkFBZSxZQUFZLENBQUEifQ==
import { ImportObject } from '../import-db';
declare const kindResolver: (imp: ImportObject) => languages.CompletionItemKind.Method | languages.CompletionItemKind.Function | languages.CompletionItemKind.Variable | languages.CompletionItemKind.Class | languages.CompletionItemKind.Interface | languages.CompletionItemKind.Enum | languages.CompletionItemKind.Reference;
export default kindResolver;

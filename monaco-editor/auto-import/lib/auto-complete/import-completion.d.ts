import * as Monaco from 'monaco-editor';
import ImportDb, { ImportObject } from './import-db';
export declare const IMPORT_COMMAND = "resolveImport";
declare class ImportCompletion implements Monaco.languages.CompletionItemProvider {
    private editor;
    private importDb;
    constructor(editor: Monaco.editor.IStandaloneCodeEditor, importDb: ImportDb);
    /**
     * Handles a command sent by monaco, when the
     * suggestion has been selected
     */
    handleCommand(imp: ImportObject, document: Monaco.editor.ITextModel): void;
    provideCompletionItems(document: Monaco.editor.ITextModel): Monaco.languages.CompletionItem[];
    private buildCompletionItem;
    private createDescription;
}
export default ImportCompletion;

import * as Monaco from 'monaco-editor';
import ImportDb, { ImportObject } from './import-db';
export interface Context {
    document: Monaco.editor.ITextModel;
    range: Monaco.Range;
    context: Monaco.languages.CodeActionContext;
    token: Monaco.CancellationToken;
    imports?: ImportObject[];
}
export declare class ImportAction implements Monaco.languages.CodeActionProvider {
    private editor;
    private importDb;
    constructor(editor: Monaco.editor.IStandaloneCodeEditor, importDb: ImportDb);
    provideCodeActions(document: Monaco.editor.ITextModel, range: Monaco.Range, context: Monaco.languages.CodeActionContext, token: Monaco.CancellationToken): Monaco.languages.CodeAction[];
    private canHandleAction;
    private actionHandler;
}

import * as Monaco from 'monaco-editor';
import { ImportObject } from './import-db';
export declare class ImportFixer {
    private editor;
    private spacesBetweenBraces;
    private doubleQuotes;
    private useSemiColon;
    constructor(editor: Monaco.editor.IStandaloneCodeEditor);
    fix(document: Monaco.editor.ITextModel, imp: ImportObject): void;
    getTextEdits(document: Monaco.editor.ITextModel, imp: ImportObject): Monaco.editor.IIdentifiedSingleEditOperation[];
    /**
     * Returns whether a given import has already been
     * resolved by the user
     */
    private parseResolved;
    /**
     * Merges an import statement into the document
     */
    private mergeImports;
    /**
     * Adds a new import statement to the document
     */
    private createImportStatement;
    private getRelativePath;
    private normaliseRelativePath;
}

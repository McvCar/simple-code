import * as Monaco from 'monaco-editor';
import ImportDb from './import-db';
export declare let monaco: typeof Monaco;
export interface Options {
    monaco: typeof Monaco;
    editor: Monaco.editor.IStandaloneCodeEditor;
}
declare class AutoImport {
    private readonly editor;
    imports: ImportDb;
    constructor(options: Options);
    /**
     * Register the commands to monaco & enable auto-importation
     */
    attachCommands(): void;
}
export default AutoImport;

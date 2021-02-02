import { Expression } from '../parser';
declare type Name = string;
declare type Path = string;
export interface Import {
    name: Name;
    type: Expression;
}
export interface ImportObject extends Import {
    file: File;
}
export interface File {
    path: Path;
    aliases?: Path[];
    imports?: Import[];
}
declare type ImportMatcher = (imp: Import) => boolean;
declare class ImportDb {
    files: File[];
    /**
     * Returns the total amount of files in the store
     */
    readonly size: number;
    /**
     * Returns all the imports from the store
     */
    all(): ImportObject[];
    /**
     * Fetches an import from the store
     * @argument name The import name to get
     * @argument fileMatcher (optional) custom function to filter the files
     */
    getImports(name: Name | ImportMatcher, fileMatcher?: (file: File) => boolean): ImportObject[];
    /**
     * Save a file to the store
     * @param file The file to save
     */
    saveFile(file: File): void;
    /**
     * Bulk save files to the store
     * @param files The files to save
     */
    saveFiles(files: File[]): void;
    /**
     * Fetches a file by it's path or alias
     * @param path The path to find
     */
    getFile(path: Path): File;
    /**
     * Adds an import to a file
     * @param path The path / alias of the file to update
     * @param name The import name to add
     * @param type The import type
     */
    addImport(path: Path, name: Name, type?: Expression): boolean;
    /**
     * Removes an import from a file
     * @param path The path / alias of the file to update
     * @param name The import name to remove
     */
    removeImport(path: Path, name: Name): boolean;
}
export default ImportDb;

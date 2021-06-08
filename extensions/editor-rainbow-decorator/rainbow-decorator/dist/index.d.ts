import * as monaco from "monaco-editor";
interface IRainbowDecoratorOptions {
    debounce?: number;
    colours?: string[];
    classNames?: string[];
    errorColour?: string;
    errorClassName?: string;
    tabSize?: number;
    skipErrors?: boolean;
}
declare class RainbowDecorator {
    private static defaultErrorColour;
    private static defaultColours;
    private static defaultDebounceDelay;
    private oldDecorators;
    private oldInvalidDecorators;
    private editor?;
    private styleSheet;
    private debounceTimer;
    private debounce;
    private errorClassName;
    private classNames;
    private tabSize;
    private skipErrors?;
    constructor(editor: monaco.editor.ICodeEditor, options?: IRainbowDecoratorOptions);
    private get depth();
    private destroy;
    private applyWithDebounce;
    private apply;
}
export default function rainbowDecorate(editor: monaco.editor.ICodeEditor, options?: IRainbowDecoratorOptions): RainbowDecorator;
export { rainbowDecorate };

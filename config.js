
const path 	= require("path");
const fs 	= require("fs");
const tools = require("./tools/tools");
const cacheDir = path.join(path.resolve(__dirname,"../"),"simple-code-cache","cache");

// 基础配置
module.exports = {
	
	cacheDir : cacheDir,
	
	// 项目目录
	prsPath : Editor.Project && Editor.Project.path ? Editor.Project.path : Editor.remote.projectPath,
	
	// 外部编辑器路径配置，win路径分隔符注意使用 ‘\\’
	editorPath: {
		win: "C:\\Program Files\\Sublime Text 3\\sublime_text.exe",
		mac: "/Applications/Sublime Text.app/Contents/MacOS/Sublime Text",
	},

	// vs编辑器选项
	vsEditorConfig: {

		value: '',
		language: 'javascript',
		mouseWheelZoom: true,			 // 鼠标可以缩放字体大小
		quickSuggestions: true,			 // 使字符串有代码提示
		definitionLinkOpensInPeek: false, // ctrl+点击 跳转是否使用小窗口预览
		cursorSurroundingLines: 5,		 // 撤销后自动滚动页面到光标相对5行的位置
		smoothScrolling: true,
		formatOnPaste: true,
		detectIndentation: true,        // 自动检测缩进格式
		colorDecorators:true, 			// 代码块 #00000 cc.Color 颜色显示
		minimap:{						// 代码预览层
			// size: 'fit',// | 'fill' | 'fit',
			showSlider:'always',
			// maxColumn:35,
			// scale:3,
			// side: 'left',
		},
		// glyphMargin: true,				// 断点显示区域
		// cursorSmoothCaretAnimation:true,
		/**
		//* This editor is used inside a diff editor.
		//*/
		// inDiffEditor?: boolean;
		// /**
		//  * The aria label for the editor's textarea (when it is focused).
		//  */
		// ariaLabel?: string;
		// /**
		//  * The `tabindex` property of the editor's textarea
		//  */
		// tabIndex?: number;
		// /**
		//  * Render vertical lines at the specified columns.
		//  * Defaults to empty array.
		//  */
		// rulers?: (number | IRulerOption)[];
		// /**
		//  * A string containing the word separators used when doing word navigation.
		//  * Defaults to `~!@#$%^&*()-=+[{]}\\|;:\'",.<>/?
		//  */
		// wordSeparators?: string;
		// /**
		//  * Enable Linux primary clipboard.
		//  * Defaults to true.
		//  */
		// selectionClipboard?: boolean;
		// /**
		//  * Control the rendering of line numbers.
		//  * If it is a function, it will be invoked when rendering a line number and the return value will be rendered.
		//  * Otherwise, if it is a truey, line numbers will be rendered normally (equivalent of using an identity function).
		//  * Otherwise, line numbers will not be rendered.
		//  * Defaults to `on`.
		//  */
		// lineNumbers?: LineNumbersType;
		// /**
		//  * Controls the minimal number of visible leading and trailing lines surrounding the cursor.
		//  * Defaults to 0.
		// */
		// cursorSurroundingLines?: number;
		// /**
		//  * Controls when `cursorSurroundingLines` should be enforced
		//  * Defaults to `default`, `cursorSurroundingLines` is not enforced when cursor position is changed
		//  * by mouse.
		// */
		// cursorSurroundingLinesStyle?: 'default' | 'all';
		// /**
		//  * Render last line number when the file ends with a newline.
		//  * Defaults to true.
		// */
		// renderFinalNewline?: boolean;
		// /**
		//  * Remove unusual line terminators like LINE SEPARATOR (LS), PARAGRAPH SEPARATOR (PS).
		//  * Defaults to 'prompt'.
		//  */
		// unusualLineTerminators?: 'off' | 'prompt' | 'auto';
		// /**
		//  * Should the corresponding line be selected when clicking on the line number?
		//  * Defaults to true.
		//  */
		// selectOnLineNumbers?: boolean;
		// /**
		//  * Control the width of line numbers, by reserving horizontal space for rendering at least an amount of digits.
		//  * Defaults to 5.
		//  */
		// lineNumbersMinChars?: number;
		// /**
		//  * Enable the rendering of the glyph margin.
		//  * Defaults to true in vscode and to false in monaco-editor.
		//  */
		// glyphMargin?: boolean;
		// /**
		//  * The width reserved for line decorations (in px).
		//  * Line decorations are placed between line numbers and the editor content.
		//  * You can pass in a string in the format floating point followed by "ch". e.g. 1.3ch.
		//  * Defaults to 10.
		//  */
		// lineDecorationsWidth?: number | string;
		// /**
		//  * When revealing the cursor, a virtual padding (px) is added to the cursor, turning it into a rectangle.
		//  * This virtual padding ensures that the cursor gets revealed before hitting the edge of the viewport.
		//  * Defaults to 30 (px).
		//  */
		// revealHorizontalRightPadding?: number;
		// /**
		//  * Render the editor selection with rounded borders.
		//  * Defaults to true.
		//  */
		// roundedSelection?: boolean;
		// /**
		//  * Class name to be added to the editor.
		//  */
		// extraEditorClassName?: string;
		// /**
		//  * Should the editor be read only.
		//  * Defaults to false.
		//  */
		// readOnly?: boolean;
		// /**
		//  * Rename matching regions on type.
		//  * Defaults to false.
		//  */
		// renameOnType?: boolean;
		// /**
		//  * Should the editor render validation decorations.
		//  * Defaults to editable.
		//  */
		// renderValidationDecorations?: 'editable' | 'on' | 'off';
		// /**
		//  * Control the behavior and rendering of the scrollbars.
		//  */
		// scrollbar?: IEditorScrollbarOptions;
		// /**
		//  * Control the behavior and rendering of the minimap.
		//  */
		// minimap?: IEditorMinimapOptions;
		// /**
		//  * Control the behavior of the find widget.
		//  */
		// find?: IEditorFindOptions;
		// /**
		//  * Display overflow widgets as `fixed`.
		//  * Defaults to `false`.
		//  */
		// fixedOverflowWidgets?: boolean;
		// /**
		//  * The number of vertical lanes the overview ruler should render.
		//  * Defaults to 3.
		//  */
		// overviewRulerLanes?: number;
		// /**
		//  * Controls if a border should be drawn around the overview ruler.
		//  * Defaults to `true`.
		//  */
		// overviewRulerBorder?: boolean;
		// /**
		//  * Control the cursor animation style, possible values are 'blink', 'smooth', 'phase', 'expand' and 'solid'.
		//  * Defaults to 'blink'.
		//  */
		// cursorBlinking?: 'blink' | 'smooth' | 'phase' | 'expand' | 'solid';
		// /**
		//  * Zoom the font in the editor when using the mouse wheel in combination with holding Ctrl.
		//  * Defaults to false.
		//  */
		// mouseWheelZoom?: boolean;
		// /**
		//  * Control the mouse pointer style, either 'text' or 'default' or 'copy'
		//  * Defaults to 'text'
		//  */
		// mouseStyle?: 'text' | 'default' | 'copy';
		// /**
		//  * Enable smooth caret animation.
		//  * Defaults to false.
		//  */
		// cursorSmoothCaretAnimation?: boolean;
		// /**
		//  * Control the cursor style, either 'block' or 'line'.
		//  * Defaults to 'line'.
		//  */
		// cursorStyle?: 'line' | 'block' | 'underline' | 'line-thin' | 'block-outline' | 'underline-thin';
		// /**
		//  * Control the width of the cursor when cursorStyle is set to 'line'
		//  */
		// cursorWidth?: number;
		// /**
		//  * Enable font ligatures.
		//  * Defaults to false.
		//  */
		// fontLigatures?: boolean | string;
		// /**
		//  * Disable the use of `transform: translate3d(0px, 0px, 0px)` for the editor margin and lines layers.
		//  * The usage of `transform: translate3d(0px, 0px, 0px)` acts as a hint for browsers to create an extra layer.
		//  * Defaults to false.
		//  */
		// disableLayerHinting?: boolean;
		// /**
		//  * Disable the optimizations for monospace fonts.
		//  * Defaults to false.
		//  */
		// disableMonospaceOptimizations?: boolean;
		// /**
		//  * Should the cursor be hidden in the overview ruler.
		//  * Defaults to false.
		//  */
		// hideCursorInOverviewRuler?: boolean;
		// /**
		//  * Enable that scrolling can go one screen size after the last line.
		//  * Defaults to true.
		//  */
		// scrollBeyondLastLine?: boolean;
		// /**
		//  * Enable that scrolling can go beyond the last column by a number of columns.
		//  * Defaults to 5.
		//  */
		// scrollBeyondLastColumn?: number;
		// /**
		//  * Enable that the editor animates scrolling to a position.
		//  * Defaults to false.
		//  */
		// smoothScrolling?: boolean;
		// /**
		//  * Enable that the editor will install an interval to check if its container dom node size has changed.
		//  * Enabling this might have a severe performance impact.
		//  * Defaults to false.
		//  */
		// automaticLayout?: boolean;
		// /**
		//  * Control the wrapping of the editor.
		//  * When `wordWrap` = "off", the lines will never wrap.
		//  * When `wordWrap` = "on", the lines will wrap at the viewport width.
		//  * When `wordWrap` = "wordWrapColumn", the lines will wrap at `wordWrapColumn`.
		//  * When `wordWrap` = "bounded", the lines will wrap at min(viewport width, wordWrapColumn).
		//  * Defaults to "off".
		//  */
		// wordWrap?: 'off' | 'on' | 'wordWrapColumn' | 'bounded';
		// /**
		//  * Control the wrapping of the editor.
		//  * When `wordWrap` = "off", the lines will never wrap.
		//  * When `wordWrap` = "on", the lines will wrap at the viewport width.
		//  * When `wordWrap` = "wordWrapColumn", the lines will wrap at `wordWrapColumn`.
		//  * When `wordWrap` = "bounded", the lines will wrap at min(viewport width, wordWrapColumn).
		//  * Defaults to 80.
		//  */
		// wordWrapColumn?: number;
		// /**
		//  * Force word wrapping when the text appears to be of a minified/generated file.
		//  * Defaults to true.
		//  */
		// wordWrapMinified?: boolean;
		// /**
		//  * Control indentation of wrapped lines. Can be: 'none', 'same', 'indent' or 'deepIndent'.
		//  * Defaults to 'same' in vscode and to 'none' in monaco-editor.
		//  */
		// wrappingIndent?: 'none' | 'same' | 'indent' | 'deepIndent';
		// /**
		//  * Controls the wrapping strategy to use.
		//  * Defaults to 'simple'.
		//  */
		// wrappingStrategy?: 'simple' | 'advanced';
		// /**
		//  * Configure word wrapping characters. A break will be introduced before these characters.
		//  * Defaults to '([{‘“〈《「『【〔（［｛｢£¥＄￡￥+＋'.
		//  */
		// wordWrapBreakBeforeCharacters?: string;
		// /**
		//  * Configure word wrapping characters. A break will be introduced after these characters.
		//  * Defaults to ' \t})]?|/&.,;¢°′″‰℃、。｡､￠，．：；？！％・･ゝゞヽヾーァィゥェォッャュョヮヵヶぁぃぅぇぉっゃゅょゎゕゖㇰㇱㇲㇳㇴㇵㇶㇷㇸㇹㇺㇻㇼㇽㇾㇿ々〻ｧｨｩｪｫｬｭｮｯｰ”〉》」』】〕）］｝｣'.
		//  */
		// wordWrapBreakAfterCharacters?: string;
		// /**
		//  * Performance guard: Stop rendering a line after x characters.
		//  * Defaults to 10000.
		//  * Use -1 to never stop rendering
		//  */
		// stopRenderingLineAfter?: number;
		// /**
		//  * Configure the editor's hover.
		//  */
		// hover?: IEditorHoverOptions;
		// /**
		//  * Enable detecting links and making them clickable.
		//  * Defaults to true.
		//  */
		// links?: boolean;
		// /**
		//  * Enable inline color decorators and color picker rendering.
		//  */
		// colorDecorators?: boolean;
		// /**
		//  * Control the behaviour of comments in the editor.
		//  */
		// comments?: IEditorCommentsOptions;
		// /**
		//  * Enable custom contextmenu.
		//  * Defaults to true.
		//  */
		// contextmenu?: boolean;
		// /**
		//  * A multiplier to be used on the `deltaX` and `deltaY` of mouse wheel scroll events.
		//  * Defaults to 1.
		//  */
		// mouseWheelScrollSensitivity?: number;
		// /**
		//  * FastScrolling mulitplier speed when pressing `Alt`
		//  * Defaults to 5.
		//  */
		// fastScrollSensitivity?: number;
		// /**
		//  * Enable that the editor scrolls only the predominant axis. Prevents horizontal drift when scrolling vertically on a trackpad.
		//  * Defaults to true.
		//  */
		// scrollPredominantAxis?: boolean;
		// /**
		//  * Enable that the selection with the mouse and keys is doing column selection.
		//  * Defaults to false.
		//  */
		// columnSelection?: boolean;
		// /**
		//  * The modifier to be used to add multiple cursors with the mouse.
		//  * Defaults to 'alt'
		//  */
		// multiCursorModifier?: 'ctrlCmd' | 'alt';
		// /**
		//  * Merge overlapping selections.
		//  * Defaults to true
		//  */
		// multiCursorMergeOverlapping?: boolean;
		// /**
		//  * Configure the behaviour when pasting a text with the line count equal to the cursor count.
		//  * Defaults to 'spread'.
		//  */
		// multiCursorPaste?: 'spread' | 'full';
		// /**
		//  * Configure the editor's accessibility support.
		//  * Defaults to 'auto'. It is best to leave this to 'auto'.
		//  */
		// accessibilitySupport?: 'auto' | 'off' | 'on';
		// /**
		//  * Controls the number of lines in the editor that can be read out by a screen reader
		//  */
		// accessibilityPageSize?: number;
		// /**
		//  * Suggest options.
		//  */
		// suggest?: ISuggestOptions;
		// /**
		//  *
		//  */
		// gotoLocation?: IGotoLocationOptions;
		// /**
		//  * Enable quick suggestions (shadow suggestions)
		//  * Defaults to true.
		//  */
		// quickSuggestions?: boolean | IQuickSuggestionsOptions;
		// /**
		//  * Quick suggestions show delay (in ms)
		//  * Defaults to 10 (ms)
		//  */
		// quickSuggestionsDelay?: number;
		// /**
		//  * Controls the spacing around the editor.
		//  */
		// padding?: IEditorPaddingOptions;
		// /**
		//  * Parameter hint options.
		//  */
		// parameterHints?: IEditorParameterHintOptions;
		// /**
		//  * Options for auto closing brackets.
		//  * Defaults to language defined behavior.
		//  */
		// autoClosingBrackets?: EditorAutoClosingStrategy;
		// /**
		//  * Options for auto closing quotes.
		//  * Defaults to language defined behavior.
		//  */
		// autoClosingQuotes?: EditorAutoClosingStrategy;
		// /**
		//  * Options for typing over closing quotes or brackets.
		//  */
		// autoClosingOvertype?: EditorAutoClosingOvertypeStrategy;
		// /**
		//  * Options for auto surrounding.
		//  * Defaults to always allowing auto surrounding.
		//  */
		// autoSurround?: EditorAutoSurroundStrategy;
		// /**
		//  * Controls whether the editor should automatically adjust the indentation when users type, paste, move or indent lines.
		//  * Defaults to advanced.
		//  */
		// autoIndent?: 'none' | 'keep' | 'brackets' | 'advanced' | 'full';
		// /**
		//  * Enable format on type.
		//  * Defaults to false.
		//  */
		// formatOnType?: boolean;
		// /**
		//  * Enable format on paste.
		//  * Defaults to false.
		//  */
		// formatOnPaste?: boolean;
		// /**
		//  * Controls if the editor should allow to move selections via drag and drop.
		//  * Defaults to false.
		//  */
		// dragAndDrop?: boolean;
		// /**
		//  * Enable the suggestion box to pop-up on trigger characters.
		//  * Defaults to true.
		//  */
		// suggestOnTriggerCharacters?: boolean;
		// /**
		//  * Accept suggestions on ENTER.
		//  * Defaults to 'on'.
		//  */
		// acceptSuggestionOnEnter?: 'on' | 'smart' | 'off';
		// /**
		//  * Accept suggestions on provider defined characters.
		//  * Defaults to true.
		//  */
		// acceptSuggestionOnCommitCharacter?: boolean;
		// /**
		//  * Enable snippet suggestions. Default to 'true'.
		//  */
		// snippetSuggestions?: 'top' | 'bottom' | 'inline' | 'none';
		// /**
		//  * Copying without a selection copies the current line.
		//  */
		// emptySelectionClipboard?: boolean;
		// /**
		//  * Syntax highlighting is copied.
		//  */
		// copyWithSyntaxHighlighting?: boolean;
		// /**
		//  * The history mode for suggestions.
		//  */
		// suggestSelection?: 'first' | 'recentlyUsed' | 'recentlyUsedByPrefix';
		// /**
		//  * The font size for the suggest widget.
		//  * Defaults to the editor font size.
		//  */
		// suggestFontSize?: number;
		// /**
		//  * The line height for the suggest widget.
		//  * Defaults to the editor line height.
		//  */
		// suggestLineHeight?: number;
		// /**
		//  * Enable tab completion.
		//  */
		// tabCompletion?: 'on' | 'off' | 'onlySnippets';
		// /**
		//  * Enable selection highlight.
		//  * Defaults to true.
		//  */
		// selectionHighlight?: boolean;
		// /**
		//  * Enable semantic occurrences highlight.
		//  * Defaults to true.
		//  */
		// occurrencesHighlight?: boolean;
		// /**
		//  * Show code lens
		//  * Defaults to true.
		//  */
		// codeLens?: boolean;
		// /**
		//  * Control the behavior and rendering of the code action lightbulb.
		//  */
		// lightbulb?: IEditorLightbulbOptions;
		// /**
		//  * Timeout for running code actions on save.
		//  */
		// codeActionsOnSaveTimeout?: number;
		// /**
		//  * Enable code folding.
		//  * Defaults to true.
		//  */
		// folding?: boolean;
		// /**
		//  * Selects the folding strategy. 'auto' uses the strategies contributed for the current document, 'indentation' uses the indentation based folding strategy.
		//  * Defaults to 'auto'.
		//  */
		// foldingStrategy?: 'auto' | 'indentation';
		// /**
		//  * Enable highlight for folded regions.
		//  * Defaults to true.
		//  */
		// foldingHighlight?: boolean;
		// /**
		//  * Controls whether the fold actions in the gutter stay always visible or hide unless the mouse is over the gutter.
		//  * Defaults to 'mouseover'.
		//  */
		// showFoldingControls?: 'always' | 'mouseover';
		// /**
		//  * Controls whether clicking on the empty content after a folded line will unfold the line.
		//  * Defaults to false.
		//  */
		// unfoldOnClickAfterEndOfLine?: boolean;
		// /**
		//  * Enable highlighting of matching brackets.
		//  * Defaults to 'always'.
		//  */
		// matchBrackets?: 'never' | 'near' | 'always';
		// /**
		//  * Enable rendering of whitespace.
		//  * Defaults to none.
		//  */
		// renderWhitespace?: 'none' | 'boundary' | 'selection' | 'trailing' | 'all';
		// /**
		//  * Enable rendering of control characters.
		//  * Defaults to false.
		//  */
		// renderControlCharacters?: boolean;
		// /**
		//  * Enable rendering of indent guides.
		//  * Defaults to true.
		//  */
		// renderIndentGuides?: boolean;
		// /**
		//  * Enable highlighting of the active indent guide.
		//  * Defaults to true.
		//  */
		// highlightActiveIndentGuide?: boolean;
		// /**
		//  * Enable rendering of current line highlight.
		//  * Defaults to all.
		//  */
		// renderLineHighlight?: 'none' | 'gutter' | 'line' | 'all';
		// /**
		//  * Control if the current line highlight should be rendered only the editor is focused.
		//  * Defaults to false.
		//  */
		// renderLineHighlightOnlyWhenFocus?: boolean;
		// /**
		//  * Inserting and deleting whitespace follows tab stops.
		//  */
		// useTabStops?: boolean;
		// /**
		//  * The font family
		//  */
		// fontFamily?: string;
		// /**
		//  * The font weight
		//  */
		// fontWeight?: string;
		// /**
		//  * The font size
		//  */
		// fontSize?: number;
		// /**
		//  * The line height
		//  */
		// lineHeight?: number;
		// /**
		//  * The letter spacing
		//  */
		// letterSpacing?: number;
		// /**
		//  * Controls fading out of unused variables.
		//  */
		// showUnused?: boolean;
		// /**
		//  * Controls whether to focus the inline editor in the peek widget by default.
		//  * Defaults to false.
		//  */
		// peekWidgetDefaultFocus?: 'tree' | 'editor';
		// /**
		//  * Controls whether the definition link opens element in the peek widget.
		//  * Defaults to false.
		//  */
		// definitionLinkOpensInPeek?: boolean;
		// /**
		//  * Controls strikethrough deprecated variables.
		//  */
		// showDeprecated?: boolean;

		/**
		 * The number of spaces a tab is equal to.
		 * This setting is overridden based on the file contents when `detectIndentation` is on.
		 * Defaults to 4.
		 */
		// tabSize?: number;
		/**
		 * Insert spaces when pressing `Tab`.
		 * This setting is overridden based on the file contents when `detectIndentation` is on.
		 * Defaults to true.
		 */
		// insertSpaces?: boolean;
		/**
		 * Controls whether `tabSize` and `insertSpaces` will be automatically detected when a file is opened based on the file contents.
		 * Defaults to true.
		 */
		// detectIndentation?: boolean;
		/**
		 * Remove trailing auto inserted whitespace.
		 * Defaults to true.
		 */
		// trimAutoWhitespace?: boolean;
		/**
		 * Special handling for large files to disable certain memory intensive features.
		 * Defaults to true.
		 */
		// largeFileOptimizations?: boolean;
		/**
		 * Controls whether completions should be computed based on words in the document.
		 * Defaults to true.
		 */
		// wordBasedSuggestions?: boolean;
		/**
		 * Controls whether the semanticHighlighting is shown for the languages that support it.
		 * true: semanticHighlighting is enabled for all themes
		 * false: semanticHighlighting is disabled for all themes
		 * 'configuredByTheme': semanticHighlighting is controlled by the current color theme's semanticHighlighting setting.
		 * Defaults to 'byTheme'.
		 */
		// 'semanticHighlighting.enabled'?: true | false | 'configuredByTheme';
		/**
		 * Keep peek editors open even when double clicking their content or when hitting `Escape`.
		 * Defaults to false.
		 */
		// stablePeek?: boolean;
		/**
		 * Lines above this length will not be tokenized for performance reasons.
		 * Defaults to 20000.
		 */
		// maxTokenizationLineLength?: number;
	},

	// 代码提示编译选项,对应 ts.config.json配置 :https://www.cnblogs.com/cczlovexw/p/11527708.html
	compilerOptions: {

		allowJs: true,
		allowSyntheticDefaultImports: true,
		experimentalDecorators: true,
		// rootDirs:["/assets"] ,
		// paths: {
		//   "@/*": ["src/*"]
		// },
		//     paths?: MapLike<string[]>;
		//     allowUmdGlobalAccess?: boolean;
		//     allowUnreachableCode?: boolean;
		//     allowUnusedLabels?: boolean;
		//     alwaysStrict?: boolean;
		//     charset?: string;
		//     checkJs?: boolean;
		//     declaration?: boolean;
		//     declarationMap?: boolean;
		//     emitDeclarationOnly?: boolean;
		//     declarationDir?: string;
		//     disableSizeLimit?: boolean;
		//     disableSourceOfProjectReferenceRedirect?: boolean;
		//     downlevelIteration?: boolean;
		//     emitBOM?: boolean;
		//     emitDecoratorMetadata?: boolean;
		//     forceConsistentCasingInFileNames?: boolean;
		//     importHelpers?: boolean;
		//     inlineSourceMap?: boolean;
		//     inlineSources?: boolean;
		//     jsx?: JsxEmit;
		//     keyofStringsOnly?: boolean;
		//     lib?: string[];
		//     locale?: string;
		//     mapRoot?: string;
		//     maxNodeModuleJsDepth?: number;
		// module: 1,
		//  target: 3,
		moduleResolution: 2, // 1.Classic 2.NodeJs
		//     newLine?: NewLineKind;
		//     noEmitHelpers?: boolean;
		//     noEmitOnError?: boolean;
		//     noErrorTruncation?: boolean;
		//     noFallthroughCasesInSwitch?: boolean;
		//     noImplicitAny?: boolean;
		//     noImplicitReturns?: boolean;
		//     noImplicitThis?: boolean;
		//     noStrictGenericChecks?: boolean;
		//     noUnusedLocals?: boolean;
		//     noUnusedParameters?: boolean;
		//     noImplicitUseStrict?: boolean;
		//     noLib?: boolean;
		//     noResolve?: boolean;
		//     out?: string;
		//     outDir?: string;
		//     outFile?: string;
		//     preserveConstEnums?: boolean;
		//     preserveSymlinks?: boolean;
		//     project?: string;
		//     reactNamespace?: string;
		//     jsxFactory?: string;
		//     composite?: boolean;
		//     removeComments?: boolean;
		//     rootDir?: string;
		//     rootDirs?: string[];
		//     skipLibCheck?: boolean;
		//     skipDefaultLibCheck?: boolean;
		//     sourceMap?: boolean;
		//     sourceRoot?: string;
		//     strict?: boolean;
		//     strictFunctionTypes?: boolean;
		//     strictBindCallApply?: boolean;
		//     strictNullChecks?: boolean;
		//     strictPropertyInitialization?: boolean;
		//     stripInternal?: boolean;
		//     suppressExcessPropertyErrors?: boolean;
		//     suppressImplicitAnyIndexErrors?: boolean;
		//     traceResolution?: boolean;
		//     resolveJsonModule?: boolean;
		//     types?: string[];
		//     /** Paths used to compute primary types search locations */
		//     typeRoots?: string[];
		//     esModuleInterop?: boolean;
		//     useDefineForClassFields?: boolean;
		//     [option: string]: CompilerOptionsValue | undefined;

	},


	optionGroups: {
		Main: {
			"theme": {
				// 主题
				path: "theme", 
				type: "select",
				defaultValue: "vs-dark-ex",
				items: [{ caption: 'vs', value: 'vs' }, { caption: 'vs-dark', value: 'vs-dark' }, { caption: 'vs-dark-ex', value: 'vs-dark-ex' }, { caption: 'hc-black', value: 'hc-black' }]
			},
			"language": {
				// 语言
				path: "language", 
				type: "select",
				items: []
			},
			"newFileType": {
				// 新建文件格式
				path: "newFileType", 
				type: "buttonBar",
				defaultValue: "ts",
				items: [
					{ caption: ".js", value: "js" },
					{ caption: ".ts", value: "ts" },
					{ caption: ".coffe", value: "coffee" },
					{ caption: ".lua", value: "lua" }
				]
			},
			"fontSize": {
				//字体大小
				path: "fontSize",
				type: "number",
				defaultValue: process.platform == 'darwin' ? 12 : 13.5 ,
				defaults: [
					{ caption: "8px", value: 8 },
					{ caption: "10px", value: 10 },
					{ caption: "12px", value: 12 },
					{ caption: "13.5px", value: 13.5 },
					{ caption: "14px", value: 14 },
					{ caption: "16px", value: 16 }
				],
			},
			"fontFamily": {
				// 字体
				path: "fontFamily",
				type: "select",
				defaultValue: undefined,
				items: [{ caption: 'default', value: undefined }]
			},
			"fontWeight": {
				// 字体粗细
				path: "fontWeight",
				type: "select",
				defaultValue: process.platform == 'darwin' ? "normal" : "600",
				items: [
					{ caption: "default", value: "normal" },
					{ caption: "1号", value: "100" },
					{ caption: "2号", value: "200" },
					{ caption: "3号", value: "300" },
					{ caption: "4号", value: "400" },
					{ caption: "5号", value: "500" },
					{ caption: "6号", value: "600" },
					{ caption: "7号", value: "700" },
					{ caption: "8号", value: "800" },
					{ caption: "9号", value: "900" },
				]
			},
			"wordWrap": {
				// 自动换行
				path: "wordWrap",
				type: "buttonBar",
				defaultValue: "off",
				items: [
					{ caption: "on", value: "on" },
					{ caption: "off", value: "off" },
				]
			},
			"keyboardHandler": {
				// 快捷键习惯
				path: "keyboardHandler",
				type: "buttonBar",
				defaultValue: "ace/keyboard/vscode",
				items: [
					{ caption: "VSCode", value: "ace/keyboard/vscode" }
				]
			},
			"minimapStyle": {
				// 显示代码预览
				path: "minimapStyle",
				type: "buttonBar",
				defaultValue: "default",
				items: [
					{ caption: tools.T('隐藏','Hide'), value: "hide" },
					{ caption: tools.T('默认','Default'), value: "default" },
					{ caption: tools.T('细腻','Exquisite'), value: "exquisite" },
				]
			},
			"minimapSide": {
				// 显示代码预览
				path: "minimapSide",
				type: "buttonBar",
				defaultValue: "right",
				items: [
					{ caption: tools.T('左边','Left'), value: "left" },
					{ caption: tools.T('右边','Right'), value: "right" },
				]
			},
			"enabledRainbow": {
				// 彩虹缩进显示
				path: "enabledRainbow",
				defaultValue: false,
			},
			"enabledBracketColor": {
				// 括号多重彩色
				path: "enabledBracketColor",
				defaultValue: true,
			},
			"smoothScrolling": {
				// 翻页过渡效果
				path: "smoothScrolling",
				defaultValue: true,
			},
			"cursorSmoothCaretAnimation": {
				// 光标过渡效果
				path: "cursorSmoothCaretAnimation",
				defaultValue: false,
			},
			"enabledCCColor": {
				// Color字段色彩预览
				path: "enabledCCColor",
				defaultValue: true,
			},
			"enabledDebugBtn": {
				// 显示调试按钮
				path: "enabledDebugBtn",
				defaultValue: false,
			},
			"enabledConsoleBtn": {
				// 显示控制台按钮
				path: "enabledConsoleBtn",
				defaultValue: false,
			},
			"clickToViewCode": {
				// 点击Node自动显示代码
				path: "clickToViewCode",
				defaultValue: true,
			},
			"scrollPredominantAxis": {
				// 光标在边缘位置
				path: "scrollPredominantAxis",
				type: "number",
				defaultValue: 5,
			},

			"codeCompileMode": {
				// 触发编译方式
				path: "codeCompileMode",
				type: "buttonBar",
				defaultValue: "save",
				items: [
					{ caption: tools.translate('whenSave' /*"保存后"*/), value: "save" },
					{ caption: tools.translate('whenBlur' /*"退出编辑后"*/), value: "blur" },
					{ caption: tools.translate('ManualComp' /*"手动编译"*/), value: "manual" },
				]
			},
			"autoSaveFile": {
				// 加载代码方式
				path: "autoSaveFile",
				type: "select",
				defaultValue: "off",
				items: [
					{ caption: tools.T('关闭','off'), value: "off" },
					{ caption: tools.T('窗口失去焦点时','When the window loses focus'), value: "blur" },
				]
			},
			"readCodeMode": {
				// 加载代码方式
				path: "readCodeMode",
				type: "select",
				defaultValue: "auto",
				items: [
					{ caption: tools.translate('auto' /*"自动"*/), value: 'auto' }, 
					{ caption: tools.translate('allImport' /*"全部加载"*/), value: 'all' }, 
					{ caption: tools.translate('atImportTo' /*"import时加载"*/), value: 'atImportTo' }
				]
			},
			"enabledVim": {
				// vim编辑模式
				path: "enabledVim",
				defaultValue: false,
			},
			"renameConverImportPath": {
				// 重命名同步修改import路径
				path: "renameConverImportPath",
				defaultValue: true,
			},
			"enabledJsGlobalSugges": {
				// JS模糊输入提示/函数跳转
				path: "enabledJsGlobalSugges",
				defaultValue: true,
			},
			"enabledTsGlobalSugges": {
				// TS模糊输入提示/函数跳转
				path: "enabledTsGlobalSugges",
				defaultValue: false,
			},
			"enabledNpmDir": {
				// 加载node_modules目录
				path: "enabledNpmDir",
				defaultValue: true,
			},

			"tabSize": {
				// tab缩进数量
				path: "tabSize",
				type: "number",
				defaultValue: 4,
			},
			"insertSpaces": {
				// tab空格缩进
				path: "insertSpaces",
				defaultValue: false,
			},
			"detectIndentation": {
				// 自动适配缩进格式
				path: "detectIndentation",
				defaultValue: true,
			},
			"formatOnPaste": {
				// 粘贴自动格式化
				path: "formatOnPaste",
				defaultValue: true,
			},
			"formatOnSaveFile": {
				// 保存自动格式化
				path: "formatOnSaveFile",
				defaultValue: false,
			},
			"enabledFormatFromPrettier": {
				// prettire 插件
				path: "enabledFormatFromPrettier",
				defaultValue: Symbol.asyncIterator ? false : false, // 旧版js解析器不支持该库,则不开启
			},
		},
		More: {
			"autoLayoutMin": {
				// 自动窗口 最小高度占比%
				path: "autoLayoutMin",
				type: "number",
				defaultValue: 10,
				defaults: [
					{ caption: "disable", value: 0 },
					{ caption: "60%", value: 60 },
					{ caption: "40%", value: 40 },
					{ caption: "20%", value: 20 },
					{ caption: "10%", value: 10 }
				]
			},

			"autoLayoutMax": {
				// 自动窗口 最大高度占比%
				path: "autoLayoutMax",
				type: "number",
				defaultValue: 80,
				defaults: [
					{ caption: tools.translate('userHabit' /*"使用用户调整窗口后的值"*/), value: 0 },
					{ caption: tools.translate('fix')+" 80%", value: 80 },
					{ caption: tools.translate('fix')+" 60%", value: 60 },
					{ caption: tools.translate('fix')+" 50%", value: 50 },
				]
			},

			"autoLayoutDt": {
				// 自动窗口 过渡动画时间
				path: "autoLayoutDt",
				type: "number",
				defaultValue: 0,
				defaults: [
					{ caption: "disable", value: 0 },
					{ caption: "0.1s", value: 0.1 },
					{ caption: "0.2s", value: 0.2 },
				]
			},

			"autoLayoutDelay": {
				// 自动窗口 过渡动作延迟
				path: "autoLayoutDelay",
				type: "number",
				defaultValue: 0.1,
				defaults: [
					{ caption: "disable", value: 0 },
					{ caption: "0.1s", value: 0.1 },
				]
			},

			"titleBarFontSize": {
				// 工具栏大小
				path: "titleBarFontSize",
				type: "number",
				defaultValue: 12,
				defaults: [
					{ caption: "8px", value: 8 },
					{ caption: "10px", value: 10 },
					{ caption: "12px", value: 12 },
					{ caption: "14px", value: 14 },
					{ caption: "16px", value: 16 }
				],
			},

			"tabBarPos": {
				// 工具栏位置
				path: "tabBarPos",
				type: "buttonBar",
				defaultValue: "",
				items: [
					{ caption: "top", value: "" },
					{ caption: "bottom", value: "1" },
				]
			},
			"hideToolsBar": {
				// 隐藏工具栏
				path: "hideToolsBar",
				defaultValue: false,
			},
			"isCheckUpdater": {
				// 自动检测更新
				path: "isCheckUpdater",
				defaultValue: true,
			},
			"isQuickDrag": {
				// 拖拽变量快速生成(使用文件名)
				path: "isQuickDrag",
				defaultValue: true,
			},
		},
	},

	keyMap: {
		"48": '0', "49": '1', "50": '2', "51": '3', "52": '4', "53": '5', "54": '6', "55": '7', "56": '8', "57": '9', "65": 'a', "66": 'b', "67": 'c', "68": 'd', "69": 'e', "70": 'f', "71": 'g', "72": 'h', "73": 'i', "74": 'j', "75": 'k', "76": 'l', "77": 'm', "78": 'n', "79": 'o', "80": 'p', "81": 'q', "82": 'r', "83": 's', "84": 't', "85": 'u', "86": 'v', "87": 'w', "88": 'x', "89": 'y', "90": 'z',
	},

	cfgPath : path.join(cacheDir,'userConfig.json'),

	getLocalStorage(){
		if(this.cfg){
			return this.cfg;
		}

		this.cfg = tools.isFileExit(this.cfgPath) && fs.readFileSync(this.cfgPath).toString() || localStorage.getItem("simple-code-config");
		try {
			this.cfg = this.cfg ? JSON.parse(this.cfg) : {}; 
		} catch (error) {
			this.cfg = {};
			console.warn(error);
		}
		return this.cfg;
	},

	// 项目位置的本地缓存
	getProjectLocalStorage(){
		if(this.pro_cfg){
			return this.pro_cfg;
		}
		const fe 	= Editor.require('packages://simple-code/tools/tools.js');

		const savePath = path.join(this.prsPath,'local','simple-code-config.json')
		
		try {
			this.pro_cfg = fe.isFileExit(savePath) ? require(savePath) : {};
		} catch (error) {
			this.pro_cfg = {}
		}
		return this.pro_cfg;
	},

	
	// 编辑器用户配置
	getUserEditorConfig(){
		let cfg = this.importUserConfigFile(Editor.url('packages://simple-code/editor_config.js'));
		Object.assign(this.vsEditorConfig,cfg);
		return this.vsEditorConfig;
	},
	
	// 保存配置
	saveStorage(){
		const savePath = path.join(this.prsPath,'local','simple-code-config.json')
		fs.writeFileSync(savePath,JSON.stringify(this.pro_cfg || {})) // 跟着项目走的配置
		tools.createDir(this.cfgPath)
		fs.writeFileSync(this.cfgPath,JSON.stringify(this.cfg || {})) // 全局配置
		// localStorage.setItem("simple-code-config", JSON.stringify(this.cfg || {}));
	},

	// 读取用户配置文件,没有则拷贝一份当用户配置文件
	importUserConfigFile(filePath)
	{
		let userFilePath = this.getUserConfigPath(filePath);
		// 首次使用拷贝模板到可写路径
		if(!tools.isFileExit(userFilePath)){
			tools.createDir(userFilePath)
			tools.copyFile(filePath,userFilePath)
		}
		try {
			return require(userFilePath);
		} catch (error) {
			Editor.warn('[simple-code] import config error:',error);
			return {}
		}
	},

	getUserConfigPath(filePath){
		return path.join(cacheDir,'configs',path.basename(filePath));
	},
}

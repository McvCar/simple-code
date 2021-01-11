// 配置信息请写在这里
module.exports = {
  
  // 快捷键配置
  "main-menu": {
    "i18n:代码编辑器/打开": {
      "message": "simple-code:open",
      "accelerator": "F1"
    },
    "i18n:代码编辑器/预览": {
      "message": "simple-code:openPreview",
      "accelerator": "F11"
    },
    "i18n:代码编辑器/设置": {
      "message": "simple-code:setting",
      "accelerator": "F10"
    },
    "i18n:代码编辑器/搜索/打开资源 (V)": {
      "message": "simple-code:findFileAndOpen",
      "accelerator": "alt+V"
    },
    "i18n:代码编辑器/搜索/跳转文件 (F)": {
      "message": "simple-code:findFileGoto",
      "accelerator": "alt+F"
    },
    "i18n:代码编辑器/搜索/全局文件搜索": {
      "message": "simple-code:open-global-search",
      "accelerator": "CmdOrCtrl+shift+F"
    },
    "i18n:代码编辑器/搜索/在资源管理器高亮未使用的资源": {
      "message": "simple-code:cleanFile",
      "accelerator": "alt+L"
    },
    "i18n:代码编辑器/调试/执行命令": {
      "message": "simple-code:runCommandLine",
      "accelerator": "alt+R"
    },
    "i18n:代码编辑器/调试/刷新预览页面": {
      "message": "simple-code:refresh-preview",
      "accelerator": "CmdOrCtrl+shift+r"
    },
    "i18n:代码编辑器/调试/执行场景所有节点绑定的脚本": {
      "message": "simple-code:run-node-js",
      "accelerator": "alt+shift+e"
    },
    "i18n:代码编辑器/编辑/打开外部编辑": {
      "message": "simple-code:openNodeFileByOutside",
      "accelerator": "f4"
    },
    "i18n:代码编辑器/编辑/批量重命名 (D)": {
      "message": "simple-code:rename",
      "accelerator": "alt+enter"
    },
    "i18n:代码编辑器/编辑/批量节点绑定组件 (G)": {
      "message": "simple-code:addNodeComp",
      "accelerator": "alt+shift+enter"
    },
    "i18n:代码编辑器/编辑/批量插入预制节点 (A)": {
      "message": "simple-code:addPrefab",
      "accelerator": "alt+shift+i"
    },
    "i18n:代码编辑器/编辑/批量选中同名节点 (S)": {
      "message": "simple-code:selectNode",
      "accelerator": "alt+d"
    },
    "i18n:代码编辑器/编辑/批量搜索|选中节点 (F)": {
      "message": "simple-code:selectNode",
      "accelerator": ""
    },
    "i18n:代码编辑器/编辑/新建脚本绑定Node": {
      "message": "simple-code:newFile",
      "accelerator": "f3"
    },
    "i18n:代码编辑器/编辑/打开代码|解锁编辑": {
      "message": "simple-code:openNodeFile",
      "accelerator": "f1"
    },
    "i18n:代码编辑器/编辑/文件夹绑定快捷键 (alt+0~9)": {
      "message": "",
      "accelerator": ""
    },
    "i18n:代码编辑器/编辑/文件夹转跳快捷键 (0~9)": {
      "message": "",
      "accelerator": ""
    },
    "i18n:代码编辑器/编辑/剪切文件 (X)": {
      "message": "simple-code:selectNode",
      "accelerator": ""
    },
    "i18n:代码编辑器/编辑/粘贴文件 (C)": {
      "message": "simple-code:selectNode",
      "accelerator": ""
    },
    "i18n:代码编辑器/编辑/删除选中节点与绑定的脚本": {
      "message": "simple-code:removeNodeAndScript",
      "accelerator": "alt+delete"
    },
    "i18n:代码编辑器/项目管理/打开项目目录": {
      "message": "simple-code:openProjectDir",
      "accelerator": "alt+f1"
    },
    "i18n:代码编辑器/项目管理/打开项目到外部编辑器": {
      "message": "simple-code:openProjectEditor",
      "accelerator": "alt+f2"
    },
    "i18n:代码编辑器/项目管理/打开项目到Creator": {
      "message": "simple-code:openProjectCreator",
      "accelerator": "alt+f3"
    },
    "i18n:代码编辑器/项目管理/配置扩展模块": {
      "message": "simple-code:openConfigExtendDir",
      "accelerator": ""
    },
    "i18n:代码编辑器/项目管理/配置新建模板": {
      "message": "simple-code:newFileDir",
      "accelerator": ""
    },
    "i18n:代码编辑器/项目管理/配置功能快捷键": {
      "message": "simple-code:openConfig",
      "accelerator": ""
    },
    "i18n:代码编辑器/项目管理/配置代码输入提示": {
      "message": "simple-code:openConfigHitn",
      "accelerator": ""
    },
  },

  // 外部编辑器路径配置，win路径分隔符注意使用 ‘\\’
  "editorPath": {
    "win": "C:\\Program Files\\Sublime Text 3\\sublime_text.exe",
    "mac": "/Applications/Sublime Text.app/Contents/MacOS/Sublime Text",
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
    // cursorSmoothCaretAnimation:true,
    /**
//  * This editor is used inside a diff editor.
//  */
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
  },

  // 代码提示编译选项,对应 ts.config.json配置 :https://www.cnblogs.com/cczlovexw/p/11527708.html
  compilerOptions: {

    // allowJs: true,
    // allowSyntheticDefaultImports: true,
    experimentalDecorators: true,
    // rootDirs:["x:/Users/mac/Desktop/MyGame/Live2dForCocosCreator-master/assets"] ,
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
    // moduleResolution: 2,
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
      "主题": {
        path: "theme",
        type: "select",
        defaultValue: "vs-dark-ex",
        items: [{ caption: 'vs', value: 'vs' }, { caption: 'vs-dark', value: 'vs-dark' }, { caption: 'vs-dark-ex', value: 'vs-dark-ex' }, { caption: 'hc-black', value: 'hc-black' }]
      },
      "语言": {
        path: "language",
        type: "select",
        items: []
      },
      "字体": {
        path: "fontFamily",
        type: "select",
        defaultValue: undefined,
        items: [{ caption: '默认', value: undefined }]
      },
      "字体大小": {
        path: "fontSize",
        type: "number",
        defaultValue: 11,
        defaults: [
          { caption: "6px", value: 8 },
          { caption: "10px", value: 10 },
          { caption: "12px", value: 12 },
          { caption: "16px", value: 16 },
          { caption: "18px", value: 18 }
        ],
      },
      "字体粗细": {
        path: "fontWeight",
        type: "select",
        defaultValue: "normal",
        items: [
          { caption: "默认", value: "normal" },
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

      "快捷键习惯": {
        type: "buttonBar",
        path: "keyboardHandler",
        defaultValue: "ace/keyboard/vscode",
        items: [
          { caption: "VSCode", value: "ace/keyboard/vscode" }
        ]
      },
      "新建文件格式": {
        type: "buttonBar",
        path: "newFileType",
        defaultValue: "ts",
        items: [
          { caption: "js文件", value: "js" },
          { caption: "ts文件", value: "ts" },
          { caption: "coffe文件", value: "coffee" },
          { caption: "lua文件", value: "lua" }
        ]
      },
      "vim编辑模式": {
        path: "enabledVim",
        defaultValue: false,
      },
      "显示代码预览": {
        path: "enabledMinimap",
        defaultValue: true,
      },
      "翻页过渡效果": {
        path: "smoothScrolling",
        defaultValue: true,
      },
      "光标过渡效果": {
        path: "cursorSmoothCaretAnimation",
        defaultValue: false,
      },
      "粘贴自动格式化": {
        path: "formatOnPaste",
        defaultValue: true,
      },
      "光标在边缘位置": {
        path: "scrollPredominantAxis",
        type: "number",
        defaultValue: 5,
      },
    },
    More: {
      "自动窗口最小高度占比%": {
        path: "autoLayoutMin",
        type: "number",
        defaultValue: 10,
        defaults: [
          { caption: "禁用功能", value: 0 },
          { caption: "60%", value: 60 },
          { caption: "40%", value: 40 },
          { caption: "20%", value: 20 },
          { caption: "10%", value: 10 }
        ]
      },

      "自动窗口最大高度占比%": {
        path: "autoLayoutMax",
        type: "number",
        defaultValue: 0,
        defaults: [
          { caption: "使用用户调整窗口后的值", value: 0 },
          { caption: "固定80%", value: 80 },
          { caption: "固定60%", value: 60 },
          { caption: "固定50%", value: 50 },
        ]
      },

      "自动窗口过渡动画时间": {
        path: "autoLayoutDt",
        type: "number",
        defaultValue: 0.1,
        defaults: [
          { caption: "禁用", value: 0 },
          { caption: "0.1秒", value: 0.1 },
          { caption: "0.2秒", value: 0.2 },
        ]
      },

      "自动窗口过渡动作延迟": {
        path: "autoLayoutDelay",
        type: "number",
        defaultValue: 0.1,
        defaults: [
          { caption: "禁用", value: 0 },
          { caption: "0.1秒", value: 0.1 },
        ]
      },

      "任务栏位置": {
        type: "buttonBar",
        path: "tabBarPos",
        defaultValue: "",
        items: [
          { caption: "顶部", value: "" },
          { caption: "低部", value: "1" },
        ]
      },

      "隐藏工具栏": {
        path: "hideToolsBar",
        defaultValue: false,
      },
    },
  },

  keyMap: {
    "48": '0', "49": '1', "50": '2', "51": '3', "52": '4', "53": '5', "54": '6', "55": '7', "56": '8', "57": '9', "65": 'a', "66": 'b', "67": 'c', "68": 'd', "69": 'e', "70": 'f', "71": 'g', "72": 'h', "73": 'i', "74": 'j', "75": 'k', "76": 'l', "77": 'm', "78": 'n', "79": 'o', "80": 'p', "81": 'q', "82": 'r', "83": 's', "84": 't', "85": 'u', "86": 'v', "87": 'w', "88": 'x', "89": 'y', "90": 'z',
  },

}

# Rainbow Decorator
## [Indent-Rainbow](https://github.com/oderwat/vscode-indent-rainbow) ported to work with [Monaco](https://microsoft.github.io/monaco-editor/)

![example](https://gitlab.com/Edrem/rainbow-decorator/raw/master/example.png)


### Usage
```javascript
import rainbowDecorate from "rainbow-decorators";

const editor = monaco.editor.create(document.getElementById("container"), {
	value: "function hello() {\n\talert('Hello world!');\n}",
	language: "javascript"
});

rainbowDecorate(editor);
```

Rainbow decorator will attach itself to the editor and respond to any changes in content. When the editor is disposed the rainbow will also clear itself.

### Configuration

An optional config can be passed in after the editor to 

|option|type|default|notes|
|--|--|--|--|
|debounce|number|200|Time in milliseconds to debounce applying decorators|
|colours|string[]|[<br>"rgba(64,64,16,0.3)",<br>"rgba(32,64,32,0.3)",<br>"rgba(64,32,64,0.3)",<br>"rgba(16,48,48,0.3)"<br>]|An array of valid CSS colours|
|classNames|string[]||An array classNames, only aplpied if no colours was provided|
|errorColour|string|rgba(128,32,32,0.3)|Colour used when a line does not have correct indentation|
|errorClassName|string||className to use for invalid lines, only applied if no errorColour was provided|
|tabSize|number|4|Tab size for each stage of indents|
|skipErrors|boolean|false|If true, skips marking incorrectly indented lines with an error

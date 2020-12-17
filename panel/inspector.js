// 暂无实现
const ace                 = Editor.require('packages://simple-code/ace/ace.js');
const language_tools      = Editor.require('packages://simple-code/ace/ext-language_tools.js');

Vue.component('widgetBase', {
  // 修改组件在 inspector 的显示样式

  style: ace.editorCss+`

	#editor {
	  width: 100%;
	  height: 400px;
	}
  `,

  template: `
	<div id="editor"> 测试 </div>
  `,

  props: {
	target: {
	  twoWay: true,
	  type: Object,
	},
  },

  $: {
    editor: '#editor',
  },

  // created
  created () {
	
	ace.config.set("basePath",Editor.url('packages://simple-code/ace/', 'utf8'))
	var editor = ace.edit(this.$editor);
	editor.setOptions({
		// 默认:false
		wrap: true, // 换行
		// autoScrollEditorIntoView: false, // 自动滚动编辑器视图
		enableLiveAutocompletion: true, // 智能补全
		enableSnippets: true, // 启用代码段
		enableBasicAutocompletion: true, // 启用基本完成 不推荐使用
	});
	// 设置主题  cobalt monokai
	editor.setTheme("ace/theme/monokai");
	// 设置编辑语言
	editor.getSession().setMode("ace/mode/javascript");
	editor.setReadOnly(false)
	editor.getSession().setTabSize(2);
  },
});
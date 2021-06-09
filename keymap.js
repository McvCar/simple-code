// 键盘配置,修改后重启Cocos Creator生效
module.exports = {
	// 光标快速上移
	'moveUp' : { win32:[["Ctrl",'i']] , mac:[["Meta",'i']] },  
	// 光标快速下移
	'moveDown' : { win32:[["Ctrl",'j']] , mac:[["Meta",'j']] },  
	// 设置
	'openSetting' : { win32:[["F12"]] , mac:[["F12"]] },  
	// 关闭tab标签
	'closeTab' : { win32:[["Ctrl",'w']] , mac:[["Meta",'w']] },  
	// 跳到上一个tab窗口
	'prevView' : { win32:[["Ctrl", "Alt", "j"], ["Ctrl", "Alt", "ArrowLeft"], ["Ctrl", "PageUp"]] , mac:[["Meta", "Alt", "j"], ["Meta", "Alt", "ArrowLeft"], ["Alt", "Shift", "Tab"]] },  
	// 跳到下一个tab窗口
	'nextView' : { win32:[["Ctrl", "Alt", "l"], ["Ctrl", "Alt", "ArrowRight"], ["Ctrl", "PageDown"]] , mac:[["Meta", "Alt", "l"], ["Meta", "Alt", "ArrowRight"], ["Alt", "Tab"]] },  
	// 执行命令行代码
	'execCode' : { win32:[["Alt","e"],["Ctrl","e"]] , mac:[["Meta",'e']] }, 
	// 执行整个场景代码(不推荐使用,已不维护)
	'execCodeByScene' : { win32:[["Alt","Shift","e"]] , mac:[["Meta","Shift","e"]] },   
	// 锁定tab
	'lockView' : { win32:[["F1"]] , mac:[["F1"]] },  
	// 进入、退出命令模式
	'cmdMode' : { win32:[["F2"]] , mac:[["F2"]] },  
	// 记录当前场景 node tree 选中状态
	'setNodeTreeTag' : { win32:[["Alt",'`']] , mac:[["Alt",'Dead']] },  
	// node tree 选中状态恢复到标记的状态
	'getNodeTreeTag' : { win32:[["`"]] , mac:[["`"]] },  
	// 快速选中同名node,类似vscode的 Ctrl + D
	'quickAddNextNode' : { win32:[["s"]] , mac:[["s"]] }, 
	// 隐藏、显示 选中的Node
	'setNodeActive' : { win32:[["q"]] , mac:[["q"]] },  

	// 批量重命名快捷键
	'renameNodeOrFile' : { win32:[["d"]] , mac:[["d"]] },  
	// 搜索预制组件并批量插入到 node
	'addCompToScene' : { win32:[["g"]] , mac:[["g"]] },  
	// 搜索预制节点并批量插入到 nodeTree
	'insertPrefab' : { win32:[["a"]] , mac:[["a"]] },  
	// 搜索打开 scene or prefab
	'gotoAnything' : { win32:[["Ctrl",'o'],['v']] , mac:[["Meta",'o'],['v']]},  
	// 搜索脚本打开
	'gotoScriptFile' : { win32:[["Ctrl",'p']] , mac:[["Meta",'p']] }, 
	// 搜索并转跳到资源
	'findFileGoto' : { win32:[] , mac:[["Ctrl",'f']] }, 
	// 搜索节点
	'findNodes' : { win32:[["f"]] , mac:[["f"]] },  

	// 跳到下个书签, 鼠标点击行数栏标记位置
	'nextBookmark' : { win32:[["Alt",'`']] , mac:[["Meta",'F1']] },  
	// 打开控制台
	'openConsole' : { win32:[["Ctrl","Shift",'y']] , mac:[["Ctrl","Shift",'y']] },  
}

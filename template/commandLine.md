/*
1.命令行模式可快速编写代码块,直接按快捷键 'ALT+E' 运行看效果
2.这模式编辑环境最大限度的还原了运行环境下的代码编辑习惯:
	a. 可访问 cc.* 下的所有对象
	b. 可通过 ui 访问当前场景下所有 Node对象
	c. 可通过 require("HelloWorld") 引入自己的游戏脚本进行测试
	d. 网络模块也可使用 http / webSocket
3.通过该模式对编辑的代码即时刷新的特性快速写出自己的游戏代码块测试
4.注意:运行的代码将会真实的改变场景内Node属性,按下保持后是代码所改的效果
4.使用例子,按下'ALT+E'试一试:
*/

// 按下'ALT+E' 编辑器场景立即刷新效果
// 在场景加个Label
let node = new cc.Node();
node.name = "test-label"
node.addComponent(cc.Label).string = "命令模式下按下Alt+E执行本代码";
ui["Canvas"].addChild(node);

node.color = new cc.Color(255,211,0)
node.runAction( cc.repeatForever(cc.jumpTo(2, cc.v2(300, 300), 50, 4) ) )

"当前时间"+(new Date());



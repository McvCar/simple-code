/**
 * @Description 描述
 * @Author 作者
 * @Date 
 * @Version 1.0
 */

import { _decorator, Component, Node, Button, Event } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Typescript')
export class Typescript extends Component {

	@property(Node)
	defineBtn: Node = null;

	start() {
		// this.bindEvent()
	}

	bindEvent() {
		this.defineBtn.on(Button.EventType.CLICK, (btn:Button) => {

		})
	}

}

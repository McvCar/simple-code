/* 
面板扩展
功能: 自动布局窗口
*/
'use strict';
const path 			= require('path');
const fs 			= require('fs');

module.exports = {
	/** @type import('../../panel/vs-panel/vs-panel-base') */
	parent : null,

	// 面板初始化
	ready(parent){
		// index.js 对象
		// 读取自动布局信息
		this.parent = parent;
		this.parent_dom 		= Editor2D.Panel.find('simple-code');
		this.layout_dom_flex 	= this.getLayoutDomFlex()
		this.self_flex_per 		= this.parent.cfg.self_flex_per || this.getSelfFlexPercent();
	},

	onLoad(){
		
		// 监听焦点
		let focusPanels = [this.parent.$editorB,this.parent.$tabList];
		for (let i = 0; i < focusPanels.length; i++) {
			const dom = focusPanels[i];
			dom.addEventListener('focus',(e)=>{
				this.setAutoLayout(true)
			},true);
		}

		this.parent_dom.addEventListener('blur',(e)=>{
			setTimeout(()=>{
				let panel = Editor2D.Panel.getFocusedPanel()
				let is_need_close = this.isSameGroupPanel(panel);
				if(is_need_close){
					this.setAutoLayout(panel == this)
				}
			},10)
		},false);

		this.setAutoLayout(Editor.Panel.getFocusedPanel() == this.parent_dom);
	},

	// 设置选项
	setOptions(cfg,isInit) 
	{
		if(!isInit)
		{
			if (cfg.autoLayoutMin != null) {
				this.setAutoLayout(true);
				this.setAutoLayout(false);
			}
			if (cfg.autoLayoutMax != null) {
				this.setAutoLayout(false);
				this.setAutoLayout(true);
			}
		}
	},

	// 监听焦点: 每0.5s检测是否调整布局了
	onCheckLayout(isUpLayout)
	{
		// 正在播放中过渡特效中
		if(this.layout_dom_flex && this.layout_dom_flex.style['-webkit-transition']){
			return;
		}

		if(isUpLayout)
		{
			let rate = this.getSelfFlexPercent();
			if(Math.abs(rate*100-this.parent.cfg.autoLayoutMin) > 3){
				this.self_flex_per = this.parent.cfg.self_flex_per = rate;
			}
		}
		
		// 伸缩窗口
		let panel = Editor.Panel.getFocusedPanel() 
		let is_self = panel == this && !this.comparisonParentDom(this.parent.$toolsPanel,this.parent_dom._focusedElement);
		let is_need_close = this.isSameGroupPanel(panel);
		if(is_self || is_need_close){
			this.setAutoLayout(is_self)
		}
	},
	
	// 设置展开面板或收起来
	setAutoLayout(is_focused)
	{
		if(this.parent.cfg.is_lock_window) 
			return;
		this.getLayoutDomFlex();
		let now_flex = this.layout_dom_flex && this.layout_dom_flex.style.flex;
		if(!this.parent.cfg.autoLayoutMin || now_flex == null || (this.old_focused_state != null && this.old_focused_state == is_focused)){
			return;
		}
		this.old_focused_state = is_focused;

		// 焦点改变时修改布局
		let my_per = is_focused ? (this.parent.cfg.autoLayoutMax ? this.parent.cfg.autoLayoutMax * 0.01 : this.self_flex_per) : this.parent.cfg.autoLayoutMin*0.01; // 调整窗口缩放比例
		let max_per = 1
		let sub_per = max_per-my_per;
		let ohter_height = 0
		let flexs = this.getFlexs();
		
		for (const i in flexs) {
			const flexInfo = flexs[i];
			if(flexInfo.dom != this.layout_dom_flex){
				ohter_height += Number(flexInfo.flex[0])
			}
		}

		for (const i in flexs) 
		{
			const flexInfo = flexs[i];
			if(this.parent.cfg.autoLayoutDt){
				
				flexInfo.dom.style['-webkit-transition']='flex '+this.parent.cfg.autoLayoutDt+"s ease "+(this.parent.cfg.autoLayoutDelay || '0')+'s'
			}
			if(flexInfo.dom != this.layout_dom_flex)
			{
				let per = Number(flexInfo.flex[0])/ohter_height;//占用空间百分比
				let oth_per = per*sub_per;
				flexInfo.dom.style.flex = oth_per+' '+ oth_per+' '+' 0px'
			}else{
				flexInfo.dom.style.flex = my_per+' '+ my_per+' '+' 0px'
			}
		}
		
		let actEnd = ()=>
		{
			this.layout_dom_flex.removeEventListener("transitionend", actEnd);
			for (const i in flexs) 
			{
				const flexInfo = flexs[i];
				flexInfo.dom.style['-webkit-transition'] = '';//清除过渡动画
			}
			this.parent.$overlay.style.display = "none";
			this.parent.upLayout();
			// 场景刷新下，有时会出黑边
			for (let i = 0; i < Editor.Panel.panels.length; i++) {
				const panel = Editor.Panel.panels[i];
				if(panel && panel._onPanelResize) panel._onPanelResize()
			}
		}
		
		if(this.parent.cfg.autoLayoutDt)
		{
			this.parent.$overlay.style.display = this.layout_dom_flex.parentElement.children[0] == this.layout_dom_flex ? "" : "inline"; // 自己在最顶层就不必显示蒙版
			this.layout_dom_flex.addEventListener('transitionend',actEnd,false);
		}else{
			actEnd();
		}
	},

	// 是否父节点的子子级
	comparisonParentDom(parentDom,domNode){
		if (domNode == null) return false;

		if(parentDom == domNode)
			return true
		else if(domNode.parentElement)
			return this.comparisonParentDom(parentDom,domNode.parentElement)
		else
			return false;
	},

	// 和本面板是同一组垂直的面板
	isSameGroupPanel(panel)
	{
		if(panel == null) return false;

		let flexs = this.getFlexs();
		for (const i in flexs) {
			const flexInfo = flexs[i];
			if(flexInfo.dom != this.layout_dom_flex){
				let isHas = this.comparisonParentDom(flexInfo.dom,panel);
				if(isHas){
					return true;
				}
			}	
		}
		return false;
	},

	// 其它窗口总高度
	getFlexs()
	{
		let list = {}
		if(this.layout_dom_flex && this.layout_dom_flex.parentElement){
			for (let i = 0; i < this.layout_dom_flex.parentElement.children.length; i++) {
				let dom = this.layout_dom_flex.parentElement.children[i];
				if(dom.style.flex){
					list[i] = {flex:dom.style.flex.split(' '),dom};
				}
			}
		}
		return list;
	},

	// 本窗口当前占用空间百分比
	getSelfFlexPercent()
	{
		this.getLayoutDomFlex();
		let flexs = this.getFlexs();
		let max_height = 0
		let self_flex 

		for (const i in flexs) {
			const flexInfo = flexs[i];
			max_height += Number(flexInfo.flex[0])
			if(flexInfo.dom == this.layout_dom_flex){
				self_flex = flexInfo.flex;
			}
		}
		if(self_flex){
			return self_flex[0]/max_height;
		}
		return 0
	},

	getLayoutDomFlex(){
		if(this.parent_dom && this.parent_dom.parentElement)
		{
			this.layout_dom_flex = this.parent_dom.parentElement;
			let isHorizontal = true;
			for (let i = 0; i < this.layout_dom_flex.parentElement.children.length; i++) {
				const dom = this.layout_dom_flex.parentElement.children[i];
				if(dom.scrollHeight != this.layout_dom_flex.scrollHeight){
					isHorizontal = false;
				}
			}
			// 这里水平布局了两排以上
			if(isHorizontal){
				this.layout_dom_flex = this.layout_dom_flex.parentElement || this.layout_dom_flex; //再找一层
			}
		}else{
			this.layout_dom_flex = undefined;
		}
		return this.layout_dom_flex;
	},

	// 面板销毁
	onDestroy(){
		this.setAutoLayout(false);
	},


	messages:{

		// 'cleanFile'()
		// {
		// },
	},
	
};
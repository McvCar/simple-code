/* 
面板扩展
功能: 自动布局窗口
*/
'use strict';
const path 			= require('path');
const fs 			= require('fs');
const Editor2D = require('../../tools/editor2D');

module.exports = {
	/** @type import('../../panel/vs-panel/vs-panel').EditorPanel */
	parent : null,

	// 面板初始化
	ready(parent){
		// index.js 对象
		// 读取自动布局信息
		this.parent = parent;
		this.parent_dom 		= this.parent.panel;
		this.layout_dom_flex 	= this.getLayoutDomFlex()
		this.self_flex_per 		= this.parent.cfg.self_flex_per || this.getSelfFlexPercent();
		this.old_focused_state  = null;
	},

	onLoad(){
		

		// 监听焦点
		let focusPanels = [this.parent.$.editorB,this.parent.$.tabList];
		for (let i = 0; i < focusPanels.length; i++) {
			const dom = focusPanels[i];
			dom.addEventListener('focus',(e)=>{
				if(this.parent.cfg.is_lock_window) return;
				this.setAutoLayout(true)
			},true);
		}

		this.parent_dom.addEventListener('blur',(e)=>{
			if(this.parent.cfg.is_lock_window) return;
			this.parent.setTimeout(()=>{
				let panel = Editor2D.Panel.getFocusedPanel()
				let is_need_close = this.isSameGroupPanel(panel);
				if(is_need_close){
					this.setAutoLayout(panel == this)
				}
			},10)
		},false);
		
		// 伸缩快捷键
		this.parent.addKeybodyEventByName('switchEditorWindow',(e)=>
		{
			if (!this.parent.is_mouse_down){
				let isOpen = !this.old_focused_state;
				this.setAutoLayout(isOpen)
				isOpen ? this.parent_dom.focus() : this.parent_dom.blur()
				e.preventDefault();
			}
		},0)

		if(!this.parent.cfg.is_lock_window) {
			this.setAutoLayout(Editor2D.Panel.getFocusedPanel() == this.parent_dom);
		};
	},

	// 设置选项
	setOptions(cfg,isInit) 
	{
		if(!isInit)
		{
			if(this.parent.cfg.is_lock_window) {
				return;
			}
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
		let panel = Editor2D.Panel.getFocusedPanel() 
		let is_self = panel == this && !this.comparisonParentDom(this.parent.$.toolsPanel,this.parent_dom._focusedElement);
		let is_need_close = this.isSameGroupPanel(panel);
		if(!this.parent.cfg.is_lock_window && (is_self || is_need_close)){
			this.setAutoLayout(is_self)
		}
	},
	
	// 设置展开面板或收起来
	setAutoLayout(is_focused)
	{
		this.layout_dom_flex = this.getLayoutDomFlex();
		let now_flex = this.layout_dom_flex && this.layout_dom_flex.style.flex;
		if(!this.parent.cfg.autoLayoutMin || now_flex == null || (this.old_focused_state != null && this.old_focused_state == is_focused)){
			return;
		}
		this.old_focused_state = is_focused;

		// 焦点改变时修改布局
		// 统计其它同级窗口总宽或总高
		let flexs = this.getFlexs();
		// 是否水平布局
		let is_horizontal = this.layout_dom_flex.isHorizontal;//this.isHorizontalLayout();
		if(is_horizontal){
			for (const i in flexs) {
				const flexInfo = flexs[i];
				if(this.parent.cfg.autoLayoutDt){
					flexInfo.dom.style['-webkit-transition'] = 'flex '+this.parent.cfg.autoLayoutDt+"s ease "+(this.parent.cfg.autoLayoutDelay || '0')+'s'
				}
				let flex = flexInfo.dom.style.flex;
				if(is_focused){
					flexInfo.dom.old_flex_grow = flexInfo.flex[0]
					flex = flexInfo.dom != this.layout_dom_flex ? '0.1 1 0%' : '1 1 0%';
				}else if(flexInfo.dom.old_flex_grow != null){
					flex = flexInfo.dom.old_flex_grow + ' 1 0%'// + ls;
				}
				flexInfo.dom.style.flex = flex;
			}
		}else{ // 垂直布局
			let my_per = is_focused ? (this.parent.cfg.autoLayoutMax ? this.parent.cfg.autoLayoutMax * 0.01 : this.self_flex_per) : this.parent.cfg.autoLayoutMin*0.01; // 调整窗口缩放比例
			let max_per = 1
			let sub_per = max_per-my_per;
			let ohter_size = 0
			for (const i in flexs) {
				const flexInfo = flexs[i];
				if(flexInfo.dom != this.layout_dom_flex){
					ohter_size += Number(flexInfo.flex[0])
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
					let per = Number(flexInfo.flex[0])/ohter_size;//占用空间百分比
					let oth_per = isNaN(per) ? sub_per : per*sub_per; // 临时修复布局异常bug;
					
					flexInfo.dom.style.flex = oth_per+' 1 0%'
				}else{
					flexInfo.dom.style.flex = my_per+' 1 0%'
				}
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
			this.parent.$.overlay.style.display = "none";
			this.parent.upLayout();
			// 刷新场景布局
			this.upScene()
		}
		
		if(this.parent.cfg.autoLayoutDt)
		{
			this.parent.$.overlay.style.display = this.layout_dom_flex.parentElement.children[0] == this.layout_dom_flex ? "" : "inline"; // 自己在最顶层就不必显示蒙版
			this.layout_dom_flex.addEventListener('transitionend',actEnd,false);
		}else{
			actEnd();
		}
	},
	
	// 是否水平调整大小
	isHorizontalLayout(){
		return true //this.parent.$.box.scrollHeight > this.parent.$.box.scrollWidth
	},

	// 刷新场景布局
	async upScene(){
		let scenePanel = Editor2D.Panel.find('scene')
		let layout_dom_flex = this.getLayoutDomFlexByPanel(scenePanel);
		if(layout_dom_flex){
			layout_dom_flex.style["minHeight"] = '100px' // 场景最小高度由300改成200 
			layout_dom_flex.style["minWidth"] = '100px' // 场景最小高度由300改成200 
			// 用于水平布局
			if(layout_dom_flex.parentElement && layout_dom_flex.parentElement.parentElement && layout_dom_flex.parentElement.parentElement == this.layout_dom_flex.parentElement){
				layout_dom_flex.parentElement.style["minWidth"] = '200px' // 场景最小高度由300改成200 
			}
		}
		let is2D;
		
		if(!this._isReady || !(await Editor.Message.request('scene','query-is-ready'))){
			let info = await Editor.Profile.getConfig("scene", "gizmos-infos")
			if(info.is2D != null){
				is2D = info.is2D;
			}
		}else{
			this._isReady = true;
			is2D = await Editor.Message.request('scene','query-is2D');
		}
		Editor.Message.send('scene','change-is2D',is2D)
		this.parent.setTimeout(async ()=>{Editor.Message.send('scene','change-is2D',await Editor.Message.request('scene','query-is2D',is2D))},5)
		this.parent.setTimeout(async ()=>{Editor.Message.send('scene','change-is2D',await Editor.Message.request('scene','query-is2D',is2D))},50)
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
					list[i] = {old_flex:dom.style.flex,flex:dom.style.flex.split(' '),dom};
				}
			}
		}
		return list;
	},

	// 本窗口当前占用空间百分比
	getSelfFlexPercent()
	{
		this.layout_dom_flex = this.getLayoutDomFlex();
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

	// 获得竖板布局层
	getLayoutDomFlex(){
		return this.getLayoutDomFlexByPanel(this.parent_dom);
	},

	// 获得编辑器所在的布局块对象
	getLayoutDomFlexByPanel(panel){
		let layout_dom_flex;
		if(panel && panel.parentElement)
		{
			layout_dom_flex = panel.parentElement.parentElement.parentElement;
			if(!layout_dom_flex.parentElement) return;
			let isHorizontal = true;
			for (let i = 0; i < layout_dom_flex.parentElement.children.length; i++) {
				const dom = layout_dom_flex.parentElement.children[i];
				if(Math.abs(dom.scrollHeight - layout_dom_flex.scrollHeight)>50){
					isHorizontal = false;
				}
			}
			// 这里水平布局了两排以上
			if(isHorizontal){
				if(layout_dom_flex.parentElement.parentElement == null){
					layout_dom_flex.isHorizontal = true;// 面板,标记使用水平布局
				}else{
					layout_dom_flex = layout_dom_flex.parentElement
					delete layout_dom_flex.isHorizontal;
				}
			}
		}else{
			layout_dom_flex = undefined;
		}
		return layout_dom_flex;
	},


	// 面板销毁
	onDestroy(){
		if(!this.parent.cfg.is_lock_window) {
			this.setAutoLayout(false);
		}
	},


	messages:{
		'switchEditorWindow'()
		{
			if(!this.parent.is_init_finish){
				return;
			}
			let isOpen = !this.old_focused_state;
			this.setAutoLayout(isOpen)
			isOpen ? this.parent_dom.focus() : this.parent_dom.blur()
		},
	},
	
};
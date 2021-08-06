/* 
*场景逻辑扩展
*删除选中的节点以及节点所绑定的脚本
*/
'use strict';
var path = require('path');
var fs = require('fs');

module.exports = {



	/*************  事件 *************/
	messages:
	{
		'getWidgetBindEvents':(args,parent)=>
		{
			let node = args.uuid && parent.findNode(args.uuid);
			if (!node) {
				return [];
			}
			
			let list = [];      
	
			node.getComponents(cc.Component).forEach((_comp)=>{
	
				if(_comp && _comp.clickEvents && _comp.clickEvents.length)
				{
					for(let myeee of _comp.clickEvents)
					{
						if(!myeee || !myeee.target) continue;
	
						let buttonTargetNode = myeee.target;
	
						let comps = buttonTargetNode.getComponents(cc.Component);
						if(comps && comps.length)
						{
							for(let comp of comps)
							{
								if(comp.__scriptUuid && comp.__classname__ && (comp.__classname__ === myeee._componentName || comp.__classname__ === myeee.component))
								{
									if(comp.__classname__.indexOf(".") == -1){
										list.push({
											name : comp.__classname__,
											scriptUuid :comp.__scriptUuid,
											funcName : myeee.handler,
										})
									};
								}
							}
						}
					}
				}
			});
	
			return list;
		},
	}
};
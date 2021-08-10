/* 
面板扩展
功能: 新建脚本并绑定组件
*/
'use strict';
const path = require('path');
const fs = require('fs');
const config = require('../../config');
const tools = require('../../tools/tools');

module.exports = {
	/** @type import('../../panel/vs-panel/vs-panel-base') */
	parent : null,

    // 面板初始化
    ready(parent) {
        // index.js 对象
        this.parent = parent;
    },

    // monaco 编辑器初始化
    onLoad() {
    },

	/** 需要刷新creator右键菜单
	 * @param type = node | asset 
	 * */ 
     onRefreshCreatorMenu(type,uuid){
        
        if (uuid == null || type != 'node') {
            // 清除菜单
            Editor.Ipc.sendToMain('simple-code:setMenuConfig', {id: 'cc-goto-widget-event',menuCfg: undefined,});
            return;
        }

        
        Editor.Scene.callSceneScript('simple-code', 'getWidgetBindEvents',{uuid}, (err, eventList) => { 
            this.eventList = eventList;
            
            if (!eventList || !eventList.length) {
                // 清除菜单
                Editor.Ipc.sendToMain('simple-code:setMenuConfig', {id: 'cc-goto-widget-event',menuCfg: undefined,});
                return;
            }

            let menuCfg = {
                layerMenu: [
                    { type: 'separator' },
                    {
                        label: tools.translate('cc-goto-widget-event'),
                        enabled: true,
                        cmd : 'cc-goto-widget-event'
                    }, // 生成拖拽组件
                ],
            };

            Editor.Ipc.sendToMain('simple-code:setMenuConfig', {
                id: 'cc-goto-widget-event',
                menuCfg: menuCfg,
            });
        });
	},

    // 面板销毁
    onDestroy() {},

    messages: {
        'cc-goto-widget-event'() {
            if(!this.eventList || !this.eventList[0]){
                return;
            }

            let eventInfo = this.eventList[0];
            let fsPath = Editor.remote.assetdb.uuidToFspath(eventInfo.scriptUuid);
            let model = this.parent.fileMgr.getModelByFsPath(fsPath);

            let findObj = model.getValue().match(new RegExp(eventInfo.funcName + "[\s]*?\(.*\)[\s]*?{"));
            let selection;
            if(findObj){
                let position = model.getPositionAt(findObj.index);
                selection = new this.parent.monaco.Selection(position.lineNumber,position.column,position.lineNumber,position.column);
            }
            this.parent.monaco.sendEvent('vs-open-file-tab',{
                uri:model.uri,
                selection:selection,
            })
        },
 
    },
};

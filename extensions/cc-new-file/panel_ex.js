/* 
面板扩展
功能: 新建脚本并绑定组件
*/
'use strict';
const path = require('path');
const fs = require('fs');
const config = require('../../config');
const tools = require('../../tools/tools');
const exec = require('child_process').exec;
const Editor2D = require('../../tools/editor2D');

let TEMPLE_PATH = path.join(path.resolve(__dirname, './'), 'new_file_temple');
let USER_TEMPLE_PATH = path.join(config.cacheDir, 'new_file_temple');
let NEW_FILE_RULE = path.join(path.resolve(__dirname, './'),'new_script_rule.js');
let USER_NEW_FILE_RULE = path.join(config.cacheDir, 'new_script_rule.js');

module.exports = {
    USER_NEW_FILE_RULE,

	/** @type import('../../panel/vs-panel/vs-panel').EditorPanel */
	parent : null,

    // 面板初始化
    ready(parent) {
        // index.js 对象
        this.parent = parent;
		this.currSelectInfo = {}
    },

    // monaco 编辑器初始化
    onLoad() {
        this.temples = {};

        // 首次使用拷贝模板到可写路径
        if (
            !tools.isDirectory(USER_TEMPLE_PATH) &&
            tools.isDirectory(TEMPLE_PATH)
        ) {
            tools.createDir(USER_TEMPLE_PATH);
            let fileList = tools.getFileList(TEMPLE_PATH, []);
            for (let i = 0; i < fileList.length; i++) {
                const filePath = fileList[i];
                tools.copyFile(
                    filePath,
                    path.join(USER_TEMPLE_PATH, path.basename(filePath))
                );
            }
        }

        // 首次使用拷贝模板到可写路径
        if (!tools.isFileExit(USER_NEW_FILE_RULE)) {
            tools.copyFile(NEW_FILE_RULE, USER_NEW_FILE_RULE);
        }

        this.upTempletList();
    },

    upTempletList() {
        this.temples = {};
        let fileList = tools.getFileList(USER_TEMPLE_PATH, []);
        for (let i = 0; i < fileList.length; i++) {
            const filePath = fileList[i];
            if (
                filePath.indexOf('.DS_Store') != -1 ||
                filePath.indexOf('desktop.ini') != -1
            ) {
                continue;
            }
            this.temples[path.basename(filePath)] = filePath; // ['file.js'] = 'dir/game/file.js'
        }
    },

    newFileAndBindNode(templePath,type,uuid) {
        if (templePath == null || !tools.isFileExit(templePath)) {
            console.log('新建脚本文件不存在');
            return;
        }

        Editor2D.Scene.callSceneScript('simple-code','get-curr-scene-url-and-node',{type,uuid},async (err, args)=> {
            if (args == null) {
                return;
            }

            try {
                let saveUrl = require(USER_NEW_FILE_RULE).getSavePath(
                    templePath,
                    args.url,
                    args.currNodeName
                );
                if(!saveUrl || saveUrl == ''){
                    // 返回空的保存路径不执行后续步骤
                    return;
                }

                let saveFspath = await Editor2D.assetdb.urlToFspath(saveUrl);
                tools.createDir(saveFspath);
                args = { templePath, saveUrl, saveFspath };
                args.type = type;
                args.uuid = uuid;

                this.newScriptFile(args);
                

            } catch (error) {
                Editor.error(
                    tools.translateZhAndEn(
                        '检测新建脚本规则是否填错:',
                        'Check if new script rule is filled incorrectly:'
                    ),
                    error
                );
            }
        });
    },

    async newScriptFile(args)
    {
        // 1.检查node是否存在
        let nodeInfo = await Editor.Message.request('scene','query-node',args.uuid);
        if (!nodeInfo || args.type != "node") {
            Editor.log("该功能需要您选中一个节点后再执行才能创建脚本与绑定节点")
            Editor2D.Scene.callSceneScript('simple-code','new-file-complete',args,false);
            return;
        }

        // 2.假设脚本已经存在，尝试绑定到node
        let isSucceed = await this.tryBindScriptToNode(args);
        if(isSucceed)
        {
            this.parent.openActiveFile(true,false);
            args.data = fs.readFileSync(args.saveFspath).toString();
            Editor2D.Scene.callSceneScript('simple-code','new-file-complete',args,true); // 通知自定义事件
        }else
        {
            // 2.脚本不存在创建脚本文件
            Editor2D.Scene.callSceneScript('simple-code','get-new-file-data',args,(err, textData) => {
                args.data = textData
				Editor2D.assetdb.create(args.saveUrl, args.data, (err, results) => {
					if (err) {
                        Editor2D.Scene.callSceneScript('simple-code','new-file-complete',args,false);
                    }
					else{
                        // 3.等待creator编译新建的脚本后再绑定到node
                        this.bindScriptToNode(args,0);
                        Editor2D.Scene.callSceneScript('simple-code','new-file-complete',args,false);
					}
				})
            });
        }

        // Editor2D.Scene.callSceneScript('simple-code','new-js-file',args,(err, eventArgs) => {
        //     // 如果脚本不存在创建文件后需要绑定到Node
        //     if(eventArgs.isNeedBindScript){
        //         this.bindScriptToNode(eventArgs)
        //     }else{
        //         this.parent.openActiveFile(true,false);
        //     }
        // });
    },

    
    async tryBindScriptToNode(args){
        // 1.检测脚本文件存在
        let fileUuid = await Editor2D.assetdb.urlToUuid(args.saveUrl);
        if(fileUuid) 
        {
            let nodeInfo = await Editor.Message.request('scene','query-node',args.uuid);
            args.scriptName = await Editor.Message.request('scene','query-script-name',fileUuid);
            args.fileUuid = fileUuid
            if(args.scriptName && nodeInfo)
            {
                // 脚本已绑定在Node上退出处理
                if(this.getNodeCompByName(nodeInfo,args.scriptName)){
                    return true;
                }

				// 2.绑定脚本到node
                let compId = tools.compareVersion(Editor.App.version,'3.6.0') == -1 ? args.scriptName : Editor.Utils.UUID.compressUUID(fileUuid)
				await Editor.Message.request('scene','create-component',{
					uuid: args.uuid,
					component: compId,
				});

                // 3.检查脚本是否绑定成功
                nodeInfo = await Editor.Message.request('scene','query-node',args.uuid);
                if(this.getNodeCompByName(nodeInfo,args.scriptName)){
                    this.parent.scriptHint(fileUuid);
                    return true;
                }
            }
        }

        return false;
    },

    // 绑定脚本到Node
    async bindScriptToNode(args,tryIndex=0)
    {
        let isSucceed = await this.tryBindScriptToNode(args);
        if(isSucceed){
            this.parent.openActiveFile(true,false);
            Editor2D.Scene.callSceneScript('simple-code','new-file-complete',args,true); // 通知自定义事件

        }else if( tryIndex++ < 15 ){
            // 如果脚本没有绑定成功，则延迟1秒等待Creator编译完脚本再尝试，总共尝试15次
            this.parent.setTimeout(this.bindScriptToNode.bind(this,args,tryIndex),1000);
        }else{
            // 添加失败，超时
            Editor2D.Scene.callSceneScript('simple-code','new-file-complete',args,false); // 通知自定义事件
        }
    },

    getNodeCompByName(nodeInfo,compName){
        if(nodeInfo && nodeInfo.__comps__){
            for (let i = 0; i < nodeInfo.__comps__.length; i++) {
                const comp = nodeInfo.__comps__[i];
                if(comp.type == compName){
                    return comp;
                }
            }
        }
    },


	/**
	 * creator菜单即将弹出
	 * @param {string} type = 'assetMenu' | 'layerMenu'
	 * @param {Object} selectInfo 
	 * @param {String} selectInfo.uuid
	 * @param {String} selectInfo.type = 'asset' | 'node'
	 */
    onCCMenuPopup(type,selectInfo = {}){
        this.updateMenu(selectInfo.type,selectInfo.uuid)
	},
	updateMenu(type,uuid){

        if (uuid == null) {
            // 清除菜单
            this.parent.ccMenuMgr.setMenuConfig({
                id: 'cc-new-file',
                menuCfg: undefined,
            });
            return;
        }

        let submenu = [];

        for (const key in this.temples) {
            let item = { label: key, enabled: true, click: this.messages['new-script-templet'].bind(this,key), };
            submenu.push(item);
        }

        submenu.push({ type: 'separator' });
        submenu.push({
            label: tools.translateZhAndEn('刷新模板', 'Refresh Templates'),
            enabled: true,
            click: this.messages['refresh-template'].bind(this),
        });
        submenu.push({
            label: tools.translateZhAndEn('自定义模板', 'Custom Template'),
            enabled: true,
            click: this.messages['custom-template'].bind(this),
        });
        submenu.push({
            label: tools.translateZhAndEn(
                '自定义生成规则',
                'Custom Build Rules'
            ),
            enabled: true,
            click: this.messages['custom-build-templet-rules'].bind(this),
        });

        let menuCfg = {
            layerMenu: [
                { type: 'separator' },
                {
                    label: tools.translate('new-script-bind'),
                    enabled: true,
                    submenu: submenu,
                }, // 生成拖拽组件
            ],
            assetMenu: [
                { type: 'separator' },
                {
                    label: tools.translate('new-script-templet'),
                    enabled: true,
                    submenu: submenu,
                }, // 生成拖拽组件
            ],
        };
        this.menuCfg = menuCfg;
        this.parent.ccMenuMgr.setMenuConfig({
            id: 'cc-new-file',
            menuCfg: menuCfg,
        });
    },

    // 面板销毁
    onDestroy() {},

    messages: {
        'new-js-file'() {
            let filePath = this.temples['define.' + this.parent.cfg.newFileType];
            let info = Editor2D.Selection.curGlobalActivate()
            this.newFileAndBindNode(filePath,info.type,info.id);
        },

        // 刷新模板
        'refresh-template'() {
            this.upTempletList();
            let selectInfo = this.parent.currCreatorEditorSelectInfo;
            this.updateMenu(selectInfo.type,selectInfo.uuid);
        },

        // 自定模板
        'custom-template'() {
            exec((Editor2D.isWin32 ? 'start ' : 'open ') + USER_TEMPLE_PATH);
        },

        // 自定规则
        'custom-build-templet-rules'() {
            this.parent.openOutSideFile(USER_NEW_FILE_RULE, true);
        },

        async 'new-script-templet'(fileName) {
            let selectInfo = this.parent.currCreatorEditorSelectInfo;
            if (selectInfo.uuid == null) {
                return;
            }

            // 在资源管理中创建
            if (selectInfo.type == 'asset') {
                let templePath = this.temples[fileName];
                let filePath = await Editor2D.assetdb.uuidToFspath(selectInfo.uuid);

                let fspath = tools.isDirectory(filePath)
                    ? filePath
                    : path.dirname(filePath);
                if (!templePath || !tools.isDirectory(fspath)) {
                    return;
                }

                let s_ind = fspath.indexOf(config.prsPath);
                if (
                    s_ind == -1 ||
                    !fspath.substr(config.prsPath.length).match('assets')
                ) {
                    alert(
                        tools.translateZhAndEn(
                            '不能选择在根目录创建模板',
                            'Cannot choose to create template in root directory'
                        )
                    );
                    return;
                }

                let data = fs.readFileSync(templePath);
                fspath = path.join(fspath, fileName);

                let saveUrl = await Editor2D.assetdb.fspathToUrl(fspath);
                Editor2D.assetdb.create(saveUrl, data);
            } else {
                // 节点上创建
                let templePath = this.temples[fileName];
                this.newFileAndBindNode(templePath,this.parent.currCreatorEditorSelectInfo.type,this.parent.currCreatorEditorSelectInfo.uuid);
            }
        },

    },
};
